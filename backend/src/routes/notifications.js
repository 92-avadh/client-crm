const express = require('express');
const router = express.Router();
const pool = require('../db');

function mapNotif(n) {
  return {
    id: n.id, type: n.type, title: n.title, message: n.message,
    timestamp: n.timestamp, isRead: n.is_read, linkModule: n.link_module,
    brandId: n.brand_id, recipientRoles: n.recipient_roles, targetUserId: n.target_user_id,
    createdAt: n.created_at
  };
}

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    let query = `SELECT * FROM notifications WHERE ($1 = ANY(recipient_roles) OR recipient_roles IS NULL OR target_user_id = $2)`;
    const params = [req.user.role, req.user.id];
    if (req.query.unreadOnly === 'true') { query += ` AND is_read = false`; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows.map(mapNotif));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// IMPORTANT: /read-all must be defined BEFORE /:id/read to prevent route conflict
// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read=true WHERE ($1 = ANY(recipient_roles) OR recipient_roles IS NULL OR target_user_id = $2)`,
      [req.user.role, req.user.id]
    );
    res.json({ success: true, count: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 RETURNING *', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Notification not found' });
    res.json(mapNotif(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
