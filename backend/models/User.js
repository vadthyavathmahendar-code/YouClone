const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" }, 

  // Task 3: Tiered Access 
  plan: { 
    type: String, 
    enum: ['Free', 'Bronze', 'Silver', 'Gold'], 
    default: 'Free' 
  },
  
  // Task 4: Location-Based Logic
location: { type: String, default: "Global Node" }, // Or just default: ""
state: { type: String, default: "Unknown" },
  // Task 2: Strict Download Limits
  dailyDownloadCount: { type: Number, default: 0 },
  lastDownloadDate: { 
    type: Date, 
    default: Date.now 
  },

  // Task 3: For Invoicing and History
  billingHistory: [{
    plan: String,
    amount: Number,
    date: { type: Date, default: Date.now },
    transactionId: String
  }],

  // Task 4: OTP Authentication
  otp: { type: String },
  otpExpiry: { type: Date },
  
  joinedAt: { type: Date, default: Date.now }
});

// 🔥 MIDDLEWARE: Auto-reset download count if a new day has started
// --- UPDATED MIDDLEWARE: Using the stable next() callback ---
userSchema.pre('save', function(next) {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastDate = this.lastDownloadDate ? new Date(this.lastDownloadDate) : new Date();
    const lastDownload = lastDate.setHours(0, 0, 0, 0);

    if (today > lastDownload) {
      this.dailyDownloadCount = 0;
      this.lastDownloadDate = new Date(); 
    }
    
    // 🚀 CRITICAL: Always call next() to let the save proceed
    next();
  } catch (err) {
    // If something fails here, pass the error to next() instead of crashing
    next(err);
  }
});
module.exports = mongoose.model('User', userSchema);
