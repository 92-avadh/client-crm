const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'conv_' + crypto.randomBytes(6).toString('hex');
const msgId = () => 'msg_' + crypto.randomBytes(6).toString('hex');
const attId = () => 'att_' + crypto.randomBytes(6).toString('hex');

const CONVERSATION_TYPES = ['team', 'brand', 'direct'];

function mapConv(c, participantIds) {
  return {
    id: c.id, type: c.type, title: c.title, brandId: c.brand_id,
    lastMessage: c.last_message, lastMessageTime: c.last_message_time,
    unreadCount: c.unread_count, createdAt: c.created_at,
    participantIds: participantIds || []
  };
}

function mapMsg(m, readBy, attachments) {
  return {
    id: m.id, conversationId: m.conversation_id, senderId: m.sender_id,
    senderName: m.sender_name, senderRole: m.sender_role, text: m.text,
    timestamp: m.timestamp, createdAt: m.created_at,
    readBy: (readBy || []).map(r => r.user_id),
    attachments: (attachments || []).map(a => ({
      id: a.id, name: a.name, size: a.size, url: a.url, type: a.type
    }))
  };
}

async function listConversations(userId) {
  const { rows } = await pool.query(
    `SELECT c.* FROM conversations c
     INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
     WHERE cp.user_id = $1
     ORDER BY c.last_message_time DESC NULLS LAST`,
    [userId]
  );
  return Promise.all(rows.map(async (c) => {
    const parts = await pool.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id=$1',
      [c.id]
    );
    return mapConv(c, parts.rows.map(p => p.user_id));
  }));
}

async function listMessages(conversationId) {
  const { rows } = await pool.query(
    'SELECT * FROM chat_messages WHERE conversation_id=$1 ORDER BY created_at ASC',
    [conversationId]
  );
  return Promise.all(rows.map(async (m) => {
    const readBy = await pool.query('SELECT user_id FROM message_read_by WHERE message_id=$1', [m.id]);
    const att = await pool.query('SELECT * FROM message_attachments WHERE message_id=$1', [m.id]);
    return mapMsg(m, readBy.rows, att.rows);
  }));
}

async function sendMessage(conversationId, user, { text, attachments = [] }) {
  const id = msgId();
  const ts = new Date().toISOString();

  const { rows } = await pool.query(
    `INSERT INTO chat_messages (id,conversation_id,sender_id,sender_name,sender_role,text,timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, conversationId, user.id, user.name, user.role, text, ts]
  );

  await pool.query(
    'INSERT INTO message_read_by (message_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [id, user.id]
  );
  await pool.query(
    'UPDATE conversations SET last_message=$1, last_message_time=$2 WHERE id=$3',
    [text, ts, conversationId]
  );

  const savedAtts = [];
  for (const att of attachments) {
    const { rows: aRows } = await pool.query(
      'INSERT INTO message_attachments (id,message_id,name,size,url,type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [attId(), id, att.name, att.size, att.url, att.type]
    );
    savedAtts.push(aRows[0]);
  }

  return mapMsg(rows[0], [{ user_id: user.id }], savedAtts);
}

async function createConversation(user, { type, title, brandId, participantIds = [] }) {
  const id = genId();
  const { rows } = await pool.query(
    'INSERT INTO conversations (id,type,title,brand_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [id, type || 'team', title, brandId || null]
  );
  const allParticipants = [...new Set([...participantIds, user.id])];
  for (const uid of allParticipants) {
    await pool.query(
      'INSERT INTO conversation_participants (conversation_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, uid]
    );
  }
  return mapConv(rows[0], allParticipants);
}

module.exports = {
  CONVERSATION_TYPES,
  mapConv, mapMsg,
  listConversations, listMessages, sendMessage, createConversation,
};
