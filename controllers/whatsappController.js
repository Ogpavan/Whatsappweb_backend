const qrcode = require('qrcode');
const { initClient, clients, qrCodes, userDetails } = require('../services/whatsappService');
const path = require('path');
const fs = require('fs');
const Session = require('../models/Session');
 

exports.generateQRCode = async (req, res) => {
  const { sessionId } = req.params;
  const qrCode = await initClient(sessionId);
  if (!qrCode) return res.status(500).json({ error: 'QR generation failed' });

  const qrImage = await qrcode.toDataURL(qrCode);
  res.json({ qrCode: qrImage });
};

exports.getUserDetails = (req, res) => {
  const { sessionId } = req.params;
  let details = userDetails[sessionId];

  if (!details) {
    const client = clients[sessionId];
    if (client && client.info) {
      const { wid, pushname } = client.info;
      details = {
        phoneNumber: wid.user,
        name: pushname || 'Unknown',
        serialized: wid._serialized
      };

      // Optionally cache it for future
      userDetails[sessionId] = details;
    }
  }

  if (!details) return res.status(404).json({ error: 'Not found' });

  res.json(details);
};



exports.sendMessage = async (req, res) => {
  const { sessionId, phoneNumber, message } = req.body;
  const client = clients[sessionId];
  if (!client) return res.status(400).json({ error: 'Session invalid' });

  try {
    await client.sendMessage(`${phoneNumber}@c.us`, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Send failed' });
  }
};

exports.logoutSession = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  const client = clients[sessionId];
  if (!client) {
    return res.status(404).json({ message: 'No active client found for this session' });
  }

  try {
    // Only destroy the client (no .logout to avoid errors)
    await client.destroy();

    // Don't delete folder, just log message
    const authPath = path.join(__dirname, `../.wwebjs_auth/session-${sessionId}`);
    if (fs.existsSync(authPath)) {
      console.log(`⚠️ Auth folder still exists for session ${sessionId} at ${authPath}`);
      // fs.rmSync(authPath, { recursive: true, force: true }); ← Disabled
    }

    // Cleanup memory
    delete clients[sessionId];

    // Update DB (mark session inactive)
    await Session.findOneAndUpdate(
      { sessionId },
      { $unset: { serializedId: '', number: '', name: '' }, status: 'inactive' }
    );

    res.status(200).json({ message: `Session ${sessionId} logged out successfully` });
  } catch (err) {
    console.error(`❌ Error logging out session ${sessionId}:`, err.message);
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};
