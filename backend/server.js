const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 1. PURE APP CORS CONFIGURATION (Task 2 & 7) ---
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Download-Count'], 
  credentials: true
}));

// --- 2. GLOBAL MIDDLEWARE ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. STATIC FILE SERVICING (Task 6 & 7: Streaming & Local Cache) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000'); // Task 7: Local Caching
  }
}));

// --- 4. API ENDPOINTS (Unified Node Architecture) ---
app.use('/api/auth', require('./routes/authRoutes'));   
app.use('/api/videos', require('./routes/videoRoutes')); 
app.use('/api/comments', require('./routes/commentRoutes')); 
app.use('/api/users', require('./routes/userRoutes'));   
app.use('/api/history', require('./routes/historyRoutes'));

app.use('/api/payments', require('./routes/paymentRoutes'));
// This tells Express: "If someone asks for /uploads, look in the uploads folder"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 5. SYSTEM DIAGNOSTICS ---
app.get('/api/node-status', (req, res) => {
  res.json({
    status: "Online",
    region: "Secunderabad",
    node: "Primary-Cluster-01",
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('🚀 YouClone Secunderabad Node is running perfectly!');
});

// --- 6. DATABASE & SERVER START ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas: YouClone-Cluster');
    app.listen(PORT, () => {
      console.log(`🚀 Node Active: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Critical Node Failure (DB):', err.message);
    process.exit(1); 
  });