const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'task_' + crypto.randomBytes(6).toString('hex');

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];

/** Row → API shape. */
function mapTask(t) {
  return {
    id: t.id,
    projectId: t.project_id,
    brandId: t.brand_id,
    title: t.title,
    description: t.description,
    assigneeId: t.assignee_id,
    dueDate: t.due_date,
    priority: t.priority,
    status: t.status,
    createdAt: t.created_at,
  };
}

/**
 * Build the visibility clause for a caller's role.
 * Business rule lives here (not in the controller) so it can be reused by
 * cron jobs, reports, or any other caller.
 */
function scopeForUser(user) {
  if (user.role === 'brand') {
    return { sql: ' AND brand_id = $1', params: [user.brandId || ''] };
  }
  if (user.role === 'admin') {
    if (user.id !== 'usr_admin') {
      return {
        sql: ' AND (brand_id IN (SELECT id FROM brands WHERE owner_id = $1) OR brand_id IS NULL)',
        params: [user.id],
      };
    }
    return { sql: '', params: [] };
  }
  // Internal team members (standard, corporate presets, or custom roles)
  return {
    sql: ' AND (assignee_id = $1 OR brand_id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $1))',
    params: [user.id],
  };
}

async function listTasks(user, filters = {}) {
  const scope = scopeForUser(user);
  let query = 'SELECT * FROM tasks WHERE 1=1' + scope.sql;
  const params = [...scope.params];
  let idx = params.length + 1;

  const filterMap = {
    brandId: 'brand_id',
    projectId: 'project_id',
    assigneeId: 'assignee_id',
    status: 'status',
  };
  for (const [key, column] of Object.entries(filterMap)) {
    if (filters[key]) {
      query += ` AND ${column}=$${idx}`;
      params.push(filters[key]);
      idx += 1;
    }
  }

  query += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(query, params);
  return rows.map(mapTask);
}

async function createTask(user, data) {
  const id = genId();
  const { rows } = await pool.query(
    `INSERT INTO tasks (id,project_id,brand_id,title,description,assignee_id,due_date,priority,status,owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      id,
      data.projectId || null,
      data.brandId,
      data.title,
      data.description || null,
      data.assigneeId || null,
      data.dueDate || null,
      data.priority || 'Medium',
      data.status || 'To Do',
      user.id,
    ]
  );
  return mapTask(rows[0]);
}

async function updateTaskStatus(id, status) {
  const { rows } = await pool.query(
    'UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *',
    [status, id]
  );
  return rows[0] ? mapTask(rows[0]) : null;
}

async function updateTask(id, data) {
  const { rows } = await pool.query(
    `UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description),
     assignee_id=COALESCE($3,assignee_id), due_date=COALESCE($4,due_date), priority=COALESCE($5,priority),
     status=COALESCE($6,status), project_id=COALESCE($7,project_id)
     WHERE id=$8 RETURNING *`,
    [
      data.title ?? null,
      data.description ?? null,
      data.assigneeId ?? null,
      data.dueDate ?? null,
      data.priority ?? null,
      data.status ?? null,
      data.projectId ?? null,
      id,
    ]
  );
  return rows[0] ? mapTask(rows[0]) : null;
}

module.exports = {
  PRIORITIES,
  STATUSES,
  mapTask,
  scopeForUser,
  listTasks,
  createTask,
  updateTaskStatus,
  updateTask,
};
