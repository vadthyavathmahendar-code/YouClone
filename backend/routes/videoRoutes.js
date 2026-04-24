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
    const sampleVideos = [
  {
        title: "Big Buck Bunny",
        description: "A large, lovable rabbit deals with three tiny bullies in this classic open-source film.",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800",
        channelName: "Blender Foundation",
        views: 125420
      },
      {
        title: "Elephants Dream",
        description: "The world's first open-movie project, showcasing a surreal mechanical world.",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnailUrl: "https://images.pexels.com/photos/1535162/pexels-photo-1535162.jpeg?auto=compress&cs=tinysrgb&w=800",
        channelName: "Orange Open Movie",
        views: 85000
      },
      {
        title: "For Bigger Blazes",
        description: "High-energy cinematic shots for testing video rendering and buffer speeds.",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnailUrl: "https://images.pexels.com/photos/701855/pexels-photo-701855.jpeg?auto=compress&cs=tinysrgb&w=800",
        channelName: "Google Cinema",
        views: 99030
      },
      {
        title: "Sintel - The Quest",
        description: "A brave woman travels the world to find her lost dragon companion.",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        thumbnailUrl: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800",
        channelName: "Blender Foundation",
        views: 250000
      },
      {
        title: "Tears of Steel",
        description: "Science fiction short film featuring robots and high-end visual effects.",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        thumbnailUrl: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",
        channelName: "Mango Open Movie",
        views: 310500
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