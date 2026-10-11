const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'hol_' + crypto.randomBytes(6).toString('hex');

const HOLIDAY_TYPES = ['National', 'Regional', 'Agency Custom'];

function mapHoliday(h) {
  return { id: h.id, title: h.title, date: h.date, type: h.type };
}

async function listHolidays() {
  const { rows } = await pool.query('SELECT * FROM holidays ORDER BY date ASC');
  return rows.map(mapHoliday);
}

async function createHoliday(data) {
  const { rows } = await pool.query(
    'INSERT INTO holidays (id,title,date,type) VALUES ($1,$2,$3,$4) RETURNING *',
    [genId(), data.title, data.date, data.type || 'Agency Custom']
  );
  return mapHoliday(rows[0]);
}

async function deleteHoliday(id) {
  const { rowCount } = await pool.query('DELETE FROM holidays WHERE id=$1', [id]);
  return rowCount > 0;
}

module.exports = { HOLIDAY_TYPES, mapHoliday, listHolidays, createHoliday, deleteHoliday };
