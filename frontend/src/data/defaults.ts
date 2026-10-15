import type { AppSettings } from '../types';

/**
 * Default application settings.
 *
 * These are *client-side shape defaults* used before the server responds.
 * They are not seed data and contain no users — the database is the single
 * source of truth for every record, including identity and access.
 *
 * NOTE: there is deliberately no user/credential list in this file.
 * Authentication resolves exclusively against the backend.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  companyGst: '',
  companyPan: '',
  companyState: '',
  defaultGstRate: 18,
  defaultHsnSac: '998231',
  invoicePrefix: 'INV-',
  bankAccountName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
  upiId: '',
  razorpayKeyId: '',
  razorpayConnected: false,
  subscriptionPlan: {
    name: 'Retentio Agency Plan',
    price: 0,
    billingCycle: 'Monthly',
    renewalDate: '',
    status: 'Active'
  },
  retentionThresholdDays: 15,
  whatsappClickToShareEnabled: false,
  currency: 'INR',
  currencySymbol: '₹',
  industry: '',
  teamSize: '',
  goals: [],
  dashboardLayout: 'default',
  dashboardFocus: 'balanced',
};
