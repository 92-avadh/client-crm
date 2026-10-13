const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'exp_' + crypto.randomBytes(6).toString('hex');
const auditId = () => 'audit_' + crypto.randomBytes(6).toString('hex');

const EXPENSE_CATEGORIES = [
  'Salary', 'Rent', 'Utilities', 'Software', 'Marketing',
  'Travel', 'Office Supplies', 'Professional Fees', 'Other',
];
const PAYMENT_MODES = ['Corporate Card', 'Bank Transfer', 'Cash', 'UPI', 'Cheque'];
const PAYMENT_STATUSES = ['Paid', 'Pending'];

function mapExpense(e) {
  let formattedDate = null;
  if (e.date) {
    if (typeof e.date === 'string') formattedDate = e.date.split('T')[0];
    else if (e.date instanceof Date) formattedDate = e.date.toISOString().split('T')[0];
    else formattedDate = String(e.date).split('T')[0];
  }
  return {
    id: e.id,
    title: e.title || e.note || e.category || 'Expense',
    description: e.description || e.note || '',
    category: e.category,
    amount: parseFloat(e.amount || 0),
    date: formattedDate,
    paymentMode: e.payment_mode || 'Corporate Card',
    paymentStatus: e.payment_status || 'Paid',
    employeeName: e.employee_name || '',
    employeeId: e.employee_id || null,
    note: e.note || e.description || '',
    receiptUrl: e.receipt_url || null,
    brandId: e.brand_id || null,
    isRecurring: Boolean(e.is_recurring),
    createdAt: e.created_at
  };
}

/** Append an audit entry. Never let logging failure break the operation. */
async function writeAudit(user, action, details) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, 'unknown')`,
      [auditId(), new Date().toISOString(), user.name, user.role, action, details]
    );
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

const formatAmount = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

async function listExpenses(user, filters = {}) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (user && user.role !== 'admin') {
    whereClause += ` AND (owner_id = $${idx} OR brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx}))`;
    params.push(user.id);
    idx += 1;
  }

  if (filters.brandId) {
    if (filters.brandId === 'other') {
      whereClause += ` AND (brand_id IS NULL OR brand_id = '' OR brand_id = 'other')`;
    } else {
      whereClause += ` AND brand_id=$${idx}`;
      params.push(filters.brandId);
      idx += 1;
    }
  }
  if (filters.category && filters.category !== 'all') {
    whereClause += ` AND category=$${idx}`;
    params.push(filters.category);
    idx += 1;
  }
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    whereClause += ` AND payment_status=$${idx}`;
    params.push(filters.paymentStatus);
    idx += 1;
  }
  if (filters.employeeName) {
    whereClause += ` AND employee_name ILIKE $${idx}`;
    params.push(`%${filters.employeeName}%`);
    idx += 1;
  }
  if (filters.search) {
    whereClause += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR note ILIKE $${idx} OR employee_name ILIKE $${idx} OR category ILIKE $${idx})`;
    params.push(`%${filters.search}%`);
    idx += 1;
  }
  if (filters.isRecurring !== undefined && filters.isRecurring !== '') {
    whereClause += ` AND is_recurring=$${idx}`;
    params.push(filters.isRecurring === 'true');
  }

  // Count total matching rows
  const countQuery = `SELECT COUNT(*) FROM expenses ${whereClause}`;
  const { rows: countRows } = await pool.query(countQuery, params);
  const total = parseInt(countRows[0].count, 10);

  // Paginated query
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 50;
  const offset = (page - 1) * pageSize;
  const query = `SELECT * FROM expenses ${whereClause} ORDER BY date DESC NULLS LAST, created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(pageSize, offset);

  const { rows } = await pool.query(query, params);
  const data = rows.map(mapExpense);

  return { data, total, page, pageSize };
}

async function createExpense(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    const cleanAmount = parseFloat(data.amount) || 0;
    const cleanTitle = (data.title && data.title.trim()) || (data.note && data.note.trim()) || data.category || 'Expense';
    const cleanDesc = data.description !== undefined ? data.description : (data.note || '');
    const cleanDate = data.date || new Date().toISOString().split('T')[0];

    const { rows } = await client.query(
      `INSERT INTO expenses (
        id, title, description, category, amount, date,
        payment_mode, payment_status, employee_name, employee_id,
        note, receipt_url, brand_id, is_recurring, owner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        id, cleanTitle, cleanDesc, data.category, cleanAmount, cleanDate,
        data.paymentMode || 'Corporate Card',
        data.paymentStatus === 'Pending' ? 'Pending' : 'Paid',
        data.employeeName ? data.employeeName.trim() : '',
        data.employeeId || null,
        data.note || cleanDesc || '',
        data.receiptUrl || null,
        (data.brandId && data.brandId !== 'other') ? data.brandId : null,
        Boolean(data.isRecurring),
        user ? user.id : null,
      ]
    );

    await writeAudit(user, 'EXPENSE_ADDED',
      `Added expense: ${cleanTitle} (${data.category}) - ${formatAmount(cleanAmount)}`);

    await client.query('COMMIT');
    return mapExpense(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateExpense(user, id, data) {
  const existing = await pool.query('SELECT * FROM expenses WHERE id=$1', [id]);
  if (!existing.rows.length) return null;
  const prev = existing.rows[0];

  const pick = (key, fallback) => (data[key] !== undefined ? data[key] : fallback);

  const newTitle = pick('title', prev.title || prev.note || prev.category);
  const newDesc = pick('description', prev.description || prev.note || '');
  const newCategory = pick('category', prev.category);
  const newAmount = data.amount !== undefined ? parseFloat(data.amount) : parseFloat(prev.amount);
  const newDate = pick('date', prev.date);
  const newMode = pick('paymentMode', prev.payment_mode);
  const newPayStatus = pick('paymentStatus', prev.payment_status || 'Paid');
  const newEmpName = pick('employeeName', prev.employee_name || '');
  const newEmpId = pick('employeeId', prev.employee_id || null);
  const newNote = pick('note', prev.note || '');
  const newReceipt = pick('receiptUrl', prev.receipt_url);
  const newBrandId = data.brandId !== undefined
    ? ((data.brandId && data.brandId !== 'other') ? data.brandId : null)
    : prev.brand_id;
  const newRecurring = data.isRecurring !== undefined ? Boolean(data.isRecurring) : prev.is_recurring;

  const { rows } = await pool.query(
    `UPDATE expenses
     SET title=$1, description=$2, category=$3, amount=$4, date=$5,
         payment_mode=$6, payment_status=$7, employee_name=$8, employee_id=$9,
         note=$10, receipt_url=$11, brand_id=$12, is_recurring=$13
     WHERE id=$14 RETURNING *`,
    [
      newTitle, newDesc, newCategory, newAmount, newDate,
      newMode, newPayStatus, newEmpName, newEmpId,
      newNote, newReceipt, newBrandId, newRecurring, id,
    ]
  );

  await writeAudit(user, 'EXPENSE_UPDATED',
    `Updated expense: ${newTitle} (${newCategory}) - ${formatAmount(newAmount)}`);

  return mapExpense(rows[0]);
}

async function deleteExpense(user, id) {
  const existing = await pool.query('SELECT * FROM expenses WHERE id=$1', [id]);
  if (!existing.rows.length) return false;
  const prev = existing.rows[0];

  await pool.query('DELETE FROM expenses WHERE id=$1', [id]);

  await writeAudit(user, 'EXPENSE_DELETED',
    `Deleted expense: ${prev.title || prev.category} - ${formatAmount(prev.amount)}`);

  return true;
}

async function deleteExpenses(user, ids) {
  if (!Array.isArray(ids) || !ids.length) return 0;
  let deletedCount = 0;
  for (const id of ids) {
    const deleted = await deleteExpense(user, id);
    if (deleted) deletedCount++;
  }
  return deletedCount;
}

module.exports = {
  EXPENSE_CATEGORIES, PAYMENT_MODES, PAYMENT_STATUSES,
  mapExpense, listExpenses, createExpense, updateExpense, deleteExpense, deleteExpenses,
};
