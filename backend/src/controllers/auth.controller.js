const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const auth = require('../services/auth.service');

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const sendOtp = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('name', { max: 150, label: 'Name' })
    .email('email', { required: true, label: 'Email' })
    .requiredString('company', { max: 200, label: 'Company name' })
    .check(
      req.body?.password && String(req.body.password).length >= 8,
      'Password must be at least 8 characters.'
    )
    .validate();

  await auth.requestRegistrationOtp(body);
  res.json({ success: true, message: `Verification code sent to ${body.email}` });
});

const resendOtp = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .email('email', { required: true, label: 'Email' })
    .optionalString('company', { max: 200, label: 'Company name' })
    .validate();

  await auth.resendOtp(body);
  res.json({ success: true, message: 'New verification code sent' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .email('email', { required: true, label: 'Email' })
    .requiredString('name', { max: 150, label: 'Name' })
    .requiredString('company', { max: 200, label: 'Company name' })
    .check(
      req.body?.password && String(req.body.password).length >= 8,
      'Password must be at least 8 characters.'
    )
    .check(
      /^\d{6}$/.test(String(req.body?.otp || '')),
      'Enter the complete 6-digit code.'
    )
    .validate();

  const result = await auth.verifyOtpAndRegister(body);
  res.cookie('token', result.token, COOKIE_OPTIONS);
  res.status(201).json({ success: true, user: result.user, token: result.token });
});

const login = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .email('email', { required: true, label: 'Email' })
    .requiredString('password', { max: 200, label: 'Password' })
    .validate();

  const result = await auth.login(body);
  res.cookie('token', result.token, COOKIE_OPTIONS);
  res.json({ user: result.user, token: result.token });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ success: true });
});

const pool = require('../db');

const me = asyncHandler(async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length) {
      const u = rows[0];
      let perms = [];
      if (Array.isArray(u.permissions)) perms = u.permissions;
      else if (typeof u.permissions === 'string') {
        try { perms = JSON.parse(u.permissions); } catch { perms = []; }
      }
      return res.json({
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          avatar: u.avatar,
          designation: u.designation,
          brandId: u.brand_id,
          permissions: perms,
        }
      });
    }
  } catch (_e) {}
  res.json({ user: req.user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .email('email', { required: true, label: 'Email' })
    .validate();

  const result = await auth.forgotPassword(body);
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .email('email', { required: true, label: 'Email' })
    .requiredString('code', { max: 10, label: 'Reset code' })
    .requiredString('newPassword', { max: 200, label: 'New password' })
    .validate();

  const result = await auth.resetPassword(body);
  res.json(result);
});

module.exports = { sendOtp, resendOtp, verifyOtp, login, logout, me, forgotPassword, resetPassword };
