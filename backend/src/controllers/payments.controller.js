const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
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
    .optionalString('razorpayPaymentId', { max: 120, label: 'Payment reference' })
    .validate();

  if (body.razorpayPaymentId) {
    await require('../db').query(
      'UPDATE invoices SET razorpay_payment_id=$1 WHERE id=$2',
      [body.razorpayPaymentId, body.invoiceId]
    );
  }

  res.status(201).json(await payments.recordPayment({
    ...body,
    mode: body.mode || 'Razorpay',
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

module.exports = { list, record, razorpayInitiate, razorpayVerify, update };
