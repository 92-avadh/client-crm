const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'task_' + crypto.randomBytes(6).toString('hex');

function mapTask(t) {
  return {
    id: t.id, projectId: t.project_id, brandId: t.brand_id, title: t.title,
    description: t.description, assigneeId: t.assignee_id, dueDate: t.due_date,
    priority: t.priority, status: t.status, createdAt: t.created_at
  };
}

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let idx = 1;
    if (req.query.brandId) { query += ` AND brand_id=$${idx}`; params.push(req.query.brandId); idx++; }
    if (req.query.projectId) { query += ` AND project_id=$${idx}`; params.push(req.query.projectId); idx++; }
    if (req.query.assigneeId) { query += ` AND assignee_id=$${idx}`; params.push(req.query.assigneeId); idx++; }
    if (req.query.status) { query += ` AND status=$${idx}`; params.push(req.query.status); idx++; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows.map(mapTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { projectId, brandId, title, description, assigneeId, dueDate, priority, status } = req.body;
    if (!title || !brandId) return res.status(400).json({ error: 'title and brandId required' });
    const id = genId();
    const { rows } = await pool.query(
      `INSERT INTO tasks (id,project_id,brand_id,title,description,assignee_id,due_date,priority,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, projectId||null, brandId, title, description, assigneeId||null, dueDate||null, priority||'Medium', status||'To Do']
    );
    res.status(201).json(mapTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const { rows } = await pool.query('UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(mapTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, description, assigneeId, dueDate, priority, status, projectId } = req.body;
    const { rows } = await pool.query(
      `UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description),
       assignee_id=COALESCE($3,assignee_id), due_date=COALESCE($4,due_date), priority=COALESCE($5,priority),
       status=COALESCE($6,status), project_id=COALESCE($7,project_id)
       WHERE id=$8 RETURNING *`,
      [title, description, assigneeId, dueDate, priority, status, projectId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(mapTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
