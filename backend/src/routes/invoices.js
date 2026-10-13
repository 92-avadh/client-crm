const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoices.controller');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.get('/:id/pdf', controller.pdfData);
router.post('/', controller.create);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.remove);

module.exports = router;
