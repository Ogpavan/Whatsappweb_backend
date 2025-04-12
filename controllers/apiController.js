const { clients } = require('../services/whatsappService');

exports.sendPublicMessage = async (req, res) => {
  const { number, type, message, instance_id, access_token } = req.query;

  if (!number || !message || !instance_id || !access_token) {
    return res.status(400).json({ status: 'error', message: 'Missing params' });
  }

  const client = clients[instance_id];
  if (!client) return res.status(404).json({ status: 'error', message: 'Instance not ready' });

  try {
    if (type === 'text') {
      await client.sendMessage(`${number}@c.us`, message);
      res.json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', message: 'Unsupported type' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
