const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/audit-logs
router.get('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const { rows } = await pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const total = await pool.query('SELECT COUNT(*) FROM audit_logs');
    res.json({
      data: rows.map(r => ({
        id: r.id, timestamp: r.timestamp, actorName: r.actor_name, actorRole: r.actor_role,
        action: r.action, details: r.details, ipAddress: r.ip_address, createdAt: r.created_at
      })),
      total: parseInt(total.rows[0].count),
      limit,
      offset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
