const { ValidationError } = require('../utils/validate');

/**
 * Centralised error handler.
 *
 * Controllers throw; this turns the throw into a response. Internal errors
 * (SQL, driver, stack) are logged server-side and never returned to the
 * client — users get a plain, actionable message.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Validation failures are expected and safe to surface.
  if (err instanceof ValidationError || err?.name === 'ValidationError') {
    return res.status(err.status || 400).json({ error: err.message });
  }

  // Known client-error shapes thrown deliberately by services.
  if (err?.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  // Unique-constraint violation → the record already exists.
  if (err?.code === '23505') {
    return res.status(409).json({ error: 'That record already exists. Please use a different value.' });
  }
  // Foreign-key violation → linked records block the change.
  if (err?.code === '23503') {
    return res.status(409).json({ error: 'This item is linked to other records and cannot be changed right now.' });
  }
  // Not-null violation → a required value was missing.
  if (err?.code === '23502') {
    return res.status(400).json({ error: 'A required field was missing. Please check the form and try again.' });
  }

  // Anything else is an internal fault: log it, tell the user nothing specific.
  console.error('[Unhandled error]', req.method, req.originalUrl, err);
  return res.status(500).json({
    error: 'Something went wrong on our end. Please try again in a moment.',
  });
}

module.exports = errorHandler;
