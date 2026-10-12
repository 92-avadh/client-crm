const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenses.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.post('/bulk-delete', controller.bulkRemove);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
