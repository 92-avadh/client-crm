const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'exp_' + crypto.randomBytes(6).toString('hex');
const auditId = () => 'audit_' + crypto.randomBytes(6).toString('hex');

function mapExpense(e) {
  let formattedDate = null;
  if (e.date) {
    if (typeof e.date === 'string') {
      formattedDate = e.date.split('T')[0];
    } else if (e.date instanceof Date) {
      formattedDate = e.date.toISOString().split('T')[0];
    } else {
      formattedDate = String(e.date).split('T')[0];
    }
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

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin or HR access required' });
    }
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    let idx = 1;

    if (req.query.brandId) {
      if (req.query.brandId === 'other') {
        query += ` AND (brand_id IS NULL OR brand_id = '' OR brand_id = 'other')`;
      } else {
        query += ` AND brand_id=$${idx}`;
        params.push(req.query.brandId);
        idx++;
      }
    }
    if (req.query.category && req.query.category !== 'all') {
      query += ` AND category=$${idx}`;
      params.push(req.query.category);
      idx++;
    }
    if (req.query.paymentStatus && req.query.paymentStatus !== 'all') {
      query += ` AND payment_status=$${idx}`;
      params.push(req.query.paymentStatus);
      idx++;
    }
    if (req.query.employeeName) {
      query += ` AND employee_name ILIKE $${idx}`;
      params.push(`%${req.query.employeeName}%`);
      idx++;
    }
    if (req.query.search) {
      query += ` AND (title ILIKE $${idx} OR description ILIKE $${idx} OR note ILIKE $${idx} OR employee_name ILIKE $${idx} OR category ILIKE $${idx})`;
      params.push(`%${req.query.search}%`);
      idx++;
    }
    if (req.query.isRecurring !== undefined && req.query.isRecurring !== '') {
      query += ` AND is_recurring=$${idx}`;
      params.push(req.query.isRecurring === 'true');
      idx++;
    }

    query += ' ORDER BY date DESC NULLS LAST, created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows.map(mapExpense));
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin or HR access required' });
    }
    const {
      title,
      description,
      category,
      amount,
      date,
      paymentMode,
      paymentStatus,
      employeeName,
      employeeId,
      note,
      receiptUrl,
      brandId,
      isRecurring
    } = req.body;

    if (!category || amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Category and valid amount are required' });
    }

    const id = genId();
    const cleanAmount = parseFloat(amount) || 0;
    const cleanTitle = (title && title.trim()) || (note && note.trim()) || category || 'Expense';
    const cleanDesc = description !== undefined ? description : (note || '');
    const cleanDate = date || new Date().toISOString().split('T')[0];
    const cleanMode = paymentMode || 'Corporate Card';
    const cleanPayStatus = paymentStatus === 'Pending' ? 'Pending' : 'Paid';
    const cleanEmpName = employeeName ? employeeName.trim() : '';
    const cleanEmpId = employeeId || null;
    const cleanNote = note || cleanDesc || '';
    const cleanReceipt = receiptUrl || null;
    const cleanBrandId = (brandId && brandId !== 'other') ? brandId : null;
    const cleanRecurring = Boolean(isRecurring);

    const { rows } = await pool.query(
      `INSERT INTO expenses (
        id, title, description, category, amount, date,
        payment_mode, payment_status, employee_name, employee_id,
        note, receipt_url, brand_id, is_recurring
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        id, cleanTitle, cleanDesc, category, cleanAmount, cleanDate,
        cleanMode, cleanPayStatus, cleanEmpName, cleanEmpId,
        cleanNote, cleanReceipt, cleanBrandId, cleanRecurring
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, 'EXPENSE_ADDED', $5, 'unknown')`,
      [
        auditId(),
        new Date().toISOString(),
        req.user.name,
        req.user.role,
        `Added expense: ${cleanTitle} (${category}) - ₹${cleanAmount.toLocaleString('en-IN')}`
      ]
    );

    res.status(201).json(mapExpense(rows[0]));
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/expenses/:id
router.patch('/:id', async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin or HR access required' });
    }
    const { id } = req.params;

    // Check existing
    const existing = await pool.query('SELECT * FROM expenses WHERE id=$1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const prev = existing.rows[0];

    const {
      title,
      description,
      category,
      amount,
      date,
      paymentMode,
      paymentStatus,
      employeeName,
      employeeId,
      note,
      receiptUrl,
      brandId,
      isRecurring
    } = req.body;

    const newTitle = title !== undefined ? title : (prev.title || prev.note || prev.category);
    const newDesc = description !== undefined ? description : (prev.description || prev.note || '');
    const newCategory = category !== undefined ? category : prev.category;
    const newAmount = amount !== undefined ? parseFloat(amount) : parseFloat(prev.amount);
    const newDate = date !== undefined ? date : prev.date;
    const newMode = paymentMode !== undefined ? paymentMode : prev.payment_mode;
    const newPayStatus = paymentStatus !== undefined ? paymentStatus : (prev.payment_status || 'Paid');
    const newEmpName = employeeName !== undefined ? employeeName : (prev.employee_name || '');
    const newEmpId = employeeId !== undefined ? employeeId : (prev.employee_id || null);
    const newNote = note !== undefined ? note : (prev.note || '');
    const newReceipt = receiptUrl !== undefined ? receiptUrl : prev.receipt_url;
    const newBrandId = brandId !== undefined ? ((brandId && brandId !== 'other') ? brandId : null) : prev.brand_id;
    const newRecurring = isRecurring !== undefined ? Boolean(isRecurring) : prev.is_recurring;

    const { rows } = await pool.query(
      `UPDATE expenses
       SET title=$1, description=$2, category=$3, amount=$4, date=$5,
           payment_mode=$6, payment_status=$7, employee_name=$8, employee_id=$9,
           note=$10, receipt_url=$11, brand_id=$12, is_recurring=$13
       WHERE id=$14 RETURNING *`,
      [
        newTitle, newDesc, newCategory, newAmount, newDate,
        newMode, newPayStatus, newEmpName, newEmpId,
        newNote, newReceipt, newBrandId, newRecurring, id
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, 'EXPENSE_UPDATED', $5, 'unknown')`,
      [
        auditId(),
        new Date().toISOString(),
        req.user.name,
        req.user.role,
        `Updated expense: ${newTitle} (${newCategory}) - ₹${newAmount.toLocaleString('en-IN')}`
      ]
    );

    res.json(mapExpense(rows[0]));
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin or HR access required' });
    }
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM expenses WHERE id=$1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const prev = existing.rows[0];

    await pool.query('DELETE FROM expenses WHERE id=$1', [id]);

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, actor_name, actor_role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, 'EXPENSE_DELETED', $5, 'unknown')`,
      [
        auditId(),
        new Date().toISOString(),
        req.user.name,
        req.user.role,
        `Deleted expense: ${prev.title || prev.category} - ₹${parseFloat(prev.amount || 0).toLocaleString('en-IN')}`
      ]
    );

    res.json({ success: true, message: 'Expense deleted successfully', id });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
