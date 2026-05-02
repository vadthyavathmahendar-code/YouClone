const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const Playlist = require('../models/Playlist');

// 1. GET ALL VIDEOS
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    console.log(`📡 Total videos in DB: ${videos.length}`);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SEARCH VIDEOS
router.get('/search/v', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      const all = await Video.find({});
      return res.json(all);
    }
    const cleanQuery = q.trim();
    const videos = await Video.find({
      $or: [
        { title: { $regex: cleanQuery, $options: 'i' } },
        { description: { $regex: cleanQuery, $options: 'i' } },
        { channelName: { $regex: cleanQuery, $options: 'i' } }
      ]
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

// 3. UPLOAD VIDEO (POST)
router.post('/', async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, channelName, uploadedBy } = req.body;
    if (!title || !videoUrl) return res.status(400).json({ message: "Title and videoUrl required" });
    const video = new Video({ title, description, videoUrl, thumbnailUrl, channelName, uploadedBy });
    const saved = await video.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. LIKE / DISLIKE VIDEO
router.put('/:id/vote', async (req, res) => {
  try {
    const { action, email } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (action === 'like') {
      if (video.likedBy.includes(email)) {
        // Unlike
        video.likes = Math.max(0, video.likes - 1);
        video.likedBy = video.likedBy.filter(e => e !== email);
      } else {
        video.likes += 1;
        video.likedBy.push(email);
        // Remove dislike if exists
        if (video.dislikedBy.includes(email)) {
          video.dislikes = Math.max(0, video.dislikes - 1);
          video.dislikedBy = video.dislikedBy.filter(e => e !== email);
        }
      }
    } else if (action === 'dislike') {
      if (video.dislikedBy.includes(email)) {
        // Un-dislike
        video.dislikes = Math.max(0, video.dislikes - 1);
        video.dislikedBy = video.dislikedBy.filter(e => e !== email);
      } else {
        video.dislikes += 1;
        video.dislikedBy.push(email);
        // Remove like if exists
        if (video.likedBy.includes(email)) {
          video.likes = Math.max(0, video.likes - 1);
          video.likedBy = video.likedBy.filter(e => e !== email);
        }
      }
    }

    await video.save();
    res.json({ likes: video.likes, dislikes: video.dislikes, likedBy: video.likedBy, dislikedBy: video.dislikedBy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. INCREMENT VIEWS
router.put('/:id/view', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    res.json({ views: video.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────

// Toggle subscribe/unsubscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { subscriber, channel } = req.body;
    const existing = await Subscription.findOne({ subscriber, channel });
    if (existing) {
      await existing.deleteOne();
      return res.json({ subscribed: false });
    }
    await new Subscription({ subscriber, channel }).save();
    res.json({ subscribed: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get subscriptions for a user
router.get('/subscriptions/:email', async (req, res) => {
  try {
    const subs = await Subscription.find({ subscriber: req.params.email });
    const channels = subs.map(s => s.channel);
    // Get latest video from each subscribed channel
    const videos = await Video.find({ channelName: { $in: channels } }).sort({ createdAt: -1 });
    res.json({ channels, videos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if subscribed
router.get('/subscribe/check', async (req, res) => {
  try {
    const { subscriber, channel } = req.query;
    const existing = await Subscription.findOne({ subscriber, channel });
    res.json({ subscribed: !!existing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PLAYLISTS ──────────────────────────────────────────────────────────────

// Get user's playlists
router.get('/playlists/:email', async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.params.email }).populate('videos');
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create playlist
router.post('/playlists', async (req, res) => {
  try {
    const { name, owner } = req.body;
    const playlist = await new Playlist({ name, owner, videos: [] }).save();
    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add/remove video from playlist
router.put('/playlists/:id/video', async (req, res) => {
  try {
    const { videoId, action } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    if (action === 'add') {
      if (!playlist.videos.includes(videoId)) playlist.videos.push(videoId);
    } else {
      playlist.videos = playlist.videos.filter(v => v.toString() !== videoId);
    }
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete playlist
router.delete('/playlists/:id', async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. GET SINGLE VIDEO
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

module.exports = router;

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
    title: "Ocean Waves",
    description: "High-speed direct stream for YouClone testing.",
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4", 
    thumbnailUrl: "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg",
    channelName: "Blender Foundation",
    views: 125420
  },
  {
    title: "Bunny Trailer",
    description: "Stable trailer for testing playback.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", 
    thumbnailUrl: "https://images.pexels.com/photos/1535162/pexels-photo-1535162.jpeg",
    channelName: "Nature Hub",
    views: 85000
  },
  {
    title: "Sintel Project",
    description: "Reliable CDN for final presentation.",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4", 
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