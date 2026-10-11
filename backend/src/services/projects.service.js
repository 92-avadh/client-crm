const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'proj_' + crypto.randomBytes(6).toString('hex');

const PROJECT_STATUSES = ['Not started', 'In Progress', 'On Hold', 'Completed'];

function mapProject(p, memberIds) {
  return {
    id: p.id, brandId: p.brand_id, name: p.name, scope: p.scope,
    startDate: p.start_date, endDate: p.end_date, status: p.status,
    billingAmount: parseFloat(p.billing_amount || 0), progress: p.progress,
    createdAt: p.created_at, assignedMemberIds: memberIds || []
  };
}

async function getProject(id) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [id]);
  if (!rows.length) return null;
  const members = await pool.query(
    'SELECT member_id FROM project_assignments WHERE project_id=$1', [id]
  );
  return mapProject(rows[0], members.rows.map(r => r.member_id));
}

async function listProjects(user, { brandId } = {}) {
  let query = 'SELECT * FROM projects WHERE 1=1';
  const params = [];
  let idx = 1;

  if (user.role === 'brand') {
    query += ` AND brand_id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else if (user.role === 'admin' && user.id !== 'usr_admin') {
    query += ` AND brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx})`;
    params.push(user.id);
    idx += 1;
  }
  if (brandId) {
    query += ` AND brand_id=$${idx}`;
    params.push(brandId);
  }

  const { rows } = await pool.query(query, params);
  return Promise.all(rows.map(async (p) => {
    const members = await pool.query(
      'SELECT member_id FROM project_assignments WHERE project_id=$1', [p.id]
    );
    return mapProject(p, members.rows.map(r => r.member_id));
  }));
}

async function createProject(user, data) {
  const id = genId();
  await pool.query(
    `INSERT INTO projects (id,brand_id,name,scope,start_date,end_date,status,billing_amount,progress,owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id, data.brandId, data.name, data.scope || null,
      data.startDate || null, data.endDate || null,
      data.status || 'Not started', data.billingAmount || 0,
      data.progress || 0, user.id,
    ]
  );
  for (const mid of data.memberIds || []) {
    await pool.query(
      'INSERT INTO project_assignments (project_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, mid]
    );
  }
  return getProject(id);
}

async function updateProject(id, data) {
  const { rows } = await pool.query(
    `UPDATE projects SET name=COALESCE($1,name), scope=COALESCE($2,scope), start_date=COALESCE($3,start_date),
     end_date=COALESCE($4,end_date), status=COALESCE($5,status), billing_amount=COALESCE($6,billing_amount),
     progress=COALESCE($7,progress) WHERE id=$8 RETURNING *`,
    [
      data.name ?? null, data.scope ?? null, data.startDate ?? null,
      data.endDate ?? null, data.status ?? null,
      data.billingAmount ?? null, data.progress ?? null, id,
    ]
  );
  if (!rows.length) return null;

  if (data.memberIds !== undefined) {
    await pool.query('DELETE FROM project_assignments WHERE project_id=$1', [id]);
    for (const mid of data.memberIds) {
      await pool.query(
        'INSERT INTO project_assignments (project_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, mid]
      );
    }
  }
  return getProject(id);
}

module.exports = {
  PROJECT_STATUSES,
  mapProject, getProject, listProjects, createProject, updateProject,
};
