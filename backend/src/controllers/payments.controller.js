const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const crypto = require('crypto');
const payments = require('../services/payments.service');

const list = asyncHandler(async (req, res) => {
  res.json(await payments.listPayments(req.user, {
    brandId: req.query.brandId,
    invoiceId: req.query.invoiceId,
  }));
});

const record = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('invoiceId', { max: 80, label: 'Invoice' })
    .requiredString('brandId', { max: 80, label: 'Client' })
    .requiredString('brandName', { max: 200, label: 'Client name' })
    .number('amount', { min: 0.01, required: true, label: 'Amount' })
    .oneOf('mode', payments.PAYMENT_MODES, { label: 'Payment mode' })
    .optionalString('referenceNo', { max: 120, label: 'Reference number' })
    .validate();

  res.status(201).json(await payments.recordPayment({ ...body, actor: req.user }));
});

const razorpayInitiate = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('invoiceId', { max: 80, label: 'Invoice' })
    .validate();

  const order = await payments.initiateRazorpay(body.invoiceId);
  if (!order) return res.status(404).json({ error: 'We could not find that invoice.' });
  res.json(order);
});

const razorpayVerify = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('invoiceId', { max: 80, label: 'Invoice' })
    .requiredString('brandId', { max: 80, label: 'Client' })
    .requiredString('brandName', { max: 200, label: 'Client name' })
    .number('amount', { min: 0.01, required: true, label: 'Amount' })
    .requiredString('razorpayOrderId', { max: 120, label: 'Razorpay order ID' })
    .requiredString('razorpayPaymentId', { max: 120, label: 'Payment reference' })
    .requiredString('razorpaySignature', { max: 200, label: 'Razorpay signature' })
    .validate();

  // Verify Razorpay signature using HMAC-SHA256
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(503).json({ error: 'Online payments are not set up yet. Please contact support.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
    .digest('hex');

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(body.razorpaySignature)
    );
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return res.status(400).json({ error: 'Payment verification failed. The signature is not valid.' });
  }

  res.status(201).json(await payments.recordPayment({
    ...body,
    mode: 'Razorpay',
    referenceNo: body.razorpayPaymentId,
    actor: req.user,
  }));
});

const update = asyncHandler(async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: "You don't have permission to edit payments." });
  }
  const body = makeValidator(req.body)
    .oneOf('status', payments.PAYMENT_STATUSES, { label: 'Status' })
    .oneOf('mode', payments.PAYMENT_MODES, { label: 'Payment mode' })
    .number('amount', { min: 0.01, label: 'Amount' })
    .optionalString('referenceNo', { max: 120, label: 'Reference number' })
    .validate();

  const updated = await payments.updatePayment(req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'We could not find that payment.' });
  res.json(updated);
});

const remove = asyncHandler(async (req, res) => {
  if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: "You don't have permission to delete payments." });
  }
  const deleted = await payments.deletePayment(req.user, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'We could not find that payment.' });
  res.json({ success: true, message: 'Payment record deleted', payment: deleted });
});

/** POST /api/payments/bulk-delete — batch delete payments. */
const bulkRemove = asyncHandler(async (req, res) => {
  if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: "You don't have permission to delete payments." });
  }
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'Please provide an array of payment IDs to delete.' });
  }
  const count = await payments.deletePayments(req.user, ids);
  res.json({ success: true, count, message: `${count} payment record(s) deleted successfully` });
});

module.exports = { list, record, razorpayInitiate, razorpayVerify, update, remove, bulkRemove };
