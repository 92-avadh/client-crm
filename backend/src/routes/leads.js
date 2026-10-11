const express = require('express');
const router = express.Router();
const controller = require('../controllers/leads.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/stage', controller.updateStage);
router.post('/:id/convert', controller.convert);

module.exports = router;
