const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// No Session import needed anymore
// const Session = require('../models/Session');

exports.createSession = async (req, res) => {
  const sessionId = uuidv4();
  const accessToken = crypto.randomBytes(16).toString('hex');

  try {
    // Just return the session ID and access token without saving to DB
    res.json({ sessionId, accessToken });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
};
