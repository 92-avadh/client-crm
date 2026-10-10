const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const genId = () => 'conv_' + crypto.randomBytes(6).toString('hex');
const msgId = () => 'msg_' + crypto.randomBytes(6).toString('hex');

function mapConv(c, participantIds) {
  return {
    id: c.id, type: c.type, title: c.title, brandId: c.brand_id,
    lastMessage: c.last_message, lastMessageTime: c.last_message_time,
    unreadCount: c.unread_count, createdAt: c.created_at,
    participantIds: participantIds||[]
  };
}

function mapMsg(m, readBy, attachments) {
  return {
    id: m.id, conversationId: m.conversation_id, senderId: m.sender_id,
    senderName: m.sender_name, senderRole: m.sender_role, text: m.text,
    timestamp: m.timestamp, createdAt: m.created_at,
    readBy: (readBy||[]).map(r => r.user_id),
    attachments: (attachments||[]).map(a => ({
      id: a.id, name: a.name, size: a.size, url: a.url, type: a.type
    }))
  };
}

// GET /api/chat/conversations
router.get('/conversations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.* FROM conversations c
       INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1
       ORDER BY c.last_message_time DESC NULLS LAST`,
      [req.user.id]
    );
    const convs = await Promise.all(rows.map(async c => {
      const parts = await pool.query('SELECT user_id FROM conversation_participants WHERE conversation_id=$1', [c.id]);
      return mapConv(c, parts.rows.map(p => p.user_id));
    }));
    res.json(convs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM chat_messages WHERE conversation_id=$1 ORDER BY created_at ASC', [req.params.id]);
    const messages = await Promise.all(rows.map(async m => {
      const readBy = await pool.query('SELECT user_id FROM message_read_by WHERE message_id=$1', [m.id]);
      const att = await pool.query('SELECT * FROM message_attachments WHERE message_id=$1', [m.id]);
      return mapMsg(m, readBy.rows, att.rows);
    }));
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const id = msgId();
    const ts = new Date().toISOString();
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (id,conversation_id,sender_id,sender_name,sender_role,text,timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, req.params.id, req.user.id, req.user.name, req.user.role, text, ts]
    );
    // Mark as read by sender
    await pool.query('INSERT INTO message_read_by (message_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, req.user.id]);
    // Update conversation last message
    await pool.query(
      'UPDATE conversations SET last_message=$1, last_message_time=$2 WHERE id=$3',
      [text, ts, req.params.id]
    );
    // Handle attachments
    const savedAtts = [];
    if (attachments && attachments.length) {
      for (const att of attachments) {
        const aid = 'att_' + crypto.randomBytes(6).toString('hex');
        const { rows: aRows } = await pool.query(
          'INSERT INTO message_attachments (id,message_id,name,size,url,type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
          [aid, id, att.name, att.size, att.url, att.type]
        );
        savedAtts.push(aRows[0]);
      }
    }
    res.status(201).json(mapMsg(rows[0], [{ user_id: req.user.id }], savedAtts));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/chat/conversations
router.post('/conversations', async (req, res) => {
  try {
    const { type, title, brandId, participantIds } = req.body;
    const id = genId();
    const { rows } = await pool.query(
      'INSERT INTO conversations (id,type,title,brand_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, type||'team', title, brandId||null]
    );
    const allParticipants = [...new Set([...(participantIds||[]), req.user.id])];
    for (const uid of allParticipants) {
      await pool.query('INSERT INTO conversation_participants (conversation_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, uid]);
    }
    res.status(201).json(mapConv(rows[0], allParticipants));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
