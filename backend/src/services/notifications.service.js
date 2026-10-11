const pool = require('../db');

function mapNotif(n) {
  return {
    id: n.id, type: n.type, title: n.title, message: n.message,
    timestamp: n.timestamp, isRead: n.is_read, linkModule: n.link_module,
    brandId: n.brand_id, recipientRoles: n.recipient_roles, targetUserId: n.target_user_id,
    createdAt: n.created_at
  };
}

async function listNotifications(user, { unreadOnly } = {}) {
  let query = `SELECT * FROM notifications WHERE ($1 = ANY(recipient_roles) OR recipient_roles IS NULL OR target_user_id = $2)`;
  const params = [user.role, user.id];
  let idx = 3;

  if (user.role === 'brand') {
    query += ` AND brand_id = $${idx}`;
    params.push(user.brandId || 'none');
    idx += 1;
  } else if (user.id !== 'usr_admin') {
    query += ` AND (brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx}) OR target_user_id = $${idx})`;
    params.push(user.id);
    idx += 1;
  }

  if (unreadOnly === 'true') query += ' AND is_read = false';
  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(mapNotif);
}

async function markAllRead(user) {
  const result = await pool.query(
    `UPDATE notifications SET is_read=true WHERE ($1 = ANY(recipient_roles) OR recipient_roles IS NULL OR target_user_id = $2)`,
    [user.role, user.id]
  );
  return result.rowCount;
}

async function markRead(id) {
  const { rows } = await pool.query(
    'UPDATE notifications SET is_read=true WHERE id=$1 RETURNING *',
    [id]
  );
  return rows[0] ? mapNotif(rows[0]) : null;
}

module.exports = { mapNotif, listNotifications, markAllRead, markRead };
