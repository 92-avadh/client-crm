const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/mailer');

const genId = () => 'usr_' + crypto.randomBytes(8).toString('hex');
const genOtp = () => String(crypto.randomInt(100000, 1000000));

const JWT_SECRET = process.env.JWT_SECRET;

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_S = 60;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, brandId: user.brand_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/** Seconds remaining before another OTP may be requested. */
async function otpCooldownRemaining(email) {
  const prev = await pool.query(
    `SELECT created_at FROM otp_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email.toLowerCase()]
  );
  if (!prev.rows.length) return 0;
  const secs = (Date.now() - new Date(prev.rows[0].created_at).getTime()) / 1000;
  return secs < OTP_COOLDOWN_S ? Math.ceil(OTP_COOLDOWN_S - secs) : 0;
}

async function issueOtp(email, company) {
  const wait = await otpCooldownRemaining(email);
  if (wait > 0) {
    const err = new Error(`Please wait ${wait}s before requesting another code.`);
    err.status = 429;
    throw err;
  }

  await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
  const otp = genOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await pool.query(
    `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES ($1, $2, 'register', $3)`,
    [email.toLowerCase(), otp, expiresAt]
  );

  sendOtpEmail(email, otp, company || 'Client-crm').catch((err) => {
    console.error(`Background email dispatch failure for ${email}: ${err.message}`);
  });
}

async function requestRegistrationOtp({ name, email, password, company }) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    const err = new Error('This email is already registered. Please sign in.');
    err.status = 409;
    throw err;
  }
  await issueOtp(email, company);
}

async function resendOtp({ email, company }) {
  await issueOtp(email, company);
}

async function verifyOtpAndRegister({ name, email, password, company, otp }) {
  const { rows } = await pool.query(
    `SELECT * FROM otp_verifications
     WHERE email = $1 AND purpose = 'register' AND verified = false
     ORDER BY created_at DESC LIMIT 1`,
    [email.toLowerCase()]
  );

  const record = rows[0];
  if (!record) {
    const err = new Error('No verification code found. Please request a new one.');
    err.status = 400;
    throw err;
  }
  if (new Date() > new Date(record.expires_at)) {
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
    const err = new Error('That code has expired. Please request a new one.');
    err.status = 400;
    err.expired = true;
    throw err;
  }

  if (record.otp_code !== String(otp).trim()) {
    const attempts = (record.attempts || 0) + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
      const err = new Error('Too many incorrect attempts. Please request a new code.');
      err.status = 429;
      throw err;
    }
    await pool.query('UPDATE otp_verifications SET attempts = $1 WHERE id = $2', [attempts, record.id]);
    const err = new Error('That code is not correct. Please check and try again.');
    err.status = 400;
    throw err;
  }

  await pool.query('UPDATE otp_verifications SET verified = true WHERE id = $1', [record.id]);

  const hash = await bcrypt.hash(password, 10);
  const id = genId();

  // First user becomes admin; subsequent self-registrations are blocked
  const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCount[0].count, 10) > 0) {
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
    const err = new Error('Self-registration is closed. Please contact your administrator to create an account.');
    err.status = 403;
    throw err;
  }

  const { rows: userRows } = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, designation, is_active)
     VALUES ($1, $2, $3, $4, 'admin', $5, true) RETURNING *`,
    [id, name, email.toLowerCase(), hash, `Founder, ${company}`]
  );
  const user = userRows[0];

  await pool.query(
    `INSERT INTO settings (id, company_name, company_email, retention_threshold_days)
     VALUES ('main', $1, $2, 30) ON CONFLICT DO NOTHING`,
    [company, email.toLowerCase()]
  );

  await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);

  return {
    token: makeToken(user),
    user: {
      id: user.id, name: user.name, email: user.email,
      role: user.role, designation: user.designation,
    },
  };
}

async function login({ email, password }) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email.toLowerCase()]
  );
  const user = rows[0];

  const invalid = () => {
    const err = new Error('Email or password is incorrect. Please try again.');
    err.status = 401;
    return err;
  };

  if (!user) throw invalid();

  const valid = await bcrypt.compare(password, user.password_hash || '');
  if (!valid) throw invalid();

  return {
    token: makeToken(user),
    user: {
      id: user.id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, avatar: user.avatar,
      designation: user.designation, brandId: user.brand_id,
    },
  };
}

async function forgotPassword({ email }) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
  const user = rows[0];

  if (!user) {
    return { message: 'If that email exists, a reset code has been sent.' };
  }

  const resetCode = genOtp();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await pool.query("DELETE FROM otp_verifications WHERE email = $1 AND purpose = 'reset'", [email.toLowerCase()]);

  await pool.query(
    `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES ($1, $2, 'reset', $3)`,
    [email.toLowerCase(), resetCode, expiresAt]
  );

  const brandName = process.env.BRAND_NAME || process.env.APP_NAME || 'Retentio';
  const subject = `Your ${brandName} password reset code`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #0a0a0a; border-radius: 12px; margin-bottom: 16px;">
          <span style="color: #fff; font-weight: 800; font-size: 22px;">R</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0a0a0a; margin: 0; letter-spacing: -0.5px;">${brandName}</h1>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #0a0a0a; margin: 0 0 8px;">Reset your password</h2>
      <p style="font-size: 14px; color: #555; margin: 0 0 28px; line-height: 1.6;">
        Use the code below to reset your password. This code expires in <strong>15 minutes</strong>.
      </p>
      <div style="background: #f5f5f5; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px;">
        <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #0a0a0a; font-family: monospace;">${resetCode}</div>
        <p style="font-size: 12px; color: #909090; margin: 10px 0 0;">Expires in 15 minutes</p>
      </div>
      <p style="font-size: 12px; color: #aaa; line-height: 1.6; margin: 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  console.log(`Dispatching password reset code to ${email}...`);
  if (process.env.DEV_LOG_OTP === 'true') {
    console.log(`[DEV ONLY] Reset code for ${email}: [ ${resetCode} ]`);
  }

  sendOtpEmail(email, resetCode, brandName).catch((err) => {
    console.error(`Background reset email dispatch failure for ${email}: ${err.message}`);
  });

  return { message: 'If that email exists, a reset code has been sent.' };
}

async function resetPassword({ email, code, newPassword }) {
  if (!newPassword || String(newPassword).length < 8) {
    const err = new Error('Password must be at least 8 characters.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `SELECT * FROM otp_verifications
     WHERE email = $1 AND purpose = 'reset' AND verified = false
     ORDER BY created_at DESC LIMIT 1`,
    [email.toLowerCase()]
  );

  const record = rows[0];
  if (!record) {
    const err = new Error('No reset code found. Please request a new one.');
    err.status = 400;
    throw err;
  }
  if (new Date() > new Date(record.expires_at)) {
    await pool.query("DELETE FROM otp_verifications WHERE email = $1 AND purpose = 'reset'", [email.toLowerCase()]);
    const err = new Error('That code has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }
  if (record.otp_code !== String(code).trim()) {
    const err = new Error('That code is not correct. Please check and try again.');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email.toLowerCase()]);
  await pool.query("DELETE FROM otp_verifications WHERE email = $1 AND purpose = 'reset'", [email.toLowerCase()]);

  return { message: 'Password has been reset successfully. Please sign in.' };
}

module.exports = {
  JWT_SECRET, MAX_OTP_ATTEMPTS,
  makeToken, requestRegistrationOtp, resendOtp, verifyOtpAndRegister, login,
  forgotPassword, resetPassword,
};
