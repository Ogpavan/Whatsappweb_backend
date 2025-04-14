const express = require('express');
const router = express.Router();
const { sendPublicMessage, sendBulkMessages } = require('../controllers/apiController');

router.post('/send', sendPublicMessage);
router.post('/bulksend', sendBulkMessages); // GET version
// or: router.post('/send', sendPublicMessage); for POST

module.exports = router;
