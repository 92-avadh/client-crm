const express = require('express');
const router = express.Router();
const controller = require('../controllers/portal.controller');

// Public intake endpoint for self-serve client onboarding link
router.post('/intake', controller.intakeClient);

// Public endpoints — authenticated via unique, high-entropy client magic_token
router.get('/:token', controller.getPortal);
router.post('/:token/feedback', controller.submitFeedback);
router.post('/:token/schedule-survey-reminder', controller.scheduleSurveyReminder);
router.get('/:token/invoices/:invoiceId', controller.getInvoice);

module.exports = router;
