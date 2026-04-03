const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  email: { type: String, required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  watchedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);