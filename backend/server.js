const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 🚀 THE PRODUCTION CORS FIX
// This allows your backend to trust both localhost AND your live Vercel frontend
const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL];

// --- 1. CORS CONFIGURATION ---
app.use(cors({
  origin: allowedOrigins, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// --- 2. GLOBAL MIDDLEWARE ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. STATIC FILE SERVICING ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    // Dynamically allow the origin requesting the file
    res.set('Access-Control-Allow-Origin', '*'); 
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000'); 
  }
}));

// --- 4. API ENDPOINTS ---
app.use('/api/auth', require('./routes/authRoutes'));    
app.use('/api/videos', require('./routes/videoRoutes')); 
app.use('/api/comments', require('./routes/commentRoutes')); 
app.use('/api/users', require('./routes/userRoutes'));    
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// --- 5. SYSTEM DIAGNOSTICS ---
app.get('/api/node-status', (req, res) => {
  res.json({
    status: "Online",
    region: "Secunderabad",
    timestamp: new Date().toISOString()
  });
});

// --- 6. 🚨 THE "JSON PROTECTOR" (Global Error Handler) 🚨 ---
app.use((err, req, res, next) => { 
  console.error("💥 Node Error Trace:", err.stack);
  
  res.status(err.status || 500).json({ 
    message: "Internal Server Error", 
    error: err.message 
  });
});

// --- 7. SOCKET.IO CONFIGURATION (WebRTC Signaling) ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // 🚀 Uses the same trusted URLs as Express
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("📡 User Connected:", socket.id);
  
  socket.emit("me", socket.id);

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("hey", { signal: signalData, from, name });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("disconnect", () => {
    console.log("🔌 User Disconnected");
  });
});

// --- 8. DATABASE & SERVER START ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Node Active on Port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB Failure:', err.message);
    process.exit(1); 
  });