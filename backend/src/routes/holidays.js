const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'hol_' + crypto.randomBytes(6).toString('hex');

// GET /api/holidays
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM holidays ORDER BY date ASC');
    res.json(rows.map(h => ({ id: h.id, title: h.title, date: h.date, type: h.type })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/holidays
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { title, date, type } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title and date required' });
    const id = genId();
    const { rows } = await pool.query(
      "INSERT INTO holidays (id,title,date,type) VALUES ($1,$2,$3,$4) RETURNING *",
      [id, title, date, type||'Agency Custom']
    );
    res.status(201).json({ id: rows[0].id, title: rows[0].title, date: rows[0].date, type: rows[0].type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/holidays/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { rowCount } = await pool.query('DELETE FROM holidays WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Holiday not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
