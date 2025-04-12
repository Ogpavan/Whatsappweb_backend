const express = require('express');
const router = express.Router();
const { createSession } = require('../controllers/sessionController');

router.post('/create-session', createSession);

module.exports = router;
