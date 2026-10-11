const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const expenses = require('../services/expenses.service');

/** Expenses are restricted to admin/HR. */
const requireFinanceRole = (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    res.status(403).json({ error: "You don't have permission to manage expenses." });
    return false;
  }
  return true;
};

const list = asyncHandler(async (req, res) => {
  if (!requireFinanceRole(req, res)) return;
  res.json(await expenses.listExpenses(req.user, {
    brandId: req.query.brandId,
    category: req.query.category,
    paymentStatus: req.query.paymentStatus,
    employeeName: req.query.employeeName,
    search: req.query.search,
    isRecurring: req.query.isRecurring,
  }));
});

const create = asyncHandler(async (req, res) => {
  if (!requireFinanceRole(req, res)) return;
  const body = makeValidator(req.body)
    .requiredString('category', { max: 100, label: 'Category' })
    .number('amount', { min: 0.01, required: true, label: 'Amount' })
    .optionalString('title', { max: 200, label: 'Title' })
    .optionalString('description', { max: 2000, label: 'Description' })
    .oneOf('paymentMode', expenses.PAYMENT_MODES, { label: 'Payment mode' })
    .oneOf('paymentStatus', expenses.PAYMENT_STATUSES, { label: 'Payment status' })
    .optionalString('employeeName', { max: 150, label: 'Employee name' })
    .optionalString('note', { max: 2000, label: 'Note' })
    .validate();

  res.status(201).json(await expenses.createExpense(req.user, body));
});

const update = asyncHandler(async (req, res) => {
  if (!requireFinanceRole(req, res)) return;
  const body = makeValidator(req.body)
    .number('amount', { min: 0.01, label: 'Amount' })
    .oneOf('paymentMode', expenses.PAYMENT_MODES, { label: 'Payment mode' })
    .oneOf('paymentStatus', expenses.PAYMENT_STATUSES, { label: 'Payment status' })
    .optionalString('title', { max: 200, label: 'Title' })
    .optionalString('description', { max: 2000, label: 'Description' })
    .validate();

  const updated = await expenses.updateExpense(req.user, req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'We could not find that expense.' });
  res.json(updated);
});

const remove = asyncHandler(async (req, res) => {
  if (!requireFinanceRole(req, res)) return;
  const deleted = await expenses.deleteExpense(req.user, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'We could not find that expense.' });
  res.json({ success: true, message: 'Expense deleted successfully', id: req.params.id });
});

module.exports = { list, create, update, remove };
