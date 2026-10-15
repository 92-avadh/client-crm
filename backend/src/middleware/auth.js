const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'retentio_jwt_secret_2026_default_secure_key_min32chars';
const JWT_SECRET = (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32)
  ? process.env.JWT_SECRET
  : DEFAULT_SECRET;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET env var is not set or < 32 chars. Using safe fallback key. Set JWT_SECRET in Render Environment Variables for maximum security.');
}


function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...rest] = cookie.trim().split('=');
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
  return cookies[name] || null;
}

module.exports = (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else {
    token = getCookie(req, 'token');
  }

  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);

    const isProd = process.env.NODE_ENV === 'production';
    const COOKIE_OPTIONS = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
    const newToken = jwt.sign(
      { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, brandId: req.user.brandId, permissions: req.user.permissions || [] },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('token', newToken, COOKIE_OPTIONS);

    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
