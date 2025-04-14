const { Client, LocalAuth } = require('whatsapp-web.js'); // ✅ Include LocalAuth
const path = require('path');

const clients = {};
const qrCodes = {};
const userDetails = {};

const initClient = (sessionId) => {
  return new Promise((resolve, reject) => {
    if (clients[sessionId]) return reject('Client already initialized');

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId, // ✅ Enables unique auth per session
        dataPath: path.join(__dirname, '..', '.wwebjs_auth'), // optional but recommended
      }),
      puppeteer: { headless: true, args: ['--no-sandbox'] },
    });

    clients[sessionId] = client;

    let qrResolved = false;

    client.on('qr', (qr) => {
      qrCodes[sessionId] = qr;
      if (!qrResolved) {
        qrResolved = true;
        resolve(qr);
      }
    });

    client.on('ready', () => {
      const { wid, pushname } = client.info;
      const phoneNumber = wid.user;
      const name = pushname || 'Unknown';
      const serialized = wid._serialized;

      userDetails[sessionId] = { phoneNumber, name, serialized };

      console.log(`✅ WhatsApp client ready for ${sessionId}`);
      if (!qrResolved) {
        qrResolved = true;
        resolve(null); // Already authenticated
      }
    });

    client.on('disconnected', () => {
      console.log(`⚡ Client ${sessionId} disconnected`);
      delete clients[sessionId];
      delete qrCodes[sessionId];
      delete userDetails[sessionId];
    });

    client.initialize();

    setTimeout(() => {
      if (!qrResolved) {
        qrResolved = true;
        reject('Initialization timeout for session ' + sessionId);
      }
    }, 30000);
  });
};

module.exports = {
  clients,
  qrCodes,
  userDetails,
  initClient,
};
