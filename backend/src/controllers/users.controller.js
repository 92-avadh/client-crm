const asyncHandler = require('../utils/asyncHandler');
const { makeValidator } = require('../utils/validate');
const users = require('../services/users.service');

const list = asyncHandler(async (req, res) => {
  res.json(await users.listUsers(req.user, {
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    pageSize: Math.max(1, Math.min(1000, parseInt(req.query.pageSize, 10) || 50)),
  }));
});

const get = asyncHandler(async (req, res) => {
  const user = await users.getUser(req.user, req.params.id);
  if (!user) return res.status(404).json({ error: 'We could not find that team member.' });
  res.json(user);
});

const create = asyncHandler(async (req, res) => {
  const perms = req.user.permissions || [];
  const canManage = req.user.role === 'admin' || req.user.role === 'hr' || perms.includes('team');
  if (!canManage) {
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

  const result = await users.createUser(req.user, body);
  if (result.error === 'password_required') {
    return res.status(400).json({ error: 'Please set a password for this team member.' });
  }
  res.status(201).json(result);
});

const update = asyncHandler(async (req, res) => {
  // Admins, HR and team managers may edit others; users may always edit themselves.
  const perms = req.user.permissions || [];
  const isSelf = req.user.id === req.params.id;
  const canManage = req.user.role === 'admin' || req.user.role === 'hr' || perms.includes('team');
  if (!canManage && !isSelf) {
    return res.status(403).json({ error: "You don't have permission to edit this team member." });
  }
  const body = makeValidator(req.body)
    .optionalString('name', { max: 150, label: 'Name' })
    .email('email', { label: 'Email' })
    .optionalString('phone', { max: 40, label: 'Phone' })
    .optionalString('designation', { max: 200, label: 'Designation' })
    .optionalString('role', { max: 100, label: 'Role' })
    .array('permissions', { ofStrings: true, max: 50, label: 'Permissions' })
    // Avatar is stored as a data URL, so the cap has to accommodate a base64
    // payload (~1.33x the binary size) rather than a plain filename.
    .check(
      !req.body?.avatar || String(req.body.avatar).length <= 2_000_000,
      'That photo is too large. Please choose an image under 2MB.'
    )
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
  const perms = req.user.permissions || [];
  const canManage = req.user.role === 'admin' || req.user.role === 'hr' || perms.includes('team');
  if (!canManage) {
    return res.status(403).json({ error: "You don't have permission to deactivate team members." });
  }
  const user = await users.deactivateUser(req.user, req.params.id);
  if (!user) return res.status(404).json({ error: 'We could not find that team member.' });
  res.json({ success: true, user });
});

module.exports = { list, get, create, update, deactivate };