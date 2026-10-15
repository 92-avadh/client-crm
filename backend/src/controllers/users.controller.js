const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const users = require('../services/users.service');

const list = asyncHandler(async (req, res) => {
  res.json(await users.listUsers(req.user, {
    page: req.query.page,
    pageSize: req.query.pageSize,
  }));
});

const get = asyncHandler(async (req, res) => {
  const user = await users.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'We could not find that team member.' });
  res.json(user);
});

const create = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "You don't have permission to add team members." });
  }
  const body = makeValidator(req.body)
    .requiredString('name', { max: 150, label: 'Name' })
    .email('email', { required: true, label: 'Email' })
    .requiredString('role', { max: 100, label: 'Role' })
    .optionalString('phone', { max: 40, label: 'Phone' })
    .optionalString('designation', { max: 200, label: 'Designation' })
    .array('permissions', { ofStrings: true, max: 50, label: 'Permissions' })
    .check(
      !req.body?.password || String(req.body.password).length >= 8,
      'Password must be at least 8 characters.'
    )
    .validate();

  res.status(201).json(await users.createUser(req.user, body));
});

const update = asyncHandler(async (req, res) => {
  // Admins may edit anyone; other users may edit only themselves.
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "You don't have permission to edit this team member." });
  }
  const body = makeValidator(req.body)
    .optionalString('name', { max: 150, label: 'Name' })
    .email('email', { label: 'Email' })
    .optionalString('phone', { max: 40, label: 'Phone' })
    .optionalString('designation', { max: 200, label: 'Designation' })
    .optionalString('role', { max: 100, label: 'Role' })
    .array('permissions', { ofStrings: true, max: 50, label: 'Permissions' })
    .check(
      !req.body?.password || String(req.body.password).length >= 8,
      'Password must be at least 8 characters.'
    )
    .validate();

  const result = await users.updateUser(req.user, req.params.id, body);
  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'We could not find that team member.' });
  }
  if (result.error === 'email_taken') {
    return res.status(409).json({ error: 'That email address is already in use by another team member.' });
  }
  res.json(result.user);
});

const deactivate = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "You don't have permission to deactivate team members." });
  }
  const user = await users.deactivateUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'We could not find that team member.' });
  res.json({ success: true, user });
});

module.exports = { list, get, create, update, deactivate };