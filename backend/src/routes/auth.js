const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

router.post('/send-otp', controller.sendOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/verify-otp', controller.verifyOtp);
router.get('/search-agencies', controller.searchAgencies);
router.post('/login', controller.login);
router.get('/status', controller.status);
router.post('/logout', controller.logout);
router.get('/me', auth, controller.me);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

module.exports = router;
