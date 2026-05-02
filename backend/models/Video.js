const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  channelName: { type: String, default: "YouClone Originals" },
  uploadedBy: { type: String, default: "" }, // user email
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],    // emails who liked
  dislikedBy: [{ type: String }], // emails who disliked
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);