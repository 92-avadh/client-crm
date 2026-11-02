const asyncHandler = require('../utils/asyncHandler');
const notifications = require('../services/notifications.service');
const push = require('../services/push.service');

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
  const updated = await notifications.markRead(req.user, req.params.id);
  if (!updated) return res.status(404).json({ error: 'We could not find that notification.' });
  res.json(updated);
});

const create = asyncHandler(async (req, res) => {
  const created = await notifications.createNotification(req.body);
  res.status(201).json(created);
});

const getVapidKey = asyncHandler(async (req, res) => {
  res.json({ publicKey: push.getVapidPublicKey() });
});

const pushSubscribe = asyncHandler(async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const result = await push.saveSubscription(req.user, req.body.subscription, userAgent);
  res.json(result);
});

const pushUnsubscribe = asyncHandler(async (req, res) => {
  const result = await push.removeSubscription(req.body.endpoint);
  res.json(result);
});

const testPush = asyncHandler(async (req, res) => {
  await push.sendPushToUser(req.user.id, {
    title: '🔔 Retentio Notification Test',
    body: 'Device notifications are active! You will now receive alerts directly on your mobile & desktop.',
    url: '/inbox',
  });
  res.json({ ok: true });
});

module.exports = {
  list,
  markAllRead,
  markRead,
  create,
  getVapidKey,
  pushSubscribe,
  pushUnsubscribe,
  testPush,
};
