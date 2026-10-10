const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'inv_' + crypto.randomBytes(6).toString('hex');
const itemId = () => 'ii_' + crypto.randomBytes(6).toString('hex');
const recId = () => 'rec_' + crypto.randomBytes(6).toString('hex');

function mapInvoice(r, items) {
  return {
    id: r.id, invoiceNumber: r.invoice_number, brandId: r.brand_id, brandName: r.brand_name,
    issueDate: r.issue_date, dueDate: r.due_date, subtotal: parseFloat(r.subtotal||0),
    hasGst: r.has_gst, gstType: r.gst_type, cgstAmount: parseFloat(r.cgst_amount||0),
    sgstAmount: parseFloat(r.sgst_amount||0), igstAmount: parseFloat(r.igst_amount||0),
    totalAmount: parseFloat(r.total_amount||0), paidAmount: parseFloat(r.paid_amount||0),
    status: r.status, notes: r.notes, paymentDate: r.payment_date, paymentMode: r.payment_mode,
    razorpayPaymentId: r.razorpay_payment_id, isRecurring: r.is_recurring, createdAt: r.created_at,
    items: (items||[]).map(i => ({
      id: i.id, invoiceId: i.invoice_id, description: i.description, hsnSac: i.hsn_sac,
      quantity: parseFloat(i.quantity||1), unitPrice: parseFloat(i.unit_price||0), amount: parseFloat(i.amount||0)
    }))
  };
}

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    let idx = 1;

    if (req.user.role === 'brand') {
      query += ` AND brand_id = $${idx}`;
      params.push(req.user.brandId || ''); idx++;
    } else if (req.user.role === 'admin' && req.user.id !== 'usr_admin') {
      query += ` AND brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx})`;
      params.push(req.user.id); idx++;
    }

    if (req.query.brandId) { query += ` AND brand_id=$${idx}`; params.push(req.query.brandId); idx++; }
    if (req.query.status) { query += ` AND status=$${idx}`; params.push(req.query.status); idx++; }
    if (req.query.search) {
      query += ` AND (invoice_number ILIKE $${idx} OR brand_name ILIKE $${idx})`;
      params.push('%' + req.query.search + '%'); idx++;
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    const invoices = await Promise.all(rows.map(async r => {
      const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [r.id]);
      return mapInvoice(r, items.rows);
    }));
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id]);
    res.json(mapInvoice(rows[0], items.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { brandId, brandName, issueDate, dueDate, subtotal, hasGst, gstType, cgstAmount, sgstAmount, igstAmount,
            totalAmount, notes, paymentMode, isRecurring, items } = req.body;
    if (!brandId) return res.status(400).json({ error: 'brandId required' });
    // Auto-generate invoice number
    const settings = await pool.query("SELECT invoice_prefix FROM settings WHERE id='main'");
    const prefix = settings.rows[0]?.invoice_prefix || 'INV-2026-';
    const countRes = await pool.query('SELECT COUNT(*) FROM invoices');
    const nextNum = parseInt(countRes.rows[0].count) + 42;
    const invoiceNumber = prefix + String(nextNum).padStart(4, '0');
    const id = genId();
    const ownerId = req.user.id;
    await pool.query(
      `INSERT INTO invoices (id,invoice_number,brand_id,brand_name,issue_date,due_date,subtotal,has_gst,gst_type,
       cgst_amount,sgst_amount,igst_amount,total_amount,paid_amount,status,notes,payment_mode,is_recurring,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,'Sent',$14,$15,$16,$17)`,
      [id, invoiceNumber, brandId, brandName, issueDate||null, dueDate||null,
       subtotal||0, hasGst||false, gstType||'NONE', cgstAmount||0, sgstAmount||0, igstAmount||0,
       totalAmount||0, notes, paymentMode||null, isRecurring||false, ownerId]
    );
    if (items && items.length) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items (id,invoice_id,description,hsn_sac,quantity,unit_price,amount) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [itemId(), id, item.description, item.hsnSac||item.hsn_sac, item.quantity||1, item.unitPrice||item.unit_price||0, item.amount||0]
        );
      }
    }
    if (isRecurring) {
      await pool.query(
        'INSERT INTO recurring_invoices (id,invoice_id,brand_id,frequency,next_due_date,status) VALUES ($1,$2,$3,$4,$5,$6)',
        [recId(), id, brandId, 'Monthly', dueDate||null, 'Active']
      );
    }
    const finalItems = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [id]);
    const inv = await pool.query('SELECT * FROM invoices WHERE id=$1', [id]);
    res.status(201).json(mapInvoice(inv.rows[0], finalItems.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const { rows } = await pool.query('UPDATE invoices SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id]);
    res.json(mapInvoice(rows[0], items.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id]);
    res.json({
      message: 'PDF generation requires WeasyPrint/Puppeteer - serve invoice data for client-side PDF',
      invoice: mapInvoice(rows[0], items.rows)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
