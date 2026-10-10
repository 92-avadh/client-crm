const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'usr_' + crypto.randomBytes(8).toString('hex');

async function getAssignedBrandIds(userId) {
  const { rows } = await pool.query('SELECT brand_id FROM brand_assignments WHERE member_id = $1', [userId]);
  return rows.map(r => r.brand_id);
}

function mapUser(u, brandIds) {
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, avatar: u.avatar, designation: u.designation,
    brandId: u.brand_id, isActive: u.is_active,
    assignedBrandIds: brandIds || []
  };
}

// GET /api/users
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM users WHERE is_active = true';
    const params = [];
    if (req.user.role !== 'admin') {
      query += ' AND role != $1';
      params.push('brand');
    }
    const { rows } = await pool.query(query, params);
    const users = await Promise.all(rows.map(async u => mapUser(u, await getAssignedBrandIds(u.id))));
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const brandIds = await getAssignedBrandIds(req.params.id);
    res.json(mapUser(rows[0], brandIds));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, email, phone, password, role, designation, avatar, brandId } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'name, email, role required' });
    const hash = await bcrypt.hash(password || 'Change@1234', 10);
    const id = genId();
    const { rows } = await pool.query(
      `INSERT INTO users (id,name,email,phone,password_hash,role,designation,avatar,brand_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, name, email, phone, hash, role, designation, avatar, brandId]
    );
    res.status(201).json(mapUser(rows[0], []));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: Admin access required to edit team members' });
    }

    const { name, email, phone, designation, avatar, role, password } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!existing.rows.length) return res.status(404).json({ error: 'User not found' });
    const prev = existing.rows[0];

    // If email is changed, check for uniqueness
    if (email && email.toLowerCase() !== (prev.email || '').toLowerCase()) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email address is already in use by another team member' });
      }
    }

    let passwordHash = prev.password_hash;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const newName = name !== undefined ? name : prev.name;
    const newEmail = email !== undefined ? email.trim() : prev.email;
    const newPhone = phone !== undefined ? phone : prev.phone;
    const newDesignation = designation !== undefined ? designation : prev.designation;
    const newAvatar = avatar !== undefined ? avatar : prev.avatar;
    const newRole = role !== undefined ? role : prev.role;

    const { rows } = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, designation = $4, avatar = $5, role = $6, password_hash = $7
       WHERE id = $8 RETURNING *`,
      [newName, newEmail, newPhone, newDesignation, newAvatar, newRole, passwordHash, userId]
    );

    const brandIds = await getAssignedBrandIds(userId);
    res.json(mapUser(rows[0], brandIds));
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PATCH /api/users/:id/deactivate
router.patch('/:id/deactivate', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query('UPDATE users SET is_active=false WHERE id=$1 RETURNING *', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: mapUser(rows[0], []) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
