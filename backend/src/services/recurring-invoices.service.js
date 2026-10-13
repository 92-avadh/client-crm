const pool = require('../db');
const crypto = require('crypto');
const invoicesService = require('./invoices.service');

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
  const id = genId();
  const { rows } = await pool.query(
    `INSERT INTO recurring_invoices (id, invoice_id, brand_id, frequency, next_due_date, status)
     VALUES ($1, $2, $3, $4, $5, 'Active') RETURNING *`,
    [id, data.invoiceId || null, data.brandId || null, data.frequency || 'Monthly', data.nextDueDate || null]
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
async function generateDueRecurring() {
  const today = new Date().toISOString().split('T')[0];
  const { rows: dueSchedules } = await pool.query(
    `SELECT ri.*, b.name as brand_name
     FROM recurring_invoices ri
     LEFT JOIN brands b ON b.id = ri.brand_id
     WHERE ri.status = 'Active' AND ri.next_due_date <= $1`,
    [today]
  );

  const generated = [];
  for (const sched of dueSchedules) {
    try {
      const invoiceData = {
        brandId: sched.brand_id,
        brandName: sched.brand_name || 'Client',
        issueDate: today,
        dueDate: null,
        items: [],
        subtotal: 0,
        hasGst: false,
        gstType: 'NONE',
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0,
        notes: `Recurring invoice (schedule ${sched.id})`,
        isRecurring: false,
      };
      await invoicesService.createInvoice({ id: 'system', name: 'System', role: 'admin' }, invoiceData);

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
        [notifId(), '🔁 Recurring Invoice Generated', `A recurring invoice was auto-generated for ${sched.brand_name}.`, new Date().toISOString(), sched.brand_id]
      );

      generated.push(sched.id);
    } catch (err) {
      console.error(`Failed to generate recurring invoice for schedule ${sched.id}:`, err.message);
    }
  }
  return generated;
}

module.exports = {
  listRecurring, getRecurring, createRecurring, updateRecurring, deleteRecurring, generateDueRecurring,
};
