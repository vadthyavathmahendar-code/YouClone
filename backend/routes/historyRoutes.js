const express = require('express');
const router = express.Router();
const History = require('../models/History');

// 1. LOG A VIEW (Upsert: Updates time if already exists)
router.post('/', async (req, res) => {
  try {
    const { email, videoId } = req.body;
    const history = await History.findOneAndUpdate(
      { email, videoId },
      { watchedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET USER HISTORY
router.get('/:email', async (req, res) => {
  try {
    const history = await History.find({ email: req.params.email })
      .populate('videoId') // This pulls the actual video title, thumbnail, etc.
      .sort({ watchedAt: -1 }); // Newest first

    // Filter out any where the original video might have been deleted from DB
    const validHistory = history.filter(h => h.videoId !== null);
    res.status(200).json(validHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CLEAR HISTORY
router.delete('/:email', async (req, res) => {
  try {
    await History.deleteMany({ email: req.params.email });
    res.status(200).json({ message: "History cleared successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;