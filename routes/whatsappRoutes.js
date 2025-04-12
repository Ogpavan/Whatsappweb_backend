const express = require('express');
const router = express.Router();
const {
  generateQRCode,
  getUserDetails,
  sendMessage,
  logoutSession
} = require('../controllers/whatsappController');

router.get('/generate-qrcode/:sessionId', generateQRCode);
router.get('/user-details/:sessionId', getUserDetails);
router.post('/send-message', sendMessage);
router.post('/logout-session', logoutSession);

module.exports = router;
