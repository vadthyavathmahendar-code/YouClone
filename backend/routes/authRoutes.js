const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

// --- 1. COMMUNICATION HELPERS ---

// Reusable transporter — Brevo SMTP on port 2525 (works on Render free tier)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525,          // port 2525 bypasses Render's SMTP blocking
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  pool: true,
  maxConnections: 3,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Task 4: Email OTP — fires in background, never blocks the response
const sendEmailOTP = (toEmail, otp) => {
  transporter.sendMail({
    from: `"YouClone Security" <${process.env.EMAIL_USER}>`,  // verified Gmail sender
    to: toEmail,
    subject: 'Your YouClone OTP Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f0f0f;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#dc2626;padding:24px;text-align:center;">
          <h2 style="margin:0;font-size:22px;font-weight:900;">YouClone</h2>
          <p style="margin:4px 0 0;opacity:0.8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Access Verification</p>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="margin:0 0 16px;font-size:15px;opacity:0.7;">Your one-time access code is:</p>
          <div style="font-size:42px;font-weight:900;letter-spacing:12px;background:#1a1a1a;padding:20px;border-radius:8px;display:inline-block;color:#fff;">${otp}</div>
          <p style="margin:20px 0 0;font-size:12px;opacity:0.4;">Valid for 10 minutes. Do not share this code.</p>
        </div>
      </div>
    `
  }).then(() => {
    console.log(`📧 OTP Email sent to ${toEmail}`);
  }).catch(err => {
    console.error("💥 Brevo Email Failure:", err.message, "| Code:", err.responseCode || '');
  });
};

// Task 4: SMS OTP via Twilio
const sendMobileOTP = async (toNumber, otp) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn("⚠️ Twilio env vars missing");
      return false;
    }
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `[YouClone] Your OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toNumber
    });
    console.log(`📱 SMS OTP sent to ${toNumber}`);
    return true;
  } catch (error) {
    console.error(`💥 Twilio Error: ${error.message} Code: ${error.code}`);
    if (error.code === 20003) {
      console.error("❌ Twilio auth failed - update TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Render env vars");
    }
    return false;
  }
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name: name || "Secunderabad Node",
      email,
      password: hashedPassword,
      location: location || "Secunderabad",
      phone: phone || "",
      otp: otp, // Save OTP for verification
      otpExpiry: new Date(Date.now() + 10 * 60000), 
      plan: "Free",
      dailyDownloadCount: 0,
      lastDownloadDate: new Date()
    });

    await user.save();

    // --- TASK 4: REGIONAL DISPATCH ---
    if (isSouthIndia(user.location)) {
      sendEmailOTP(user.email, otp); // fire and forget
      console.log(`📧 Signup OTP dispatched to: ${user.email}`);
      return res.status(200).json({ 
        requiresOTP: true, 
        authType: "email", 
        message: "OTP sent to your email." 
      });
    } else {
      if (user.phone) {
        const formattedPhone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
        const smsSent = await sendMobileOTP(formattedPhone, otp);
        if (!smsSent) {
          sendEmailOTP(user.email, otp);
          return res.status(200).json({ requiresOTP: true, authType: "email", message: "OTP sent to your email." });
        }
        return res.status(200).json({ requiresOTP: true, authType: "mobile", message: "OTP sent to your mobile." });
      } else {
        sendEmailOTP(user.email, otp);
        return res.status(200).json({ requiresOTP: true, authType: "email", message: "OTP sent to your email." });
      }
    }

  } catch (err) {
    console.error("💥 Signup Crash Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error during registration." });
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
    user.otpExpiry = new Date(Date.now() + 10 * 60000); 
    await user.save();

    // 3. REGIONAL OTP DISPATCH
    if (isSouthIndia(user.location)) {
      sendEmailOTP(user.email, otp); // fire and forget — responds instantly
      console.log(`📧 [South India] Email OTP dispatched → ${user.email}`);
      return res.status(200).json({ 
        requiresOTP: true, authType: "email", email: user.email,
        message: "OTP sent to your registered email address"
      });
    } else {
      let smsSent = false;
      if (user.phone) {
        const formattedPhone = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
        smsSent = await sendMobileOTP(formattedPhone, otp);
        if (smsSent) {
          sendEmailOTP(user.email, otp); // backup email
          return res.status(200).json({ 
            requiresOTP: true, authType: "mobile", email: user.email,
            mobile: formattedPhone, message: "OTP sent to your registered mobile number"
          });
        }
      }
      // SMS failed or no phone — email fallback
      sendEmailOTP(user.email, otp); // fire and forget
      console.log(`📧 [Other Region] Email OTP dispatched → ${user.email}`);
      return res.status(200).json({ 
        requiresOTP: true, authType: "email", email: user.email,
        message: "OTP sent to your registered email address"
      });
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
    
    console.log("📋 Profile Request - Email:", email);
    
    if (!email || email === 'null' || email === 'undefined') {
      console.error("❌ Invalid email parameter:", email);
      return res.status(400).json({ error: "Email parameter is required" });
    }
    
    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      console.error("❌ User not found for email:", email);
      return res.status(404).json({ error: "User not found" });
    }
    
    const today = new Date().toDateString();
    const lastDown = new Date(user.lastDownloadDate || Date.now()).toDateString();
    
    if (today !== lastDown) {
      user.dailyDownloadCount = 0;
      user.lastDownloadDate = new Date();
      await user.save();
    }
    
    console.log("✅ Profile fetched successfully for:", email);
    return res.json(user);
  } catch (err) {
    console.error("💥 Profile Route Error:", err.message, err.stack);
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
    const { email, videoId, title, thumbnail } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      user.dailyDownloadCount += 1;
      user.lastDownloadDate = new Date();

      // Save download record if video info provided
      if (videoId && title) {
        user.downloads = user.downloads || [];
        // Avoid duplicates — move to top if already exists
        user.downloads = user.downloads.filter((d) => d.videoId?.toString() !== videoId);
        user.downloads.unshift({ videoId, title, thumbnail: thumbnail || '', downloadedAt: new Date() });
        // Keep only last 50 downloads
        if (user.downloads.length > 50) user.downloads = user.downloads.slice(0, 50);
      }

      await user.save();
      return res.json({ success: true, count: user.dailyDownloadCount });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;