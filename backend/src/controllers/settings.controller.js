const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const settings = require('../services/settings.service');
const pool = require('../db');
const { getAgencyId } = require('../utils/agency');

const get = asyncHandler(async (req, res) => {
  const data = await settings.getSettings(req.user);
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
    .optionalString('bankName', { max: 150, label: 'Bank name' })
    .optionalString('bankAccountName', { max: 150, label: 'Account holder name' })
    .optionalString('bankAccountNumber', { max: 40, label: 'Account number' })
    .optionalString('bankIfsc', { max: 20, label: 'IFSC code' })
    .optionalString('bankBranch', { max: 150, label: 'Bank branch' })
    .optionalString('upiId', { max: 80, label: 'UPI ID' })
    .optionalString('razorpayKeyId', { max: 120, label: 'Razorpay key' })
    .number('retentionThresholdDays', { min: 1, max: 365, label: 'Retention threshold' })
    .optionalString('slackWebhookUrl', { max: 500, label: 'Slack Webhook URL' })
    .optionalString('discordWebhookUrl', { max: 500, label: 'Discord Webhook URL' });

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

  res.json(await settings.updateSettings(req.user, fullPayload));
});

const testWebhook = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only administrators can test webhooks." });
  }
  const { url, service } = req.body;
  const { testWebhookUrl } = require('../services/webhook.service');
  const result = await testWebhookUrl(url, service);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

const resetData = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only administrators can reset workspace data." });
  }

  if (req.body.confirmPhrase !== 'RESET_MY_WORKSPACE') {
    return res.status(400).json({
      error: 'Confirmation phrase required. Send { confirmPhrase: "RESET_MY_WORKSPACE" } to confirm workspace wipe.'
    });
  }

  const agencyId = getAgencyId(req.user);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Scope all deletions strictly to caller's agency
    await client.query('DELETE FROM payments WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE agency_id = $1)', [agencyId]);
    await client.query('DELETE FROM recurring_invoices WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM invoices WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM expenses WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM leads WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM tasks WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM projects WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM brand_documents WHERE brand_id IN (SELECT id FROM brands WHERE agency_id = $1)', [agencyId]);
    await client.query('DELETE FROM user_brand_assignments WHERE brand_id IN (SELECT id FROM brands WHERE agency_id = $1)', [agencyId]);
    await client.query('DELETE FROM brand_assignments WHERE brand_id IN (SELECT id FROM brands WHERE agency_id = $1)', [agencyId]);
    await client.query('DELETE FROM brands WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM meetings WHERE agency_id = $1', [agencyId]);
    await client.query('DELETE FROM holidays WHERE agency_id = $1 AND type != $2', [agencyId, 'National']);
    await client.query('DELETE FROM notifications WHERE agency_id = $1', [agencyId]);

    // Preserve the initiating admin user
    await client.query('DELETE FROM users WHERE agency_id = $1 AND id != $2', [agencyId, req.user.id]);

    // Reset agency-specific settings if not main
    if (agencyId !== 'main' && agencyId !== 'usr_admin') {
      await client.query('DELETE FROM settings WHERE id = $1', [agencyId]);
    }

    // Record an audit log entry for this sensitive administrative action
    await client.query(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address, agency_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'aud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        new Date().toISOString(),
        req.user.name || 'Admin',
        req.user.role || 'admin',
        'WORKSPACE_DATA_RESET',
        `Workspace data was reset by ${req.user.name || req.user.email}. Admin user preserved.`,
        req.ip || 'unknown',
        agencyId
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Workspace data cleared successfully. Admin user preserved.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { get, update, testWebhook, resetData };
