const jwt = require('jsonwebtoken');
const { getAgencyId } = require('../utils/agency');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters. All environments require a secure 32+ character key.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

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
  let isCookieAuth = false;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else {
    token = getCookie(req, 'token');
    if (token) isCookieAuth = true;
  }

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  // CSRF Defense: When mutating state with cookie-based auth, verify origin or custom request header
  if (isCookieAuth && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    const hasCustomHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
    // In production or cross-site environments, verify origin or custom header presence
    if (!origin && !hasCustomHeader) {
      return res.status(403).json({ error: 'CSRF protection: missing request verification headers.' });
    }
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user.agencyId = getAgencyId(req.user);

    const newToken = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        brandId: req.user.brandId,
        agencyId: req.user.agencyId,
        permissions: req.user.permissions || [],
      },
      JWT_SECRET,
      { expiresIn: '30d', algorithm: 'HS256' }
    );
    res.cookie('token', newToken, COOKIE_OPTIONS);

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('[Auth middleware error]', err);
    return res.status(500).json({ error: 'Authentication processing failed' });
  }
};
module.exports.JWT_SECRET = JWT_SECRET;
