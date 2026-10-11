const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const auth = require('../services/auth.service');

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
  res.status(201).json({ success: true, ...result });
});

const login = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .email('email', { required: true, label: 'Email' })
    .requiredString('password', { max: 200, label: 'Password' })
    .validate();

  res.json(await auth.login(body));
});

const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: the client discards the token. Endpoint kept for symmetry.
  res.json({ success: true });
});

const forgotPassword = asyncHandler(async (req, res) => {
  // Always the same response so the endpoint cannot enumerate accounts.
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

module.exports = { sendOtp, resendOtp, verifyOtp, login, logout, forgotPassword };
