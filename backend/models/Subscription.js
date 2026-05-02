const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriber: { type: String, required: true }, // user email who subscribes
  channel: { type: String, required: true },    // channelName they subscribe to
}, { timestamps: true });

subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
