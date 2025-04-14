const qrcode = require('qrcode');
const { initClient, clients, qrCodes, userDetails } = require('../services/whatsappService');
const path = require('path');
const fs = require('fs');

// Generate QR code for WhatsApp session
exports.generateQRCode = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const qrCode = await initClient(sessionId);
    if (!qrCode) return res.status(500).json({ error: 'QR generation failed' });

    const qrImage = await qrcode.toDataURL(qrCode);
    res.json({ qrCode: qrImage });
  } catch (err) {
    console.error(`❌ QR generation error for ${sessionId}:`, err.message);
    res.status(500).json({ error: 'QR generation failed' });
  }
};

// Get connected WhatsApp user details
exports.getUserDetails = (req, res) => {
  const { sessionId } = req.params;

  const client = clients[sessionId];
  const details = userDetails[sessionId];

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  if (!details) {
    return res.status(202).json({ status: 'waiting', message: 'Client is initializing' });
  }

   
  res.status(200).json(details); // 👈 Should hit this if ready
};


// Send message via active session
exports.sendMessage = async (req, res) => {
  const { sessionId, phoneNumber, message } = req.body;

  const client = clients[sessionId];
  if (!client) return res.status(400).json({ error: 'Session invalid' });

  try {
    await client.sendMessage(`${phoneNumber}@c.us`, message);
    res.json({ success: true });
  } catch (err) {
    console.error(`❌ Send message error:`, err.message);
    res.status(500).json({ error: 'Send failed' });
  }
};

// Logout and cleanup session
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
    await client.destroy();

    // Optional: You may remove auth folder here if you want full reset
    const authPath = path.join(__dirname, `../.wwebjs_auth/session-${sessionId}`);
    if (fs.existsSync(authPath)) {
      console.log(`⚠️ Auth folder still exists for session ${sessionId} at ${authPath}`);
      // fs.rmSync(authPath, { recursive: true, force: true }); // Uncomment if you want to wipe session files
    }

    // Remove from memory
    delete clients[sessionId];
    delete qrCodes[sessionId];
    delete userDetails[sessionId];

    res.status(200).json({ message: `Session ${sessionId} logged out successfully` });
  } catch (err) {
    console.error(`❌ Error logging out session ${sessionId}:`, err.message);
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};
