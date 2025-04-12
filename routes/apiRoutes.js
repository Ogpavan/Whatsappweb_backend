const express = require('express');
const router = express.Router();
const { sendPublicMessage } = require('../controllers/apiController');

router.post('/send', sendPublicMessage); // GET version
// or: router.post('/send', sendPublicMessage); for POST

module.exports = router;
