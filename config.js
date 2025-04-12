require('dotenv').config();
const mongoose = require('mongoose');
const { restoreSessions } = require('./services/whatsappService');

exports.connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Restore all previously authenticated sessions
    await restoreSessions();
    console.log('♻️ All WhatsApp sessions restored');

  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
};
