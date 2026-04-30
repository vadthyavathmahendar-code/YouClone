const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// 1. POST: Save a new comment (WITH TASK 1 INCLUSIVE BLOCKING)
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    // 🛡️ TASK 1: INCLUSIVE REGEX 
    // Allows English, Numbers, Punctuation, and Indian Unicode (Telugu, Hindi, etc.)
    const inclusiveRegex = /^[a-zA-Z0-9\s.,!?\'\"\u00C0-\u1FFF\u2C00-\uD7FF]+$/;

    // Logic: If it DOES NOT match the allowed characters, block it.
    if (!inclusiveRegex.test(text)) {
      return res.status(400).json({ 
        message: "Comment blocked! Please avoid symbols like @, #, or $ to keep the environment clean." 
      });
    }

    const newComment = new Comment(req.body);
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Comment Save Error:", error);
    res.status(500).json({ message: "Failed to save comment" });
  }
});

// 2. GET: Fetch all comments for a specific video
router.get('/video/:videoId', async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// 3. PUT: Handle Likes/Dislikes & TASK 1 AUTO-MODERATION
router.put('/:id/vote', async (req, res) => {
  try {
    const { action } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (action === 'like') {
      comment.likes += 1;
    } else if (action === 'dislike') {
      comment.dislikes += 1;
      
      // 🔥 TASK 1: AUTO-REMOVE AT 2 DISLIKES 🔥
      if (comment.dislikes >= 2) {
        await comment.deleteOne();
        return res.status(200).json({ 
          message: "Comment removed due to negative community feedback", 
          deleted: true 
        });
      }
    }

    const updatedComment = await comment.save();
    res.status(200).json({ updatedComment, deleted: false });
  } catch (error) {
    console.error("Vote Error:", error);
    res.status(500).json({ message: "Failed to process vote" });
  }
});
// 4. POST: TRANSLATION using Google Translate (gtx client - no rate limit)
router.post('/:id/translate', async (req, res) => {
  let comment;
  try {
    comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const targetLang = req.body.targetLang || 'en';
    const text = comment.text;

    // Use gtx client endpoint — reliable, no rate limiting
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) throw new Error(`Translate API returned ${response.status}`);

    const data = await response.json();

    // Parse the nested array response: [[["translated","original",...],...],...]
    const translatedText = data[0]
      .filter((chunk) => chunk[0])
      .map((chunk) => chunk[0])
      .join('');

    const sourceLang = data[2] || 'unknown';

    console.log(`🌍 Translated from ${sourceLang} to ${targetLang}: "${translatedText}"`);

    res.status(200).json({ translatedText, sourceLang, targetLang });

  } catch (error) {
    console.error("Translation Engine Error:", error.message);
    res.status(200).json({
      translatedText: comment ? comment.text : "Translation unavailable",
      error: true
    });
  }
});

module.exports = router;