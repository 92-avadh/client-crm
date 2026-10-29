const asyncHandler = require('../utils/asyncHandler');
const auditLogs = require('../services/auditLogs.service');

const list = asyncHandler(async (req, res) => {
  if (req.user?.role === 'brand') {
    return res.status(403).json({ error: "You don't have permission to view activity logs." });
  }
  const result = await auditLogs.listAuditLogs(req.user, {
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json(result);
});

module.exports = { list };
