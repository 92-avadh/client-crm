const pool = require('../db');
const crypto = require('crypto');

const genId = () => 'conv_' + crypto.randomBytes(6).toString('hex');
const msgId = () => 'msg_' + crypto.randomBytes(6).toString('hex');
const attId = () => 'att_' + crypto.randomBytes(6).toString('hex');

const CONVERSATION_TYPES = ['team', 'brand', 'direct'];

function mapConv(c, participantIds = [], otherMember = null) {
  let displayTitle = c.title;
  if (c.type === 'direct' && otherMember) {
    displayTitle = otherMember.name;
  }

  return {
    id: c.id,
    type: c.type,
    title: displayTitle,
    brandId: c.brand_id,
    lastMessage: c.last_message,
    lastMessageTime: c.last_message_time,
    unreadCount: parseInt(c.unread_count || 0, 10),
    createdAt: c.created_at,
    participantIds: participantIds || [],
    otherMember: otherMember ? {
      id: otherMember.id,
      name: otherMember.name,
      avatar: otherMember.avatar,
      role: otherMember.role,
      designation: otherMember.designation,
    } : null,
  };
}

function mapMsg(m, readBy = [], attachments = []) {
  const readUserIds = (readBy || []).map(r => (typeof r === 'object' && r ? r.user_id : r)).filter(Boolean);
  // In WhatsApp terms: single tick (sent/saved) vs double tick (read by recipient)
  const isReadByOthers = readUserIds.some(uid => uid !== m.sender_id);

  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role,
    text: m.text,
    timestamp: m.timestamp,
    createdAt: m.created_at,
    readBy: readUserIds,
    isRead: isReadByOthers,
    attachments: (attachments || []).map(a => ({
      id: a.id,
      name: a.name,
      size: a.size,
      url: a.url,
      type: a.type,
    })),
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
  // Count total conversations
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
    `SELECT c.*,
       (
         SELECT COUNT(*)
         FROM chat_messages m
         WHERE m.conversation_id = c.id
           AND m.sender_id != $1
           AND NOT EXISTS (
             SELECT 1 FROM message_read_by rb
             WHERE rb.message_id = m.id AND rb.user_id = $1
           )
       ) AS live_unread_count
     FROM conversations c
     INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
     WHERE cp.user_id = $1
     ORDER BY c.last_message_time DESC NULLS LAST, c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  // Batch fetch participants
  const convIds = rows.map(c => c.id);
  const participantsMap = await getParticipantsForConversations(convIds);

  // Collect other user IDs for direct conversations
  const otherUserIdsToFetch = new Set();
  for (const conv of rows) {
    if (conv.type === 'direct') {
      const pList = participantsMap.get(conv.id) || [];
      const otherId = pList.find(id => id !== userId);
      if (otherId) otherUserIdsToFetch.add(otherId);
    }
  }

  const usersMap = new Map();
  if (otherUserIdsToFetch.size > 0) {
    const { rows: uRows } = await pool.query(
      'SELECT id, name, avatar, role, designation, email FROM users WHERE id = ANY($1)',
      [[...otherUserIdsToFetch]]
    );
    for (const u of uRows) {
      usersMap.set(u.id, u);
    }
  }

  const data = rows.map(c => {
    const pList = participantsMap.get(c.id) || [];
    let otherMember = null;
    if (c.type === 'direct') {
      const otherId = pList.find(id => id !== userId);
      if (otherId) otherMember = usersMap.get(otherId) || null;
    }
    const convMapped = mapConv(c, pList, otherMember);
    convMapped.unreadCount = parseInt(c.live_unread_count || 0, 10);
    return convMapped;
  });

  return { data, total, page, pageSize };
}

async function listMessages(conversationId, { page = 1, pageSize = 100 } = {}) {
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

  // Batch fetch read receipts and attachments
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

    // Sender automatically marks their own message as read
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

    const mapped = mapMsg(rows[0], [{ user_id: user.id }], savedAtts);

    // Broadcast in real time via Socket.io
    try {
      const participantsMap = await getParticipantsForConversations([conversationId]);
      const participantIds = participantsMap.get(conversationId) || [];
      const socket = require('../socket');
      socket.broadcastNewMessage(conversationId, mapped, participantIds);
    } catch (e) {
      console.warn('Socket broadcast warning:', e.message);
    }

    return mapped;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function markMessagesRead(conversationId, userId) {
  // Find messages in this conversation not yet read by userId
  const { rows } = await pool.query(
    `SELECT m.id FROM chat_messages m
     WHERE m.conversation_id = $1
       AND m.sender_id != $2
       AND NOT EXISTS (
         SELECT 1 FROM message_read_by rb
         WHERE rb.message_id = m.id AND rb.user_id = $2
       )`,
    [conversationId, userId]
  );

  if (rows.length === 0) {
    return { updatedCount: 0, messageIds: [] };
  }

  const messageIds = rows.map(r => r.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const mid of messageIds) {
      await client.query(
        'INSERT INTO message_read_by (message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [mid, userId]
      );
    }
    await client.query('COMMIT');

    // Broadcast read receipt via Socket.io so sender sees double tick ✓✓ instantly
    try {
      const socket = require('../socket');
      socket.broadcastMessagesRead(conversationId, userId, messageIds);
    } catch (e) {
      console.warn('Socket read broadcast warning:', e.message);
    }

    return { updatedCount: messageIds.length, messageIds };
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
    const createdConv = mapConv(rows[0], allParticipants);

    // Broadcast new conversation to participant rooms
    try {
      const socket = require('../socket');
      socket.broadcastConversationCreated(createdConv, allParticipants);
    } catch (e) {
      console.warn('Socket conv broadcast warning:', e.message);
    }

    return createdConv;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrCreateDirectConversation(user, targetUserId) {
  if (user.id === targetUserId) {
    const err = new Error('Cannot start a direct conversation with yourself.');
    err.status = 400;
    throw err;
  }

  // Check if a direct conversation between user.id and targetUserId already exists
  const { rows } = await pool.query(
    `SELECT c.* FROM conversations c
     JOIN conversation_participants p1 ON c.id = p1.conversation_id AND p1.user_id = $1
     JOIN conversation_participants p2 ON c.id = p2.conversation_id AND p2.user_id = $2
     WHERE c.type = 'direct'
     LIMIT 1`,
    [user.id, targetUserId]
  );

  const { rows: targetUserRows } = await pool.query(
    'SELECT id, name, avatar, role, designation FROM users WHERE id = $1',
    [targetUserId]
  );
  const targetUser = targetUserRows[0];

  if (rows.length > 0) {
    const participantsMap = await getParticipantsForConversations([rows[0].id]);
    return mapConv(rows[0], participantsMap.get(rows[0].id) || [user.id, targetUserId], targetUser);
  }

  const title = targetUser?.name || 'Direct Chat';
  const newConv = await createConversation(user, {
    type: 'direct',
    title,
    participantIds: [user.id, targetUserId],
  });

  newConv.otherMember = targetUser ? {
    id: targetUser.id,
    name: targetUser.name,
    avatar: targetUser.avatar,
    role: targetUser.role,
    designation: targetUser.designation,
  } : null;

  return newConv;
}

module.exports = {
  CONVERSATION_TYPES,
  mapConv,
  mapMsg,
  listConversations,
  listMessages,
  sendMessage,
  markMessagesRead,
  createConversation,
  getOrCreateDirectConversation,
};
