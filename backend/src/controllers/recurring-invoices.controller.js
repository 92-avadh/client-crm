const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const svc = require('../services/recurring-invoices.service');

const list = asyncHandler(async (req, res) => {
  const data = await svc.listRecurring(req.user);
  const total = data.length;
  res.json({ data, total, page: 1, pageSize: total });
});

const get = asyncHandler(async (req, res) => {
  const item = await svc.getRecurring(req.params.id);
  if (!item) return res.status(404).json({ error: 'Recurring schedule not found.' });
  res.json(item);
});

const create = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .optionalString('invoiceId', { max: 80 })
    .optionalString('brandId', { max: 80 })
    .oneOf('frequency', ['Monthly', 'Quarterly', 'Yearly'], { required: true })
    .optionalString('nextDueDate', { max: 20 })
    .validate();
  const item = await svc.createRecurring(req.user, body);
  res.status(201).json(item);
});

const update = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .oneOf('frequency', ['Monthly', 'Quarterly', 'Yearly'])
    .optionalString('nextDueDate', { max: 20 })
    .oneOf('status', ['Active', 'Paused', 'Cancelled'])
    .validate();
  const item = await svc.updateRecurring(req.params.id, body);
  if (!item) return res.status(404).json({ error: 'Recurring schedule not found.' });
  res.json(item);
});

const remove = asyncHandler(async (req, res) => {
  const item = await svc.deleteRecurring(req.params.id);
  if (!item) return res.status(404).json({ error: 'Recurring schedule not found.' });
  res.json({ success: true, message: 'Recurring schedule deleted' });
});

const runNow = asyncHandler(async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: "Only administrators can trigger invoice generation." });
  }
  const generated = await svc.generateDueRecurring();
  res.json({ success: true, count: generated.length, generated });
});

module.exports = { list, get, create, update, remove, runNow };
