const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// --- 1. COMMUNICATION HELPERS ---

// Task 4: Email OTP for South India
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
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; background-color: #111; padding: 20px; border: 1px solid #333; display: inline-block; margin: 20px 0; border-radius: 10px;">
          ${otp}
        </div>
        <p style="opacity: 0.5; font-size: 12px; text-transform: uppercase;">This code expires in 10 minutes.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Task 4: SMS OTP for other regions
const sendMobileOTP = async (toNumber, otp) => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `[YouClone Node] Your secure access code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber 
  });
};

// Task 4: Regional Logic Gate
const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
const isSouthIndia = (location) => {
  if (!location) return false;
  const loc = location.toLowerCase();
  return southIndianStates.some(state => loc.includes(state.toLowerCase())) || 
         loc.includes('hyderabad') || 
         loc.includes('secunderabad');
};

// --- 2. AUTH ROUTES ---

// 1. SIGNUP: Updated for stability
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, location, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Credentials required." });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Node already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create instance first
    const user = new User({
      name: name || "Secunderabad Node",
      email,
      password: hashedPassword,
      location: location || "Secunderabad",
      phone: phone || "",
      plan: "Free",
      dailyDownloadCount: 0,
      lastDownloadDate: new Date()
    });

    // This triggers the pre('save') hook we just fixed
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    console.log("✅ Node Registered Successfully:", email);
    return res.status(200).json({ message: "Signup successful", token, user });

  } catch (err) {
    console.error("💥 Signup Crash Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});
// LOGIN: Trigger Regional Auth (Task 4)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "Node not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid passcode." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60000); 
    await user.save();

    if (isSouthIndia(user.location)) {
      await sendEmailOTP(user.email, otp);
      return res.status(200).json({ requiresOTP: true, authType: "email", email: user.email });
    } else {
      console.log(`📡 [SMS SIMULATION] Sending OTP ${otp} to ${user.phone}`);
  // await sendMobileOTP(formattedPhone, otp); // Comment this out while Twilio is down
  res.status(200).json({ message: "OTP sent to Mobile (Simulated)", authType: "mobile", email: user.email });
    }
  } catch (err) {
    console.error("💥 Login Error:", err.message);
    return res.status(500).json({ error: "Authentication node failure." });
  }
});

// VERIFY OTP: Authorized Entry
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.status(200).json({ message: "Authorized", token, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --- 3. UTILITY ROUTES ---

// PROFILE: Daily Reset Sync (Task 2)
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const today = new Date().toDateString();
    const lastDown = new Date(user.lastDownloadDate || Date.now()).toDateString();
    
    if (today !== lastDown) {
      user.dailyDownloadCount = 0;
      user.lastDownloadDate = new Date();
      await user.save();
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE: Calibrate Location/Name
router.post('/update', async (req, res) => {
  try {
    const { email, name, location } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { name, location },
      { new: true } 
    ).select('-password');
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// INCREMENT DOWNLOAD: Tracker (Task 2)
router.post('/increment-download', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      user.dailyDownloadCount += 1;
      user.lastDownloadDate = new Date();
      await user.save();
      return res.json({ success: true, count: user.dailyDownloadCount });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;