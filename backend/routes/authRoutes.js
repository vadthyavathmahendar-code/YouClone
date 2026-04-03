const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔥 Communication Packages for OTP
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// --- COMMUNICATION HELPERS ---

// 1. Email Sender (Nodemailer)
const sendEmailOTP = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"YouClone Security Node" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your YouClone Access Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0f0f0f; color: white; padding: 40px; text-align: center; border-radius: 10px;">
        <h2 style="color: #dc2626; text-transform: uppercase; letter-spacing: 2px;">Node Access Authorization</h2>
        <p style="opacity: 0.8;">A login attempt was detected.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; background-color: #111; padding: 20px; border: 1px solid #333; display: inline-block; margin: 20px 0; border-radius: 10px;">
          ${otp}
        </div>
        <p style="opacity: 0.5; font-size: 12px; text-transform: uppercase;">This code expires in 10 minutes.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// 2. SMS Sender (Twilio)
const sendMobileOTP = async (toNumber, otp) => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `[YouClone Node] Your secure access code is: ${otp}. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber // Must include country code, e.g., +919876543210
  });
};

// --- HELPER: South India Check ---
const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
const isSouthIndia = (location) => southIndianStates.some(state => location.toLowerCase().includes(state.toLowerCase())) || location.toLowerCase().includes('hyderabad') || location.toLowerCase().includes('secunderabad');

// 1. SIGNUP ROUTE (Task 4: Regional Auth Sync)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    
    let user = await User.findOne({ email });

    if (!user) {
      // Securely hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone: phone || "",
        location: location || "Secunderabad", 
        plan: "Free",
        dailyDownloadCount: 0,
        lastDownloadDate: new Date()
      });
      console.log("🆕 New Node Created:", email);
    } else {
        return res.status(400).json({ message: "User already exists." });
    }

    const token = jwt.sign({ id: user._id }, "SECRET_KEY_123", { expiresIn: '7d' });
    res.status(200).json({ message: "Signup successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN ROUTE (Task 4: REAL Regional OTP Trigger)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid passcode." });

    // Generate a random 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = generatedOTP;
    user.otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes expiry
    await user.save(); // Now this will successfully save to DB!

    // TASK 4: ACTUAL REGIONAL ROUTING LOGIC
    if (isSouthIndia(user.location)) {
      try {
        await sendEmailOTP(user.email, generatedOTP);
        console.log(`✅ [SUCCESS] Email OTP sent to ${user.email}`);
        res.status(200).json({ message: "OTP sent to Email", authType: "email", email: user.email });
      } catch (err) {
        console.error("Email Error:", err);
        res.status(500).json({ message: "Failed to send Email OTP. Check console." });
      }
    } else {
      try {
        if (!user.phone) {
          return res.status(400).json({ message: "No phone number registered for SMS." });
        }
        await sendMobileOTP(user.phone, generatedOTP);
        console.log(`✅ [SUCCESS] SMS OTP sent to ${user.phone}`);
        res.status(200).json({ message: "OTP sent to Mobile", authType: "mobile", email: user.email });
      } catch (err) {
        console.error("SMS Error:", err);
        res.status(500).json({ message: "Failed to send SMS OTP. Check console." });
      }
    }

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Server error during authentication." });
  }
});

// 3. VERIFY OTP ROUTE (Finalizes Login)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Clear OTP after successful login for security
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, "SECRET_KEY_123", { expiresIn: '7d' });
    res.status(200).json({ message: "Authentication successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PROFILE FETCH ROUTE
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const today = new Date().toDateString();
    const lastDown = new Date(user.lastDownloadDate || Date.now()).toDateString();
    
    if (today !== lastDown) {
      user.dailyDownloadCount = 0;
      user.lastDownloadDate = new Date();
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. UPDATE PROFILE ROUTE
router.post('/update', async (req, res) => {
  try {
    const { email, name, location } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { name, location },
      { returnDocument: 'after' } 
    ).select('-password');

    if (!user) return res.status(404).json({ message: "Node not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. DOWNLOAD TRACKER 
router.post('/increment-download', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (user) {
      user.dailyDownloadCount += 1;
      user.lastDownloadDate = new Date();
      await user.save();
      res.json({ success: true, count: user.dailyDownloadCount });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;