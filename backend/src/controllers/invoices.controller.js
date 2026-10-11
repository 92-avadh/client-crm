const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const invoices = require('../services/invoices.service');

const list = asyncHandler(async (req, res) => {
  res.json(await invoices.listInvoices(req.user, {
    brandId: req.query.brandId,
    status: req.query.status,
    search: req.query.search,
  }));
});

const get = asyncHandler(async (req, res) => {
  const invoice = await invoices.getInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'We could not find that invoice.' });
  res.json(invoice);
});

const create = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('brandId', { max: 80, label: 'Client' })
    .requiredString('brandName', { max: 200, label: 'Client name' })
    .oneOf('gstType', invoices.GST_TYPES, { label: 'GST type' })
    .number('subtotal', { min: 0, label: 'Subtotal' })
    .number('cgstAmount', { min: 0, label: 'CGST' })
    .number('sgstAmount', { min: 0, label: 'SGST' })
    .number('igstAmount', { min: 0, label: 'IGST' })
    .number('totalAmount', { min: 0, required: true, label: 'Total amount' })
    .optionalString('notes', { max: 2000, label: 'Notes' })
    .array('items', { max: 200, label: 'Line items' })
    .validate();

  res.status(201).json(await invoices.createInvoice(req.user, body));
});

const updateStatus = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .oneOf('status', invoices.INVOICE_STATUSES, { required: true, label: 'Status' })
    .validate();

  const updated = await invoices.updateInvoiceStatus(req.params.id, body.status);
  if (!updated) return res.status(404).json({ error: 'We could not find that invoice.' });
  res.json(updated);
});

/** GET /api/invoices/:id/pdf — returns invoice data for client-side rendering. */
const pdfData = asyncHandler(async (req, res) => {
  const invoice = await invoices.getInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'We could not find that invoice.' });
  res.json({ invoice });
});

module.exports = { list, get, create, updateStatus, pdfData };
