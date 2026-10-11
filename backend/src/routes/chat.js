const express = require('express');
const router = express.Router();
const controller = require('../controllers/chat.controller');

router.get('/conversations', controller.listConversations);
router.get('/conversations/:id/messages', controller.listMessages);
router.post('/conversations/:id/messages', controller.sendMessage);
router.post('/conversations', controller.createConversation);

module.exports = router;
