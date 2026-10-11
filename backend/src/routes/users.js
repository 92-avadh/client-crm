const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.controller');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.patch('/:id/deactivate', controller.deactivate);

module.exports = router;
