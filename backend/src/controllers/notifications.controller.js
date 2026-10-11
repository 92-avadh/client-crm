const asyncHandler = require('../utils/asyncHandler');
const notifications = require('../services/notifications.service');

const list = asyncHandler(async (req, res) => {
  res.json(await notifications.listNotifications(req.user, {
    unreadOnly: req.query.unreadOnly,
  }));
});

const markAllRead = asyncHandler(async (req, res) => {
  const count = await notifications.markAllRead(req.user);
  res.json({ success: true, count });
});

const markRead = asyncHandler(async (req, res) => {
  const updated = await notifications.markRead(req.params.id);
  if (!updated) return res.status(404).json({ error: 'We could not find that notification.' });
  res.json(updated);
});

module.exports = { list, markAllRead, markRead };
