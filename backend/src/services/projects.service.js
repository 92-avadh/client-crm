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

async function listProjects(user, { brandId, page = 1, pageSize = 50 } = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (user.role === 'brand') {
    where += ` AND brand_id = $${idx}`;
    params.push(user.brandId || '');
    idx += 1;
  } else if (user.role === 'admin' && user.id !== 'usr_admin') {
    where += ` AND brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx})`;
    params.push(user.id);
    idx += 1;
  }
  if (brandId) {
    where += ` AND brand_id=$${idx}`;
    params.push(brandId);
  }

  // Count total
  const countResult = await pool.query(`SELECT COUNT(*) AS total FROM projects ${where}`, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Paginated query with member IDs via LEFT JOIN + json_agg
  const offset = (page - 1) * pageSize;
  const dataParams = [...params, pageSize, offset];
  const dataQuery = `
    SELECT p.*,
      COALESCE(
        (SELECT json_agg(DISTINCT pa.member_id) FROM project_assignments pa WHERE pa.project_id = p.id),
        '[]'
      ) AS assigned_member_ids
    FROM projects p
    ${where}
    ORDER BY p.created_at DESC, p.id
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const { rows } = await pool.query(dataQuery, dataParams);

  const data = rows.map(p => mapProject(p, p.assigned_member_ids || []));

  return { data, total, page, pageSize };
}

async function createProject(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    await client.query(
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
      await client.query(
        'INSERT INTO project_assignments (project_id,member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, mid]
      );
    }

    await client.query('COMMIT');
    return getProject(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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