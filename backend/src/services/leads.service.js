const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'lead_' + crypto.randomBytes(6).toString('hex');
const newBrandId = () => 'brand_' + crypto.randomBytes(6).toString('hex');

const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const LEAD_SOURCES = ['Referral', 'Website', 'Social Media', 'Cold Call', 'Event', 'Other'];

const { formatDateOnly } = require('../utils/dateUtils');

function mapLead(l) {
  return {
    id: l.id, name: l.name, company: l.company, contact: l.contact,
    email: l.email, phone: l.phone, source: l.source, stage: l.stage,
    value: parseFloat(l.value || 0), followUpDate: formatDateOnly(l.follow_up_date),
    notes: l.notes, createdAt: l.created_at
  };
}

async function listLeads(user, { stage } = {}) {
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  let idx = 1;

  // Scope by role, never by a hardcoded user id. Keying off a specific id
  // meant every other internal user (including team members) could read every
  // lead in the workspace.
  if (user && user.role === 'brand') {
    query += ` AND owner_id = $${idx}`;
    params.push(user.brandId || user.id);
    idx += 1;
  } else if (user && user.role !== 'admin' && user.role !== 'hr') {
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    if (!perms.includes('leads')) {
      query += ` AND owner_id = $${idx}`;
      params.push(user.id);
      idx += 1;
    }
  }
  if (stage) {
    query += ` AND stage=$${idx}`;
    params.push(stage);
  }
  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows.map(mapLead);
}

async function createLead(user, data) {
  const { rows } = await pool.query(
    `INSERT INTO leads (id,name,company,contact,email,phone,source,stage,value,follow_up_date,notes,owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      genId(), data.name, data.company || null, data.contact || null,
      data.email || null, data.phone || null, data.source || null,
      data.stage || 'New', data.value || 0, formatDateOnly(data.followUpDate),
      data.notes || null, user ? user.id : null,
    ]
  );
  return mapLead(rows[0]);
}

async function updateLeadStage(id, stage) {
  const { rows } = await pool.query(
    'UPDATE leads SET stage=$1 WHERE id=$2 RETURNING *', [stage, id]
  );
  return rows[0] ? mapLead(rows[0]) : null;
}

/**
 * Convert a lead into an active client.
 * Business logic (and the transaction boundary) live here so it can be
 * reused — e.g. from an import job — without duplicating SQL.
 */
async function convertLeadToBrand(id, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: leadRows } = await client.query('SELECT * FROM leads WHERE id=$1 FOR UPDATE', [id]);
    if (!leadRows.length) {
      await client.query('ROLLBACK');
      return null;
    }
    const lead = leadRows[0];
    const brandId = newBrandId();

    await client.query(
      `INSERT INTO brands (id,name,owner_name,email,phone,status,monthly_fee,owner_id)
       VALUES ($1,$2,$3,$4,$5,'Active',0,$6)`,
      [brandId, lead.company || lead.name, lead.contact || lead.name,
       lead.email, lead.phone, user ? user.id : null]
    );
    const { rows: updatedLead } = await client.query(
      "UPDATE leads SET stage='Won' WHERE id=$1 RETURNING *", [id]
    );
    const { rows: brandRows } = await client.query('SELECT * FROM brands WHERE id=$1', [brandId]);

    await client.query('COMMIT');
    return { brand: brandRows[0], lead: mapLead(updatedLead[0]) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  LEAD_STAGES, LEAD_SOURCES,
  mapLead, listLeads, createLead, updateLeadStage, convertLeadToBrand,
};
