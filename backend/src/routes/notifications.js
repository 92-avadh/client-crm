const express = require('express');
const router = express.Router();
const controller = require('../controllers/notifications.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/vapid-key', controller.getVapidKey);
router.post('/push-subscribe', controller.pushSubscribe);
router.post('/push-unsubscribe', controller.pushUnsubscribe);
router.post('/test-push', controller.testPush);
// /read-all must be registered BEFORE /:id/read to avoid the param swallowing it.
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
