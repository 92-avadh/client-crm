const pool = require('../db');
const { getAgencyId } = require('../utils/agency');

function mapNotif(n) {
  return {
    id: n.id, type: n.type, title: n.title, message: n.message,
    timestamp: n.timestamp, isRead: n.is_read, linkModule: n.link_module,
    brandId: n.brand_id, recipientRoles: n.recipient_roles, targetUserId: n.target_user_id,
    createdAt: n.created_at
  };
}

async function listNotifications(user, { unreadOnly } = {}) {
  const isTeamMember = user.role !== 'brand';
  const agencyId = getAgencyId(user);
  let query = `SELECT * FROM notifications WHERE (agency_id = $4 OR (agency_id IS NULL AND brand_id IN (SELECT id FROM brands WHERE agency_id = $4 OR owner_id = $4)) OR (agency_id IS NULL AND $4 = 'usr_admin')) AND ($1 = ANY(recipient_roles) OR ($3::boolean = true AND 'team' = ANY(recipient_roles)) OR recipient_roles IS NULL OR target_user_id = $2)`;
  const params = [user.role, user.id, isTeamMember, agencyId];
  let idx = 5;

  if (user.role === 'brand') {
    query += ` AND brand_id = $${idx}`;
    params.push(user.brandId || 'none');
    idx += 1;
  } else if (user.role !== 'admin') {
    query += ` AND (
      target_user_id = $${idx}
      OR brand_id IS NULL
      OR brand_id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $${idx})
      OR brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx} OR agency_id = $4)
    )`;
    params.push(user.id);
    idx += 1;
  }

  if (unreadOnly === 'true') query += ' AND is_read = false';
  query += ' ORDER BY created_at DESC LIMIT 60';

  const { rows } = await pool.query(query, params);
  return rows.map(mapNotif);
}

async function createNotification({
  type = 'system',
  title,
  message,
  linkModule,
  brandId,
  recipientRoles = ['admin', 'manager', 'team'],
  targetUserId = null,
  agencyId = null,
}) {
  const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const timestamp = new Date().toISOString();
  let resolvedAgencyId = agencyId;
  if (!resolvedAgencyId && brandId) {
    try {
      const { rows } = await pool.query('SELECT agency_id, owner_id FROM brands WHERE id=$1', [brandId]);
      if (rows.length) resolvedAgencyId = rows[0].agency_id || rows[0].owner_id;
    } catch {}
  }
  const { rows } = await pool.query(
    `INSERT INTO notifications (id, type, title, message, timestamp, is_read, link_module, brand_id, recipient_roles, target_user_id, agency_id)
     VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9, $10)
     RETURNING *`,
    [id, type, title, message, timestamp, linkModule || null, brandId || null, recipientRoles, targetUserId || null, resolvedAgencyId]
  );
  const notif = mapNotif(rows[0]);
  try {
    const { broadcastNotification } = require('../socket');
    broadcastNotification(notif, targetUserId);
  } catch (err) {
    console.warn('Socket broadcast warning for notification:', err.message);
  }
  return notif;
}

async function markAllRead(user) {
  const isTeamMember = user.role !== 'brand';
  const agencyId = getAgencyId(user);
  const result = await pool.query(
    `UPDATE notifications SET is_read=true WHERE (agency_id = $4 OR (agency_id IS NULL AND brand_id IN (SELECT id FROM brands WHERE agency_id = $4 OR owner_id = $4))) AND ($1 = ANY(recipient_roles) OR ($3::boolean = true AND 'team' = ANY(recipient_roles)) OR recipient_roles IS NULL OR target_user_id = $2)`,
    [user.role, user.id, isTeamMember, agencyId]
  );
  return result.rowCount;
}

async function markRead(user, id) {
  const isTeamMember = user.role !== 'brand';
  const agencyId = getAgencyId(user);
  const { rows } = await pool.query(
    `UPDATE notifications SET is_read=true
     WHERE id=$1
       AND (agency_id = $5 OR (agency_id IS NULL AND brand_id IN (SELECT id FROM brands WHERE agency_id = $5 OR owner_id = $5)))
       AND ($2 = ANY(recipient_roles) OR ($4::boolean = true AND 'team' = ANY(recipient_roles)) OR recipient_roles IS NULL OR target_user_id = $3)
     RETURNING *`,
    [id, user.role, user.id, isTeamMember, agencyId]
  );
  return rows[0] ? mapNotif(rows[0]) : null;
}

module.exports = { mapNotif, listNotifications, createNotification, markAllRead, markRead };
