const express = require('express');
const router = express.Router();
const { initiateGoogleAuth, handleGoogleCallback, processUserInbox } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

router.get('/connect', protect, initiateGoogleAuth);
router.get('/oauth2callback', handleGoogleCallback);
router.get('/fetch-unread', protect, processUserInbox);

module.exports = router;
