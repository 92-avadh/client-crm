const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings.controller');

router.get('/', controller.get);
router.patch('/', controller.update);
router.post('/reset-data', controller.resetData);

module.exports = router;
