const jwt = require('jsonwebtoken');
const DEFAULT_SECRET = 'retentio_jwt_secret_2026_default_secure_key_min32chars';
const JWT_SECRET = (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32)
  ? process.env.JWT_SECRET
  : DEFAULT_SECRET;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ WARNING: JWT_SECRET not set (or < 32 chars). Using safe fallback secret. Set JWT_SECRET in Render Environment Variables.');
}

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
