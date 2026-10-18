const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const brands = require('../services/brands.service');

/** Shared field rules for create/update payloads. */
function validateClient(body, { requireName = false } = {}) {
  const v = makeValidator(body);
  if (requireName) v.requiredString('name', { max: 200, label: 'Client name' });
  else v.optionalString('name', { max: 200, label: 'Client name' });

  return v
    .optionalString('ownerName', { max: 200, label: 'Contact person' })
    .optionalString('mobile', { max: 40, label: 'Mobile number' })
    .email('email', { label: 'Email' })
    .optionalString('billingAddress', { max: 500, label: 'Billing address' })
    .optionalString('city', { max: 100, label: 'City' })
    .optionalString('state', { max: 80, label: 'State' })
    .optionalString('pincode', { max: 12, label: 'Pincode' })
    .optionalString('gstNumber', { max: 30, label: 'GST number' })
    .optionalString('pan', { max: 20, label: 'PAN' })
    .optionalString('serviceDetails', { max: 3000, label: 'Service details' })
    .number('monthlyFee', { min: 0, label: 'Monthly fee' })
    .number('billingCycleDay', { min: 1, max: 31, label: 'Billing day' })
    .optionalString('notes', { max: 3000, label: 'Notes' })
    .oneOf('status', brands.CLIENT_STATUSES, { label: 'Status' })
    .oneOf('paymentStatus', brands.PAYMENT_STATUSES, { label: 'Payment status' })
    .array('memberIds', { ofStrings: true, max: 100, label: 'Team members' })
    .validate();
}

const list = asyncHandler(async (req, res) => {
  res.json(await brands.listBrands(req.user, {
    status: req.query.status,
    search: req.query.search,
    page: req.query.page,
    pageSize: req.query.pageSize,
  }));
});

const get = asyncHandler(async (req, res) => {
  const brand = await brands.getBrandWithDetails(req.user, req.params.id);
  if (!brand) return res.status(404).json({ error: 'We could not find that client.' });
  if (brand.error === 'forbidden') {
    return res.status(403).json({ error: "You don't have permission to view this client." });
  }
  res.json(brand);
});

const create = asyncHandler(async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: "You don't have permission to add clients." });
  }
  const body = validateClient(req.body, { requireName: true });
  res.status(201).json(await brands.createBrand(req.user, body));
});

const update = asyncHandler(async (req, res) => {
  if (!await brands.verifyBrandAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "You don't have permission to edit this client." });
  }
  const body = validateClient(req.body);
  const updated = await brands.updateBrand(req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'We could not find that client.' });
  res.json(updated);
});

const assignMembers = asyncHandler(async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: "Only administrators can assign team members." });
  }
  const body = makeValidator(req.body)
    .array('memberIds', { ofStrings: true, max: 100, label: 'Team members' })
    .validate();

  const updated = await brands.assignMembers(req.params.id, body.memberIds || []);
  if (!updated) return res.status(404).json({ error: 'We could not find that client.' });
  res.json(updated);
});

const logActivity = asyncHandler(async (req, res) => {
  if (!await brands.verifyBrandAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "You don't have permission to log activity for this client." });
  }
  const updated = await brands.logActivity(req.params.id);
  if (!updated) return res.status(404).json({ error: 'We could not find that client.' });
  res.json(updated);
});

const churn = asyncHandler(async (req, res) => {
  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: "Only administrators can mark clients as churned." });
  }
  const updated = await brands.markChurned(req.params.id);
  if (!updated) return res.status(404).json({ error: 'We could not find that client.' });
  res.json(updated);
});

const snoozeRetention = asyncHandler(async (req, res) => {
  if (!await brands.verifyBrandAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "You don't have permission to update retention for this client." });
  }
  const updated = await brands.snoozeRetention(req.params.id);
  if (!updated) return res.status(404).json({ error: 'We could not find that client.' });
  res.json(updated);
});

const addDocument = asyncHandler(async (req, res) => {
  if (!await brands.verifyBrandAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "You don't have permission to add documents for this client." });
  }
  const body = makeValidator(req.body)
    .requiredString('name', { max: 300, label: 'Document name' })
    .oneOf('type', brands.DOCUMENT_TYPES, { label: 'Document type' })
    .optionalString('size', { max: 40, label: 'File size' })
    .validate();

  res.status(201).json(await brands.addDocument(req.params.id, body));
});

module.exports = { list, get, create, update, assignMembers, logActivity, churn, snoozeRetention, addDocument };