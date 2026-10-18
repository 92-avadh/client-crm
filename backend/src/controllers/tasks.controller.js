const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const tasks = require('../services/tasks.service');

/** GET /api/tasks */
const list = asyncHandler(async (req, res) => {
  const filters = {
    brandId: req.query.brandId,
    projectId: req.query.projectId,
    assigneeId: req.query.assigneeId,
    status: req.query.status,
  };
  res.json(await tasks.listTasks(req.user, filters));
});

/** POST /api/tasks */
const create = asyncHandler(async (req, res) => {
  const body = makeValidator(req.body)
    .requiredString('title', { max: 300, label: 'Title' })
    .requiredString('brandId', { max: 80, label: 'Client' })
    .optionalString('description', { max: 5000, label: 'Description' })
    .optionalString('projectId', { max: 80, label: 'Project' })
    .optionalString('assigneeId', { max: 80, label: 'Assignee' })
    .oneOf('priority', tasks.PRIORITIES, { label: 'Priority' })
    .oneOf('status', tasks.STATUSES, { label: 'Status' })
    .validate();

  res.status(201).json(await tasks.createTask(req.user, body));
});

/** PATCH /api/tasks/:id/status */
const updateStatus = asyncHandler(async (req, res) => {
  if (!await tasks.verifyTaskAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "You don't have permission to update this task." });
  }
  const body = makeValidator(req.body)
    .oneOf('status', tasks.STATUSES, { required: true, label: 'Status' })
    .validate();

  const updated = await tasks.updateTaskStatus(req.params.id, body.status);
  if (!updated) return res.status(404).json({ error: 'We could not find that task.' });
  res.json(updated);
});

/** PATCH /api/tasks/:id */
const update = asyncHandler(async (req, res) => {
  if (!await tasks.verifyTaskAccess(req.user, req.params.id)) {
    return res.status(403).json({ error: "You don't have permission to edit this task." });
  }
  const body = makeValidator(req.body)
    .optionalString('title', { max: 300, label: 'Title' })
    .optionalString('description', { max: 5000, label: 'Description' })
    .oneOf('priority', tasks.PRIORITIES, { label: 'Priority' })
    .oneOf('status', tasks.STATUSES, { label: 'Status' })
    .validate();

  const updated = await tasks.updateTask(req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'We could not find that task.' });
  res.json(updated);
});

module.exports = { list, create, updateStatus, update };
