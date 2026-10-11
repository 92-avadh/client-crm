const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'inv_' + crypto.randomBytes(6).toString('hex');
const itemId = () => 'ii_' + crypto.randomBytes(6).toString('hex');
const recId = () => 'rec_' + crypto.randomBytes(6).toString('hex');

const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const GST_TYPES = ['NONE', 'CGST_SGST', 'IGST'];

function mapInvoice(r, items) {
  return {
    id: r.id, invoiceNumber: r.invoice_number, brandId: r.brand_id, brandName: r.brand_name,
    issueDate: r.issue_date, dueDate: r.due_date, subtotal: parseFloat(r.subtotal || 0),
    hasGst: r.has_gst, gstType: r.gst_type, cgstAmount: parseFloat(r.cgst_amount || 0),
    sgstAmount: parseFloat(r.sgst_amount || 0), igstAmount: parseFloat(r.igst_amount || 0),
    totalAmount: parseFloat(r.total_amount || 0), paidAmount: parseFloat(r.paid_amount || 0),
    status: r.status, notes: r.notes, paymentDate: r.payment_date, paymentMode: r.payment_mode,
    razorpayPaymentId: r.razorpay_payment_id, isRecurring: r.is_recurring, createdAt: r.created_at,
    items: (items || []).map(i => ({
      id: i.id, invoiceId: i.invoice_id, description: i.description, hsnSac: i.hsn_sac,
      quantity: parseFloat(i.quantity || 1), unitPrice: parseFloat(i.unit_price || 0), amount: parseFloat(i.amount || 0)
    }))
  };
}

async function getItems(invoiceId) {
  const { rows } = await pool.query(
    'SELECT * FROM invoice_items WHERE invoice_id=$1', [invoiceId]
  );
  return rows;
}

async function listInvoices(user, { brandId, status, search } = {}) {
  let query = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];
  let idx = 1;

  if (user.role === 'brand') {
    query += ` AND brand_id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  }
  if (brandId) {
    query += ` AND brand_id=$${idx}`;
    params.push(brandId);
    idx += 1;
  }
  if (status) {
    query += ` AND status=$${idx}`;
    params.push(status);
    idx += 1;
  }
  if (search) {
    query += ` AND (invoice_number ILIKE $${idx} OR brand_name ILIKE $${idx})`;
    params.push('%' + search + '%');
  }
  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return Promise.all(rows.map(async (r) => mapInvoice(r, await getItems(r.id))));
}

async function getInvoice(id) {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [id]);
  if (!rows.length) return null;
  return mapInvoice(rows[0], await getItems(id));
}

/**
 * Derive the next invoice number from the configured prefix.
 * Kept in the service so other callers (recurring jobs) can reuse it.
 */
async function nextInvoiceNumber() {
  const settings = await pool.query("SELECT invoice_prefix FROM settings WHERE id='main'");
  const prefix = settings.rows[0]?.invoice_prefix || 'INV-2026-';
  const countRes = await pool.query('SELECT COUNT(*) FROM invoices');
  const nextNum = parseInt(countRes.rows[0].count, 10) + 42;
  return prefix + String(nextNum).padStart(4, '0');
}

async function createInvoice(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invoiceNumber = await nextInvoiceNumber();
    const id = genId();

    await client.query(
      `INSERT INTO invoices (id,invoice_number,brand_id,brand_name,issue_date,due_date,subtotal,has_gst,gst_type,
       cgst_amount,sgst_amount,igst_amount,total_amount,paid_amount,status,notes,payment_mode,is_recurring,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,'Sent',$14,$15,$16,$17)`,
      [
        id, invoiceNumber, data.brandId, data.brandName, data.issueDate || null, data.dueDate || null,
        data.subtotal || 0, data.hasGst || false, data.gstType || 'NONE',
        data.cgstAmount || 0, data.sgstAmount || 0, data.igstAmount || 0,
        data.totalAmount || 0, data.notes || null, data.paymentMode || null,
        data.isRecurring || false, user.id,
      ]
    );

    for (const item of data.items || []) {
      await client.query(
        'INSERT INTO invoice_items (id,invoice_id,description,hsn_sac,quantity,unit_price,amount) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [itemId(), id, item.description, item.hsnSac || null, item.quantity || 1, item.unitPrice || 0, item.amount || 0]
      );
    }

    if (data.isRecurring) {
      await client.query(
        'INSERT INTO recurring_invoices (id,invoice_id,brand_id,frequency,next_due_date,status) VALUES ($1,$2,$3,$4,$5,$6)',
        [recId(), id, data.brandId, 'Monthly', data.dueDate || null, 'Active']
      );
    }

    await client.query('COMMIT');
    return getInvoice(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateInvoiceStatus(id, status) {
  const { rows } = await pool.query(
    'UPDATE invoices SET status=$1 WHERE id=$2 RETURNING *', [status, id]
  );
  if (!rows.length) return null;
  return mapInvoice(rows[0], await getItems(id));
}

module.exports = {
  INVOICE_STATUSES, GST_TYPES,
  mapInvoice, listInvoices, getInvoice, createInvoice, updateInvoiceStatus,
};
