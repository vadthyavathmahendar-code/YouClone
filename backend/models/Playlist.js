const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: String, required: true }, // user email
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);
