const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const meetings = require('../services/meetings.service');

const list = asyncHandler(async (req, res) => {
  res.json(await meetings.listMeetings(req.user, {
    brandId: req.query.brandId,
    leadId: req.query.leadId,
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(200, parseInt(req.query.pageSize, 10) || 50)),
  }));
});

const create = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('title', { max: 200, label: 'Meeting title' })
    .optionalString('brandId', { max: 80, label: 'Client' })
    .optionalString('leadId', { max: 80, label: 'Lead' })
    .optionalString('date', { max: 40, label: 'Date' })
    .optionalString('time', { max: 20, label: 'Time' })
    .number('durationMinutes', { min: 5, max: 1440, label: 'Duration' })
    .optionalString('linkOrLocation', { max: 500, label: 'Link or location' })
    .optionalString('notes', { max: 3000, label: 'Notes' })
    .array('attendeeIds', { ofStrings: true, max: 100, label: 'Attendees' })
    .validate();

  res.status(201).json(await meetings.createMeeting(req.user, body));
});

const update = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .optionalString('title', { max: 200, label: 'Meeting title' })
    .optionalString('brandId', { max: 80, label: 'Client' })
    .optionalString('leadId', { max: 80, label: 'Lead' })
    .optionalString('date', { max: 50, label: 'Date' })
    .optionalString('time', { max: 20, label: 'Time' })
    .number('durationMinutes', { min: 5, max: 1440, label: 'Duration' })
    .optionalString('linkOrLocation', { max: 500, label: 'Link or location' })
    .optionalString('notes', { max: 3000, label: 'Notes' })
    .array('attendeeIds', { ofStrings: true, max: 100, label: 'Attendees' })
    .validate();

  const updated = await meetings.updateMeeting(req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'We could not find that meeting.' });
  res.json(updated);
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await meetings.deleteMeeting(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'We could not find that meeting.' });
  res.json({ success: true });
});

module.exports = { list, create, update, remove };
