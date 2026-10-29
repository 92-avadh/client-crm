export interface ModulePermission {
  id: string;
  label: string;
  description: string;
  category: 'core' | 'finance' | 'collaboration' | 'admin';
}

export const AVAILABLE_PERMISSIONS: ModulePermission[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Overview',
    description: 'Agency metrics, quick actions, performance graphs & summary',
    category: 'core',
  },
  {
    id: 'clients',
    label: 'Clients & Brands',
    description: 'Client profiles, contracts, contact info & documents',
    category: 'core',
  },
  {
    id: 'projects',
    label: 'Projects Management',
    description: 'Project scopes, milestones, timelines & deliverables',
    category: 'core',
  },
  {
    id: 'tasks',
    label: 'Tasks & To-Dos',
    description: 'Task assignments, priorities, due dates & status updates',
    category: 'core',
  },
  {
    id: 'invoices',
    label: 'Invoices & Billing',
    description: 'Invoice generator, GST breakdown, PDF export & recurring cycles',
    category: 'finance',
  },
  {
    id: 'finance',
    label: 'Finance & Payments',
    description: 'Payment receipts, reconciliation, bank mode & profit stats',
    category: 'finance',
  },
  {
    id: 'expenses',
    label: 'Business Expenses',
    description: 'Employee salaries, subscriptions, ads & operational costs',
    category: 'finance',
  },
  {
    id: 'team',
    label: 'Team Directory',
    description: 'Member directory, designations, contact info & role manager',
    category: 'collaboration',
  },
  {
    id: 'inbox',
    label: 'Notifications Inbox',
    description: 'System announcements, urgent alerts & milestone notices',
    category: 'collaboration',
  },
  {
    id: 'chat',
    label: 'Team Chat & Channels',
    description: 'Direct messaging and real-time team conversation channels',
    category: 'collaboration',
  },
  {
    id: 'meetings',
    label: 'Meetings Calendar',
    description: 'Client calls, internal standups & scheduling calendar',
    category: 'collaboration',
  },
  {
    id: 'leads',
    label: 'Leads Pipeline',
    description: 'Prospect pipeline, deal stages & brand conversions',
    category: 'core',
  },
  {
    id: 'settings',
    label: 'Agency Settings',
    description: 'Company info, bank accounts, GST/PAN & subscription settings',
    category: 'admin',
  },
];

export const ALL_PERMISSION_IDS = AVAILABLE_PERMISSIONS.map((p) => p.id);

export interface CorporateRoleOption {
  value: string;
  label: string;
  category: 'General' | 'Management' | 'Operations' | 'Finance' | 'Growth' | 'Tech & Creative';
  description: string;
  adminOnly?: boolean;
}

export const CORPORATE_ROLES: CorporateRoleOption[] = [
  {
    value: 'team',
    label: 'Team Member',
    category: 'General',
    description: 'Standard collaborator with tasks, calendar, clients & chat',
  },
  {
    value: 'hr',
    label: 'HR Manager',
    category: 'Management',
    description: 'People operations, team directory, onboarding & admin duties',
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
    category: 'Operations',
    description: 'Project scopes, milestone deliverables, task flow & meetings',
  },
  {
    value: 'operations_manager',
    label: 'Operations Manager',
    category: 'Operations',
    description: 'Cross-functional operations, team allocation & execution',
  },
  {
    value: 'finance',
    label: 'Finance & Billing Specialist',
    category: 'Finance',
    description: 'Invoices, payments, financial reconciliation & expenses',
  },
  {
    value: 'sales',
    label: 'Sales & Business Development',
    category: 'Growth',
    description: 'Leads pipeline, prospective deals, meetings & conversions',
  },
  {
    value: 'marketing',
    label: 'Marketing Strategist',
    category: 'Growth',
    description: 'Brand campaigns, client engagements, marketing operations & leads',
  },
  {
    value: 'account_executive',
    label: 'Account Executive',
    category: 'Management',
    description: 'Client relationship management, project briefs & billing coordination',
  },
  {
    value: 'creative_designer',
    label: 'Creative & UI/UX Designer',
    category: 'Tech & Creative',
    description: 'Brand assets, design mockups, sprint tasks & project delivery',
  },
  {
    value: 'developer',
    label: 'Technical Engineer / Developer',
    category: 'Tech & Creative',
    description: 'Software development, technical sprints & deliverable tasks',
  },
  {
    value: 'admin',
    label: 'Administrator / Executive',
    category: 'Management',
    description: 'Complete unrestricted control over entire system',
    adminOnly: true,
  },
];

export function getDefaultPermissionsForRole(role: string): string[] {
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

export interface PermissionPreset {
  name: string;
  description: string;
  permissions: string[];
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    name: 'All Access',
    description: 'Complete access to all 14 dashboard modules',
    permissions: [...ALL_PERMISSION_IDS],
  },
  {
    name: 'Operations & Execution',
    description: 'Projects, tasks, calendar, clients & team chat',
    permissions: ['dashboard', 'clients', 'projects', 'tasks', 'team', 'inbox', 'chat', 'meetings'],
  },
  {
    name: 'Finance & Billing',
    description: 'Invoices, payments, expenses & client billing profiles',
    permissions: ['dashboard', 'clients', 'invoices', 'finance', 'expenses', 'inbox'],
  },
  {
    name: 'Sales & Growth',
    description: 'Leads pipeline, client onboarding, meetings & messaging',
    permissions: ['dashboard', 'leads', 'clients', 'meetings', 'chat', 'inbox'],
  },
];
