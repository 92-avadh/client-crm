const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/mailer');

const genId = () => 'usr_' + crypto.randomBytes(8).toString('hex');
const genOtp = () => String(crypto.randomInt(100000, 1000000));

const DEFAULT_SECRET = 'retentio_jwt_secret_2026_default_secure_key_min32chars';
const DEV_JWT_SECRET = DEFAULT_SECRET;
const JWT_SECRET = (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32)
  ? process.env.JWT_SECRET
  : DEFAULT_SECRET;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_S = 60;
const MAX_OTP_ATTEMPTS = 5;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ WARNING: JWT_SECRET not set (or < 32 chars). Using safe fallback secret. Set JWT_SECRET in Render Environment Variables.');
}

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

  // Dispatch email delivery in background so user registration response is instant (~50ms)
  sendOtpEmail(email, otp, company || 'Client-crm').catch((err) => {
    console.error(`⚠️ Background email dispatch failure for ${email}: ${err.message}`);
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

  // Brute-force protection: count failed attempts against this code.
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

  // Same message for unknown email and wrong password — do not leak which.
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

module.exports = {
  JWT_SECRET, DEV_JWT_SECRET, MAX_OTP_ATTEMPTS,
  makeToken, requestRegistrationOtp, resendOtp, verifyOtpAndRegister, login,
};
