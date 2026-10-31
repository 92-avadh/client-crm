/**
 * Modular Dashboard Permissions & Corporate Role Defaults
 * Synchronized with frontend/src/components/team/permissionsConfig.ts
 */

const ALL_PERMISSION_IDS = [
  'dashboard',
  'clients',
  'projects',
  'tasks',
  'invoices',
  'finance',
  'expenses',
  'team',
  'inbox',
  'chat',
  'meetings',
  'leads',
  'settings',
];

function getDefaultPermissionsForRole(role) {
  switch (role) {
    case 'admin':
      return [...ALL_PERMISSION_IDS];
    case 'hr':
      return [
        'dashboard',
        'clients',
        'projects',
        'tasks',
        'invoices',
        'expenses',
        'team',
        'inbox',
        'chat',
        'meetings',
        'leads',
        'settings',
      ];
    case 'finance':
      return ['dashboard', 'clients', 'invoices', 'finance', 'expenses', 'inbox'];
    case 'sales':
      return ['dashboard', 'leads', 'clients', 'meetings', 'chat', 'inbox'];
    case 'marketing':
      return ['dashboard', 'clients', 'projects', 'tasks', 'leads', 'chat', 'meetings'];
    case 'project_manager':
    case 'operations_manager':
      return ['dashboard', 'clients', 'projects', 'tasks', 'team', 'inbox', 'chat', 'meetings'];
    case 'account_executive':
      return ['dashboard', 'clients', 'projects', 'tasks', 'invoices', 'chat', 'meetings'];
    case 'creative_designer':
      return ['dashboard', 'clients', 'projects', 'tasks', 'chat', 'meetings'];
    case 'developer':
      return ['dashboard', 'projects', 'tasks', 'chat'];
    case 'brand':
      return ['inbox', 'chat', 'meetings', 'settings'];
    case 'team':
    default:
      return ['dashboard', 'clients', 'projects', 'tasks', 'inbox', 'chat', 'meetings'];
  }
}

function resolvePermissions(role, permissions) {
  if (Array.isArray(permissions) && permissions.length > 0) {
    return permissions;
  }
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
  return getDefaultPermissionsForRole(role);
}

module.exports = {
  ALL_PERMISSION_IDS,
  getDefaultPermissionsForRole,
  resolvePermissions,
};
