const express = require('express');
const router = express.Router();
const controller = require('../controllers/tasks.controller');

// Route layer: URL + HTTP verb only. Parsing, validation and business logic
// live in the controller and service respectively.
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id', controller.update);

module.exports = router;
