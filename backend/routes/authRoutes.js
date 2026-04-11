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
  // 1. If no location, or it's your new default fallback, it's NOT South India logic
  if (!location || location === "Global Node" || location === "Unknown") return false;

  const loc = location.toLowerCase();

  // 2. Check if the string contains any South Indian state name
  const matchesState = southIndianStates.some(state => loc.includes(state.toLowerCase()));

  // 3. Check for specific city keywords (Hyderabad/Secunderabad)
  const matchesCity = loc.includes('hyderabad') || loc.includes('secunderabad');

  return matchesState || matchesCity;
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
// // LOGIN: Trigger Regional Auth (Task 4)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // 1. Basic Auth Validation
    if (!user) return res.status(400).json({ error: "Node not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid passcode." });

    // 2. Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60000); // 10 Min Expiry
    await user.save();

    // 3. REGIONAL LOGIC GATE (Task 4)
    if (isSouthIndia(user.location)) {
      // --- REGION A: SOUTH INDIA (Email OTP) ---
      await sendEmailOTP(user.email, otp);
      return res.status(200).json({ 
        requiresOTP: true, 
        authType: "email", 
        email: user.email 
      });

    } else {
      // --- REGION B: GLOBAL/OTHER (Real Mobile OTP) ---
      
      // Safety Check: Ensure phone exists
      if (!user.phone) {
        return res.status(400).json({ error: "Mobile number missing for SMS authentication." });
      }

      // Format for Twilio (E.164)
      const formattedPhone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;

      try {
        // 🔥 TRIGGER REAL SMS DISPATCH
        await sendMobileOTP(formattedPhone, otp);
        console.log(`🚀 Real SMS OTP dispatched to: ${formattedPhone}`);

        return res.status(200).json({ 
          requiresOTP: true, 
          authType: "mobile", 
          email: user.email,
          mobile: formattedPhone 
        });
      } catch (twilioErr) {
        console.error("💥 Twilio Dispatch Failure:", twilioErr.message);
        
        // Fallback for Trial Accounts: If the number isn't verified in Twilio dashboard
        return res.status(500).json({ 
          error: "SMS delivery failed. Check Twilio verified caller IDs.", 
          details: twilioErr.message 
        });
      }
    }
  } catch (err) {
    console.error("💥 Authentication Node Failure:", err.message);
    return res.status(500).json({ error: "System-level authentication failure." });
  }
});

// VERIFY OTP: Authorized Entry
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // 1. Simple Find: Just find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Node not found." });
    }

    // Debugging Logs (You can see these in your terminal now)
    console.log(`Input OTP: ${otp} | DB OTP: ${user.otp}`);

    // 2. Validate OTP (Check value and expiry)
    // We use .toString() to ensure we aren't comparing a Number to a String
    if (user.otp?.toString() !== otp?.toString() || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // 3. Clear OTP from DB after successful use
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // 4. Issue JWT Token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    console.log("✅ OTP Verified for:", email);
    return res.status(200).json({ message: "Authorized", token, user });

  } catch (err) {
    console.error("💥 Verify OTP Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
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
      { returnDocument: 'after' }
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