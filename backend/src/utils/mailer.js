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

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured — return a console logger transporter
    return null;
  }

  const port = parseInt(SMTP_PORT || '587');

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: (SMTP_PASS || '').replace(/\s+/g, '')
    },
    // TLS certificates are validated by default. Only set
    // SMTP_ALLOW_SELF_SIGNED=true if your mail server genuinely uses a
    // self-signed certificate — doing so disables MITM protection.
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
 * Send OTP email.
 * If SMTP is not configured, prints OTP to console (dev mode).
 */
async function sendOtpEmail(toEmail, otp, agencyName = 'Client-crm') {
  // Never interpolate raw user input into HTML.
  const safeAgency = escapeHtml(agencyName);
  const safeOtp = escapeHtml(otp);
  const from = process.env.SMTP_FROM || `"${agencyName}" <${process.env.SMTP_USER || 'noreply@client-crm.com'}>`;
  const subject = `Your ${agencyName} verification code: ${otp}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #0a0a0a; border-radius: 12px; margin-bottom: 16px;">
          <span style="color: #fff; font-weight: 800; font-size: 22px;">R</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0a0a0a; margin: 0; letter-spacing: -0.5px;">${safeAgency}</h1>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #0a0a0a; margin: 0 0 8px;">Verify your email address</h2>
      <p style="font-size: 14px; color: #555; margin: 0 0 28px; line-height: 1.6;">
        Use the code below to complete your registration. This code expires in <strong>5 minutes</strong>.
      </p>

      <div style="background: #f5f5f5; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px;">
        <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #0a0a0a; font-family: monospace;">${safeOtp}</div>
        <p style="font-size: 12px; color: #909090; margin: 10px 0 0;">Expires in 5 minutes</p>
      </div>

      <p style="font-size: 12px; color: #aaa; line-height: 1.6; margin: 0;">
        If you didn't request this, you can safely ignore this email. Someone may have entered your email by mistake.
      </p>

      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0;" />
      <p style="font-size: 11px; color: #ccc; text-align: center; margin: 0;">${safeAgency} · Secure account verification</p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    // Dev mode: just log it
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧  OTP EMAIL (dev mode — SMTP not configured)`);
    console.log(`    To:      ${toEmail}`);
    console.log(`    Subject: ${subject}`);
    console.log(`    OTP:     ${otp}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { messageId: 'dev-console' };
  }

  const info = await transporter.sendMail({ from, to: toEmail, subject, html });
  console.log(`📧 OTP email sent to ${toEmail} — messageId: ${info.messageId}`);
  return info;
}

module.exports = { sendOtpEmail };
