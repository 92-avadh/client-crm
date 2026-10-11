const pool = require('../db');

const MAX_LIMIT = 200;

function mapAuditLog(r) {
  return {
    id: r.id, timestamp: r.timestamp, actorName: r.actor_name, actorRole: r.actor_role,
    action: r.action, details: r.details, ipAddress: r.ip_address, createdAt: r.created_at
  };
}

async function listAuditLogs(user, { limit, offset } = {}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), MAX_LIMIT);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  let query = 'SELECT * FROM audit_logs';
  let countQuery = 'SELECT COUNT(*) FROM audit_logs';
  const params = [];

  // Non-admins only see their own activity.
  if (user.role !== 'admin') {
    query += ' WHERE actor_name = $1';
    countQuery += ' WHERE actor_name = $1';
    params.push(user.name);
  }

  const pIdx = params.length + 1;
  query += ` ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
  params.push(safeLimit, safeOffset);

  const { rows } = await pool.query(query, params);
  const countParams = user.role !== 'admin' ? [user.name] : [];
  const total = await pool.query(countQuery, countParams);

  return {
    data: rows.map(mapAuditLog),
    total: parseInt(total.rows[0].count, 10),
    limit: safeLimit,
    offset: safeOffset,
  };
}

module.exports = { MAX_LIMIT, mapAuditLog, listAuditLogs };
