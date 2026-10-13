import { getNaturalErrorMessage } from './errors';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://client-crm-api-g9qz.onrender.com/api';

// Automatic wake-up ping for Render free tier & tab keep-alive
if (typeof window !== 'undefined') {
  // Wake-up immediately on page load
  fetch(`${BASE_URL}/health`).catch(() => {});
  // Ping every 10 minutes while active in browser to keep Render awake
  setInterval(() => {
    fetch(`${BASE_URL}/health`).catch(() => {});
  }, 10 * 60 * 1000);
}

// Token is stored in httpOnly cookie — no localStorage token management needed
export const getToken = () => null; // kept for backwards compatibility
export const setToken = (_t: string) => {}; // noop — cookie is set by server
export const clearToken = () => {}; // noop — cookie cleared by logout endpoint

// Core fetch wrapper
async function req<T>(method: string, path: string, body?: any): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    // fetch() only rejects on network/CORS failure — never on HTTP status.
    throw new Error(getNaturalErrorMessage(networkErr));
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({} as any));
    // Prefer the server's message, but normalise it to something user-friendly.
    throw new Error(
      getNaturalErrorMessage(payload?.error || payload?.message || `HTTP ${res.status}`)
    );
  }

  // 204 / empty bodies
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const api = {
  auth: {
    login: (email: string, password: string) => req<{token: string; user: any}>('POST', '/auth/login', { email, password }),
    sendOtp: (data: { name: string; email: string; password: string; company: string }) =>
      req<{ success: boolean; message: string }>('POST', '/auth/send-otp', data),
    verifyOtp: (data: { name: string; email: string; password: string; company: string; otp: string }) =>
      req<{ success: boolean; token: string; user: any }>('POST', '/auth/verify-otp', data),
    resendOtp: (email: string, company: string) =>
      req<{ success: boolean; message: string }>('POST', '/auth/resend-otp', { email, company }),
    logout: () => req('POST', '/auth/logout'),
    me: () => req<{ user: any }>('GET', '/auth/me'),
    forgotPassword: (email: string) =>
      req<{ message: string }>('POST', '/auth/forgot-password', { email }),
    resetPassword: (data: { email: string; code: string; newPassword: string }) =>
      req<{ message: string }>('POST', '/auth/reset-password', data),
  },
  users: {
    list: () => req<any[]>('GET', '/users'),
    get: (id: string) => req<any>('GET', `/users/${id}`),
    create: (data: any) => req<any>('POST', '/users', data),
    update: (id: string, data: any) => req<any>('PATCH', `/users/${id}`, data),
    deactivate: (id: string) => req<any>('PATCH', `/users/${id}/deactivate`),
  },
  brands: {
    list: (params?: any) => req<any[]>('GET', '/brands' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => req<any>('GET', `/brands/${id}`),
    create: (data: any) => req<any>('POST', '/brands', data),
    update: (id: string, data: any) => req<any>('PATCH', `/brands/${id}`, data),
    assignMembers: (id: string, memberIds: string[]) => req<any>('PATCH', `/brands/${id}/assign-members`, { memberIds }),
    logActivity: (id: string, actionName: string) => req<any>('PATCH', `/brands/${id}/log-activity`, { actionName }),
    churn: (id: string) => req<any>('PATCH', `/brands/${id}/churn`),
    snoozeRetention: (id: string) => req<any>('PATCH', `/brands/${id}/snooze-retention`),
  },
  projects: {
    list: (params?: any) => req<any[]>('GET', '/projects' + (params ? '?' + new URLSearchParams(params) : '')),
    create: (data: any) => req<any>('POST', '/projects', data),
    update: (id: string, data: any) => req<any>('PATCH', `/projects/${id}`, data),
  },
  tasks: {
    list: (params?: any) => req<any[]>('GET', '/tasks' + (params ? '?' + new URLSearchParams(params) : '')),
    create: (data: any) => req<any>('POST', '/tasks', data),
    updateStatus: (id: string, status: string) => req<any>('PATCH', `/tasks/${id}/status`, { status }),
    update: (id: string, data: any) => req<any>('PATCH', `/tasks/${id}`, data),
  },
  invoices: {
    list: (params?: any) => req<any[]>('GET', '/invoices' + (params ? '?' + new URLSearchParams(params) : '')),
    get: (id: string) => req<any>('GET', `/invoices/${id}`),
    create: (data: any) => req<any>('POST', '/invoices', data),
    updateStatus: (id: string, status: string) => req<any>('PATCH', `/invoices/${id}/status`, { status }),
    delete: (id: string) => req<any>('DELETE', `/invoices/${id}`),
  },
  payments: {
    list: (params?: any) => req<any[]>('GET', '/payments' + (params ? '?' + new URLSearchParams(params) : '')),
    record: (data: any) => req<any>('POST', '/payments', data),
    update: (id: string, data: any) => req<any>('PATCH', `/payments/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/payments/${id}`),
    razorpayInitiate: (invoiceId: string) => req<any>('POST', '/payments/razorpay-initiate', { invoiceId }),
    razorpayVerify: (data: any) => req<any>('POST', '/payments/razorpay-verify', data),
  },
  recurringInvoices: {
    list: () => req<any[]>('GET', '/recurring-invoices'),
    get: (id: string) => req<any>('GET', `/recurring-invoices/${id}`),
    create: (data: any) => req<any>('POST', '/recurring-invoices', data),
    update: (id: string, data: any) => req<any>('PATCH', `/recurring-invoices/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/recurring-invoices/${id}`),
  },
  expenses: {
    list: (params?: any) => req<any[]>('GET', '/expenses' + (params ? '?' + new URLSearchParams(params) : '')),
    create: (data: any) => req<any>('POST', '/expenses', data),
    update: (id: string, data: any) => req<any>('PATCH', `/expenses/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/expenses/${id}`),
    bulkDelete: (ids: string[]) => req<any>('POST', '/expenses/bulk-delete', { ids }),
  },
  meetings: {
    list: (params?: any) => req<any[]>('GET', '/meetings' + (params ? '?' + new URLSearchParams(params) : '')),
    create: (data: any) => req<any>('POST', '/meetings', data),
    update: (id: string, data: any) => req<any>('PATCH', `/meetings/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/meetings/${id}`),
  },
  leads: {
    list: (params?: any) => req<any[]>('GET', '/leads' + (params ? '?' + new URLSearchParams(params) : '')),
    create: (data: any) => req<any>('POST', '/leads', data),
    updateStage: (id: string, stage: string) => req<any>('PATCH', `/leads/${id}/stage`, { stage }),
    convert: (id: string) => req<any>('POST', `/leads/${id}/convert`),
  },
  notifications: {
    list: (params?: any) => req<any[]>('GET', '/notifications' + (params ? '?' + new URLSearchParams(params) : '')),
    markRead: (id: string) => req<any>('PATCH', `/notifications/${id}/read`),
    markAllRead: () => req<any>('PATCH', '/notifications/read-all'),
  },
  chat: {
    conversations: () => req<any[]>('GET', '/chat/conversations'),
    messages: (convId: string) => req<any[]>('GET', `/chat/conversations/${convId}/messages`),
    sendMessage: (convId: string, data: any) => req<any>('POST', `/chat/conversations/${convId}/messages`, data),
    createConversation: (data: any) => req<any>('POST', '/chat/conversations', data),
  },
  settings: {
    get: () => req<any>('GET', '/settings'),
    update: (data: any) => req<any>('PATCH', '/settings', data),
  },
  holidays: {
    list: () => req<any[]>('GET', '/holidays'),
    create: (data: any) => req<any>('POST', '/holidays', data),
    delete: (id: string) => req<any>('DELETE', `/holidays/${id}`),
  },
  auditLogs: {
    list: (params?: any) => req<any[]>('GET', '/audit-logs' + (params ? '?' + new URLSearchParams(params) : '')),
  },
};
