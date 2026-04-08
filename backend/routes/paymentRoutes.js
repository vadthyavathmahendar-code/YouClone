const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Add to your .env
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Add to your .env
});

const planDetails = {
  10: "Bronze",
  50: "Silver",
  100: "Gold"
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. CREATE RAZORPAY ORDER
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Razorpay works in Paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. VERIFY PAYMENT & UPGRADE & SEND INVOICE
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, newPlan, price } = req.body;

  const validatedPlan = planDetails[price]; 
if (!validatedPlan || validatedPlan !== newPlan) {
   return res.status(400).json({ message: "Data Tampering Detected" });
}
  // Verify Signature
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature !== expectedSign) {
    return res.status(400).json({ message: "Invalid payment signature!" });
  }

  try {
    const user = await User.findOneAndUpdate({ email }, { plan: newPlan }, { new: true });

    // Send Invoice Email
    const mailOptions = {
      from: '"YouClone Premium" <your-email@gmail.com>',
      to: email,
      subject: `Invoice - ${newPlan} Subscription`,
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #ff0000;">Payment Successful!</h2>
          <p>Hi ${user.name}, you are now a <b>${newPlan}</b> member.</p>
          <p>Amount Paid: ₹${price}</p>
          <p>Transaction ID: ${razorpay_payment_id}</p>
        </div>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;