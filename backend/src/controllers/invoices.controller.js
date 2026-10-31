const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const invoices = require('../services/invoices.service');
const { resolvePermissions } = require('../utils/permissions');

function canWriteInvoices(user) {
  if (!user) return false;
  if (['admin', 'hr', 'manager'].includes(user.role)) return true;
  const perms = resolvePermissions(user.role, user.permissions);
  return perms.includes('invoices') || perms.includes('invoices_write') || perms.includes('finance');
}

const list = asyncHandler(async (req, res) => {
  res.json(await invoices.listInvoices(req.user, {
    brandId: req.query.brandId,
    status: req.query.status,
    search: req.query.search,
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(200, parseInt(req.query.pageSize, 10) || 50)),
  }));
});

const get = asyncHandler(async (req, res) => {
  const invoice = await invoices.getInvoice(req.user, req.params.id);
  if (!invoice) return res.status(404).json({ error: 'We could not find that invoice.' });
  if (invoice.error === 'forbidden') {
    return res.status(403).json({ error: "You don't have permission to view this invoice." });
  }
  res.json(invoice);
});

const create = asyncHandler(async (req, res) => {
  if (!canWriteInvoices(req.user)) {
    return res.status(403).json({ error: "You don't have permission to create invoices." });
  }
  const body = makeValidator(req.body)
    .requiredString('brandId', { max: 80, label: 'Client' })
    .requiredString('brandName', { max: 200, label: 'Client name' })
    .oneOf('gstType', invoices.GST_TYPES, { label: 'GST type' })
    .number('subtotal', { min: 0, label: 'Subtotal' })
    .number('cgstAmount', { min: 0, label: 'CGST' })
    .number('sgstAmount', { min: 0, label: 'SGST' })
    .number('igstAmount', { min: 0, label: 'IGST' })
    .number('totalAmount', { min: 0, required: true, label: 'Total amount' })
    .optionalString('currency', { max: 10, label: 'Currency' })
    .optionalString('currencySymbol', { max: 10, label: 'Currency symbol' })
    .optionalString('issueDate', { max: 30, label: 'Issue date' })
    .optionalString('dueDate', { max: 30, label: 'Due date' })
    .optionalString('notes', { max: 2000, label: 'Notes' })
    .array('items', { max: 200, label: 'Line items' })
    .validate();

  res.status(201).json(await invoices.createInvoice(req.user, body));
});

const updateStatus = asyncHandler(async (req, res) => {
  if (!canWriteInvoices(req.user)) {
    return res.status(403).json({ error: "You don't have permission to update invoice status." });
  }
  const body = makeValidator(req.body)
    .oneOf('status', invoices.INVOICE_STATUSES, { required: true, label: 'Status' })
    .validate();

  const updated = await invoices.updateInvoiceStatus(req.user, req.params.id, body.status);
  if (!updated) return res.status(404).json({ error: 'We could not find that invoice.' });
  res.json(updated);
});

/** GET /api/invoices/:id/pdf — returns invoice data for client-side rendering. */
const pdfData = asyncHandler(async (req, res) => {
  const invoice = await invoices.getInvoice(req.user, req.params.id);
  if (!invoice) return res.status(404).json({ error: 'We could not find that invoice.' });
  if (invoice.error === 'forbidden') {
    return res.status(403).json({ error: "You don't have permission to view this invoice." });
  }
  res.json({ invoice });
});

/** DELETE /api/invoices/:id */
const remove = asyncHandler(async (req, res) => {
  const deleted = await invoices.deleteInvoice(req.user, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'We could not find that invoice.' });
  res.json({ success: true, message: 'Invoice deleted successfully', invoice: deleted });
});

/** POST /api/invoices/bulk-delete — batch delete invoices. */
const bulkRemove = asyncHandler(async (req, res) => {
  if (!canWriteInvoices(req.user)) {
    return res.status(403).json({ error: "You don't have permission to delete invoices." });
  }
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'Please provide an array of invoice IDs to delete.' });
  }
  const count = await invoices.deleteInvoices(req.user, ids);
  res.json({ success: true, count, message: `${count} invoice(s) deleted successfully` });
});

module.exports = { list, get, create, updateStatus, pdfData, remove, bulkRemove };
