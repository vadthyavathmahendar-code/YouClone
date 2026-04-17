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
    title: "Big Buck Bunny - 720p",
    description: "Classic open-source animation. Stable for Task 7 downloads.",
    videoUrl: '${process.env.NEXT_PUBLIC_API_URL}/uploads/1.mp4',
    thumbnailUrl: "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800",
    channelName: "Blender Foundation",
    views: 15420
  },
  {
    title: "Cosmos Laundromat",
    description: "Another high-quality public domain video for testing gestures.",
    videoUrl: '${process.env.NEXT_PUBLIC_API_URL}/uploads/2.mp4',
    thumbnailUrl: "https://images.pexels.com/photos/1535162/pexels-photo-1535162.jpeg?auto=compress&cs=tinysrgb&w=800",
    channelName: "Blender Hub",
    views: 45000
  },
  {
    title: "Sintel - Open Movie",
    description: "A lonely young woman, Sintel, helps and befriends a dragon.",
        videoUrl: '${process.env.NEXT_PUBLIC_API_URL}/uploads/3.mp4',
    thumbnailUrl: "https://images.pexels.com/photos/701855/pexels-photo-701855.jpeg?auto=compress&cs=tinysrgb&w=800",
    channelName: "Blender Foundation",
    views: 89030
  },{
    title: "test video",
    description: "A lonely young woman, Sintel, helps and befriends a dragon.",
        videoUrl: '${process.env.NEXT_PUBLIC_API_URL}/uploads/4.mp4',
    thumbnailUrl: "https://images.pexels.com/photos/701855/pexels-photo-701855.jpeg?auto=compress&cs=tinysrgb&w=800",
    channelName: "Blender Foundation",
    views: 89030
  },{
    title: "Aditya Vikram",
    description: "A man finds himself trapped in a mysterious world where he must confront his past and fight for his future.",
        videoUrl: '${process.env.NEXT_PUBLIC_API_URL}/uploads/6.mp4',
    thumbnailUrl: "https://images.pexels.com/photos/701855/pexels-photo-701855.jpeg?auto=compress&cs=tinysrgb&w=800",
    channelName: "Mahi Films",
    views: 89030
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