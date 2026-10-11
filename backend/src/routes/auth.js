const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');

router.post('/send-otp', controller.sendOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/verify-otp', controller.verifyOtp);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.post('/forgot-password', controller.forgotPassword);

module.exports = router;
