const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'brand_' + crypto.randomBytes(6).toString('hex');
const docId = () => 'doc_' + crypto.randomBytes(6).toString('hex');

async function getBrandWithDetails(id) {
  const { rows } = await pool.query('SELECT * FROM brands WHERE id=$1', [id]);
  if (!rows.length) return null;
  const brand = rows[0];
  const members = await pool.query('SELECT member_id FROM brand_assignments WHERE brand_id=$1', [id]);
  const docs = await pool.query('SELECT * FROM brand_documents WHERE brand_id=$1', [id]);
  return {
    ...mapBrand(brand),
    assignedMemberIds: members.rows.map(r => r.member_id),
    documents: docs.rows.map(mapDoc)
  };
}

function mapBrand(b) {
  return {
    id: b.id, name: b.name, ownerName: b.owner_name, mobile: b.mobile, email: b.email,
    billingAddress: b.billing_address, state: b.state, pincode: b.pincode,
    gstNumber: b.gst_number, pan: b.pan, serviceDetails: b.service_details,
    monthlyFee: parseFloat(b.monthly_fee || 0), billingCycleDay: b.billing_cycle_day,
    onboardingDate: b.onboarding_date, notes: b.notes, status: b.status,
    paymentStatus: b.payment_status || 'Paid',
    lastActivityDate: b.last_activity_date, lastPaymentDate: b.last_payment_date,
    createdAt: b.created_at
  };
}

function mapDoc(d) {
  return { id: d.id, brandId: d.brand_id, name: d.name, size: d.size, uploadDate: d.upload_date, type: d.type };
}

// GET /api/brands
router.get('/', async (req, res) => {
  try {
    const params = [];
    let idx = 1;
    let query, alias;

    if (req.user.role === 'team') {
      alias = 'b';
      query = `SELECT b.* FROM brands b INNER JOIN brand_assignments ba ON b.id = ba.brand_id WHERE ba.member_id = $${idx}`;
      params.push(req.user.id); idx++;
    } else if (req.user.role === 'brand') {
      alias = '';
      query = `SELECT * FROM brands WHERE id = $${idx}`;
      params.push(req.user.brandId || ''); idx++;
    } else {
      alias = '';
      query = `SELECT * FROM brands WHERE 1=1`;
    }

    const col = (name) => alias ? `${alias}.${name}` : name;

    if (req.query.status) { query += ` AND ${col('status')} = $${idx}`; params.push(req.query.status); idx++; }
    if (req.query.search) {
      query += ` AND (${col('name')} ILIKE $${idx} OR ${col('owner_name')} ILIKE $${idx})`;
      params.push('%' + req.query.search + '%'); idx++;
    }
    const { rows } = await pool.query(query, params);
    const brands = await Promise.all(rows.map(async b => {
      const members = await pool.query('SELECT member_id FROM brand_assignments WHERE brand_id=$1', [b.id]);
      const docs = await pool.query('SELECT * FROM brand_documents WHERE brand_id=$1', [b.id]);
      return { ...mapBrand(b), assignedMemberIds: members.rows.map(r => r.member_id), documents: docs.rows.map(mapDoc) };
    }));
    res.json(brands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/brands/:id
router.get('/:id', async (req, res) => {
  try {
    const brand = await getBrandWithDetails(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const payId = () => 'pay_' + crypto.randomBytes(6).toString('hex');

// POST /api/brands
router.post('/', async (req, res) => {
  try {
    if (!['admin','hr'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const { name, ownerName, mobile, email, billingAddress, state, pincode, gstNumber, pan,
            serviceDetails, monthlyFee, billingCycleDay, onboardingDate, notes, status, paymentStatus, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const id = genId();
    const fee = parseFloat(monthlyFee) || 0;
    const today = onboardingDate || new Date().toISOString().split('T')[0];
    const initialPaymentStatus = paymentStatus === 'Paid' ? 'Paid' : 'Pending';

    await pool.query(
      `INSERT INTO brands (id,name,owner_name,mobile,email,billing_address,state,pincode,gst_number,pan,
       service_details,monthly_fee,billing_cycle_day,onboarding_date,notes,status,payment_status,last_payment_date,last_activity_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)`,
      [id, name, ownerName, mobile, email, billingAddress, state, pincode, gstNumber, pan,
       serviceDetails, fee, billingCycleDay||1, today, notes, status||'Active', initialPaymentStatus, today]
    );
    if (memberIds && memberIds.length) {
      for (const mid of memberIds) {
        await pool.query('INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, mid]);
      }
    }

    // Automatically record onboarding retainer collection in payments
    if (fee > 0) {
      const pid = payId();
      const refNo = 'RET-' + id.replace('brand_', '').toUpperCase();
      const pStatus = initialPaymentStatus === 'Paid' ? 'Success' : 'Pending';
      await pool.query(
        `INSERT INTO payments (id, invoice_id, brand_id, brand_name, amount, payment_date, mode, reference_no, status)
         VALUES ($1, NULL, $2, $3, $4, $5, 'Bank Transfer', $6, $7)`,
        [pid, id, name, fee, today, refNo, pStatus]
      );
    }

    const brand = await getBrandWithDetails(id);
    res.status(201).json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/brands/:id
router.patch('/:id', async (req, res) => {
  try {
    const { name, ownerName, mobile, email, billingAddress, state, pincode, gstNumber, pan,
            serviceDetails, monthlyFee, billingCycleDay, onboardingDate, notes, status, paymentStatus, memberIds } = req.body;
    const { rows } = await pool.query(
      `UPDATE brands SET
       name=COALESCE($1,name), owner_name=COALESCE($2,owner_name), mobile=COALESCE($3,mobile),
       email=COALESCE($4,email), billing_address=COALESCE($5,billing_address), state=COALESCE($6,state),
       pincode=COALESCE($7,pincode), gst_number=COALESCE($8,gst_number), pan=COALESCE($9,pan),
       service_details=COALESCE($10,service_details), monthly_fee=COALESCE($11,monthly_fee),
       billing_cycle_day=COALESCE($12,billing_cycle_day), onboarding_date=COALESCE($13,onboarding_date),
       notes=COALESCE($14,notes), status=COALESCE($15,status), payment_status=COALESCE($16,payment_status)
       WHERE id=$17 RETURNING *`,
      [name, ownerName, mobile, email, billingAddress, state, pincode, gstNumber, pan,
       serviceDetails, monthlyFee, billingCycleDay, onboardingDate, notes, status, paymentStatus, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Brand not found' });

    if (memberIds && Array.isArray(memberIds)) {
      await pool.query('DELETE FROM brand_assignments WHERE brand_id=$1', [req.params.id]);
      for (const mid of memberIds) {
        await pool.query('INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, mid]);
      }
    }

    // Sync payments table when paymentStatus or monthlyFee is updated
    if (paymentStatus || monthlyFee !== undefined) {
      const brandRow = rows[0];
      const targetPayStatus = (paymentStatus || brandRow.payment_status) === 'Paid' ? 'Success' : 'Pending';
      const newFee = monthlyFee !== undefined ? parseFloat(monthlyFee) : parseFloat(brandRow.monthly_fee);

      const existingPay = await pool.query(
        'SELECT * FROM payments WHERE brand_id = $1 ORDER BY payment_date DESC, id DESC LIMIT 1',
        [req.params.id]
      );

      if (existingPay.rows.length > 0) {
        await pool.query(
          `UPDATE payments SET status = $1, amount = COALESCE($2, amount), brand_name = $3 WHERE id = $4`,
          [targetPayStatus, newFee > 0 ? newFee : null, brandRow.name, existingPay.rows[0].id]
        );
      } else if (newFee > 0) {
        const pid = payId();
        const refNo = 'RET-' + req.params.id.replace('brand_', '').toUpperCase();
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
          `INSERT INTO payments (id, invoice_id, brand_id, brand_name, amount, payment_date, mode, reference_no, status)
           VALUES ($1, NULL, $2, $3, $4, $5, 'Bank Transfer', $6, $7)`,
          [pid, req.params.id, brandRow.name, newFee, today, refNo, targetPayStatus]
        );
      }
    }

    const brand = await getBrandWithDetails(req.params.id);
    res.json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/brands/:id/assign-members
router.patch('/:id/assign-members', async (req, res) => {
  try {
    const { memberIds } = req.body;
    await pool.query('DELETE FROM brand_assignments WHERE brand_id=$1', [req.params.id]);
    if (memberIds && memberIds.length) {
      for (const mid of memberIds) {
        await pool.query('INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, mid]);
      }
    }
    const brand = await getBrandWithDetails(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/brands/:id/log-activity
router.patch('/:id/log-activity', async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE brands SET last_activity_date=CURRENT_DATE WHERE id=$1 RETURNING *', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Brand not found' });
    const brand = await getBrandWithDetails(req.params.id);
    res.json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/brands/:id/churn
router.patch('/:id/churn', async (req, res) => {
  try {
    const { rows } = await pool.query("UPDATE brands SET status='Churned' WHERE id=$1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Brand not found' });
    const brand = await getBrandWithDetails(req.params.id);
    res.json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/brands/:id/snooze-retention
router.patch('/:id/snooze-retention', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE brands SET last_activity_date = last_activity_date + INTERVAL '7 days' WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Brand not found' });
    const brand = await getBrandWithDetails(req.params.id);
    res.json(brand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/brands/:id/documents
router.post('/:id/documents', async (req, res) => {
  try {
    const { name, size, type } = req.body;
    const id = docId();
    const { rows } = await pool.query(
      'INSERT INTO brand_documents (id,brand_id,name,size,type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, req.params.id, name, size, type]
    );
    res.status(201).json(mapDoc(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
