const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'meet_' + crypto.randomBytes(6).toString('hex');

const { formatDateOnly } = require('../utils/dateUtils');

function mapMeeting(m, attendeeIds) {
  return {
    id: m.id, title: m.title, brandId: m.brand_id, leadId: m.lead_id,
    date: formatDateOnly(m.date), time: m.time, durationMinutes: m.duration_minutes,
    linkOrLocation: m.link_or_location, notes: m.notes, reminderSent: m.reminder_sent,
    createdAt: m.created_at, attendeeIds: attendeeIds || []
  };
}

async function attachAttendees(meetingId, attendeeIds) {
  const att = await pool.query(
    'SELECT user_id FROM meeting_attendees WHERE meeting_id=$1', [meetingId]
  );
  return att.rows.map(r => r.user_id);
}

/**
 * Batch-fetch attendees for multiple meetings in a single query.
 * Returns a Map of meeting_id -> user_id array.
 */
async function getAttendeesForMeetings(meetingIds) {
  if (!meetingIds.length) return new Map();
  const { rows } = await pool.query(
    'SELECT meeting_id, user_id FROM meeting_attendees WHERE meeting_id = ANY($1)',
    [meetingIds]
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.meeting_id)) map.set(row.meeting_id, []);
    map.get(row.meeting_id).push(row.user_id);
  }
  return map;
}

async function getMeeting(id) {
  const { rows } = await pool.query('SELECT * FROM meetings WHERE id=$1', [id]);
  if (!rows.length) return null;
  return mapMeeting(rows[0], await attachAttendees(id));
}

async function listMeetings(user, { brandId, leadId, page = 1, pageSize = 50 } = {}) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (user) {
    if (user.role === 'brand') {
      whereClause += ` AND brand_id = $${idx}`;
      params.push(user.brandId || 'none');
      idx += 1;
    } else if (user.role === 'admin') {
      whereClause += ` AND (owner_id = $${idx} OR owner_id IS NULL OR brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx} OR owner_id IS NULL) OR brand_id IS NULL)`;
      params.push(user.id);
      idx += 1;
    } else {
      whereClause += ` AND (owner_id = $${idx} OR id IN (SELECT meeting_id FROM meeting_attendees WHERE user_id = $${idx}) OR brand_id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $${idx}))`;
      params.push(user.id);
      idx += 1;
    }
  }
  if (brandId) {
    whereClause += ` AND brand_id=$${idx}`;
    params.push(brandId);
    idx += 1;
  }
  if (leadId) {
    whereClause += ` AND lead_id=$${idx}`;
    params.push(leadId);
  }

  // Count total matching rows
  const countQuery = `SELECT COUNT(*) FROM meetings ${whereClause}`;
  const { rows: countRows } = await pool.query(countQuery, params);
  const total = parseInt(countRows[0].count, 10);

  // Paginated query
  const offset = (page - 1) * pageSize;
  const query = `SELECT * FROM meetings ${whereClause} ORDER BY date ASC, time ASC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(pageSize, offset);

  const { rows } = await pool.query(query, params);

  // Batch fetch attendees — single query instead of N+1
  const attendeesMap = await getAttendeesForMeetings(rows.map(m => m.id));
  const data = rows.map(m => mapMeeting(m, attendeesMap.get(m.id) || []));

  return { data, total, page, pageSize };
}

async function createMeeting(user, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    await client.query(
      `INSERT INTO meetings (id,title,brand_id,lead_id,date,time,duration_minutes,link_or_location,notes,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id, data.title, data.brandId || null, data.leadId || null,
        formatDateOnly(data.date), data.time || null, data.durationMinutes || 60,
        data.linkOrLocation || null, data.notes || null, user ? user.id : null,
      ]
    );
    for (const uid of data.attendeeIds || []) {
      await client.query(
        'INSERT INTO meeting_attendees (meeting_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, uid]
      );
    }

    await client.query('COMMIT');
    const meeting = await getMeeting(id);
    try {
      const { createNotification } = require('./notifications.service');
      await createNotification({
        type: 'meeting',
        title: 'Meeting Scheduled',
        message: `"${meeting.title}" scheduled on ${meeting.date || 'TBD'} at ${meeting.time || '10:00 AM'}.`,
        linkModule: 'meetings',
        brandId: meeting.brandId || null,
        recipientRoles: ['admin', 'manager', 'team'],
      });
    } catch (err) {
      console.warn('Failed to dispatch meeting notification:', err.message);
    }
    return meeting;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateMeeting(id, data) {
  const { rows } = await pool.query(
    `UPDATE meetings SET title=COALESCE($1,title), brand_id=COALESCE($2,brand_id), lead_id=COALESCE($3,lead_id),
     date=COALESCE($4,date), time=COALESCE($5,time), duration_minutes=COALESCE($6,duration_minutes),
     link_or_location=COALESCE($7,link_or_location), notes=COALESCE($8,notes)
     WHERE id=$9 RETURNING *`,
    [
      data.title ?? null, data.brandId ?? null, data.leadId ?? null,
      data.date !== undefined ? formatDateOnly(data.date) : null,
      data.time ?? null, data.durationMinutes ?? null,
      data.linkOrLocation ?? null, data.notes ?? null, id,
    ]
  );
  if (!rows.length) return null;

  if (data.attendeeIds !== undefined) {
    await pool.query('DELETE FROM meeting_attendees WHERE meeting_id=$1', [id]);
    for (const uid of data.attendeeIds) {
      await pool.query(
        'INSERT INTO meeting_attendees (meeting_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, uid]
      );
    }
  }
  return mapMeeting(rows[0], await attachAttendees(id));
}

async function deleteMeeting(id) {
  const { rowCount } = await pool.query('DELETE FROM meetings WHERE id=$1', [id]);
  return rowCount > 0;
}

module.exports = { mapMeeting, getMeeting, listMeetings, createMeeting, updateMeeting, deleteMeeting };
