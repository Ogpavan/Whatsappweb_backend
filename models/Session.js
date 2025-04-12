const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  number: { type: String },
  name: { type: String },
  serializedId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
