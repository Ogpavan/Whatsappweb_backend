// server.js
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Store sessions dynamically
const clients = {};
const qrCodes = {};

// API to generate QR code
app.get('/generate-qrcode/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    if (clients[sessionId]) {
        console.log(`⚠️ Client for ${sessionId} is already initialized.`);
        return res.status(400).json({ error: 'Client already initialized' });
    }

    console.log(`🚀 Initializing client for ${sessionId}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    clients[sessionId] = client;

    client.on('qr', (qr) => {
        console.log(`✅ QR Code generated for ${sessionId}`);
        qrCodes[sessionId] = qr;
    });

    client.on('authenticated', () => {
        console.log(`🔐 Authenticated for ${sessionId}`);
    });

    client.on('ready', async () => {
        console.log(`🚀 WhatsApp Web is ready for ${sessionId}`);
        if (client.info && client.info.wid) {
            const phoneNumber = client.info.wid.user;
            const name = client.info.pushname || 'Unknown';
            const serialized = client.info.wid._serialized;

            console.log(`📞 Logged in as: ${name} (${phoneNumber}) - Serialized: ${serialized}`);

            try {
                const apiUrl = 'http://localhost:59397/api/Whatsapp/RegisterUser';
                await axios.post(apiUrl, { phoneNumber, name, serialized });
                console.log('✅ User registered successfully!');
            } catch (error) {
                console.error('❌ Error registering user:', error.response ? error.response.data : error.message);
            }
        }
    });

    client.on('disconnected', () => {
        console.log(`⚡ Client disconnected for ${sessionId}`);
        delete clients[sessionId];
    });

    client.initialize();

    // Poll for QR Code generation
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        if (qrCodes[sessionId]) {
            clearInterval(interval);
            try {
                const qrImage = await qrcode.toDataURL(qrCodes[sessionId]);
                return res.json({ qrCode: qrImage });
            } catch (error) {
                return res.status(500).json({ error: 'Failed to generate QR Code' });
            }
        }
        if (attempts > 20) {
            clearInterval(interval);
            return res.status(500).json({ error: 'QR Code generation timeout!' });
        }
    }, 1000);
});

// Start server
app.listen(3000, () => {
    console.log('🚀 Server running at http://localhost:3000');
});
