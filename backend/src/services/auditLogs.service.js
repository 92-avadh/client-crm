const pool = require('../db');
const { getAgencyId } = require('../utils/agency');

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
  const agencyId = getAgencyId(user);

  let whereClause = "WHERE (agency_id = $1 OR (agency_id IS NULL AND $1 = 'usr_admin'))";
  const params = [agencyId];

  // Admins and HR see agency-wide activity; standard collaborators only see their own.
  const perms = Array.isArray(user?.permissions) ? user.permissions : [];
  if (user.role !== 'admin' && user.role !== 'hr' && !perms.includes('settings')) {
    whereClause += ' AND actor_name = $2';
    params.push(user.name);
  }

  const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
  const total = await pool.query(countQuery, params);

  const pIdx = params.length + 1;
  const query = `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
  params.push(safeLimit, safeOffset);

  const { rows } = await pool.query(query, params);

  return {
    data: rows.map(mapAuditLog),
    total: parseInt(total.rows[0].count, 10),
    limit: safeLimit,
    offset: safeOffset,
  };
}

module.exports = { MAX_LIMIT, mapAuditLog, listAuditLogs };
