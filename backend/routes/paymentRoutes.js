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

const planPerks = {
  Bronze: { watch: "7 minutes", downloads: "1/day", price: 10 },
  Silver:  { watch: "10 minutes", downloads: "5/day", price: 50 },
  Gold:    { watch: "Unlimited", downloads: "Unlimited", price: 100 },
};

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  pool: true,
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

    const perks = planPerks[newPlan] || {};
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Send Invoice Email
    const mailOptions = {
      from: `"YouClone Premium" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Invoice - YouClone ${newPlan} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: #dc2626; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">YouClone</h1>
            <p style="margin: 6px 0 0; opacity: 0.8; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Payment Confirmed</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hi <b>${user.name}</b>, your upgrade to <b style="color:#dc2626;">${newPlan} Plan</b> is active!</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 12px 0; color: #aaa;">Plan</td>
                <td style="padding: 12px 0; font-weight: bold; text-align: right;">${newPlan}</td>
              </tr>
              <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 12px 0; color: #aaa;">Watch Time</td>
                <td style="padding: 12px 0; font-weight: bold; text-align: right;">${perks.watch}</td>
              </tr>
              <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 12px 0; color: #aaa;">Downloads</td>
                <td style="padding: 12px 0; font-weight: bold; text-align: right;">${perks.downloads}</td>
              </tr>
              <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 12px 0; color: #aaa;">Amount Paid</td>
                <td style="padding: 12px 0; font-weight: bold; text-align: right; color: #22c55e;">₹${price}</td>
              </tr>
              <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 12px 0; color: #aaa;">Transaction ID</td>
                <td style="padding: 12px 0; font-family: monospace; font-size: 12px; text-align: right;">${razorpay_payment_id}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #aaa;">Date</td>
                <td style="padding: 12px 0; text-align: right;">${invoiceDate}</td>
              </tr>
            </table>
            <div style="margin-top: 28px; padding: 16px; background: #1a1a1a; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #aaa;">Enjoy your <b style="color:#fff;">${newPlan}</b> benefits on YouClone!</p>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 11px; color: #555;">This is an automated invoice. Do not reply to this email.</p>
          </div>
        </div>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;