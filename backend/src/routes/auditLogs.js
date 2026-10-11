const express = require('express');
const router = express.Router();
const controller = require('../controllers/auditLogs.controller');

router.get('/', controller.list);

module.exports = router;
