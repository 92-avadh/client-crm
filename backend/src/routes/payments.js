const express = require('express');
const router = express.Router();
const controller = require('../controllers/payments.controller');

router.get('/', controller.list);
router.post('/', controller.record);
router.post('/razorpay-initiate', controller.razorpayInitiate);
router.post('/razorpay-verify', controller.razorpayVerify);
router.patch('/:id', controller.update);

module.exports = router;
