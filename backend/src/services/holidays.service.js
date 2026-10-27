const pool = require('../db');
const crypto = require('crypto');
const { getAgencyId } = require('../utils/agency');

const genId = () => 'hol_' + crypto.randomBytes(6).toString('hex');

const HOLIDAY_TYPES = ['National', 'Regional', 'Agency Custom'];

function mapHoliday(h) {
  return { id: h.id, title: h.title, date: h.date, type: h.type };
}

async function listHolidays(user, { page = 1, pageSize = 50 } = {}) {
  const agencyId = user ? getAgencyId(user) : 'usr_admin';
  const whereSql = "WHERE type = 'National' OR agency_id = $1 OR (agency_id IS NULL AND $1 = 'usr_admin')";
  // Count total
  const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM holidays ${whereSql}`, [agencyId]);
  const total = parseInt(countRows[0].count, 10);

  // Paginated query
  const offset = (page - 1) * pageSize;
  const { rows } = await pool.query(
    `SELECT * FROM holidays ${whereSql} ORDER BY date ASC LIMIT $2 OFFSET $3`,
    [agencyId, pageSize, offset]
  );
  const data = rows.map(mapHoliday);

  return { data, total, page, pageSize };
}

async function createHoliday(user, data) {
  const agencyId = user ? getAgencyId(user) : 'usr_admin';
  const { rows } = await pool.query(
    'INSERT INTO holidays (id,title,date,type,agency_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [genId(), data.title, data.date, data.type || 'Agency Custom', agencyId]
  );
  return mapHoliday(rows[0]);
}

async function deleteHoliday(id) {
  const { rowCount } = await pool.query('DELETE FROM holidays WHERE id=$1', [id]);
  return rowCount > 0;
}

module.exports = { HOLIDAY_TYPES, mapHoliday, listHolidays, createHoliday, deleteHoliday };
