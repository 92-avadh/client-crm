const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  console.error('JWT_SECRET must be set to a value >= 32 characters in production.');
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET not set. Using development-only fallback.');
}

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET || 'dev_only_not_for_production_use_this');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
