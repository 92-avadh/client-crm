const webpush = require('web-push');
const pool = require('../db');
const crypto = require('crypto');
const { getAgencyId } = require('../utils/agency');

const genId = () => 'psub_' + crypto.randomBytes(6).toString('hex');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BHKGp-iuLXMGlvPYR7ZerTfXWy0twde1eyJdOdLFAiozXEBVhTyUnyZUYVZz4L8kBYgv1Bs7wAjOvWjlWOPFC3Q';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'X4BrVHA67a6FRdiMjE_fegeGSXrPBOSZXFGM0PVaFDQ';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@retentio.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('WebPush VAPID setup warning:', err.message);
}

function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/** Save or update a browser push subscription for a user. */
async function saveSubscription(user, subscription, userAgent = '') {
  if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    const err = new Error('Invalid push subscription structure');
    err.status = 400;
    throw err;
  }

  const agencyId = getAgencyId(user);
  const id = genId();

  await pool.query(
    `INSERT INTO push_subscriptions (id, user_id, agency_id, endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (endpoint) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       agency_id = EXCLUDED.agency_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent`,
    [id, user.id, agencyId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent || '']
  );

  return { ok: true };
}

/** Remove a browser push subscription when disabled by user. */
async function removeSubscription(endpoint) {
  if (!endpoint) return { ok: true };
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
  return { ok: true };
}

/**
 * Dispatch native push notification to a specific user across all their registered devices (mobile / desktop).
 */
async function sendPushToUser(userId, payload) {
  if (!userId) return;
  try {
    const { rows } = await pool.query(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (!rows.length) return;

    const dataString = JSON.stringify({
      title: payload.title || 'Retentio Notification',
      body: payload.body || payload.message || '',
      icon: payload.icon || '/retentio-icon.png',
      badge: payload.badge || '/retentio-icon.png',
      tag: payload.tag || `notif_${Date.now()}`,
      data: {
        url: payload.url || payload.link || '/',
        ...payload.data,
      },
    });

    const sendPromises = rows.map(async (row) => {
      const pushConfig = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, dataString);
      } catch (err) {
        // HTTP 410 (Gone) or 404 means the user revoked permission or the browser subscription expired.
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [row.id]).catch(() => {});
        } else {
          console.warn('Push delivery failed for subscription:', row.id, err.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.warn('sendPushToUser error:', err.message);
  }
}

/**
 * Dispatch native push to all users in an agency matching the given roles.
 */
async function sendPushToAgencyOrRoles(agencyId, recipientRoles = [], payload) {
  try {
    let query = 'SELECT DISTINCT user_id FROM push_subscriptions WHERE agency_id = $1';
    const params = [agencyId];

    if (recipientRoles && recipientRoles.length > 0 && !recipientRoles.includes('all')) {
      query = `SELECT DISTINCT ps.user_id FROM push_subscriptions ps
               JOIN users u ON u.id = ps.user_id
               WHERE ps.agency_id = $1 AND u.role = ANY($2)`;
      params.push(recipientRoles);
    }

    const { rows } = await pool.query(query, params);
    if (!rows.length) return;

    for (const r of rows) {
      await sendPushToUser(r.user_id, payload);
    }
  } catch (err) {
    console.warn('sendPushToAgencyOrRoles error:', err.message);
  }
}

module.exports = {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  sendPushToUser,
  sendPushToAgencyOrRoles,
};

