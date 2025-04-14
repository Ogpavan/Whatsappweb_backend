const { clients } = require('../services/whatsappService');

exports.sendPublicMessage = async (req, res) => {
  const { number, type, message, instance_id, access_token } = req.body;

  // Basic validations
  if (!number || !type || !message || !instance_id || !access_token) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Optional: validate access_token here (e.g., match with env or DB)

  const client = clients[instance_id];
  if (!client) {
    return res.status(404).json({ success: false, error: 'Invalid instance ID or not connected' });
  }

  try {
    if (type === 'text') {
      await client.sendMessage(`${number}@c.us`, message);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported message type' });
    }

    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error(`❌ Error sending message: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// controllers/apiController.js


exports.sendBulkMessages = async (req, res) => {
  const { instance_id, access_token } = req.query;
  const recipients = req.body?.recipients;

  console.log('📥 /api/bulk-send request received');

  // Validate input
  if (!instance_id || !access_token || !Array.isArray(recipients)) {
    return res.status(400).json({ success: false, message: 'Missing instance_id, access_token, or recipients array.' });
  }

  const client = clients[instance_id]; // ✅ fixed here
  if (!client || !client.info?.wid) {
    return res.status(404).json({ success: false, message: 'Client not found or not connected.' });
  }

  const results = [];

  for (const entry of recipients) {
    const number = entry.number?.toString().trim();
    const message = entry.message?.toString().trim();

  

    if (!number || !message) {
      results.push({ number, status: 'skipped', reason: 'Missing number or message' });
      continue;
    }

    const chatId = number.endsWith('@c.us') ? number : `${number}@c.us`;

    try {
      await client.sendMessage(chatId, message);
      results.push({ number, status: 'sent' });
      console.log(`✅ Sent to ${chatId}`);
    } catch (error) {
      results.push({ number, status: 'failed', error: error.message });
      console.error(`❌ Failed to send to ${chatId}`, error.message);
    }
  }

  return res.status(200).json({ success: true, results });
};

