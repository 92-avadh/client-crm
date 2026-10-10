const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'pay_' + crypto.randomBytes(6).toString('hex');
const notifId = () => 'notif_' + crypto.randomBytes(6).toString('hex');
const auditId = () => 'audit_' + crypto.randomBytes(6).toString('hex');

function mapPayment(p) {
  return {
    id: p.id, invoiceId: p.invoice_id, brandId: p.brand_id, brandName: p.brand_name,
    amount: parseFloat(p.amount||0), paymentDate: p.payment_date, mode: p.mode,
    referenceNo: p.reference_no, status: p.status, proofUrl: p.proof_url, createdAt: p.created_at
  };
}

async function recordPayment(invoiceId, brandId, brandName, amount, mode, referenceNo, proofUrl, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = genId();
    const today = new Date().toISOString().split('T')[0];
    const payRes = await client.query(
      `INSERT INTO payments (id,invoice_id,brand_id,brand_name,amount,payment_date,mode,reference_no,status,proof_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Success',$9) RETURNING *`,
      [id, invoiceId, brandId, brandName, amount, today, mode, referenceNo, proofUrl||null]
    );
    // Update invoice
    const invRes = await client.query(
      `UPDATE invoices SET paid_amount = paid_amount + $1,
       status = CASE WHEN paid_amount + $1 >= total_amount THEN 'Paid' ELSE 'Partially Paid' END,
       payment_date = CASE WHEN paid_amount + $1 >= total_amount THEN $2::date ELSE payment_date END,
       payment_mode = CASE WHEN paid_amount + $1 >= total_amount THEN $3 ELSE payment_mode END
       WHERE id=$4 RETURNING *`,
      [amount, today, mode, invoiceId]
    );
    // Update brand
    const brandRes = await client.query(
      `UPDATE brands SET last_payment_date=$1, last_activity_date=$1 WHERE id=$2 RETURNING *`,
      [today, brandId]
    );
    // Insert notification
    await client.query(
      `INSERT INTO notifications (id,type,title,message,timestamp,is_read,link_module,brand_id,recipient_roles)
       VALUES ($1,'payment',$2,$3,$4,false,'invoices',$5,ARRAY['admin','hr'])`,
      [
        notifId(),
        `💰 Payment Received: ₹${parseFloat(amount).toLocaleString('en-IN')}`,
        `Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} received from ${brandName}.`,
        new Date().toISOString(),
        brandId
      ]
    );
    // Insert audit log
    await client.query(
      `INSERT INTO audit_logs (id,timestamp,actor_name,actor_role,action,details,ip_address)
       VALUES ($1,$2,$3,$4,'PAYMENT_RECORDED',$5,'unknown')`,
      [auditId(), new Date().toISOString(), actor?.name||'System', actor?.role||'system',
       `Recorded payment of ₹${amount} for invoice ${invoiceId} from ${brandName}.`]
    );
    await client.query('COMMIT');
    return { payment: mapPayment(payRes.rows[0]), invoice: invRes.rows[0], brand: brandRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];
    let idx = 1;
    if (req.query.brandId) { query += ` AND brand_id=$${idx}`; params.push(req.query.brandId); idx++; }
    if (req.query.invoiceId) { query += ` AND invoice_id=$${idx}`; params.push(req.query.invoiceId); idx++; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows.map(mapPayment));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payments
router.post('/', async (req, res) => {
  try {
    const { invoiceId, brandId, brandName, amount, mode, referenceNo, proofUrl } = req.body;
    if (!invoiceId || !brandId || !amount) return res.status(400).json({ error: 'invoiceId, brandId, amount required' });
    const result = await recordPayment(invoiceId, brandId, brandName, amount, mode, referenceNo, proofUrl, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payments/razorpay-initiate
router.post('/razorpay-initiate', async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const { rows } = await pool.query('SELECT total_amount FROM invoices WHERE id=$1', [invoiceId]);
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const settings = await pool.query("SELECT razorpay_key_id FROM settings WHERE id='main'");
    const keyId = settings.rows[0]?.razorpay_key_id || 'rzp_test_xxx';
    const orderId = 'order_' + crypto.randomBytes(10).toString('hex');
    res.json({
      razorpayOrderId: orderId,
      amount: Math.round(parseFloat(rows[0].total_amount) * 100),
      currency: 'INR',
      keyId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payments/razorpay-verify
router.post('/razorpay-verify', async (req, res) => {
  try {
    const { invoiceId, brandId, brandName, amount, mode, razorpayPaymentId } = req.body;
    if (!invoiceId || !brandId || !amount) return res.status(400).json({ error: 'invoiceId, brandId, amount required' });
    // Update razorpay payment id on invoice
    await pool.query('UPDATE invoices SET razorpay_payment_id=$1 WHERE id=$2', [razorpayPaymentId, invoiceId]);
    const result = await recordPayment(invoiceId, brandId, brandName, amount, mode||'Razorpay', razorpayPaymentId, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/payments/:id
router.patch('/:id', async (req, res) => {
  try {
    if (!['admin','hr'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const { status, mode, paymentDate, referenceNo, amount } = req.body;
    const { rows } = await pool.query(
      `UPDATE payments SET
       status = COALESCE($1, status),
       mode = COALESCE($2, mode),
       payment_date = COALESCE($3, payment_date),
       reference_no = COALESCE($4, reference_no),
       amount = COALESCE($5, amount)
       WHERE id = $6 RETURNING *`,
      [status, mode, paymentDate, referenceNo, amount !== undefined ? parseFloat(amount) : null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' });
    const payment = mapPayment(rows[0]);

    // Synchronize client brand payment status if brand_id is associated
    if (status && rows[0].brand_id) {
      if (status === 'Success') {
        await pool.query(
          "UPDATE brands SET payment_status = 'Paid', last_payment_date = COALESCE($1, last_payment_date), last_activity_date = COALESCE($1, last_activity_date) WHERE id = $2",
          [rows[0].payment_date, rows[0].brand_id]
        );
      } else if (status === 'Pending') {
        const otherSuccess = await pool.query(
          "SELECT id FROM payments WHERE brand_id = $1 AND id != $2 AND status = 'Success'",
          [rows[0].brand_id, req.params.id]
        );
        if (!otherSuccess.rows.length) {
          await pool.query("UPDATE brands SET payment_status = 'Pending' WHERE id = $1", [rows[0].brand_id]);
        }
      }
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
