const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http'); // 🟢 ADD THIS
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- 1. CORS CONFIGURATION ---
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// --- 2. GLOBAL MIDDLEWARE ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. STATIC FILE SERVICING ---
// Task 7: Performance & Streaming
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
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
// This prevents the "Unexpected token <" error by ensuring 
// errors are sent as JSON, not HTML.
// --- 6. 🚨 THE "JSON PROTECTOR" 🚨 ---
// You MUST include 'next' in the arguments list even if you don't use it!
app.use((err, req, res, next) => { 
  console.error("💥 Node Error Trace:", err.stack);
  
  // This ensures your frontend gets a JSON object, not an HTML error page
  res.status(err.status || 500).json({ 
    message: "Internal Server Error", 
    error: err.message 
  });
});

// --- 1. SOCKET.IO CONFIGURATION (Task 6) ---
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("📡 User Connected to VoIP Node:", socket.id);
  
  // 🔥 This sends the ID to your "GENERATING..." box!
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

// ... Keep your existing CORS, Middleware, and Routes code here ...
// (Make sure app.use('/api/auth', etc. is still here)

// --- 7. DATABASE & SERVER START ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // 🔴 CRITICAL: Listen on 'server', NOT 'app'
    server.listen(PORT, () => {
      console.log(`🚀 Node Active: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB Failure:', err.message);
    process.exit(1); 
  });