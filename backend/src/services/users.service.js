const pool = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const genId = () => 'usr_' + crypto.randomBytes(8).toString('hex');

const USER_ROLES = ['admin', 'hr', 'team', 'brand'];

async function getAssignedBrandIds(userId) {
  const { rows } = await pool.query(
    'SELECT brand_id FROM brand_assignments WHERE member_id = $1', [userId]
  );
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

async function listUsers(user) {
  let query = 'SELECT * FROM users WHERE is_active = true';
  const params = [];
  let idx = 1;

  if (user && user.role !== 'admin') {
    if (user.role === 'brand') {
      query += ` AND (id = $${idx} OR brand_id = $${idx + 1})`;
      params.push(user.id, user.brandId || 'none');
      idx += 2;
    } else {
      query += ` AND (id = $${idx} OR created_by = $${idx})`;
      params.push(user.id);
    }
  }

  const { rows } = await pool.query(query, params);
  return Promise.all(rows.map(async (u) => mapUser(u, await getAssignedBrandIds(u.id))));
}

async function getUser(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (!rows.length) return null;
  return mapUser(rows[0], await getAssignedBrandIds(id));
}

async function createUser(actor, data) {
  // A caller-supplied password is hashed; otherwise a default is issued and
  // the user is expected to reset it.
  const hash = await bcrypt.hash(data.password || 'Change@1234', 10);
  const id = genId();

  const { rows } = await pool.query(
    `INSERT INTO users (id,name,email,phone,password_hash,role,designation,avatar,brand_id,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      id, data.name, data.email.toLowerCase(), data.phone || null, hash,
      data.role, data.designation || null, data.avatar || null,
      data.brandId || null, actor.id,
    ]
  );
  return mapUser(rows[0], []);
}

async function updateUser(actor, userId, data) {
  const existing = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!existing.rows.length) return { error: 'not_found' };
  const prev = existing.rows[0];

  // Email must stay unique across team members.
  if (data.email && data.email.toLowerCase() !== (prev.email || '').toLowerCase()) {
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
      [data.email.trim(), userId]
    );
    if (emailCheck.rows.length > 0) return { error: 'email_taken' };
  }

  let passwordHash = prev.password_hash;
  if (data.password && data.password.trim().length > 0) {
    passwordHash = await bcrypt.hash(data.password.trim(), 10);
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET name = $1, email = $2, phone = $3, designation = $4, avatar = $5, role = $6, password_hash = $7
     WHERE id = $8 RETURNING *`,
    [
      data.name !== undefined ? data.name : prev.name,
      data.email !== undefined ? data.email.trim() : prev.email,
      data.phone !== undefined ? data.phone : prev.phone,
      data.designation !== undefined ? data.designation : prev.designation,
      data.avatar !== undefined ? data.avatar : prev.avatar,
      data.role !== undefined ? data.role : prev.role,
      passwordHash,
      userId,
    ]
  );

  return { user: mapUser(rows[0], await getAssignedBrandIds(userId)) };
}

async function deactivateUser(id) {
  const { rows } = await pool.query(
    'UPDATE users SET is_active=false WHERE id=$1 RETURNING *', [id]
  );
  return rows[0] ? mapUser(rows[0], []) : null;
}

module.exports = {
  USER_ROLES,
  mapUser, getAssignedBrandIds, listUsers, getUser, createUser, updateUser, deactivateUser,
};
