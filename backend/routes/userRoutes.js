const express = require('express');
const router = express.Router();
const User = require('../models/User');

// MOCK UPGRADE ROUTE
router.put('/upgrade-plan', async (req, res) => {
  const { firebaseId, planName } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { firebaseId: firebaseId },
      { plan: planName },
      { returnDocument: 'after' }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    console.log(`⭐ User ${firebaseId} upgraded to ${planName}`);
    
    // In a real app, this is where we'd call the Email function
    res.status(200).json({ 
      message: "Upgrade Successful! Invoice sent to email.", 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during upgrade" });
  }
});

// backend/routes/userRoutes.js
router.post('/sync-watchtime', async (req, res) => {
  const { email, watchTime } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { totalWatchTime: watchTime },
      { returnDocument: 'after' }
    );
    res.json({ success: true, totalWatchTime: user.totalWatchTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;