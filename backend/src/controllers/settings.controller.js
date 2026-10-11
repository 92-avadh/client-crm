const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const settings = require('../services/settings.service');

const get = asyncHandler(async (req, res) => {
  const data = await settings.getSettings();
  if (!data) return res.status(404).json({ error: 'Settings have not been set up yet.' });
  res.json(data);
});

const update = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .optionalString('companyName', { max: 200, label: 'Company name' })
    .email('companyEmail', { label: 'Company email' })
    .optionalString('companyPhone', { max: 40, label: 'Company phone' })
    .optionalString('companyAddress', { max: 500, label: 'Company address' })
    .optionalString('companyGst', { max: 30, label: 'GST number' })
    .optionalString('companyPan', { max: 20, label: 'PAN' })
    .optionalString('companyState', { max: 80, label: 'State' })
    .number('defaultGstRate', { min: 0, max: 100, label: 'Default GST rate' })
    .optionalString('defaultHsnSac', { max: 20, label: 'HSN/SAC code' })
    .optionalString('invoicePrefix', { max: 12, label: 'Invoice prefix' })
    .optionalString('bankAccountName', { max: 150, label: 'Account holder name' })
    .optionalString('bankAccountNumber', { max: 40, label: 'Account number' })
    .optionalString('bankIfsc', { max: 20, label: 'IFSC code' })
    .optionalString('bankBranch', { max: 150, label: 'Bank branch' })
    .optionalString('upiId', { max: 80, label: 'UPI ID' })
    .optionalString('razorpayKeyId', { max: 120, label: 'Razorpay key' })
    .number('retentionThresholdDays', { min: 1, max: 365, label: 'Retention threshold' })
    .validate();

  res.json(await settings.updateSettings(body));
});

module.exports = { get, update };
