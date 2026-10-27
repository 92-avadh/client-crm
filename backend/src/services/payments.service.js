const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'pay_' + crypto.randomBytes(6).toString('hex');
const notifId = () => 'notif_' + crypto.randomBytes(6).toString('hex');
const auditId = () => 'audit_' + crypto.randomBytes(6).toString('hex');

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Razorpay UPI', 'Cash', 'Cheque', 'Corporate Card', 'Razorpay'];
const PAYMENT_STATUSES = ['Success', 'Pending'];

function mapPayment(p) {
  return {
    id: p.id, invoiceId: p.invoice_id, brandId: p.brand_id, brandName: p.brand_name,
    amount: parseFloat(p.amount || 0), paymentDate: p.payment_date, mode: p.mode,
    referenceNo: p.reference_no, status: p.status, proofUrl: p.proof_url, createdAt: p.created_at
  };
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Record a payment and cascade the side effects (invoice balance, client
 * activity, notification, audit entry) inside one transaction.
 *
 * Lives in the service layer so any caller — API, cron, webhook — gets the
 * same consistent behaviour instead of re-implementing the SQL.
 */
const { getAgencyId } = require('../utils/agency');

async function recordPayment({ invoiceId, brandId, brandName, amount, mode, referenceNo, proofUrl, actor }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = genId();
    const today = new Date().toISOString().split('T')[0];
    const agencyId = actor ? getAgencyId(actor) : null;

    if (invoiceId) {
      const invCheck = await client.query('SELECT agency_id, brand_id, total_amount, paid_amount FROM invoices WHERE id = $1', [invoiceId]);
      if (!invCheck.rows.length) {
        await client.query('ROLLBACK');
        const err = new Error('Invoice not found');
        err.status = 404;
        throw err;
      }
      const inv = invCheck.rows[0];
      if (agencyId && inv.agency_id && String(inv.agency_id) !== String(agencyId)) {
        await client.query('ROLLBACK');
        const err = new Error('Access denied. Invoice belongs to another workspace.');
        err.status = 403;
        throw err;
      }
    }

    const payRes = await client.query(
      `INSERT INTO payments (id,invoice_id,brand_id,brand_name,amount,payment_date,mode,reference_no,status,proof_url,owner_id,agency_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Success',$9,$10,$11) RETURNING *`,
      [id, invoiceId, brandId, brandName, amount, today, mode, referenceNo, proofUrl || null, actor ? actor.id : null, agencyId]
    );

    const invRes = await client.query(
      `UPDATE invoices SET paid_amount = paid_amount + $1,
       status = CASE WHEN paid_amount + $1 >= total_amount THEN 'Paid' ELSE 'Partially Paid' END,
       payment_date = CASE WHEN paid_amount + $1 >= total_amount THEN $2::date ELSE payment_date END,
       payment_mode = CASE WHEN paid_amount + $1 >= total_amount THEN $3 ELSE payment_mode END
       WHERE id=$4 RETURNING *`,
      [amount, today, mode, invoiceId]
    );

    const brandRes = await client.query(
      `UPDATE brands SET last_payment_date=$1, last_activity_date=$1 WHERE id=$2 RETURNING *`,
      [today, brandId]
    );

    const paymentNotif = {
      id: notifId(),
      type: 'payment',
      title: `💰 Payment Received: ${inr(amount)}`,
      message: `Payment of ${inr(amount)} received from ${brandName}.`,
      timestamp: new Date().toISOString(),
      is_read: false,
      link_module: 'invoices',
      brand_id: brandId,
      recipient_roles: ['admin', 'manager', 'hr', 'team'],
    };

    await client.query(
      `INSERT INTO notifications (id,type,title,message,timestamp,is_read,link_module,brand_id,recipient_roles)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        paymentNotif.id,
        paymentNotif.type,
        paymentNotif.title,
        paymentNotif.message,
        paymentNotif.timestamp,
        false,
        paymentNotif.link_module,
        paymentNotif.brand_id,
        paymentNotif.recipient_roles,
      ]
    );

    try {
      const { broadcastNotification } = require('../socket');
      broadcastNotification(paymentNotif);
    } catch {}

    await client.query(
      `INSERT INTO audit_logs (id,timestamp,actor_name,actor_role,action,details,ip_address)
       VALUES ($1,$2,$3,$4,'PAYMENT_RECORDED',$5,'unknown')`,
      [
        auditId(), new Date().toISOString(),
        actor?.name || 'System', actor?.role || 'system',
        `Recorded payment of ${inr(amount)} for invoice ${invoiceId} from ${brandName}.`,
      ]
    );

    await client.query('COMMIT');
    return {
      payment: mapPayment(payRes.rows[0]),
      invoice: invRes.rows[0],
      brand: brandRes.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listPayments(user, { brandId, invoiceId } = {}) {
  let query = 'SELECT * FROM payments WHERE 1=1';
  const params = [];
  let idx = 1;

  const agencyId = getAgencyId(user);
  if (user.role === 'brand') {
    query += ` AND brand_id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else if (user.role === 'admin' || user.role === 'hr') {
    // Admins and HR see payments across their agency workspace
    query += ` AND (agency_id = $${idx} OR owner_id = $${idx} OR brand_id IN (SELECT id FROM brands WHERE agency_id = $${idx} OR owner_id = $${idx}))`;
    params.push(agencyId);
    idx += 1;
  } else {
    // Team members must not read agency-wide financial records.
    return [];
  }
  if (brandId) {
    query += ` AND brand_id=$${idx}`;
    params.push(brandId);
    idx += 1;
  }
  if (invoiceId) {
    query += ` AND invoice_id=$${idx}`;
    params.push(invoiceId);
    idx += 1;
  }
  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(mapPayment);
}

async function updatePayment(user, id, data) {
  const agencyId = user ? getAgencyId(user) : null;
  const existing = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  if (!existing.rows.length) return null;
  const prev = existing.rows[0];

  if (agencyId && prev.agency_id && String(prev.agency_id) !== String(agencyId)) {
    const err = new Error('Access denied. Payment belongs to another workspace.');
    err.status = 403;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE payments SET
     status = COALESCE($1, status),
     mode = COALESCE($2, mode),
     payment_date = COALESCE($3, payment_date),
     reference_no = COALESCE($4, reference_no)
     WHERE id = $5 RETURNING *`,
    [
      data.status ?? null, data.mode ?? null, data.paymentDate ?? null,
      data.referenceNo ?? null,
      id,
    ]
  );
  if (!rows.length) return null;

  const payment = mapPayment(rows[0]);

  // Keep the client's payment status consistent with its payments.
  if (data.status && rows[0].brand_id) {
    if (data.status === 'Success') {
      await pool.query(
        "UPDATE brands SET payment_status = 'Paid', last_payment_date = COALESCE($1, last_payment_date), last_activity_date = COALESCE($1, last_activity_date) WHERE id = $2",
        [rows[0].payment_date, rows[0].brand_id]
      );
    } else if (data.status === 'Pending') {
      const otherSuccess = await pool.query(
        "SELECT id FROM payments WHERE brand_id = $1 AND id != $2 AND status = 'Success'",
        [rows[0].brand_id, id]
      );
      if (!otherSuccess.rows.length) {
        await pool.query("UPDATE brands SET payment_status = 'Pending' WHERE id = $1", [rows[0].brand_id]);
      }
    }
  }

  return payment;
}

/** Prepare a Razorpay order for an invoice. */
async function initiateRazorpay(user, invoiceId) {
  const agencyId = user ? getAgencyId(user) : null;
  let query = 'SELECT total_amount, paid_amount, agency_id FROM invoices WHERE id=$1';
  const params = [invoiceId];
  if (agencyId) {
    query += ' AND (agency_id = $2 OR owner_id = $2)';
    params.push(agencyId);
  }
  const { rows } = await pool.query(query, params);
  if (!rows.length) return null;

  const settings = await pool.query("SELECT razorpay_key_id FROM settings WHERE id='main'");
  const keyId = settings.rows[0]?.razorpay_key_id;
  if (!keyId) {
    const err = new Error('Online payments are not set up yet. Please contact support.');
    err.status = 503;
    throw err;
  }

  const remainingBalance = Math.max(0, parseFloat(rows[0].total_amount) - parseFloat(rows[0].paid_amount || 0));

  return {
    razorpayOrderId: 'order_' + crypto.randomBytes(10).toString('hex'),
    amount: Math.round(remainingBalance * 100),
    currency: 'INR',
    keyId,
  };
}

async function deletePayment(user, id) {
  if (user && !['admin', 'hr', 'manager'].includes(user.role)) {
    const err = new Error('Only admin or manager can delete payments');
    err.status = 403;
    throw err;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prev = await client.query('SELECT * FROM payments WHERE id=$1', [id]);
    if (!prev.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }
    const pay = prev.rows[0];
    const agencyId = user ? getAgencyId(user) : null;
    if (agencyId && pay.agency_id && String(pay.agency_id) !== String(agencyId)) {
      await client.query('ROLLBACK');
      const err = new Error('Access denied. Payment belongs to another workspace.');
      err.status = 403;
      throw err;
    }

    // Revert invoice paid amount if payment was Success
    if (pay.invoice_id && pay.status === 'Success') {
      const invRes = await client.query('SELECT * FROM invoices WHERE id=$1', [pay.invoice_id]);
      if (invRes.rows.length) {
        const inv = invRes.rows[0];
        const newPaid = Math.max(0, parseFloat(inv.paid_amount || 0) - parseFloat(pay.amount || 0));
        const newStatus = newPaid <= 0 ? 'Sent' : newPaid < parseFloat(inv.total_amount || 0) ? 'Partially Paid' : 'Paid';
        await client.query(
          'UPDATE invoices SET paid_amount=$1, status=$2 WHERE id=$3',
          [newPaid, newStatus, pay.invoice_id]
        );
      }
    }

    await client.query('DELETE FROM payments WHERE id=$1', [id]);

    await client.query(
      `INSERT INTO audit_logs (id,timestamp,actor_name,actor_role,action,details,ip_address)
       VALUES ($1,$2,$3,$4,'PAYMENT_DELETED',$5,'unknown')`,
      [
        auditId(),
        new Date().toISOString(),
        user?.name || 'System',
        user?.role || 'system',
        `Deleted payment record ${pay.reference_no || pay.id} of ₹${pay.amount} for ${pay.brand_name}.`,
      ]
    );

    await client.query('COMMIT');
    return { id, referenceNo: pay.reference_no, amount: pay.amount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deletePayments(user, ids) {
  if (!Array.isArray(ids) || !ids.length) return 0;
  let deletedCount = 0;
  for (const id of ids) {
    const deleted = await deletePayment(user, id);
    if (deleted) deletedCount++;
  }
  return deletedCount;
}

module.exports = {
  PAYMENT_MODES, PAYMENT_STATUSES,
  mapPayment, recordPayment, listPayments, updatePayment, initiateRazorpay, deletePayment, deletePayments,
};
