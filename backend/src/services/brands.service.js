const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'brand_' + crypto.randomBytes(6).toString('hex');
const docId = () => 'doc_' + crypto.randomBytes(6).toString('hex');
const payId = () => 'pay_' + crypto.randomBytes(6).toString('hex');

const CLIENT_STATUSES = ['Active', 'On Hold', 'Churned'];
const PAYMENT_STATUSES = ['Paid', 'Pending'];
const DOCUMENT_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PNG', 'JPG', 'JPEG', 'Other'];

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

async function getBrandWithDetails(id) {
  const { rows } = await pool.query('SELECT * FROM brands WHERE id=$1', [id]);
  if (!rows.length) return null;
  const members = await pool.query('SELECT member_id FROM brand_assignments WHERE brand_id=$1', [id]);
  const docs = await pool.query('SELECT * FROM brand_documents WHERE brand_id=$1', [id]);
  return {
    ...mapBrand(rows[0]),
    assignedMemberIds: members.rows.map(r => r.member_id),
    documents: docs.rows.map(mapDoc),
  };
}

async function listBrands(user, { status, search } = {}) {
  const params = [];
  let idx = 1;
  let query;
  let alias;

  if (user.role === 'team') {
    alias = 'b';
    query = `SELECT b.* FROM brands b INNER JOIN brand_assignments ba ON b.id = ba.brand_id WHERE ba.member_id = $${idx}`;
    params.push(user.id);
    idx += 1;
  } else if (user.role === 'brand') {
    alias = '';
    query = `SELECT * FROM brands WHERE id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else {
    alias = '';
    if (user.id === 'usr_admin') {
      query = `SELECT * FROM brands WHERE (owner_id = 'usr_admin' OR owner_id IS NULL)`;
    } else {
      query = `SELECT * FROM brands WHERE owner_id = $${idx}`;
      params.push(user.id);
      idx += 1;
    }
  }

  const col = (name) => (alias ? `${alias}.${name}` : name);

  if (status) {
    query += ` AND ${col('status')} = $${idx}`;
    params.push(status);
    idx += 1;
  }
  if (search) {
    query += ` AND (${col('name')} ILIKE $${idx} OR ${col('owner_name')} ILIKE $${idx})`;
    params.push('%' + search + '%');
  }

  const { rows } = await pool.query(query, params);
  return Promise.all(rows.map(async (b) => {
    const members = await pool.query('SELECT member_id FROM brand_assignments WHERE brand_id=$1', [b.id]);
    const docs = await pool.query('SELECT * FROM brand_documents WHERE brand_id=$1', [b.id]);
    return {
      ...mapBrand(b),
      assignedMemberIds: members.rows.map(r => r.member_id),
      documents: docs.rows.map(mapDoc),
    };
  }));
}

async function createBrand(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    const fee = parseFloat(data.monthlyFee) || 0;
    const today = data.onboardingDate || new Date().toISOString().split('T')[0];
    const paymentStatus = data.paymentStatus === 'Paid' ? 'Paid' : 'Pending';

    await client.query(
      `INSERT INTO brands (id,name,owner_name,mobile,email,billing_address,state,pincode,gst_number,pan,
       service_details,monthly_fee,billing_cycle_day,onboarding_date,notes,status,payment_status,last_payment_date,last_activity_date,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18,$19)`,
      [
        id, data.name, data.ownerName || null, data.mobile || null, data.email || null,
        data.billingAddress || null, data.state || null, data.pincode || null,
        data.gstNumber || null, data.pan || null, data.serviceDetails || null,
        fee, data.billingCycleDay || 1, today, data.notes || null,
        data.status || 'Active', paymentStatus, today, user.id,
      ]
    );

    for (const mid of data.memberIds || []) {
      await client.query(
        'INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, mid]
      );
    }

    // Record the onboarding retainer so billing starts in sync.
    if (fee > 0) {
      await client.query(
        `INSERT INTO payments (id, invoice_id, brand_id, brand_name, amount, payment_date, mode, reference_no, status, owner_id)
         VALUES ($1, NULL, $2, $3, $4, $5, 'Bank Transfer', $6, $7, $8)`,
        [
          payId(), id, data.name, fee, today,
          'RET-' + id.replace('brand_', '').toUpperCase(),
          paymentStatus === 'Paid' ? 'Success' : 'Pending',
          user.id,
        ]
      );
    }

    await client.query('COMMIT');
    return getBrandWithDetails(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateBrand(id, data) {
  const { rows } = await pool.query(
    `UPDATE brands SET
     name=COALESCE($1,name), owner_name=COALESCE($2,owner_name), mobile=COALESCE($3,mobile),
     email=COALESCE($4,email), billing_address=COALESCE($5,billing_address), state=COALESCE($6,state),
     pincode=COALESCE($7,pincode), gst_number=COALESCE($8,gst_number), pan=COALESCE($9,pan),
     service_details=COALESCE($10,service_details), monthly_fee=COALESCE($11,monthly_fee),
     billing_cycle_day=COALESCE($12,billing_cycle_day), onboarding_date=COALESCE($13,onboarding_date),
     notes=COALESCE($14,notes), status=COALESCE($15,status), payment_status=COALESCE($16,payment_status)
     WHERE id=$17 RETURNING *`,
    [
      data.name ?? null, data.ownerName ?? null, data.mobile ?? null,
      data.email ?? null, data.billingAddress ?? null, data.state ?? null,
      data.pincode ?? null, data.gstNumber ?? null, data.pan ?? null,
      data.serviceDetails ?? null, data.monthlyFee ?? null,
      data.billingCycleDay ?? null, data.onboardingDate ?? null,
      data.notes ?? null, data.status ?? null, data.paymentStatus ?? null,
      id,
    ]
  );
  if (!rows.length) return null;

  if (Array.isArray(data.memberIds)) {
    await pool.query('DELETE FROM brand_assignments WHERE brand_id=$1', [id]);
    for (const mid of data.memberIds) {
      await pool.query(
        'INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, mid]
      );
    }
  }

  // Keep the payments ledger consistent with the client's billing state.
  if (data.paymentStatus || data.monthlyFee !== undefined) {
    const brandRow = rows[0];
    const targetPayStatus = (data.paymentStatus || brandRow.payment_status) === 'Paid' ? 'Success' : 'Pending';
    const newFee = data.monthlyFee !== undefined
      ? parseFloat(data.monthlyFee)
      : parseFloat(brandRow.monthly_fee);

    const existingPay = await pool.query(
      'SELECT * FROM payments WHERE brand_id = $1 ORDER BY payment_date DESC, id DESC LIMIT 1',
      [id]
    );

    if (existingPay.rows.length > 0) {
      await pool.query(
        `UPDATE payments SET status = $1, amount = COALESCE($2, amount), brand_name = $3 WHERE id = $4`,
        [targetPayStatus, newFee > 0 ? newFee : null, brandRow.name, existingPay.rows[0].id]
      );
    } else if (newFee > 0) {
      const today = new Date().toISOString().split('T')[0];
      await pool.query(
        `INSERT INTO payments (id, invoice_id, brand_id, brand_name, amount, payment_date, mode, reference_no, status)
         VALUES ($1, NULL, $2, $3, $4, $5, 'Bank Transfer', $6, $7)`,
        [payId(), id, brandRow.name, newFee, today,
         'RET-' + id.replace('brand_', '').toUpperCase(), targetPayStatus]
      );
    }
  }

  return getBrandWithDetails(id);
}

async function assignMembers(id, memberIds) {
  await pool.query('DELETE FROM brand_assignments WHERE brand_id=$1', [id]);
  for (const mid of memberIds) {
    await pool.query(
      'INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, mid]
    );
  }
  return getBrandWithDetails(id);
}

async function logActivity(id) {
  const { rows } = await pool.query(
    'UPDATE brands SET last_activity_date=CURRENT_DATE WHERE id=$1 RETURNING *', [id]
  );
  if (!rows.length) return null;
  return getBrandWithDetails(id);
}

async function markChurned(id) {
  const { rows } = await pool.query(
    "UPDATE brands SET status='Churned' WHERE id=$1 RETURNING *", [id]
  );
  if (!rows.length) return null;
  return getBrandWithDetails(id);
}

async function snoozeRetention(id) {
  const { rows } = await pool.query(
    "UPDATE brands SET last_activity_date = last_activity_date + INTERVAL '7 days' WHERE id=$1 RETURNING *",
    [id]
  );
  if (!rows.length) return null;
  return getBrandWithDetails(id);
}

async function addDocument(brandId, data) {
  const { rows } = await pool.query(
    'INSERT INTO brand_documents (id,brand_id,name,size,type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [docId(), brandId, data.name, data.size || null, data.type || 'Other']
  );
  return mapDoc(rows[0]);
}

module.exports = {
  CLIENT_STATUSES, PAYMENT_STATUSES, DOCUMENT_TYPES,
  mapBrand, mapDoc, getBrandWithDetails, listBrands, createBrand,
  updateBrand, assignMembers, logActivity, markChurned, snoozeRetention, addDocument,
};
