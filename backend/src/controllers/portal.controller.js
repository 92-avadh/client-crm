const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const portalService = require('../services/portal.service');

const getPortal = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const data = await portalService.getPortalDataByToken(token);
  if (!data) {
    return res.status(404).json({ error: 'This client portal link is invalid, expired, or has been revoked.' });
  }
  res.json(data);
});

const submitFeedback = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const body = makeValidator(req.body)
    .number('score', { min: 1, max: 10, required: true, label: 'NPS Score' })
    .optionalString('comment', { max: 1000, label: 'Comment' })
    .validate();

  const result = await portalService.submitPortalFeedback(token, body.score, body.comment);
  res.json(result);
});

const getInvoice = asyncHandler(async (req, res) => {
  const { token, invoiceId } = req.params;
  const result = await portalService.getPortalInvoiceDetails(token, invoiceId);
  if (!result) {
    return res.status(404).json({ error: 'Invoice not found or access denied.' });
  }
  res.json(result);
});

const scheduleSurveyReminder = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await portalService.scheduleSurveyReminder(token);
  res.json(result);
});

const intakeClient = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('name', { max: 200, label: 'Company / Client name' })
    .optionalString('ownerName', { max: 200, label: 'Point of Contact' })
    .optionalString('mobile', { max: 40, label: 'Mobile / WhatsApp' })
    .email('email', { label: 'Email' })
    .optionalString('billingAddress', { max: 500, label: 'Billing address' })
    .optionalString('city', { max: 100, label: 'City' })
    .optionalString('state', { max: 80, label: 'State' })
    .optionalString('pincode', { max: 12, label: 'Pincode' })
    .optionalString('gstNumber', { max: 30, label: 'GST Number' })
    .optionalString('pan', { max: 20, label: 'PAN' })
    .optionalString('serviceDetails', { max: 3000, label: 'Services needed' })
    .optionalString('notes', { max: 3000, label: 'Notes' })
    .number('monthlyFee', { min: 0, label: 'Monthly fee' })
    .optionalString('currency', { max: 10, label: 'Currency' })
    .optionalString('currencySymbol', { max: 10, label: 'Currency symbol' })
    .optionalString('contractStartDate', { max: 50, label: 'Start date' })
    .array('deliverables', { max: 100, label: 'Deliverables' })
    .validate();

  const result = await portalService.intakeClient(body);
  res.status(201).json(result);
});

module.exports = {
  getPortal,
  submitFeedback,
  scheduleSurveyReminder,
  intakeClient,
  getInvoice,
};
