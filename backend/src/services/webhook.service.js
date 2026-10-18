const pool = require('../db');

/**
 * Send an event payload to configured Slack or Discord webhooks.
 * Designed defensively: never throws or blocks execution.
 */
async function sendWebhookEvent(eventType, { title, description, brandName, amount, currency, linkUrl }) {
  try {
    const { rows } = await pool.query("SELECT slack_webhook_url, discord_webhook_url FROM settings WHERE id = 'main'");
    if (!rows.length) return;

    const { slack_webhook_url: slackUrl, discord_webhook_url: discordUrl } = rows[0];

    const messageText = `*Retentio CRM Alert:* ${title}\n${description || ''}` +
      (brandName ? `\n• Client: ${brandName}` : '') +
      (amount != null ? `\n• Amount: ${currency || '₹'}${Number(amount).toLocaleString()}` : '');

    // Send to Slack if configured
    if (slackUrl && slackUrl.startsWith('http')) {
      fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[Retentio] ${title}`,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: title, emoji: true },
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: messageText },
            },
            ...(linkUrl ? [{
              type: 'actions',
              elements: [{
                type: 'button',
                text: { type: 'plain_text', text: 'View in Retentio' },
                url: linkUrl,
              }],
            }] : []),
          ],
        }),
        signal: AbortSignal.timeout(4000),
      }).catch((e) => console.warn('Slack webhook warning:', e.message));
    }

    // Send to Discord if configured
    if (discordUrl && discordUrl.startsWith('http')) {
      fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**[Retentio Alert]** ${title}`,
          embeds: [{
            title,
            description: description || 'New activity logged in Retentio CRM.',
            color: eventType.includes('churn') ? 0xEF4444 : (eventType.includes('payment') ? 0x10B981 : 0x3B82F6),
            fields: [
              ...(brandName ? [{ name: 'Client', value: brandName, inline: true }] : []),
              ...(amount != null ? [{ name: 'Value', value: `${currency || '₹'}${Number(amount).toLocaleString()}`, inline: true }] : []),
            ],
            footer: { text: 'Retentio Client Retention CRM' },
            timestamp: new Date().toISOString(),
          }],
        }),
        signal: AbortSignal.timeout(4000),
      }).catch((e) => console.warn('Discord webhook warning:', e.message));
    }
  } catch (err) {
    console.warn('sendWebhookEvent error:', err.message);
  }
}

/**
 * Send an immediate test ping to verify a webhook URL.
 */
async function testWebhookUrl(url, service = 'Webhook') {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Invalid URL. Must begin with http:// or https://' };
  }

  const isDiscord = url.includes('discord.com');
  const payload = isDiscord
    ? {
        content: `🧪 **Test Notification from Retentio Agency CRM**\nYour Discord webhook integration is connected and functioning perfectly!`,
      }
    : {
        text: `🧪 *Test Notification from Retentio Agency CRM*\nYour ${service} webhook integration is connected and functioning perfectly!`,
      };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok || res.status === 204) {
      return { success: true, message: `Successfully delivered test message to ${service}!` };
    }
    const errText = await res.text().catch(() => '');
    return { success: false, error: `Webhook returned HTTP ${res.status}: ${errText.slice(0, 100)}` };
  } catch (err) {
    return { success: false, error: `Connection failed: ${err.message}` };
  }
}

module.exports = { sendWebhookEvent, testWebhookUrl };
