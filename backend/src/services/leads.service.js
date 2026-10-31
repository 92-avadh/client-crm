const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'lead_' + crypto.randomBytes(6).toString('hex');
const newBrandId = () => 'brand_' + crypto.randomBytes(6).toString('hex');

const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const LEAD_SOURCES = ['Referral', 'Website', 'Social Media', 'Cold Call', 'Event', 'Other'];

const { formatDateOnly } = require('../utils/dateUtils');
const { getAgencyId } = require('../utils/agency');

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

  if (user) {
    const agencyId = getAgencyId(user);
    if (user.role === 'brand') {
      query += ` AND owner_id = $${idx}`;
      params.push(user.brandId || user.id);
      idx += 1;
    } else {
      query += ` AND (agency_id = $${idx} OR (agency_id IS NULL AND owner_id = $${idx}))`;
      params.push(agencyId);
      idx += 1;

      if (user.role !== 'admin' && user.role !== 'hr') {
        const perms = Array.isArray(user.permissions) ? user.permissions : [];
        if (!perms.includes('leads')) {
          query += ` AND owner_id = $${idx}`;
          params.push(user.id);
          idx += 1;
        }
      }
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
  const agencyId = getAgencyId(user);

  if (data.email) {
    const dupLead = await pool.query(
      "SELECT id, name FROM leads WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND (agency_id = $2 OR owner_id = $2) AND stage NOT IN ('Won', 'Lost')",
      [data.email, agencyId]
    ).catch(() => ({ rows: [] }));
    if (dupLead.rows.length) {
      const err = new Error(`A lead with the email "${data.email}" is already in your active pipeline (${dupLead.rows[0].name}).`);
      err.status = 409;
      throw err;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO leads (id,name,company,contact,email,phone,source,stage,value,follow_up_date,notes,owner_id,agency_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      genId(), data.name, data.company || null, data.contact || null,
      data.email || null, data.phone || null, data.source || null,
      data.stage || 'New', data.value || 0, formatDateOnly(data.followUpDate),
      data.notes || null, user ? user.id : null,
      agencyId,
    ]
  );
  const lead = mapLead(rows[0]);
  try {
    const { createNotification } = require('./notifications.service');
    await createNotification({
      type: 'lead',
      title: 'New Lead Captured',
      message: `Lead "${lead.name}" (${lead.company || 'Direct'}) added to pipeline.`,
      linkModule: 'leads',
      recipientRoles: ['admin', 'manager'],
      agencyId,
    });
  } catch (err) {
    console.warn('Failed to dispatch lead notification:', err.message);
  }
  return lead;
}

async function updateLeadStage(user, id, stage) {
  const agencyId = user ? getAgencyId(user) : null;
  let query = 'UPDATE leads SET stage=$1 WHERE id=$2';
  const params = [stage, id];
  if (agencyId) {
    query += ' AND (agency_id=$3 OR (agency_id IS NULL AND (owner_id=$3 OR $3=\'usr_admin\')))';
    params.push(agencyId);
  }
  query += ' RETURNING *';
  const { rows } = await pool.query(query, params);
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
    const agencyId = getAgencyId(user);
    if (agencyId && lead.agency_id && String(lead.agency_id) !== String(agencyId)) {
      await client.query('ROLLBACK');
      const err = new Error('Access denied. Lead belongs to another workspace.');
      err.status = 403;
      throw err;
    }

    const brandId = newBrandId();

    await client.query(
      `INSERT INTO brands (id,name,owner_name,email,phone,status,monthly_fee,owner_id,agency_id)
       VALUES ($1,$2,$3,$4,$5,'Active',0,$6,$7)`,
      [brandId, lead.company || lead.name, lead.contact || lead.name,
       lead.email, lead.phone, user ? user.id : null, agencyId]
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
