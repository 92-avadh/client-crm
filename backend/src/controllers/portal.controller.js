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

module.exports = {
  getPortal,
  submitFeedback,
  getInvoice,
};
