const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" }, // Added for Twilio SMS Auth
  
  // Task 3: Tiered Access (Pure App Logic)
  plan: { 
    type: String, 
    enum: ['Free', 'Bronze', 'Silver', 'Gold'], 
    default: 'Free' 
  },
  location: { type: String, default: "Secunderabad" },
  dailyDownloadCount: { type: Number, default: 0 },
  lastDownloadDate: { type: Date, default: Date.now },
  joinedAt: { type: Date, default: Date.now },
  
  // 🔥 NEW: Added OTP Fields
  otp: { type: String },
  otpExpiry: { type: Date }
});

module.exports = mongoose.model('User', userSchema);