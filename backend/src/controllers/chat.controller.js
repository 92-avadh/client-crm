const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const chat = require('../services/chat.service');

const listConversations = asyncHandler(async (req, res) => {
  res.json(await chat.listConversations(req.user.id, {
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(200, parseInt(req.query.pageSize, 10) || 50)),
  }));
});

const listMessages = asyncHandler(async (req, res) => {
  res.json(await chat.listMessages(req.params.id, {
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(200, parseInt(req.query.pageSize, 10) || 100)),
  }));
});

const sendMessage = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .optionalString('text', { max: 10000, label: 'Message' })
    .array('attachments', { max: 10, label: 'Attachments' })
    .check(
      (req.body?.text && String(req.body.text).trim()) ||
      (Array.isArray(req.body?.attachments) && req.body.attachments.length > 0),
      'A message needs text or at least one attachment.'
    )
    .validate();

  res.status(201).json(
    await chat.sendMessage(req.params.id, req.user, {
      text: body.text || '',
      attachments: body.attachments || [],
    })
  );
});

const createConversation = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .oneOf('type', chat.CONVERSATION_TYPES, { label: 'Conversation type' })
    .optionalString('title', { max: 200, label: 'Title' })
    .optionalString('brandId', { max: 80, label: 'Client' })
    .array('participantIds', { ofStrings: true, max: 100, label: 'Participants' })
    .validate();

  res.status(201).json(await chat.createConversation(req.user, body));
});

const directConversation = asyncHandler(async (req, res) => {
  const targetUserId = req.params.targetUserId || req.body.targetUserId;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Target team member ID is required for direct chat.' });
  }

  const conv = await chat.getOrCreateDirectConversation(req.user, targetUserId);
  res.json(conv);
});

const markRead = asyncHandler(async (req, res) => {
  const result = await chat.markMessagesRead(req.params.id, req.user.id);
  res.json(result);
});

module.exports = {
  listConversations,
  listMessages,
  sendMessage,
  createConversation,
  directConversation,
  markRead,
};
