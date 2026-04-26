const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/Video');

// 1. GET ALL VIDEOS (With Debug Log)
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    console.log(`📡 Total videos in DB: ${videos.length}`);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SEARCH VIDEOS (Force Fuzzy Match)
router.get('/search/v', async (req, res) => {
  try {
    const { q } = req.query;
    console.log("📥 Incoming Search Query:", q);

    if (!q || q.trim() === "") {
        const all = await Video.find({});
        return res.json(all); // Return all if query is empty for testing
    }

    const cleanQuery = q.trim();

    // Use $regex with 'i' (case-insensitive)
    // We also use $options: 'm' just in case there are newlines
    const videos = await Video.find({
      $or: [
        { title: { $regex: cleanQuery, $options: 'i' } },
        { description: { $regex: cleanQuery, $options: 'i' } },
        { channelName: { $regex: cleanQuery, $options: 'i' } }
      ]
    });

    console.log(`✅ Search for "${cleanQuery}" produced ${videos.length} results.`);
    res.json(videos);
  } catch (error) {
    console.error("❌ Search API Error:", error);
    res.status(500).json({ message: "Search failed" });
  }
});

// 3. GET SINGLE VIDEO
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid ID format" });
    }
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Not found" });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 4. SEED ROUTE (With explicit field verification)
router.get('/seed/run', async (req, res) => {
  try {
    // Replace the sampleVideos array in Section 4 with this:
// Replace Section 4 sampleVideos with this:
const sampleVideos = [
  {
    title: "Big Buck Bunny",
    description: "High-speed direct stream for YouClone testing.",
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4", // Extremely fast CDN link
    thumbnailUrl: "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg",
    channelName: "Blender Foundation",
    views: 125420
  },
  {
    title: "Arctic Wildlife",
    description: "Testing playback with high-definition nature footage.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Fast sample link
    thumbnailUrl: "https://images.pexels.com/photos/1535162/pexels-photo-1535162.jpeg",
    channelName: "Nature Hub",
    views: 85000
  },
  {
    title: "Production Demo",
    description: "Stable stream for internship final presentation.",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4", // Reliable CDN
    thumbnailUrl: "https://images.pexels.com/photos/701855/pexels-photo-701855.jpeg",
    channelName: "Vercel Node",
    views: 99030
  }
];
    console.log("🧹 Clearing Video Collection...");
    await Video.deleteMany({}); 
    
    console.log("🌱 Inserting Sample Data...");
    const created = await Video.insertMany(sampleVideos);
    
    console.log("🏁 Seed complete!");
    res.json({ 
        message: "SUCCESS! Database updated.", 
        count: created.length,
        sample: created[0] // Returns one back to you to verify fields
    });
  } catch (err) {
    console.error("❌ Seed Error:", err);
    res.status(500).json({ message: "Seed failed: " + err.message });
  }
});

module.exports = router;