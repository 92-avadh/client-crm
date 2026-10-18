const express = require('express');
const router = express.Router();
const controller = require('../controllers/chat.controller');

router.get('/conversations', controller.listConversations);
router.post('/conversations', controller.createConversation);
router.post('/direct/:targetUserId', controller.directConversation);
router.get('/conversations/:id/messages', controller.listMessages);
router.post('/conversations/:id/messages', controller.sendMessage);
router.post('/conversations/:id/read', controller.markRead);
router.delete('/conversations/:id/messages/:messageId', controller.deleteMessage);
router.delete('/conversations/:id', controller.deleteConversation);
router.post('/conversations/:id/clear', controller.clearConversation);

module.exports = router;

