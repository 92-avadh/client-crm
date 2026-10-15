const pool = require('../db');

function mapSettings(r) {
  if (!r) return null;
  let goals = [];
  if (Array.isArray(r.goals)) {
    goals = r.goals;
  } else if (typeof r.goals === 'string') {
    try { goals = JSON.parse(r.goals); } catch { goals = []; }
  }

  let invoiceDesign = {};
  if (r.invoice_design && typeof r.invoice_design === 'object') {
    invoiceDesign = r.invoice_design;
  } else if (typeof r.invoice_design === 'string') {
    try { invoiceDesign = JSON.parse(r.invoice_design); } catch { invoiceDesign = {}; }
  }

  return {
    id: r.id,
    companyName: r.company_name,
    companyEmail: r.company_email,
    companyPhone: r.company_phone,
    companyAddress: r.company_address,
    companyGst: r.company_gst,
    companyPan: r.company_pan,
    companyState: r.company_state,
    currency: r.currency || 'INR',
    currencySymbol: r.currency_symbol || '₹',
    industry: r.industry || '',
    teamSize: r.team_size || '',
    goals,
    dashboardLayout: r.dashboard_layout || 'default',
    dashboardFocus: r.dashboard_focus || 'balanced',
    defaultGstRate: parseFloat(r.default_gst_rate || 18),
    defaultHsnSac: r.default_hsn_sac,
    invoicePrefix: r.invoice_prefix,
    bankAccountName: r.bank_account_name,
    bankAccountNumber: r.bank_account_number,
    bankIfsc: r.bank_ifsc,
    bankBranch: r.bank_branch,
    upiId: r.upi_id,
    razorpayKeyId: r.razorpay_key_id,
    razorpayConnected: r.razorpay_connected,
    subscriptionPlan: {
      name: r.subscription_plan_name,
      price: parseFloat(r.subscription_price || 0),
      billingCycle: r.subscription_billing_cycle,
      renewalDate: r.subscription_renewal_date,
      status: r.subscription_status
    },
    retentionThresholdDays: r.retention_threshold_days,
    whatsappEnabled: r.whatsapp_enabled,
    invoiceDesign,
    updatedAt: r.updated_at
  };
}

async function getSettings() {
  const { rows } = await pool.query("SELECT * FROM settings WHERE id='main'");
  return rows.length ? mapSettings(rows[0]) : null;
}

async function updateSettings(data) {
  const sp = data.subscriptionPlan || {};
  const { rows } = await pool.query(
    `INSERT INTO settings (
      id, company_name, company_email, company_phone, company_address, company_gst, company_pan, company_state,
      default_gst_rate, default_hsn_sac, invoice_prefix, bank_account_name, bank_account_number, bank_ifsc, bank_branch, upi_id,
      razorpay_key_id, razorpay_connected, subscription_plan_name, subscription_price, subscription_billing_cycle,
      subscription_renewal_date, subscription_status, retention_threshold_days, whatsapp_enabled, invoice_design,
      currency, currency_symbol, industry, team_size, goals, dashboard_layout, dashboard_focus, updated_at
    )
    VALUES ('main', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, NOW())
    ON CONFLICT (id) DO UPDATE SET
      company_name = COALESCE($1, settings.company_name),
      company_email = COALESCE($2, settings.company_email),
      company_phone = COALESCE($3, settings.company_phone),
      company_address = COALESCE($4, settings.company_address),
      company_gst = COALESCE($5, settings.company_gst),
      company_pan = COALESCE($6, settings.company_pan),
      company_state = COALESCE($7, settings.company_state),
      default_gst_rate = COALESCE($8, settings.default_gst_rate),
      default_hsn_sac = COALESCE($9, settings.default_hsn_sac),
      invoice_prefix = COALESCE($10, settings.invoice_prefix),
      bank_account_name = COALESCE($11, settings.bank_account_name),
      bank_account_number = COALESCE($12, settings.bank_account_number),
      bank_ifsc = COALESCE($13, settings.bank_ifsc),
      bank_branch = COALESCE($14, settings.bank_branch),
      upi_id = COALESCE($15, settings.upi_id),
      razorpay_key_id = COALESCE($16, settings.razorpay_key_id),
      razorpay_connected = COALESCE($17, settings.razorpay_connected),
      subscription_plan_name = COALESCE($18, settings.subscription_plan_name),
      subscription_price = COALESCE($19, settings.subscription_price),
      subscription_billing_cycle = COALESCE($20, settings.subscription_billing_cycle),
      subscription_renewal_date = COALESCE($21, settings.subscription_renewal_date),
      subscription_status = COALESCE($22, settings.subscription_status),
      retention_threshold_days = COALESCE($23, settings.retention_threshold_days),
      whatsapp_enabled = COALESCE($24, settings.whatsapp_enabled),
      invoice_design = COALESCE($25, settings.invoice_design),
      currency = COALESCE($26, settings.currency),
      currency_symbol = COALESCE($27, settings.currency_symbol),
      industry = COALESCE($28, settings.industry),
      team_size = COALESCE($29, settings.team_size),
      goals = COALESCE($30, settings.goals),
      dashboard_layout = COALESCE($31, settings.dashboard_layout),
      dashboard_focus = COALESCE($32, settings.dashboard_focus),
      updated_at = NOW()
    RETURNING *`,
    [
      data.companyName ?? null,
      data.companyEmail ?? null,
      data.companyPhone ?? null,
      data.companyAddress ?? null,
      data.companyGst ?? null,
      data.companyPan ?? null,
      data.companyState ?? null,
      data.defaultGstRate !== undefined ? data.defaultGstRate : null,
      data.defaultHsnSac ?? null,
      data.invoicePrefix ?? null,
      data.bankAccountName ?? null,
      data.bankAccountNumber ?? null,
      data.bankIfsc ?? null,
      data.bankBranch ?? null,
      data.upiId ?? null,
      data.razorpayKeyId ?? null,
      data.razorpayConnected !== undefined ? data.razorpayConnected : null,
      sp.name ?? null,
      sp.price !== undefined ? sp.price : null,
      sp.billingCycle ?? null,
      sp.renewalDate ?? null,
      sp.status ?? null,
      data.retentionThresholdDays !== undefined ? data.retentionThresholdDays : null,
      data.whatsappEnabled !== undefined ? data.whatsappEnabled : null,
      data.invoiceDesign ? JSON.stringify(data.invoiceDesign) : null,
      data.currency ?? null,
      data.currencySymbol ?? null,
      data.industry ?? null,
      data.teamSize ?? null,
      data.goals ? JSON.stringify(data.goals) : null,
      data.dashboardLayout ?? null,
      data.dashboardFocus ?? null,
    ]
  );
  return mapSettings(rows[0]);
}

module.exports = { mapSettings, getSettings, updateSettings };
