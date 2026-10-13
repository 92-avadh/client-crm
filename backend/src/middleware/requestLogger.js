const { v4: uuidv4 } = require('uuid');

/**
 * Request logger — adds request ID and logs method/path/status/duration.
 */
function requestLogger(req, res, next) {
  const requestId = uuidv4();
  const start = Date.now();

  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}

module.exports = requestLogger;