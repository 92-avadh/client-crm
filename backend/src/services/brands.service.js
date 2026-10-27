const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'brand_' + crypto.randomBytes(6).toString('hex');
const docId = () => 'doc_' + crypto.randomBytes(6).toString('hex');
const payId = () => 'pay_' + crypto.randomBytes(6).toString('hex');

const CLIENT_STATUSES = ['Active', 'Inactive', 'Paused', 'Churned', 'On Hold'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Active', 'Inactive', 'Paused', 'Churned'];
const DOCUMENT_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PNG', 'JPG', 'JPEG', 'Other'];

const { formatDateOnly } = require('../utils/dateUtils');

function mapBrand(b) {
  return {
    id: b.id, name: b.name, ownerName: b.owner_name, mobile: b.mobile, email: b.email,
    billingAddress: b.billing_address, city: b.city, state: b.state, pincode: b.pincode,
    gstNumber: b.gst_number, pan: b.pan, serviceDetails: b.service_details,
    monthlyFee: parseFloat(b.monthly_fee || 0), billingCycleDay: b.billing_cycle_day,
    currency: b.currency || 'INR', currencySymbol: b.currency_symbol || '₹',
    retainerHours: parseFloat(b.retainer_hours || 40), usedHours: parseFloat(b.used_hours || 0),
    npsScore: b.nps_score != null ? parseInt(b.nps_score, 10) : null,
    contractStartDate: formatDateOnly(b.contract_start_date),
    contractEndDate: formatDateOnly(b.contract_end_date),
    magicToken: b.magic_token,
    onboardingDate: formatDateOnly(b.onboarding_date), notes: b.notes, status: b.status,
    paymentStatus: b.payment_status || 'Paid',
    lastActivityDate: formatDateOnly(b.last_activity_date),
    lastPaymentDate: formatDateOnly(b.last_payment_date),
    deliverables: Array.isArray(b.deliverables) ? b.deliverables : (typeof b.deliverables === 'string' ? (() => { try { return JSON.parse(b.deliverables); } catch { return []; } })() : []),
    surveyReminderScheduledAt: b.survey_reminder_scheduled_at,
    createdAt: b.created_at
  };
}

function mapDoc(d) {
  return {
    id: d.id,
    brandId: d.brand_id,
    name: d.name,
    size: d.size,
    uploadDate: formatDateOnly(d.upload_date),
    type: d.type,
    category: d.category || 'Contract',
    renewalDate: formatDateOnly(d.renewal_date),
    status: d.status || 'Signed',
    fileUrl: d.file_url || null,
  };
}

const { getAgencyId } = require('../utils/agency');

async function verifyBrandAccess(user, id) {
  if (!user) return false;
  const agencyId = getAgencyId(user);
  if (user.role === 'admin' || user.role === 'hr') {
    const ownerCheck = await pool.query(
      'SELECT 1 FROM brands WHERE id = $1 AND (agency_id = $2 OR owner_id = $2)',
      [id, agencyId]
    );
    return ownerCheck.rows.length > 0;
  }
  if (user.role === 'brand') return user.brandId === id;
  const assignCheck = await pool.query(
    'SELECT 1 FROM brand_assignments WHERE brand_id = $1 AND member_id = $2',
    [id, user.id]
  );
  return assignCheck.rows.length > 0;
}

async function getBrandWithDetails(userOrId, maybeId) {
  const id = maybeId !== undefined ? maybeId : userOrId;
  const user = maybeId !== undefined ? userOrId : null;
  const { rows } = await pool.query('SELECT * FROM brands WHERE id=$1', [id]);
  if (!rows.length) return null;

  if (user && typeof user === 'object' && !await verifyBrandAccess(user, id)) {
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
  const agencyId = getAgencyId(user);
  const params = [];
  let idx = 1;
  let baseWhere;
  let alias;

  if (user.role === 'brand') {
    alias = '';
    baseWhere = `id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else if (user.role === 'admin' || user.role === 'hr') {
    alias = '';
    baseWhere = `(agency_id = $${idx} OR owner_id = $${idx})`;
    params.push(agencyId);
    idx += 1;
  } else {
    // All internal roles (team, project managers, etc)
    alias = 'b';
    baseWhere = `(b.agency_id = $${idx} OR b.owner_id = $${idx}) AND b.id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $${idx + 1})`;
    params.push(agencyId, user.id);
    idx += 2;
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
    const today = formatDateOnly(data.onboardingDate) || new Date().toISOString().split('T')[0];
    const contractStartDate = formatDateOnly(data.contractStartDate) || today;
    const contractEndDate = formatDateOnly(data.contractEndDate);
    const status = data.status || 'Active';
    // Default to 'Pending' — payment must be explicitly confirmed by user before marking Paid
    const paymentStatus = data.paymentStatus === 'Paid' ? 'Paid' : 'Pending';
    const lastPaymentDate = paymentStatus === 'Paid' ? today : null;
    const magicToken = 'tok_' + crypto.randomBytes(12).toString('hex');
    const currency = data.currency || 'INR';
    const currencySymbol = data.currencySymbol || (currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : (currency === 'AED' ? 'AED' : (currency === 'CAD' ? 'CA$' : '₹')))));
    const retainerHours = parseFloat(data.retainerHours || 40);
    // NPS score must be null until client submits rating in portal — never default to 9
    const npsScore = data.npsScore != null ? parseInt(data.npsScore, 10) : null;

    const deliverables = Array.isArray(data.deliverables) ? JSON.stringify(data.deliverables) : '[]';
    const agencyId = getAgencyId(user);

    await client.query(
      `INSERT INTO brands (id,name,owner_name,mobile,email,billing_address,city,state,pincode,gst_number,pan,
       service_details,monthly_fee,billing_cycle_day,onboarding_date,notes,status,payment_status,last_payment_date,last_activity_date,owner_id,
       currency, currency_symbol, retainer_hours, used_hours, nps_score, contract_start_date, contract_end_date, magic_token, deliverables, agency_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)`,
      [
        id, data.name, data.ownerName || null, data.mobile || null, data.email || null,
        data.billingAddress || null, data.city || null, data.state || null, data.pincode || null,
        data.gstNumber || null, data.pan || null, data.serviceDetails || null,
        fee, data.billingCycleDay || 1, today, data.notes || null,
        status, paymentStatus, lastPaymentDate, today, user.id,
        currency, currencySymbol, retainerHours, 0, npsScore,
        contractStartDate, contractEndDate, magicToken, deliverables, agencyId
      ]
    );

    for (const mid of data.memberIds || []) {
      await client.query(
        'INSERT INTO brand_assignments (brand_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, mid]
      );
    }

    // Only record an initial payment if the user explicitly marked it Paid upfront.
    // Never fabricate an unconfirmed payment for a pending client.
    if (fee > 0 && paymentStatus === 'Paid') {
      await client.query(
        `INSERT INTO payments (id, invoice_id, brand_id, brand_name, amount, payment_date, mode, reference_no, status, owner_id, agency_id)
         VALUES ($1, NULL, $2, $3, $4, $5, 'Bank Transfer', $6, 'Success', $7, $8)`,
        [
          payId(), id, data.name, fee, today,
          'RET-' + id.replace('brand_', '').toUpperCase(),
          user.id,
          agencyId,
        ]
      );
    }

    await client.query('COMMIT');
    const brand = await getBrandWithDetails(user, id);
    try {
      const { createNotification } = require('./notifications.service');
      await createNotification({
        type: 'assignment',
        title: 'New Client Onboarded',
        message: `Client "${brand.name}" has been onboarded with retainer ${brand.currencySymbol || '₹'}${Number(brand.monthlyFee || 0).toLocaleString('en-IN')}/mo.`,
        linkModule: 'clients',
        brandId: brand.id,
        recipientRoles: ['admin', 'manager', 'team'],
      });
    } catch (err) {
      console.warn('Failed to dispatch client onboarding notification:', err.message);
    }
    return brand;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateBrand(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  const directMap = {
    name: 'name',
    ownerName: 'owner_name',
    mobile: 'mobile',
    email: 'email',
    billingAddress: 'billing_address',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    gstNumber: 'gst_number',
    pan: 'pan',
    serviceDetails: 'service_details',
    notes: 'notes',
    status: 'status',
    paymentStatus: 'payment_status',
    currency: 'currency',
    currencySymbol: 'currency_symbol',
  };

  for (const [key, col] of Object.entries(directMap)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push(data[key] === '' ? null : data[key]);
    }
  }

  if (data.monthlyFee !== undefined) {
    fields.push(`monthly_fee = $${idx++}`);
    values.push(parseFloat(data.monthlyFee) || 0);
  }
  if (data.billingCycleDay !== undefined) {
    fields.push(`billing_cycle_day = $${idx++}`);
    values.push(parseInt(data.billingCycleDay, 10) || 1);
  }
  if (data.retainerHours !== undefined) {
    fields.push(`retainer_hours = $${idx++}`);
    values.push(parseFloat(data.retainerHours) || 40);
  }
  if (data.usedHours !== undefined) {
    fields.push(`used_hours = $${idx++}`);
    values.push(parseFloat(data.usedHours) || 0);
  }
  if (data.npsScore !== undefined) {
    fields.push(`nps_score = $${idx++}`);
    values.push(data.npsScore != null ? parseInt(data.npsScore, 10) : null);
  }
  if (data.contractStartDate !== undefined) {
    fields.push(`contract_start_date = $${idx++}`);
    values.push(formatDateOnly(data.contractStartDate));
  }
  if (data.contractEndDate !== undefined) {
    fields.push(`contract_end_date = $${idx++}`);
    values.push(formatDateOnly(data.contractEndDate));
  }
  if (data.onboardingDate !== undefined) {
    fields.push(`onboarding_date = $${idx++}`);
    values.push(formatDateOnly(data.onboardingDate));
  }
  if (data.deliverables !== undefined) {
    fields.push(`deliverables = $${idx++}`);
    values.push(JSON.stringify(Array.isArray(data.deliverables) ? data.deliverables : []));
  }

  let rows = [];
  if (fields.length > 0) {
    values.push(id);
    const sql = `UPDATE brands SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(sql, values);
    rows = res.rows;
    if (!rows.length) return null;
  } else {
    const res = await pool.query('SELECT * FROM brands WHERE id = $1', [id]);
    rows = res.rows;
    if (!rows.length) return null;
  }

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