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
