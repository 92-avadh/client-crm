/**
 * Idempotency Middleware
 *
 * Prevents duplicate processing of state-changing operations (such as payments or invoice creations)
 * when network retries occur. Clients pass an `Idempotency-Key` header.
 */

const idempotencyStore = new Map();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Periodic cleanup of expired idempotency records
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyStore.entries()) {
    if (val.expiry < now) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 1000);

function idempotency(req, res, next) {
  // Only state-changing requests use idempotency
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!key) {
    return next();
  }

  const userId = req.user?.id || 'anon';
  const compositeKey = `${userId}:${req.method}:${req.baseUrl || ''}${req.path}:${key}`;

  const existing = idempotencyStore.get(compositeKey);
  if (existing) {
    if (existing.status === 'in_flight') {
      return res.status(409).json({
        error: 'A request with this Idempotency-Key is currently in flight. Please wait.',
      });
    }

    if (existing.expiry > Date.now()) {
      res.setHeader('X-Idempotency-Replay', 'true');
      res.status(existing.statusCode);
      return res.json(existing.body);
    }
  }

  // Mark in-flight
  idempotencyStore.set(compositeKey, {
    status: 'in_flight',
    expiry: Date.now() + IDEMPOTENCY_TTL_MS,
  });

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    idempotencyStore.set(compositeKey, {
      status: 'completed',
      statusCode: res.statusCode,
      body,
      expiry: Date.now() + IDEMPOTENCY_TTL_MS,
    });
    return originalJson(body);
  };

  next();
}

module.exports = idempotency;
