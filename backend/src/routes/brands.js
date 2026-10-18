const express = require('express');
const router = express.Router();
const controller = require('../controllers/brands.controller');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.patch('/:id/assign-members', controller.assignMembers);
router.patch('/:id/log-activity', controller.logActivity);
router.patch('/:id/churn', controller.churn);
router.patch('/:id/snooze-retention', controller.snoozeRetention);
router.post('/:id/log-hours', controller.logHours);
router.post('/:id/documents', controller.addDocument);

module.exports = router;
