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

/**
 * Batch-fetch participants for multiple conversations in a single query.
 * Returns a Map of conversation_id -> user_id array.
 */
async function getParticipantsForConversations(conversationIds) {
  if (!conversationIds.length) return new Map();
  const { rows } = await pool.query(
    'SELECT conversation_id, user_id FROM conversation_participants WHERE conversation_id = ANY($1)',
    [conversationIds]
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.conversation_id)) map.set(row.conversation_id, []);
    map.get(row.conversation_id).push(row.user_id);
  }
  return map;
}

/**
 * Batch-fetch read receipts for multiple messages in a single query.
 * Returns a Map of message_id -> user_id array.
 */
async function getReadByForMessages(messageIds) {
  if (!messageIds.length) return new Map();
  const { rows } = await pool.query(
    'SELECT message_id, user_id FROM message_read_by WHERE message_id = ANY($1)',
    [messageIds]
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.message_id)) map.set(row.message_id, []);
    map.get(row.message_id).push(row.user_id);
  }
  return map;
}

/**
 * Batch-fetch attachments for multiple messages in a single query.
 * Returns a Map of message_id -> attachment array.
 */
async function getAttachmentsForMessages(messageIds) {
  if (!messageIds.length) return new Map();
  const { rows } = await pool.query(
    'SELECT * FROM message_attachments WHERE message_id = ANY($1)',
    [messageIds]
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.message_id)) map.set(row.message_id, []);
    map.get(row.message_id).push(row);
  }
  return map;
}

async function listConversations(userId, { page = 1, pageSize = 50 } = {}) {
  // Count total
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM conversations c
     INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
     WHERE cp.user_id = $1`,
    [userId]
  );
  const total = parseInt(countRows[0].count, 10);

  // Paginated query
  const offset = (page - 1) * pageSize;
  const { rows } = await pool.query(
    `SELECT c.* FROM conversations c
     INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
     WHERE cp.user_id = $1
     ORDER BY c.last_message_time DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  // Batch fetch participants — single query instead of N+1
  const participantsMap = await getParticipantsForConversations(rows.map(c => c.id));
  const data = rows.map(c => mapConv(c, participantsMap.get(c.id) || []));

  return { data, total, page, pageSize };
}

async function listMessages(conversationId, { page = 1, pageSize = 50 } = {}) {
  // Count total
  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM chat_messages WHERE conversation_id=$1',
    [conversationId]
  );
  const total = parseInt(countRows[0].count, 10);

  // Paginated query
  const offset = (page - 1) * pageSize;
  const { rows } = await pool.query(
    'SELECT * FROM chat_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
    [conversationId, pageSize, offset]
  );

  // Batch fetch read receipts and attachments — single queries instead of N+1
  const readByMap = await getReadByForMessages(rows.map(m => m.id));
  const attachmentsMap = await getAttachmentsForMessages(rows.map(m => m.id));
  const data = rows.map(m => mapMsg(m, readByMap.get(m.id) || [], attachmentsMap.get(m.id) || []));

  return { data, total, page, pageSize };
}

async function sendMessage(conversationId, user, { text, attachments = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = msgId();
    const ts = new Date().toISOString();

    const { rows } = await client.query(
      `INSERT INTO chat_messages (id,conversation_id,sender_id,sender_name,sender_role,text,timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, conversationId, user.id, user.name, user.role, text, ts]
    );

    await client.query(
      'INSERT INTO message_read_by (message_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, user.id]
    );
    await client.query(
      'UPDATE conversations SET last_message=$1, last_message_time=$2 WHERE id=$3',
      [text, ts, conversationId]
    );

    const savedAtts = [];
    for (const att of attachments) {
      const { rows: aRows } = await client.query(
        'INSERT INTO message_attachments (id,message_id,name,size,url,type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [attId(), id, att.name, att.size, att.url, att.type]
      );
      savedAtts.push(aRows[0]);
    }

    await client.query('COMMIT');
    return mapMsg(rows[0], [{ user_id: user.id }], savedAtts);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function createConversation(user, { type, title, brandId, participantIds = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = genId();
    const { rows } = await client.query(
      'INSERT INTO conversations (id,type,title,brand_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, type || 'team', title, brandId || null]
    );
    const allParticipants = [...new Set([...participantIds, user.id])];
    for (const uid of allParticipants) {
      await client.query(
        'INSERT INTO conversation_participants (conversation_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, uid]
      );
    }

    await client.query('COMMIT');
    return mapConv(rows[0], allParticipants);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  CONVERSATION_TYPES,
  mapConv, mapMsg,
  listConversations, listMessages, sendMessage, createConversation,
};
