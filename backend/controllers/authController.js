const { sendOTPEmail } = require('../services/emailService');
const User = require('../models/User');

exports.registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60000); // Expires in 10 minutes

    let user = await User.findOne({ email });

    // Check if user already exists and is fully verified
    if (user && user.isVerified) {
        return res.status(400).json({ error: "User already exists." });
    }

    if (!user) {
        // Create new user
        user = new User({ email, password, otp, otpExpires, isVerified: false });
    } else {
        // Update unverified user with new OTP and password
        user.password = password; 
        user.otp = otp;
        user.otpExpires = otpExpires;
    }
    
    await user.save(); // The pre-save hook in User.js will hash the password here
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent to your email!" });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if OTP matches and is not expired
    if (user.otp === otp && user.otpExpires > Date.now()) {
      user.isVerified = true;
      user.otp = undefined; // Clear OTP data
      user.otpExpires = undefined; // Clear OTP expiration
      await user.save();

      return res.status(200).json({ message: "Email verified successfully!" });
    } else {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Server error during verification." });
  }
};