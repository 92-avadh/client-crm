const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'lead_' + crypto.randomBytes(6).toString('hex');
const brandId = () => 'brand_' + crypto.randomBytes(6).toString('hex');

function mapLead(l) {
  return {
    id: l.id, name: l.name, company: l.company, contact: l.contact,
    email: l.email, phone: l.phone, source: l.source, stage: l.stage,
    value: parseFloat(l.value||0), followUpDate: l.follow_up_date,
    notes: l.notes, createdAt: l.created_at
  };
}

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    let idx = 1;
    if (req.user && req.user.id !== 'usr_admin') {
      query += ` AND owner_id = $${idx}`;
      params.push(req.user.id);
      idx++;
    }
    if (req.query.stage) { query += ` AND stage=$${idx}`; params.push(req.query.stage); idx++; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows.map(mapLead));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const { name, company, contact, email, phone, source, stage, value, followUpDate, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const id = genId();
    const ownerId = req.user ? req.user.id : null;
    const { rows } = await pool.query(
      `INSERT INTO leads (id,name,company,contact,email,phone,source,stage,value,follow_up_date,notes,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [id, name, company, contact, email, phone, source, stage||'New', value||0, followUpDate||null, notes, ownerId]
    );
    res.status(201).json(mapLead(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/leads/:id/stage
router.patch('/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ error: 'stage required' });
    const { rows } = await pool.query('UPDATE leads SET stage=$1 WHERE id=$2 RETURNING *', [stage, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead not found' });
    res.json(mapLead(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/:id/convert
router.post('/:id/convert', async (req, res) => {
  try {
    const { rows: leadRows } = await pool.query('SELECT * FROM leads WHERE id=$1', [req.params.id]);
    if (!leadRows.length) return res.status(404).json({ error: 'Lead not found' });
    const lead = leadRows[0];
    const newBrandId = brandId();
    const ownerId = req.user ? req.user.id : null;
    await pool.query(
      `INSERT INTO brands (id,name,owner_name,email,phone,status,monthly_fee,owner_id)
       VALUES ($1,$2,$3,$4,$5,'Active',0,$6)`,
      [newBrandId, lead.company||lead.name, lead.contact||lead.name, lead.email, lead.phone, ownerId]
    );
    const updatedLead = await pool.query("UPDATE leads SET stage='Won' WHERE id=$1 RETURNING *", [req.params.id]);
    const { rows: brandRows } = await pool.query('SELECT * FROM brands WHERE id=$1', [newBrandId]);
    res.status(201).json({ brand: brandRows[0], lead: mapLead(updatedLead.rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
