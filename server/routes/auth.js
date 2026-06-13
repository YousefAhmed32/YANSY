const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register',          authController.register);
router.post('/login',             authController.login);
router.post('/logout',            authController.logout);
router.post('/forgot-password',   authController.forgotPassword);
router.post('/reset-password',    authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Google OAuth — receives authorization code from frontend popup, returns JWT
router.post('/google',            authController.googleAuth);

// Protected routes
router.get('/me',                   authenticate, authController.getMe);
router.post('/resend-verification', authenticate, authController.resendVerification);

module.exports = router;
