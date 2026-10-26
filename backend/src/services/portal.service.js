const pool = require('../db');
const crypto = require('crypto');
const { sendWebhookEvent } = require('./webhook.service');
const { formatDateOnly } = require('../utils/dateUtils');

const notifId = () => 'notif_' + crypto.randomBytes(6).toString('hex');
const auditId = () => 'audit_' + crypto.randomBytes(6).toString('hex');

async function getPortalDataByToken(token) {
  if (!token || typeof token !== 'string') return null;

  const brandRes = await pool.query(
    `SELECT id, name, owner_name, email, mobile, service_details, monthly_fee, billing_cycle_day,
            currency, currency_symbol, retainer_hours, used_hours, nps_score, contract_start_date,
            contract_end_date, status, payment_status, last_payment_date
     FROM brands WHERE magic_token = $1`,
    [token]
  );
  if (!brandRes.rows.length) return null;
  const brand = brandRes.rows[0];

  // Fetch Agency / Platform Settings for Branded Header
  const settingsRes = await pool.query(
    `SELECT company_name, company_email, company_phone, company_address,
            bank_account_name, bank_account_number, bank_ifsc, bank_branch, upi_id
     FROM settings WHERE id = 'main'`
  );
  const agency = settingsRes.rows[0] || { company_name: 'Agency CRM' };

  // Fetch Deliverables / Tasks for this Client
  const tasksRes = await pool.query(
    `SELECT id, title, description, status, priority, due_date, created_at
     FROM tasks WHERE brand_id = $1 ORDER BY created_at DESC`,
    [brand.id]
  );

  // Fetch Invoices for this Client
  const invoicesRes = await pool.query(
    `SELECT id, invoice_number, issue_date, due_date, subtotal, total_amount, paid_amount,
            status, notes, currency, currency_symbol
     FROM invoices WHERE brand_id = $1 ORDER BY issue_date DESC, created_at DESC`,
    [brand.id]
  );

  // Calculate quick stats
  const totalTasks = tasksRes.rows.length;
  const completedTasks = tasksRes.rows.filter(t => t.status === 'Completed').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const retainerHours = parseFloat(brand.retainer_hours || 40);
  const usedHours = parseFloat(brand.used_hours || 0);
  const hoursRemaining = Math.max(0, retainerHours - usedHours);

  return {
    agency: {
      companyName: agency.company_name || 'Agency Workspace',
      companyEmail: agency.company_email || '',
      companyPhone: agency.company_phone || '',
      companyAddress: agency.company_address || '',
      bankDetails: {
        accountName: agency.bank_account_name || '',
        accountNumber: agency.bank_account_number || '',
        ifsc: agency.bank_ifsc || '',
        branch: agency.bank_branch || '',
        upiId: agency.upi_id || '',
      },
    },
    client: {
      id: brand.id,
      name: brand.name,
      ownerName: brand.owner_name,
      email: brand.email,
      mobile: brand.mobile,
      serviceDetails: brand.service_details,
      monthlyFee: parseFloat(brand.monthly_fee || 0),
      currency: brand.currency || 'INR',
      currencySymbol: brand.currency_symbol || '₹',
      billingCycleDay: brand.billing_cycle_day,
      contractStartDate: formatDateOnly(brand.contract_start_date),
      contractEndDate: formatDateOnly(brand.contract_end_date),
      status: brand.status,
      paymentStatus: brand.payment_status,
      lastPaymentDate: formatDateOnly(brand.last_payment_date),
      npsScore: brand.nps_score,
      retainerHours,
      usedHours,
      hoursRemaining,
      hoursUtilizationPct: retainerHours > 0 ? Math.round((usedHours / retainerHours) * 100) : 0,
    },
    deliverables: {
      total: totalTasks,
      completed: completedTasks,
      progressPct,
      items: tasksRes.rows.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: formatDateOnly(t.due_date),
      })),
    },
    invoices: invoicesRes.rows.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      issueDate: formatDateOnly(inv.issue_date),
      dueDate: formatDateOnly(inv.due_date),
      totalAmount: parseFloat(inv.total_amount || 0),
      paidAmount: parseFloat(inv.paid_amount || 0),
      status: inv.status,
      currency: inv.currency || brand.currency || 'INR',
      currencySymbol: inv.currency_symbol || brand.currency_symbol || '₹',
      notes: inv.notes,
    })),
  };
}

async function submitPortalFeedback(token, score, comment = '') {
  if (!token || score == null || score < 1 || score > 10) {
    throw new Error('Please select a valid rating between 1 and 10.');
  }

  const brandRes = await pool.query(
    'SELECT id, name, owner_name, email FROM brands WHERE magic_token = $1',
    [token]
  );
  if (!brandRes.rows.length) {
    throw new Error('Portal link is invalid or expired.');
  }
  const brand = brandRes.rows[0];

  // Update NPS Score on brand
  await pool.query(
    'UPDATE brands SET nps_score = $1, last_activity_date = CURRENT_DATE WHERE id = $2',
    [score, brand.id]
  );

  // Add notification to agency team
  const sentiment = score >= 9 ? '🌟 High Satisfaction' : (score <= 6 ? '🚨 Detractor Alert' : '👍 Feedback');
  await pool.query(
    `INSERT INTO notifications (id, type, title, message, timestamp, link_module, brand_id, recipient_roles)
     VALUES ($1, 'retention', $2, $3, $4, 'retention', $5, ARRAY['admin', 'hr', 'team'])`,
    [
      notifId(),
      `${sentiment}: ${brand.name} rated us ${score}/10`,
      `${brand.owner_name || brand.name} submitted feedback via Client Portal.${comment ? ` Note: "${comment}"` : ''}`,
      new Date().toISOString(),
      brand.id,
    ]
  );

  // Add audit log
  await pool.query(
    `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address)
     VALUES ($1, $2, $3, 'client', 'Portal Feedback Submitted', $4, 'client-portal')`,
    [
      auditId(),
      new Date().toISOString(),
      brand.owner_name || brand.name,
      `Submitted NPS score ${score}/10.${comment ? ` Comment: ${comment}` : ''}`,
    ]
  );

  // Send webhook notification
  sendWebhookEvent('client_feedback', {
    title: `${sentiment}: ${brand.name} NPS ${score}/10`,
    description: comment ? `"${comment}"` : 'Client rated agency deliverables via Magic Portal.',
    brandName: brand.name,
  });

  return { success: true, message: 'Thank you for your feedback! Your rating has been recorded.' };
}

async function getPortalInvoiceDetails(token, invoiceId) {
  const brandRes = await pool.query('SELECT id, name, currency, currency_symbol FROM brands WHERE magic_token = $1', [token]);
  if (!brandRes.rows.length) return null;
  const brand = brandRes.rows[0];

  const invRes = await pool.query(
    'SELECT * FROM invoices WHERE id = $1 AND brand_id = $2',
    [invoiceId, brand.id]
  );
  if (!invRes.rows.length) return null;
  const inv = invRes.rows[0];

  const itemsRes = await pool.query(
    'SELECT * FROM invoice_items WHERE invoice_id = $1',
    [invoiceId]
  );

  const settingsRes = await pool.query("SELECT * FROM settings WHERE id = 'main'");
  const settings = settingsRes.rows[0] || {};

  return {
    invoice: {
      ...inv,
      subtotal: parseFloat(inv.subtotal || 0),
      totalAmount: parseFloat(inv.total_amount || 0),
      paidAmount: parseFloat(inv.paid_amount || 0),
      cgstAmount: parseFloat(inv.cgst_amount || 0),
      sgstAmount: parseFloat(inv.sgst_amount || 0),
      igstAmount: parseFloat(inv.igst_amount || 0),
      currency: inv.currency || brand.currency || 'INR',
      currencySymbol: inv.currency_symbol || brand.currency_symbol || '₹',
      items: itemsRes.rows.map(i => ({
        id: i.id,
        description: i.description,
        hsnSac: i.hsn_sac,
        quantity: parseFloat(i.quantity || 1),
        unitPrice: parseFloat(i.unit_price || 0),
        amount: parseFloat(i.amount || 0),
      })),
    },
    agency: settings,
  };
}

module.exports = {
  getPortalDataByToken,
  submitPortalFeedback,
  getPortalInvoiceDetails,
};
