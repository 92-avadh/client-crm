const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const settings = require('../services/settings.service');

const get = asyncHandler(async (req, res) => {
  const data = await settings.getSettings();
  if (!data) return res.status(404).json({ error: 'Settings have not been set up yet.' });
  res.json(data);
});

const update = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "You don't have permission to update settings." });
  }

  const v = makeValidator(req.body)
    .optionalString('companyName', { max: 200, label: 'Company name' })
    .optionalString('companyPhone', { max: 40, label: 'Company phone' })
    .optionalString('companyAddress', { max: 500, label: 'Company address' })
    .optionalString('companyGst', { max: 30, label: 'GST number' })
    .optionalString('companyPan', { max: 20, label: 'PAN' })
    .optionalString('companyState', { max: 80, label: 'State' })
    .optionalString('currency', { max: 10, label: 'Currency' })
    .optionalString('currencySymbol', { max: 10, label: 'Currency symbol' })
    .optionalString('industry', { max: 100, label: 'Industry' })
    .optionalString('teamSize', { max: 50, label: 'Team size' })
    .optionalString('dashboardLayout', { max: 30, label: 'Dashboard layout' })
    .optionalString('dashboardFocus', { max: 30, label: 'Dashboard focus' })
    .number('defaultGstRate', { min: 0, max: 100, label: 'Default GST rate' })
    .optionalString('defaultHsnSac', { max: 20, label: 'HSN/SAC code' })
    .optionalString('invoicePrefix', { max: 20, label: 'Invoice prefix' })
    .optionalString('bankAccountName', { max: 150, label: 'Account holder name' })
    .optionalString('bankAccountNumber', { max: 40, label: 'Account number' })
    .optionalString('bankIfsc', { max: 20, label: 'IFSC code' })
    .optionalString('bankBranch', { max: 150, label: 'Bank branch' })
    .optionalString('upiId', { max: 80, label: 'UPI ID' })
    .optionalString('razorpayKeyId', { max: 120, label: 'Razorpay key' })
    .number('retentionThresholdDays', { min: 1, max: 365, label: 'Retention threshold' });

  if (req.body.companyEmail) {
    v.email('companyEmail', { label: 'Company email' });
  }

  const body = v.validate();

  // Merge extra non-scalar configurations like subscriptionPlan, goals, invoiceDesign
  const fullPayload = {
    ...body,
    subscriptionPlan: req.body.subscriptionPlan,
    goals: Array.isArray(req.body.goals) ? req.body.goals : undefined,
    invoiceDesign: req.body.invoiceDesign,
    whatsappEnabled: req.body.whatsappEnabled,
    razorpayConnected: req.body.razorpayConnected,
  };

  res.json(await settings.updateSettings(fullPayload));
});

const resetData = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only administrators can reset workspace data." });
  }
  const resetDb = require('../db/reset');
  await resetDb();
  res.json({ success: true, message: 'All workspace data cleared successfully. Admin user preserved.' });
});

module.exports = { get, update, resetData };
