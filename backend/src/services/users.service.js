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
  let perms = [];
  if (Array.isArray(u.permissions)) {
    perms = u.permissions;
  } else if (typeof u.permissions === 'string') {
    try { perms = JSON.parse(u.permissions); } catch { perms = []; }
  }
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, avatar: u.avatar, designation: u.designation,
    brandId: u.brand_id, isActive: u.is_active,
    permissions: perms,
    assignedBrandIds: brandIds || [],
    createdBy: u.created_by || null,
  };
}

const { getAgencyId } = require('../utils/agency');

async function listUsers(user, { page = 1, pageSize = 50, includeInactive = false } = {}) {
  const agencyId = getAgencyId(user);
  let where = (user?.role === 'admin' || includeInactive) ? 'WHERE 1=1' : 'WHERE is_active = true';
  const params = [];
  let idx = 1;

  if (user) {
    if (user.role !== 'brand') {
      // Internal agency staff only see users belonging to their agency
      where += ` AND (agency_id = $${idx} OR created_by = $${idx} OR id = $${idx}) AND role != 'brand'`;
      params.push(agencyId);
      idx += 1;
    } else {
      where += ` AND (id = $${idx} OR brand_id = $${idx + 1} OR id IN (SELECT member_id FROM brand_assignments WHERE brand_id = $${idx + 1}))`;
      params.push(user.id, user.brandId || 'none');
      idx += 2;
    }
  }

  // Count total
  const countResult = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Paginated query with brand assignments via LEFT JOIN + json_agg
  const offset = (page - 1) * pageSize;
  const dataParams = [...params, pageSize, offset];
  const dataQuery = `
    SELECT u.*,
      COALESCE(
        (SELECT json_agg(DISTINCT ba.brand_id) FROM brand_assignments ba WHERE ba.member_id = u.id),
        '[]'
      ) AS assigned_brand_ids
    FROM users u
    ${where}
    ORDER BY u.created_at DESC, u.id
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const { rows } = await pool.query(dataQuery, dataParams);

  const data = rows.map(u => mapUser(u, u.assigned_brand_ids || []));

  return { data, total, page, pageSize };
}

async function getUser(actor, id) {
  // Support both getUser(id) and getUser(actor, id)
  const targetId = id || actor;
  const user = id ? actor : null;

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [targetId]);
  if (!rows.length) return null;
  const target = rows[0];

  if (user) {
    if (user.role !== 'admin' && user.id !== targetId) {
      return null;
    }
    if (user.role === 'admin' && user.id !== targetId) {
      const userAgencyId = getAgencyId(user);
      const targetAgencyId = target.agency_id || target.created_by || target.id;
      if (String(userAgencyId) !== String(targetAgencyId)) {
        return null;
      }
    }
  }

  return mapUser(target, await getAssignedBrandIds(targetId));
}

async function createUser(actor, data) {
  // A password must be supplied by the caller. Previously a hardcoded default
  // ('Change@1234') was issued when none was given, which left a known
  // credential on every account created without one.
  if (!data.password || String(data.password).trim().length === 0) {
    return { error: 'password_required' };
  }
  const hash = await bcrypt.hash(String(data.password).trim(), 10);
  const id = genId();
  const permissionsJson = JSON.stringify(Array.isArray(data.permissions) ? data.permissions : []);
  const actorId = actor ? actor.id : null;
  const agencyId = getAgencyId(actor);

  const { rows } = await pool.query(
    `INSERT INTO users (id,name,email,phone,password_hash,role,designation,avatar,brand_id,permissions,created_by,agency_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12) RETURNING *`,
    [
      id, data.name, data.email.toLowerCase(), data.phone || null, hash,
      data.role || 'team', data.designation || null, data.avatar || null,
      data.brandId || null, permissionsJson, actorId, agencyId
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

  const prevPerms = Array.isArray(prev.permissions)
    ? prev.permissions
    : (typeof prev.permissions === 'string' ? JSON.parse(prev.permissions || '[]') : []);

  // Privilege Escalation Defense: Only administrators may change roles or permissions
  const nextRole = (actor && actor.role === 'admin' && data.role !== undefined) ? data.role : prev.role;
  const permissionsJson = (actor && actor.role === 'admin' && data.permissions !== undefined)
    ? JSON.stringify(Array.isArray(data.permissions) ? data.permissions : [])
    : JSON.stringify(prevPerms);

  const { rows } = await pool.query(
    `UPDATE users
     SET name = $1, email = $2, phone = $3, designation = $4, avatar = $5, role = $6, password_hash = $7, permissions = $8::jsonb
     WHERE id = $9 RETURNING *`,
    [
      data.name !== undefined ? data.name : prev.name,
      data.email !== undefined ? data.email.trim() : prev.email,
      data.phone !== undefined ? data.phone : prev.phone,
      data.designation !== undefined ? data.designation : prev.designation,
      data.avatar !== undefined ? (data.avatar || null) : prev.avatar,
      nextRole,
      passwordHash,
      permissionsJson,
      userId,
    ]
  );

  return { user: mapUser(rows[0], await getAssignedBrandIds(userId)) };
}

async function deactivateUser(actor, id) {
  const targetId = id || actor;
  const user = id ? actor : null;

  if (user) {
    if (user.id === targetId) {
      const err = new Error('You cannot deactivate your own account.');
      err.status = 400;
      throw err;
    }
    const actorAgencyId = getAgencyId(user);
    const { rows: targetRows } = await pool.query('SELECT * FROM users WHERE id = $1', [targetId]);
    if (!targetRows.length) return null;
    const target = targetRows[0];
    const targetAgencyId = target.agency_id || target.created_by || target.id;
    if (String(actorAgencyId) !== String(targetAgencyId)) {
      const err = new Error('Access denied. User belongs to another workspace.');
      err.status = 403;
      throw err;
    }
    if (target.role === 'admin') {
      const { rows: adminCountRows } = await pool.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND is_active = true AND (agency_id = $1 OR created_by = $1 OR id = $1)",
        [actorAgencyId]
      );
      if (adminCountRows[0].n <= 1) {
        const err = new Error('You cannot deactivate the last active admin account.');
        err.status = 400;
        throw err;
      }
    }
  }

  const { rows } = await pool.query(
    'UPDATE users SET is_active=false WHERE id=$1 RETURNING *', [targetId]
  );
  return rows[0] ? mapUser(rows[0], []) : null;
}

module.exports = {
  USER_ROLES,
  mapUser, getAssignedBrandIds, listUsers, getUser, createUser, updateUser, deactivateUser,
};