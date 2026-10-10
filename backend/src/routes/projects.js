const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'proj_' + crypto.randomBytes(6).toString('hex');

async function getProject(id) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [id]);
  if (!rows.length) return null;
  const members = await pool.query('SELECT member_id FROM project_assignments WHERE project_id=$1', [id]);
  return mapProject(rows[0], members.rows.map(r => r.member_id));
}

function mapProject(p, memberIds) {
  return {
    id: p.id, brandId: p.brand_id, name: p.name, scope: p.scope,
    startDate: p.start_date, endDate: p.end_date, status: p.status,
    billingAmount: parseFloat(p.billing_amount || 0), progress: p.progress,
    createdAt: p.created_at, assignedMemberIds: memberIds || []
  };
}

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    let idx = 1;

    if (req.user.role === 'brand') {
      query += ` AND brand_id = $${idx}`;
      params.push(req.user.brandId || ''); idx++;
    } else if (req.user.role === 'admin' && req.user.id !== 'usr_admin') {
      query += ` AND brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx})`;
      params.push(req.user.id); idx++;
    }

    if (req.query.brandId) { query += ` AND brand_id=$${idx}`; params.push(req.query.brandId); idx++; }
    const { rows } = await pool.query(query, params);
    const projects = await Promise.all(rows.map(async p => {
      const members = await pool.query('SELECT member_id FROM project_assignments WHERE project_id=$1', [p.id]);
      return mapProject(p, members.rows.map(r => r.member_id));
    }));
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { brandId, name, scope, startDate, endDate, status, billingAmount, progress, memberIds } = req.body;
    if (!brandId || !name) return res.status(400).json({ error: 'brandId and name required' });
    const id = genId();
    const ownerId = req.user.id;
    await pool.query(
      `INSERT INTO projects (id,brand_id,name,scope,start_date,end_date,status,billing_amount,progress,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, brandId, name, scope, startDate||null, endDate||null, status||'Not started', billingAmount||0, progress||0, ownerId]
    );
    if (memberIds && memberIds.length) {
      for (const mid of memberIds) {
        await pool.query('INSERT INTO project_assignments (project_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, mid]);
      }
    }
    const project = await getProject(id);
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
  try {
    const { name, scope, startDate, endDate, status, billingAmount, progress, memberIds } = req.body;
    const { rows } = await pool.query(
      `UPDATE projects SET name=COALESCE($1,name), scope=COALESCE($2,scope), start_date=COALESCE($3,start_date),
       end_date=COALESCE($4,end_date), status=COALESCE($5,status), billing_amount=COALESCE($6,billing_amount),
       progress=COALESCE($7,progress) WHERE id=$8 RETURNING *`,
      [name, scope, startDate, endDate, status, billingAmount, progress, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    if (memberIds !== undefined) {
      await pool.query('DELETE FROM project_assignments WHERE project_id=$1', [req.params.id]);
      for (const mid of memberIds) {
        await pool.query('INSERT INTO project_assignments (project_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, mid]);
      }
    }
    const project = await getProject(req.params.id);
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
