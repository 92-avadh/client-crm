const express = require('express');
const router = express.Router();
const controller = require('../controllers/projects.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);

module.exports = router;
