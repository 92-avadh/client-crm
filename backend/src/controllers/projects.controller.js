const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const projects = require('../services/projects.service');

const list = asyncHandler(async (req, res) => {
  res.json(await projects.listProjects(req.user, {
    brandId: req.query.brandId,
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(200, parseInt(req.query.pageSize, 10) || 50)),
  }));
});

const create = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('name', { max: 200, label: 'Project name' })
    .requiredString('brandId', { max: 80, label: 'Client' })
    .optionalString('scope', { max: 3000, label: 'Scope' })
    .optionalString('startDate', { max: 50, label: 'Start date' })
    .optionalString('endDate', { max: 50, label: 'End date' })
    .oneOf('status', projects.PROJECT_STATUSES, { label: 'Status' })
    .number('billingAmount', { min: 0, label: 'Billing amount' })
    .number('progress', { min: 0, max: 100, label: 'Progress' })
    .array('memberIds', { ofStrings: true, max: 100, label: 'Team members' })
    .validate();

  res.status(201).json(await projects.createProject(req.user, body));
});

const update = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .optionalString('name', { max: 200, label: 'Project name' })
    .optionalString('scope', { max: 3000, label: 'Scope' })
    .optionalString('startDate', { max: 50, label: 'Start date' })
    .optionalString('endDate', { max: 50, label: 'End date' })
    .oneOf('status', projects.PROJECT_STATUSES, { label: 'Status' })
    .number('billingAmount', { min: 0, label: 'Billing amount' })
    .number('progress', { min: 0, max: 100, label: 'Progress' })
    .array('memberIds', { ofStrings: true, max: 100, label: 'Team members' })
    .validate();

  const updated = await projects.updateProject(req.user, req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'We could not find that project.' });
  res.json(updated);
});


const remove = asyncHandler(async (req, res) => {
  const perms = req.user.permissions || [];
  if (!['admin', 'hr'].includes(req.user.role) && !perms.includes('projects')) {
    return res.status(403).json({ error: "You don't have permission to delete projects." });
  }
  const result = await projects.deleteProject(req.user, req.params.id);
  if (!result) return res.status(404).json({ error: 'We could not find that project.' });
  res.json({ message: 'Project deleted successfully', ...result });
});

module.exports = { list, create, update, remove };