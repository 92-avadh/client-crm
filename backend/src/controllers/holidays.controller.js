const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const holidays = require('../services/holidays.service');

const list = asyncHandler(async (req, res) => {
  res.json(await holidays.listHolidays(req.user, {
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(200, parseInt(req.query.pageSize, 10) || 50)),
  }));
});

const create = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "You don't have permission to manage holidays." });
  }
  const body = makeValidator(req.body)
    .requiredString('title', { max: 200, label: 'Holiday name' })
    .requiredString('date', { max: 40, label: 'Date' })
    .oneOf('type', holidays.HOLIDAY_TYPES, { label: 'Type' })
    .validate();

  res.status(201).json(await holidays.createHoliday(req.user, body));
});

const remove = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "You don't have permission to manage holidays." });
  }
  const deleted = await holidays.deleteHoliday(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'We could not find that holiday.' });
  res.json({ success: true });
});

module.exports = { list, create, remove };
