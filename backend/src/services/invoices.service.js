const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'inv_' + crypto.randomBytes(6).toString('hex');
const itemId = () => 'ii_' + crypto.randomBytes(6).toString('hex');
const recId = () => 'rec_' + crypto.randomBytes(6).toString('hex');

const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const GST_TYPES = ['NONE', 'CGST_SGST', 'IGST'];

const { formatDateOnly } = require('../utils/dateUtils');

function mapInvoice(r, items) {
  return {
    id: r.id, invoiceNumber: r.invoice_number, brandId: r.brand_id, brandName: r.brand_name,
    issueDate: formatDateOnly(r.issue_date), dueDate: formatDateOnly(r.due_date), subtotal: parseFloat(r.subtotal || 0),
    hasGst: r.has_gst, gstType: r.gst_type, cgstAmount: parseFloat(r.cgst_amount || 0),
    sgstAmount: parseFloat(r.sgst_amount || 0), igstAmount: parseFloat(r.igst_amount || 0),
    totalAmount: parseFloat(r.total_amount || 0), paidAmount: parseFloat(r.paid_amount || 0),
    currency: r.currency || 'INR', currencySymbol: r.currency_symbol || '₹',
    status: r.status, notes: r.notes, paymentDate: formatDateOnly(r.payment_date), paymentMode: r.payment_mode,
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

/**
 * Batch-fetch items for multiple invoices in a single query.
 * Returns a Map of invoice_id -> items array.
 */
async function getItemsForInvoices(invoiceIds) {
  if (!invoiceIds.length) return new Map();
  const { rows } = await pool.query(
    'SELECT * FROM invoice_items WHERE invoice_id = ANY($1)',
    [invoiceIds]
  );
  const map = new Map();
  for (const item of rows) {
    if (!map.has(item.invoice_id)) map.set(item.invoice_id, []);
    map.get(item.invoice_id).push(item);
  }
  return map;
}

const { getAgencyId } = require('../utils/agency');

async function listInvoices(user, { brandId, status, search, page = 1, pageSize = 50 } = {}) {
  const agencyId = getAgencyId(user);
  let whereClause = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (user.role === 'brand') {
    whereClause += ` AND brand_id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else if (user.role === 'admin' || user.role === 'hr') {
    whereClause += ` AND (agency_id = $${idx} OR owner_id = $${idx})`;
    params.push(agencyId);
    idx += 1;
  } else {
    whereClause += ` AND (agency_id = $${idx} OR owner_id = $${idx}) AND brand_id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $${idx + 1})`;
    params.push(agencyId, user.id);
    idx += 2;
  }
  if (brandId) {
    whereClause += ` AND brand_id=$${idx}`;
    params.push(brandId);
    idx += 1;
  }
  if (status) {
    whereClause += ` AND status=$${idx}`;
    params.push(status);
    idx += 1;
  }
  if (search) {
    whereClause += ` AND (invoice_number ILIKE $${idx} OR brand_name ILIKE $${idx})`;
    params.push('%' + search + '%');
  }

  // Count total matching rows
  const countQuery = `SELECT COUNT(*) FROM invoices ${whereClause}`;
  const { rows: countRows } = await pool.query(countQuery, params);
  const total = parseInt(countRows[0].count, 10);

  // Paginated query
  const offset = (page - 1) * pageSize;
  const query = `SELECT * FROM invoices ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(pageSize, offset);

  const { rows } = await pool.query(query, params);

  // Batch fetch items — single query instead of N+1
  const itemsMap = await getItemsForInvoices(rows.map(r => r.id));
  const data = rows.map(r => mapInvoice(r, itemsMap.get(r.id) || []));

  return { data, total, page, pageSize };
}

async function getInvoice(user, id) {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [id]);
  if (!rows.length) return null;
  const inv = rows[0];

  // BOLA authorization check
  if (user && user.role !== 'admin') {
    if (user.role === 'brand') {
      if (user.brandId !== inv.brand_id) return { error: 'forbidden' };
    } else {
      const assignCheck = await pool.query(
        'SELECT 1 FROM brand_assignments WHERE brand_id = $1 AND member_id = $2',
        [inv.brand_id, user.id]
      );
      if (!assignCheck.rows.length) return { error: 'forbidden' };
    }
  }

  return mapInvoice(inv, await getItems(id));
}

/**
 * Derive the next invoice number from the configured prefix.
 * Kept in the service so other callers (recurring jobs) can reuse it.
 */
async function nextInvoiceNumber() {
  const settings = await pool.query("SELECT invoice_prefix FROM settings WHERE id='main'");
  const prefix = settings.rows[0]?.invoice_prefix || 'INV-2026-';
  // Use a row lock on a counter row to avoid race conditions under concurrent creates.
  // Fall back to COUNT(*) + 42 if the sequence row doesn't exist yet.
  const counterRes = await pool.query(
    `INSERT INTO invoice_sequence (id, next_num) VALUES ('main', 43)
     ON CONFLICT (id) DO UPDATE SET next_num = invoice_sequence.next_num + 1
     RETURNING next_num`
  ).catch(async (e) => {
    if (e.code === '42P01' || e.code === '42703') {
      // Table doesn't exist yet — create it and retry
      await pool.query(`CREATE TABLE IF NOT EXISTS invoice_sequence (
        id VARCHAR(50) PRIMARY KEY,
        next_num INTEGER NOT NULL DEFAULT 42
      )`);
      return pool.query(
        `INSERT INTO invoice_sequence (id, next_num) VALUES ('main', 43)
         ON CONFLICT (id) DO UPDATE SET next_num = invoice_sequence.next_num + 1
         RETURNING next_num`
      );
    }
    throw e;
  });
  const nextNum = counterRes.rows[0].next_num;
  return prefix + String(nextNum).padStart(4, '0');
}

async function createInvoice(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    const invoiceNumber = await nextInvoiceNumber();
    const currency = data.currency || 'INR';
    const currencySymbol = data.currencySymbol || (currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : (currency === 'AED' ? 'AED' : (currency === 'CAD' ? 'CA$' : '₹')))));

    const agencyId = getAgencyId(user);
    await client.query(
      `INSERT INTO invoices (id,invoice_number,brand_id,brand_name,issue_date,due_date,subtotal,has_gst,gst_type,
       cgst_amount,sgst_amount,igst_amount,total_amount,paid_amount,status,notes,payment_mode,is_recurring,owner_id,
       currency,currency_symbol,agency_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,'Sent',$14,$15,$16,$17,$18,$19,$20)`,
      [
        id, invoiceNumber, data.brandId, data.brandName,
        formatDateOnly(data.issueDate), formatDateOnly(data.dueDate),
        data.subtotal || 0, data.hasGst || false, data.gstType || 'NONE',
        data.cgstAmount || 0, data.sgstAmount || 0, data.igstAmount || 0,
        data.totalAmount || 0, data.notes || null, data.paymentMode || null,
        data.isRecurring || false, user.id,
        currency, currencySymbol, agencyId
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
    const invoice = await getInvoice(user, id);
    try {
      const { createNotification } = require('./notifications.service');
      await createNotification({
        type: 'invoice',
        title: 'New Invoice Issued',
        message: `Invoice #${invoice.invoiceNumber} for ${invoice.currencySymbol || '₹'}${Number(invoice.totalAmount || 0).toLocaleString('en-IN')} issued to ${invoice.brandName}.`,
        linkModule: 'invoices',
        brandId: invoice.brandId,
        recipientRoles: ['admin', 'manager'],
      });
    } catch (err) {
      console.warn('Failed to dispatch invoice notification:', err.message);
    }
    return invoice;
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
  const invoice = mapInvoice(rows[0], await getItems(id));
  if (status === 'Paid') {
    try {
      const { createNotification } = require('./notifications.service');
      await createNotification({
        type: 'payment',
        title: 'Invoice Paid',
        message: `Invoice #${invoice.invoiceNumber} for ${invoice.currencySymbol || '₹'}${Number(invoice.totalAmount || 0).toLocaleString('en-IN')} has been paid by ${invoice.brandName}!`,
        linkModule: 'invoices',
        brandId: invoice.brandId,
        recipientRoles: ['admin', 'manager'],
      });
    } catch {}
  }
  return invoice;
}

const auditId = () => 'audit_' + crypto.randomBytes(6).toString('hex');

async function writeAudit(user, action, details) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, 'unknown')`,
      [auditId(), new Date().toISOString(), user?.name || 'System', user?.role || 'system', action, details]
    );
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

async function deleteInvoice(user, id) {
  if (user && !['admin', 'hr', 'manager'].includes(user.role)) {
    const err = new Error('Only admin or manager can delete invoices');
    err.status = 403;
    throw err;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prev = await client.query('SELECT * FROM invoices WHERE id=$1', [id]);
    if (!prev.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }
    const inv = prev.rows[0];

    // Clean up relations
    await client.query('DELETE FROM recurring_invoices WHERE invoice_id=$1', [id]);
    await client.query('UPDATE payments SET invoice_id=NULL WHERE invoice_id=$1', [id]);
    await client.query('DELETE FROM invoice_items WHERE invoice_id=$1', [id]);
    await client.query('DELETE FROM invoices WHERE id=$1', [id]);

    await writeAudit(
      user,
      'INVOICE_DELETED',
      `Deleted invoice ${inv.invoice_number} (${inv.brand_name}) total amount ₹${inv.total_amount}`
    );

    await client.query('COMMIT');
    return { id, invoiceNumber: inv.invoice_number };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteInvoices(user, ids) {
  if (!Array.isArray(ids) || !ids.length) return 0;
  let deletedCount = 0;
  for (const id of ids) {
    const deleted = await deleteInvoice(user, id);
    if (deleted) deletedCount++;
  }
  return deletedCount;
}

module.exports = {
  INVOICE_STATUSES, GST_TYPES,
  mapInvoice, listInvoices, getInvoice, createInvoice, updateInvoiceStatus, deleteInvoice, deleteInvoices,
};
