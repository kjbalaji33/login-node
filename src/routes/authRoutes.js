const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, changePasswordByUsername, logoutUser } = require('../controllers/authController');
const { initiateGoogleLogin, handleGoogleLoginCallback } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/change-password', changePasswordByUsername);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

router.get('/google', initiateGoogleLogin);
router.get('/google/callback', handleGoogleLoginCallback);

module.exports = router;
