const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter from environment variables.
 *
 * Required env vars (set in .env or docker-compose.yml):
 *   SMTP_HOST     e.g. smtp.gmail.com
 *   SMTP_PORT     e.g. 587
 *   SMTP_USER     e.g. yourapp@gmail.com
 *   SMTP_PASS     e.g. your-app-password
 *   SMTP_FROM     e.g. "Retentio <noreply@yourapp.com>"
 *
 * For development/testing without SMTP configured, emails are
 * logged to the console instead of actually sent.
 */

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const cleanPass = (SMTP_PASS || '').replace(/\s+/g, '');
  const isGmail = (SMTP_HOST || '').toLowerCase().includes('gmail') || (!SMTP_HOST && (SMTP_USER || '').includes('@gmail.com'));

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: cleanPass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }

  const port = parseInt(SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: cleanPass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== 'true' }
  });
}

/** Escape a value before interpolating it into email HTML. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Send email via Resend HTTP API (Port 443 - HTTPS).
 * Never blocked by cloud providers like Render Free Tier.
 */
async function sendViaResend({ toEmail, subject, html, agencyName }) {
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || `${agencyName} <onboarding@resend.dev>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend API error (${res.status}): ${data.message || JSON.stringify(data)}`);
  }
  return { messageId: data.id, provider: 'resend' };
}

/**
 * Send email via Brevo HTTP API (Port 443 - HTTPS).
 */
async function sendViaBrevo({ toEmail, subject, html }) {
  const senderEmail = process.env.SMTP_USER || process.env.BREVO_FROM || 'noreply@client-crm.com';
  const brandName = process.env.BRAND_NAME || process.env.APP_NAME || 'Retentio';
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: brandName, email: senderEmail },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html
    })
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.message?.includes('unrecognised IP') || data.code === 'unauthorized') {
      console.error(`\n⚠️  BREVO IP RESTRICTION: Brevo requires you to deactivate IP blocking so Render/cloud servers can send emails.`);
      console.error(`👉  Go to: https://app.brevo.com/security/authorised_ips and click 'Deactivate' under 'Blocking unauthorized IP addresses'.\n`);
    }
    throw new Error(`Brevo API error (${res.status}): ${data.message || JSON.stringify(data)}`);
  }
  return { messageId: data.messageId, provider: 'brevo' };
}

/**
 * Send OTP email.
 * 1. Prints OTP to server logs immediately (instant backup for testing).
 * 2. If RESEND_API_KEY is present, delivers via Resend HTTPS (bypasses Render SMTP block).
 * 3. If BREVO_API_KEY is present, delivers via Brevo HTTPS.
 * 4. Otherwise falls back to SMTP (Nodemailer), which works locally or on paid Render tiers.
 */
async function sendOtpEmail(toEmail, otp, agencyName = '') {
  const brandName = process.env.BRAND_NAME || process.env.APP_NAME || 'Retentio';
  const safeBrand = escapeHtml(brandName);
  const safeAgency = escapeHtml(agencyName);
  const safeOtp = escapeHtml(otp);
  const from = process.env.SMTP_FROM || `"${brandName}" <${process.env.SMTP_USER || 'noreply@client-crm.com'}>`;
  const subject = `Your ${brandName} verification code: ${otp}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #0a0a0a; border-radius: 12px; margin-bottom: 16px;">
          <span style="color: #fff; font-weight: 800; font-size: 22px;">R</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0a0a0a; margin: 0; letter-spacing: -0.5px;">${safeBrand}</h1>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #0a0a0a; margin: 0 0 8px;">Verify your email address</h2>
      <p style="font-size: 14px; color: #555; margin: 0 0 28px; line-height: 1.6;">
        Use the code below to complete your registration${safeAgency && safeAgency !== brandName ? ` for <strong>${safeAgency}</strong>` : ''}. This code expires in <strong>5 minutes</strong>.
      </p>

      <div style="background: #f5f5f5; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px;">
        <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #0a0a0a; font-family: monospace;">${safeOtp}</div>
        <p style="font-size: 12px; color: #909090; margin: 10px 0 0;">Expires in 5 minutes</p>
      </div>

      <p style="font-size: 12px; color: #aaa; line-height: 1.6; margin: 0;">
        If you didn't request this, you can safely ignore this email. Someone may have entered your email by mistake.
      </p>

      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;" />
      <p style="font-size: 11px; color: #ccc; text-align: center; margin: 0;">${safeBrand} · Secure account verification</p>
    </div>
  `;

  // Log dispatch attempt without leaking the secret OTP code in production
  console.log(`📤 Dispatching verification code to ${toEmail}...`);
  if (process.env.DEV_LOG_OTP === 'true') {
    console.log(`🔑 [DEV ONLY] OTP for ${toEmail}: [ ${otp} ]`);
  }

  // Priority 1: Resend HTTP API (HTTPS port 443, never blocked by Render)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend({ toEmail, subject, html, agencyName });
      console.log(`📧 OTP email delivered via Resend HTTP to ${toEmail} (id: ${res.messageId})`);
      return res;
    } catch (err) {
      console.error(`⚠️ Resend HTTP delivery error: ${err.message}`);
    }
  }

  // Priority 2: Brevo HTTP API (HTTPS port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await sendViaBrevo({ toEmail, subject, html, agencyName });
      console.log(`📧 OTP email delivered via Brevo HTTP to ${toEmail} (id: ${res.messageId})`);
      return res;
    } catch (err) {
      console.error(`⚠️ Brevo HTTP delivery error: ${err.message}`);
    }
  }

  // Priority 3: Nodemailer SMTP
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`ℹ️  No external email service configured. OTP logged to console above.`);
    return { messageId: 'dev-console' };
  }

  try {
    const info = await transporter.sendMail({ from, to: toEmail, subject, html });
    console.log(`📧 OTP email successfully delivered via SMTP to ${toEmail} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    const isTimeout = err.code === 'ETIMEDOUT' || err.message?.includes('timeout');
    if (isTimeout) {
      console.error(`⚠️ SMTP dispatch error to ${toEmail}: Connection timeout.`);
      console.error(`ℹ️ Notice: Render Free Tier blocks outbound SMTP ports 25, 465, & 587. To send emails on Render, add RESEND_API_KEY in Render Environment Variables or use the console OTP printed above.`);
    } else {
      console.error(`⚠️ SMTP dispatch error to ${toEmail}: ${err.message}`);
    }
    return { messageId: 'fallback-logged', error: err.message };
  }
}

module.exports = { sendOtpEmail };
