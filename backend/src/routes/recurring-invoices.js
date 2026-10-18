const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/recurring-invoices.controller');

router.get('/', auth, controller.list);
router.get('/:id', auth, controller.get);
router.post('/run-now', auth, controller.runNow);
router.post('/', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
