const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// 1. POST: Save a new comment (WITH TASK 1 BLOCKING LOGIC)
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    // 🔥 TASK 1: BLOCK SPECIAL CHARACTERS 🔥
    // This regex allows letters, numbers, spaces, and basic punctuation (. , ! ? ' ")
    const specialCharRegex = /[^a-zA-Z0-9 \.,!?\'\"]/;
    if (specialCharRegex.test(text)) {
      return res.status(400).json({ 
        message: "Comment blocked! Special characters are not allowed to maintain a clean environment." 
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

// 3. PUT: Handle Likes/Dislikes & TASK 1 SMART DELETE
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
        await Comment.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Comment removed due to negative feedback", deleted: true });
      }
    }

    const updatedComment = await comment.save();
    res.status(200).json({ updatedComment, deleted: false });
  } catch (error) {
    res.status(500).json({ message: "Failed to process vote" });
  }
});

// 4. POST: TASK 1 TRANSLATION MOCK
// Real translation would use Google Translate API, but we'll mock it for the internship
router.post('/:id/translate', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Mock Translation Logic
    const translatedText = `[Translated to English]: ${comment.text}`;
    
    res.status(200).json({ translatedText });
  } catch (error) {
    res.status(500).json({ message: "Translation failed" });
  }
});

module.exports = router;