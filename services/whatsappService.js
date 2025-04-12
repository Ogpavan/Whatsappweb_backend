const { Client, LocalAuth } = require('whatsapp-web.js');
const Session = require('../models/Session');
const axios = require('axios');

const clients = {};
const qrCodes = {};
const userDetails = {};

// Init a new or existing session
const initClient = (sessionId) => {
  return new Promise((resolve, reject) => {
    if (clients[sessionId]) return reject('Client already initialized');

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: { headless: true, args: ['--no-sandbox'] }
    });

    clients[sessionId] = client;

    let qrResolved = false;

    client.on('qr', (qr) => {
      qrCodes[sessionId] = qr;
      if (!qrResolved) {
        qrResolved = true;
        resolve(qr); // Resolve with QR for frontend to display
      }
    });

    client.on('ready', async () => {
      const { wid, pushname } = client.info;
      const phoneNumber = wid.user;
      const name = pushname || 'Unknown';
      const serialized = wid._serialized;

      userDetails[sessionId] = { phoneNumber, name, serialized };

      try {
        await Session.findOneAndUpdate(
          { sessionId },
          { number: phoneNumber, name, serializedId: serialized },
          { new: true }
        );

        // Optional: Notify external service
        const apiUrl = 'http://localhost:3000/api/Whatsapp/RegisterUser';
        await axios.post(apiUrl, { phoneNumber, name, serialized });
      } catch (err) {
        console.error('Error saving session or registering:', err.message);
      }

      if (!qrResolved) {
        qrResolved = true;
        resolve(null); // Already logged in, no QR required
      }

      console.log(`✅ WhatsApp client ready for ${sessionId}`);
    });

    client.on('disconnected', async () => {
      console.log(`⚡ Client ${sessionId} disconnected`);
    
      // Clean from memory
      delete clients[sessionId];
      delete qrCodes[sessionId];
      delete userDetails[sessionId];
    
      // Clean from MongoDB (optional)
      try {
        await Session.findOneAndDelete({ sessionId });
        console.log(`🗑️ Session ${sessionId} removed from DB`);
      } catch (err) {
        console.error(`❌ Failed to delete session ${sessionId} from DB:`, err.message);
      }
    });
    

    client.initialize();

    // Timeout for safety
    setTimeout(() => {
      if (!qrResolved) {
        qrResolved = true;
        reject('Initialization timeout for session ' + sessionId);
      }
    }, 30000);
  });
};

// Restore previously logged-in clients (called on server start)
const restoreSessions = async () => {
  const activeSessions = await Session.find({ serializedId: { $exists: true } });

  for (const session of activeSessions) {
    const { sessionId } = session;
    try {
      await initClient(sessionId);
      console.log(`♻️ Restored WhatsApp client for session: ${sessionId}`);
    } catch (err) {
      console.error(`⚠️ Failed to restore session ${sessionId}:`, err);
    }
  }
};

module.exports = {
  clients,
  qrCodes,
  userDetails,
  initClient,
  restoreSessions,
};
