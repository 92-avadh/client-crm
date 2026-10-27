const pool = require('../db');
const crypto = require('crypto');
const invoicesService = require('./invoices.service');
const { getAgencyId } = require('../utils/agency');

const genId = () => 'rec_' + crypto.randomBytes(6).toString('hex');
const notifId = () => 'notif_' + crypto.randomBytes(6).toString('hex');

/**
 * List all recurring invoice schedules.
 */
async function listRecurring(user) {
  let query = `SELECT ri.*, b.name as brand_name
               FROM recurring_invoices ri
               LEFT JOIN brands b ON b.id = ri.brand_id`;
  const params = [];
  if (user.role === 'brand') {
    query += ' WHERE ri.brand_id = $1';
    params.push(user.brandId || '');
  } else {
    const agencyId = getAgencyId(user);
    query += ` WHERE (ri.agency_id = $1 OR b.agency_id = $1 OR (b.agency_id IS NULL AND (b.owner_id = $1 OR $1 = 'usr_admin')))`;
    params.push(agencyId);
  }
  query += ' ORDER BY ri.created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Get a single recurring schedule by ID.
 */
async function getRecurring(id) {
  const { rows } = await pool.query(
    `SELECT ri.*, b.name as brand_name
     FROM recurring_invoices ri
     LEFT JOIN brands b ON b.id = ri.brand_id
     WHERE ri.id = $1`, [id]
  );
  return rows[0] || null;
}

/**
 * Create a new recurring schedule.
 */
async function createRecurring(user, data) {
  const agencyId = getAgencyId(user);
  const id = genId();
  const { rows } = await pool.query(
    `INSERT INTO recurring_invoices (id, invoice_id, brand_id, frequency, next_due_date, status, agency_id)
     VALUES ($1, $2, $3, $4, $5, 'Active', $6) RETURNING *`,
    [id, data.invoiceId || null, data.brandId || null, data.frequency || 'Monthly', data.nextDueDate || null, agencyId]
  );
  return rows[0];
}

/**
 * Update a recurring schedule.
 */
async function updateRecurring(id, data) {
  const { rows } = await pool.query(
    `UPDATE recurring_invoices SET
       frequency = COALESCE($1, frequency),
       next_due_date = COALESCE($2, next_due_date),
       status = COALESCE($3, status)
     WHERE id = $4 RETURNING *`,
    [data.frequency || null, data.nextDueDate || null, data.status || null, id]
  );
  return rows[0] || null;
}

/**
 * Delete a recurring schedule.
 */
async function deleteRecurring(id) {
  const { rows } = await pool.query(
    'DELETE FROM recurring_invoices WHERE id = $1 RETURNING id', [id]
  );
  return rows[0] || null;
}

/**
 * Generate the next invoice for a due recurring schedule.
 * Called by a background job (cron) — not exposed via API directly.
 */
/**
 * Generate the next invoice for due recurring schedules and client retainer cycle days.
 * Called by scheduled cron runner and on-demand trigger.
 */
async function generateDueRecurring() {
  const today = new Date().toISOString().split('T')[0];
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const { sendWebhookEvent } = require('./webhook.service');

  const generated = [];

  // Part A: Due recurring_invoices table schedules
  const { rows: dueSchedules } = await pool.query(
    `SELECT ri.*, b.name as brand_name, b.monthly_fee, b.currency, b.currency_symbol
     FROM recurring_invoices ri
     LEFT JOIN brands b ON b.id = ri.brand_id
     WHERE ri.status = 'Active' AND ri.next_due_date <= $1`,
    [today]
  );

  for (const sched of dueSchedules) {
    try {
      const fee = parseFloat(sched.monthly_fee || 0);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const invoiceData = {
        brandId: sched.brand_id,
        brandName: sched.brand_name || 'Client',
        issueDate: today,
        dueDate: dueDateStr,
        items: [{
          description: `Monthly Retainer Service - ${monthName} ${currentYear}`,
          quantity: 1,
          unitPrice: fee,
          amount: fee,
        }],
        subtotal: fee,
        hasGst: false,
        gstType: 'NONE',
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: fee,
        currency: sched.currency || 'INR',
        currencySymbol: sched.currency_symbol || '₹',
        notes: `Automated recurring retainer invoice for ${monthName} ${currentYear}.`,
        isRecurring: false,
      };
      const created = await invoicesService.createInvoice({ id: 'system', name: 'System Cron', role: 'admin' }, invoiceData);

      // Advance next_due_date by one month
      const nextDue = new Date(sched.next_due_date || today);
      nextDue.setMonth(nextDue.getMonth() + 1);
      await pool.query(
        'UPDATE recurring_invoices SET next_due_date = $1 WHERE id = $2',
        [nextDue.toISOString().split('T')[0], sched.id]
      );

      // Notify admins
      await pool.query(
        `INSERT INTO notifications (id, type, title, message, timestamp, is_read, link_module, brand_id, recipient_roles)
         VALUES ($1, 'invoice', $2, $3, $4, false, 'invoices', $5, ARRAY['admin','hr'])`,
        [
          notifId(),
          '🔁 Retainer Invoice Auto-Generated',
          `Automated monthly invoice #${created.invoiceNumber} (${sched.currency_symbol || '₹'}${fee.toLocaleString()}) generated for ${sched.brand_name}.`,
          new Date().toISOString(),
          sched.brand_id
        ]
      );

      sendWebhookEvent('invoice_generated', {
        title: `🔁 Recurring Retainer Invoice Generated: ${sched.brand_name}`,
        description: `Automated invoice #${created.invoiceNumber} generated for ${sched.brand_name}.`,
        brandName: sched.brand_name,
        amount: fee,
        currency: sched.currency_symbol || '₹',
      });

      generated.push({ id: sched.id, invoiceNumber: created.invoiceNumber, brandName: sched.brand_name });
    } catch (err) {
      console.error(`Failed to generate recurring invoice for schedule ${sched.id}:`, err.message);
    }
  }

  // Part B: Direct Brand Retainers matching billingCycleDay
  const { rows: cycleBrands } = await pool.query(
    `SELECT b.* FROM brands b
     WHERE b.status = 'Active' AND b.monthly_fee > 0 AND (b.billing_cycle_day = $1 OR b.billing_cycle_day IS NULL OR b.billing_cycle_day = 1)`,
    [currentDay]
  );

  for (const b of cycleBrands) {
    try {
      // Check if invoice already raised for this brand in the current calendar month
      const existing = await pool.query(
        `SELECT id FROM invoices
         WHERE brand_id = $1
           AND EXTRACT(MONTH FROM issue_date) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE)
         LIMIT 1`,
        [b.id]
      );
      if (existing.rows.length > 0) continue; // Already billed this month

      const fee = parseFloat(b.monthly_fee || 0);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const invoiceData = {
        brandId: b.id,
        brandName: b.name,
        issueDate: today,
        dueDate: dueDateStr,
        items: [{
          description: `Agency Monthly Retainer - ${monthName} ${currentYear}`,
          quantity: 1,
          unitPrice: fee,
          amount: fee,
        }],
        subtotal: fee,
        hasGst: false,
        gstType: 'NONE',
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: fee,
        currency: b.currency || 'INR',
        currencySymbol: b.currency_symbol || '₹',
        notes: `Automated monthly retainer invoice scheduled on cycle day ${b.billing_cycle_day || 1}.`,
        isRecurring: false,
      };

      const created = await invoicesService.createInvoice({ id: 'system', name: 'System Cron', role: 'admin' }, invoiceData);

      await pool.query(
        `INSERT INTO notifications (id, type, title, message, timestamp, is_read, link_module, brand_id, recipient_roles)
         VALUES ($1, 'invoice', $2, $3, $4, false, 'invoices', $5, ARRAY['admin','hr'])`,
        [
          notifId(),
          '📄 Monthly Retainer Invoice Drafted',
          `Auto-drafted invoice #${created.invoiceNumber} (${b.currency_symbol || '₹'}${fee.toLocaleString()}) for ${b.name} on monthly cycle day ${b.billing_cycle_day || 1}.`,
          new Date().toISOString(),
          b.id
        ]
      );

      sendWebhookEvent('invoice_generated', {
        title: `📄 Retainer Invoice Auto-Generated: ${b.name}`,
        description: `Automated invoice #${created.invoiceNumber} drafted for cycle day ${b.billing_cycle_day || 1}.`,
        brandName: b.name,
        amount: fee,
        currency: b.currency_symbol || '₹',
      });

      generated.push({ brandId: b.id, invoiceNumber: created.invoiceNumber, brandName: b.name });
    } catch (err) {
      console.error(`Failed to auto-generate monthly retainer for brand ${b.id}:`, err.message);
    }
  }

  return generated;
}

module.exports = {
  listRecurring, getRecurring, createRecurring, updateRecurring, deleteRecurring, generateDueRecurring,
};
