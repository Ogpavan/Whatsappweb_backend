const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Session = require('../models/Session');

exports.createSession = async (req, res) => {
  const sessionId = uuidv4();
  const accessToken = crypto.randomBytes(16).toString('hex');

  try {
    const session = new Session({ sessionId, accessToken });
    await session.save();
    res.json({ sessionId, accessToken });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
};
