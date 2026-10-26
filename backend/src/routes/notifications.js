const express = require('express');
const router = express.Router();
const controller = require('../controllers/notifications.controller');

router.get('/', controller.list);
router.post('/', controller.create);
// /read-all must be registered BEFORE /:id/read to avoid the param swallowing it.
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
