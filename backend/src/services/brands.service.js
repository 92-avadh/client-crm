const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'brand_' + crypto.randomBytes(6).toString('hex');
const docId = () => 'doc_' + crypto.randomBytes(6).toString('hex');
const payId = () => 'pay_' + crypto.randomBytes(6).toString('hex');

const CLIENT_STATUSES = ['Active', 'Inactive', 'Paused', 'Churned', 'On Hold'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Active', 'Inactive', 'Paused', 'Churned'];
const DOCUMENT_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PNG', 'JPG', 'JPEG', 'Other'];

function mapBrand(b) {
  return {
    id: b.id, name: b.name, ownerName: b.owner_name, mobile: b.mobile, email: b.email,
    billingAddress: b.billing_address, city: b.city, state: b.state, pincode: b.pincode,
    gstNumber: b.gst_number, pan: b.pan, serviceDetails: b.service_details,
    monthlyFee: parseFloat(b.monthly_fee || 0), billingCycleDay: b.billing_cycle_day,
    currency: b.currency || 'INR', currencySymbol: b.currency_symbol || '₹',
    retainerHours: parseFloat(b.retainer_hours || 40), usedHours: parseFloat(b.used_hours || 0),
    npsScore: b.nps_score != null ? parseInt(b.nps_score, 10) : null,
    contractStartDate: b.contract_start_date, contractEndDate: b.contract_end_date,
    magicToken: b.magic_token,
    onboardingDate: b.onboarding_date, notes: b.notes, status: b.status,
    paymentStatus: b.payment_status || 'Paid',
    lastActivityDate: b.last_activity_date, lastPaymentDate: b.last_payment_date,
    createdAt: b.created_at
  };
}

function mapDoc(d) {
  return {
    id: d.id,
    brandId: d.brand_id,
    name: d.name,
    size: d.size,
    uploadDate: d.upload_date,
    type: d.type,
    category: d.category || 'Contract',
    renewalDate: d.renewal_date || null,
    status: d.status || 'Signed',
    fileUrl: d.file_url || null,
  };
}

async function verifyBrandAccess(user, id) {
  if (!user) return false;
  if (['admin', 'hr'].includes(user.role) || user.id === 'usr_admin') return true;
  if (user.role === 'brand') return user.brandId === id;
  const assignCheck = await pool.query(
    'SELECT 1 FROM brand_assignments WHERE brand_id = $1 AND member_id = $2',
    [id, user.id]
  );
  return assignCheck.rows.length > 0;
}

async function getBrandWithDetails(user, id) {
  const { rows } = await pool.query('SELECT * FROM brands WHERE id=$1', [id]);
  if (!rows.length) return null;

  if (user && !await verifyBrandAccess(user, id)) {
    return { error: 'forbidden' };
  }

  const members = await pool.query('SELECT member_id FROM brand_assignments WHERE brand_id=$1', [id]);
  const docs = await pool.query('SELECT * FROM brand_documents WHERE brand_id=$1', [id]);
  return {
    ...mapBrand(rows[0]),
    assignedMemberIds: members.rows.map(r => r.member_id),
    documents: docs.rows.map(mapDoc),
  };
}

async function listBrands(user, { status, search, page = 1, pageSize = 50 } = {}) {
  const params = [];
  let idx = 1;
  let baseWhere;
  let alias;

  if (user.role === 'brand') {
    alias = '';
    baseWhere = `id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else if (user.id === 'usr_admin') {
    alias = '';
    baseWhere = `(owner_id = $${idx} OR owner_id IS NULL)`;
    params.push(user.id);
    idx += 1;
  } else if (user.role === 'admin') {
    alias = '';
    baseWhere = `owner_id = $${idx}`;
    params.push(user.id);
    idx += 1;
  } else {
    // All internal roles (team, hr, corporate presets, custom roles)
    alias = 'b';
    baseWhere = `b.id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $${idx})`;
    params.push(user.id);
    idx += 1;
  }

  const col = (name) => (alias ? `${alias}.${name}` : name);

  if (status) {
    baseWhere += ` AND ${col('status')} = $${idx}`;
    params.push(status);
    idx += 1;
  }
  if (search) {
    baseWhere += ` AND (${col('name')} ILIKE $${idx} OR ${col('owner_name')} ILIKE $${idx})`;
    params.push('%' + search + '%');
  }

  // Count total
  const countQuery = `SELECT COUNT(*) AS total FROM brands ${alias || ''} WHERE ${baseWhere}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Paginated query with JOINs
  const offset = (page - 1) * pageSize;
  const dataParams = [...params, pageSize, offset];
  const dataQuery = `
    SELECT b.*,
      COALESCE(
        (SELECT json_agg(DISTINCT ba.member_id) FROM brand_assignments ba WHERE ba.brand_id = b.id),
        '[]'
      ) AS assigned_member_ids,
      COALESCE(
        (SELECT json_agg(row_to_json(d)) FROM (
          SELECT id, brand_id, name, size, upload_date, type FROM brand_documents WHERE brand_id = b.id
        ) d),
        '[]'
      ) AS documents
    FROM brands b
    WHERE ${baseWhere}
    ORDER BY b.created_at DESC, b.id
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const { rows } = await pool.query(dataQuery, dataParams);

  const data = rows.map(b => ({
    ...mapBrand(b),
    assignedMemberIds: b.assigned_member_ids || [],
    documents: (b.documents || []).map(mapDoc),
  }));

  return { data, total, page, pageSize };
}

async function createBrand(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    const fee = parseFloat(data.monthlyFee) || 0;
    const today = data.onboardingDate || new Date().toISOString().split('T')[0];
    const status = data.status || (['Active', 'Inactive', 'Paused', 'Churned'].includes(data.paymentStatus) ? data.paymentStatus : 'Active');
    const paymentStatus = data.paymentStatus === 'Pending' ? 'Pending' : (data.paymentStatus === 'Paid' ? 'Paid' : (['Inactive', 'Paused', 'Churned'].includes(status) ? 'Pending' : 'Paid'));
    const magicToken = 'tok_' + crypto.randomBytes(12).toString('hex');
    const currency = data.currency || 'INR';
    const currencySymbol = data.currencySymbol || (currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : (currency === 'AED' ? 'AED' : (currency === 'CAD' ? 'CA$' : '₹')))));
    const retainerHours = parseFloat(data.retainerHours || 40);
    const npsScore = data.npsScore != null ? parseInt(data.npsScore, 10) : 9;

    await client.query(
      `INSERT INTO brands (id,name,owner_name,mobile,email,billing_address,city,state,pincode,gst_number,pan,
       service_details,monthly_fee,billing_cycle_day,onboarding_date,notes,status,payment_status,last_payment_date,last_activity_date,owner_id,
       currency, currency_symbol, retainer_hours, used_hours, nps_score, contract_start_date, contract_end_date, magic_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
      [
        id, data.name, data.ownerName || null, data.mobile || null, data.email || null,
        data.billingAddress || null, data.city || null, data.state || null, data.pincode || null,
        data.gstNumber || null, data.pan || null, data.serviceDetails || null,
        fee, data.billingCycleDay || 1, today, data.notes || null,
        status, paymentStatus, today, user.id,
        currency, currencySymbol, retainerHours, 0, npsScore,
        data.contractStartDate || today, data.contractEndDate || null, magicToken
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
    return getBrandWithDetails(user, id);
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
     email=COALESCE($4,email), billing_address=COALESCE($5,billing_address), city=COALESCE($6,city), state=COALESCE($7,state),
     pincode=COALESCE($8,pincode), gst_number=COALESCE($9,gst_number), pan=COALESCE($10,pan),
     service_details=COALESCE($11,service_details), monthly_fee=COALESCE($12,monthly_fee),
     billing_cycle_day=COALESCE($13,billing_cycle_day), onboarding_date=COALESCE($14,onboarding_date),
     notes=COALESCE($15,notes), status=COALESCE($16,status), payment_status=COALESCE($17,payment_status),
     currency=COALESCE($18,currency), currency_symbol=COALESCE($19,currency_symbol),
     retainer_hours=COALESCE($20,retainer_hours), used_hours=COALESCE($21,used_hours),
     nps_score=COALESCE($22,nps_score), contract_start_date=COALESCE($23,contract_start_date),
     contract_end_date=COALESCE($24,contract_end_date)
     WHERE id=$25 RETURNING *`,
    [
      data.name ?? null, data.ownerName ?? null, data.mobile ?? null,
      data.email ?? null, data.billingAddress ?? null, data.city ?? null, data.state ?? null,
      data.pincode ?? null, data.gstNumber ?? null, data.pan ?? null,
      data.serviceDetails ?? null, data.monthlyFee ?? null,
      data.billingCycleDay ?? null, data.onboardingDate ?? null,
      data.notes ?? null, data.status ?? null, data.paymentStatus ?? null,
      data.currency ?? null, data.currencySymbol ?? null,
      data.retainerHours != null ? parseFloat(data.retainerHours) : null,
      data.usedHours != null ? parseFloat(data.usedHours) : null,
      data.npsScore != null ? parseInt(data.npsScore, 10) : null,
      data.contractStartDate ?? null, data.contractEndDate ?? null,
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
    `INSERT INTO brand_documents (id, brand_id, name, size, type, category, renewal_date, status, file_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      docId(), brandId, data.name, data.size || null, data.type || 'Other',
      data.category || 'Contract', data.renewalDate || null, data.status || 'Signed', data.fileUrl || null
    ]
  );
  return mapDoc(rows[0]);
}

async function logHours(id, hours) {
  const h = parseFloat(hours) || 0;
  const { rows } = await pool.query(
    'UPDATE brands SET used_hours = GREATEST(0, used_hours + $1), last_activity_date = CURRENT_DATE WHERE id = $2 RETURNING *',
    [h, id]
  );
  if (!rows.length) return null;
  return mapBrand(rows[0]);
}

module.exports = {
  CLIENT_STATUSES, PAYMENT_STATUSES, DOCUMENT_TYPES,
  mapBrand, mapDoc, verifyBrandAccess, getBrandWithDetails, listBrands, createBrand,
  updateBrand, assignMembers, logActivity, markChurned, snoozeRetention, addDocument, logHours,
};