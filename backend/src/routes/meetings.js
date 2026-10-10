const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'meet_' + crypto.randomBytes(6).toString('hex');

function mapMeeting(m, attendeeIds) {
  return {
    id: m.id, title: m.title, brandId: m.brand_id, leadId: m.lead_id,
    date: m.date, time: m.time, durationMinutes: m.duration_minutes,
    linkOrLocation: m.link_or_location, notes: m.notes, reminderSent: m.reminder_sent,
    createdAt: m.created_at, attendeeIds: attendeeIds||[]
  };
}

// GET /api/meetings
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params = [];
    let idx = 1;

    // Scope by role & tenant
    if (req.user) {
      if (req.user.role === 'brand') {
        const bId = req.user.brandId;
        query += ` AND brand_id = $${idx}`;
        params.push(bId || 'none');
        idx++;
      } else if (req.user.id !== 'usr_admin') {
        query += ` AND (owner_id = $${idx} OR brand_id IN (SELECT id FROM brands WHERE owner_id = $${idx}))`;
        params.push(req.user.id);
        idx++;
      }
    }

    if (req.query.brandId) { query += ` AND brand_id=$${idx}`; params.push(req.query.brandId); idx++; }
    if (req.query.leadId) { query += ` AND lead_id=$${idx}`; params.push(req.query.leadId); idx++; }
    query += ' ORDER BY date ASC, time ASC';
    const { rows } = await pool.query(query, params);
    const meetings = await Promise.all(rows.map(async m => {
      const att = await pool.query('SELECT user_id FROM meeting_attendees WHERE meeting_id=$1', [m.id]);
      return mapMeeting(m, att.rows.map(r => r.user_id));
    }));
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/meetings
router.post('/', async (req, res) => {
  try {
    const { title, brandId, leadId, date, time, durationMinutes, linkOrLocation, notes, attendeeIds } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = genId();
    const ownerId = req.user ? req.user.id : null;
    await pool.query(
      `INSERT INTO meetings (id,title,brand_id,lead_id,date,time,duration_minutes,link_or_location,notes,owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, title, brandId||null, leadId||null, date||null, time, durationMinutes||60, linkOrLocation, notes, ownerId]
    );
    if (attendeeIds && attendeeIds.length) {
      for (const uid of attendeeIds) {
        await pool.query('INSERT INTO meeting_attendees (meeting_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, uid]);
      }
    }
    const { rows } = await pool.query('SELECT * FROM meetings WHERE id=$1', [id]);
    const att = await pool.query('SELECT user_id FROM meeting_attendees WHERE meeting_id=$1', [id]);
    res.status(201).json(mapMeeting(rows[0], att.rows.map(r => r.user_id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/meetings/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, brandId, leadId, date, time, durationMinutes, linkOrLocation, notes, attendeeIds } = req.body;
    const { rows } = await pool.query(
      `UPDATE meetings SET title=COALESCE($1,title), brand_id=COALESCE($2,brand_id), lead_id=COALESCE($3,lead_id),
       date=COALESCE($4,date), time=COALESCE($5,time), duration_minutes=COALESCE($6,duration_minutes),
       link_or_location=COALESCE($7,link_or_location), notes=COALESCE($8,notes)
       WHERE id=$9 RETURNING *`,
      [title, brandId, leadId, date, time, durationMinutes, linkOrLocation, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Meeting not found' });
    if (attendeeIds !== undefined) {
      await pool.query('DELETE FROM meeting_attendees WHERE meeting_id=$1', [req.params.id]);
      for (const uid of attendeeIds) {
        await pool.query('INSERT INTO meeting_attendees (meeting_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, uid]);
      }
    }
    const att = await pool.query('SELECT user_id FROM meeting_attendees WHERE meeting_id=$1', [req.params.id]);
    res.json(mapMeeting(rows[0], att.rows.map(r => r.user_id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM meetings WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
