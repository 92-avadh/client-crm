/**
 * Route configuration — single source of truth for URL ↔ tab mapping.
 * Add a new route here and in App.tsx <Routes> to register a new page.
 */

export const ROUTES = {
  dashboard: '/dashboard',
  clients: '/clients',
  projects: '/projects',
  tasks: '/tasks',
  invoices: '/invoices',
  finance: '/finance',
  expenses: '/expenses',
  retention: '/retention',
  chat: '/chat',
  meetings: '/meetings',
  leads: '/leads',
  team: '/team',
  inbox: '/inbox',
  settings: '/settings',
} as const;

export type RouteTab = keyof typeof ROUTES;

/** Reverse map: URL path → tab id */
export const PATH_TO_TAB: Record<string, RouteTab> = {
  ...Object.fromEntries(
    Object.entries(ROUTES).map(([tab, path]) => [path, tab as RouteTab])
  ),
  '/': 'dashboard',
};

/** Default landing route */
export const DEFAULT_ROUTE = ROUTES.dashboard;

/** Valid route paths for the router */
export const ROUTE_PATHS = Object.values(ROUTES);
