const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const leads = require('../services/leads.service');

const list = asyncHandler(async (req, res) => {
  res.json(await leads.listLeads(req.user, { stage: req.query.stage }));
});

const create = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('name', { max: 200, label: 'Lead name' })
    .optionalString('company', { max: 200, label: 'Company' })
    .optionalString('contact', { max: 200, label: 'Contact person' })
    .email('email', { label: 'Email' })
    .optionalString('phone', { max: 40, label: 'Phone' })
    .oneOf('source', leads.LEAD_SOURCES, { label: 'Source' })
    .oneOf('stage', leads.LEAD_STAGES, { label: 'Stage' })
    .number('value', { min: 0, label: 'Deal value' })
    .optionalString('followUpDate', { max: 50, label: 'Follow up date' })
    .optionalString('notes', { max: 3000, label: 'Notes' })
    .validate();

  res.status(201).json(await leads.createLead(req.user, body));
});

const updateStage = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .oneOf('stage', leads.LEAD_STAGES, { required: true, label: 'Stage' })
    .validate();

  const updated = await leads.updateLeadStage(req.params.id, body.stage);
  if (!updated) return res.status(404).json({ error: 'We could not find that lead.' });
  res.json(updated);
});

const convert = asyncHandler(async (req, res) => {
  const result = await leads.convertLeadToBrand(req.params.id, req.user);
  if (!result) return res.status(404).json({ error: 'We could not find that lead.' });
  res.status(201).json(result);
});

module.exports = { list, create, updateStage, convert };
