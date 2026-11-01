const express = require('express');
const router = express.Router();
const controller = require('../controllers/leads.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/stage', controller.updateStage);
router.post('/:id/convert', controller.convert);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
