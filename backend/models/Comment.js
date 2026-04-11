// backend/models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  videoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  user: { 
    type: String, 
    default: 'Anonymous Node' 
  },
  city: { 
    type: String, 
    default: 'Unknown' 
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  dislikes: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);