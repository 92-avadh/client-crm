const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { sendOtpEmail } = require('../utils/mailer');

const genId = () => 'usr_' + crypto.randomBytes(8).toString('hex');
const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const makeToken = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// ─────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// Step 1: validate input, check email not taken, send OTP
// ─────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password || !company) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check email not already registered
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This email is already registered. Please sign in.' });
    }

    // Rate limit: if OTP sent < 60s ago, block
    const prev = await pool.query(
      `SELECT created_at FROM otp_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase()]
    );
    if (prev.rows.length > 0) {
      const secs = (Date.now() - new Date(prev.rows[0].created_at).getTime()) / 1000;
      if (secs < 60) {
        return res.status(429).json({ error: `Please wait ${Math.ceil(60 - secs)}s before requesting another code.` });
      }
    }

    // Delete old OTPs for this email, generate new one
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
    const otp = genOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES ($1, $2, 'register', $3)`,
      [email.toLowerCase(), otp, expiresAt]
    );

    await sendOtpEmail(email, otp, company || 'Retentio');

    res.json({ success: true, message: `Verification code sent to ${email}` });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, company } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const prev = await pool.query(
      `SELECT created_at FROM otp_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase()]
    );
    if (prev.rows.length > 0) {
      const secs = (Date.now() - new Date(prev.rows[0].created_at).getTime()) / 1000;
      if (secs < 60) {
        return res.status(429).json({ error: `Please wait ${Math.ceil(60 - secs)}s before requesting a new code.` });
      }
    }

    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
    const otp = genOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at) VALUES ($1, $2, 'register', $3)`,
      [email.toLowerCase(), otp, expiresAt]
    );
    await sendOtpEmail(email, otp, company || 'Retentio');

    res.json({ success: true, message: 'New verification code sent' });
  } catch (err) {
    console.error('resend-otp error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Step 2: verify OTP, create user, return token
// ─────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { name, email, password, company, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM otp_verifications
       WHERE email = $1 AND purpose = 'register' AND verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase()]
    );

    const record = rows[0];
    if (!record) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }
    if (new Date() > new Date(record.expires_at)) {
      await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.', expired: true });
    }
    if (record.otp_code !== String(otp).trim()) {
      return res.status(400).json({ error: 'Incorrect OTP. Please check and try again.' });
    }

    // Mark OTP verified
    await pool.query('UPDATE otp_verifications SET verified = true WHERE id = $1', [record.id]);

    // Create user
    const hash = await bcrypt.hash(password, 10);
    const id = genId();
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, designation, is_active)
       VALUES ($1, $2, $3, $4, 'admin', $5, true) RETURNING *`,
      [id, name, email.toLowerCase(), hash, `Founder, ${company}`]
    );
    const user = userRows[0];

    // Bootstrap default settings
    await pool.query(
      `INSERT INTO settings (id, company_name, company_email, retention_threshold_days)
       VALUES ('main', $1, $2, 30) ON CONFLICT DO NOTHING`,
      [company, email.toLowerCase()]
    );

    // Clean up
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email.toLowerCase()]);

    const token = makeToken(user);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, designation: user.designation
      }
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = makeToken(user);
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, role: user.role, avatar: user.avatar,
        designation: user.designation, brandId: user.brand_id
      }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ success: true }));

// POST /api/auth/forgot-password (placeholder)
router.post('/forgot-password', (req, res) => {
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

module.exports = router;
