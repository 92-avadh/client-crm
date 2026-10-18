import React from 'react';
import { Building2, Users, Briefcase, Layers, Megaphone, Tag } from 'lucide-react';

export interface CategoryStyle {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  desc: string;
}

/**
 * Category metadata for the expense ledger.
 *
 * The legacy keys map old records onto the current canonical categories so
 * historical data renders with the right label and colour.
 */
export const CATEGORY_CONFIG: Record<string, CategoryStyle> = {
  'Freelancer & Contractor Fees': {
    label: 'Freelancer & Contractor Fees', icon: Users,
    color: 'var(--info-text)', bg: 'var(--info-bg)', border: 'var(--info-border)',
    desc: 'Contractor payouts, specialized consultants, and outsourced design/dev',
  },
  'Ad Spend & Media Buying': {
    label: 'Ad Spend & Media Buying', icon: Megaphone,
    color: 'var(--warn-text)', bg: 'var(--warn-bg)', border: 'var(--warn-border)',
    desc: 'Meta, Google, LinkedIn ad budgets managed directly for client retainers',
  },
  'Stock Assets & Specialized Tools': {
    label: 'Stock Assets & Specialized Tools', icon: Layers,
    color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: 'var(--accent-border)',
    desc: 'Premium plugins, fonts, stock photography, and 3D assets',
  },
  'Client Deliverable Production': {
    label: 'Client Deliverable Production', icon: Building2,
    color: 'var(--text-primary)', bg: 'var(--bg-raised)', border: 'var(--border)',
    desc: 'Production shoots, video editing, hosting, and print proofs',
  },
  'Brand Expenses': {
    label: 'Brand Expenses', icon: Building2,
    color: 'var(--text-primary)', bg: 'var(--bg-raised)', border: 'var(--border)',
    desc: 'Direct client ad spend, creative assets, shoot costs & deliverables',
  },
  'Other Deliverable Costs': {
    label: 'Other Deliverable Costs', icon: Tag,
    color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border)',
    desc: 'Direct deliverable-associated fulfillment costs',
  },
  'Employee Salaries': {
    label: 'Employee Salaries', icon: Users,
    color: 'var(--info-text)', bg: 'var(--info-bg)', border: 'var(--info-border)',
    desc: 'Staff compensation, payroll & strategist monthly retainer fees',
  },
  'Office Expenses': {
    label: 'Office Expenses', icon: Briefcase,
    color: 'var(--success-text)', bg: 'var(--success-bg)', border: 'var(--success-border)',
    desc: 'Studio lease, utilities, office broadband & maintenance',
  },
  'Software & Subscriptions': {
    label: 'Software & Subscriptions', icon: Layers,
    color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: 'var(--accent-border)',
    desc: 'SaaS tools, cloud infrastructure, Figma, Google Workspace & AI APIs',
  },
  'Marketing Expenses': {
    label: 'Marketing Expenses', icon: Megaphone,
    color: 'var(--warn-text)', bg: 'var(--warn-bg)', border: 'var(--warn-border)',
    desc: 'Agency promotions, LinkedIn ads, PR & acquisition marketing',
  },
  'Other Expenses': {
    label: 'Other Expenses', icon: Tag,
    color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border)',
    desc: 'Client dinners, business travel, statutory compliance & petty cash',
  },

  // Legacy mappings
  'Salary': {
    label: 'Employee Salaries', icon: Users,
    color: 'var(--info-text)', bg: 'var(--info-bg)', border: 'var(--info-border)',
    desc: 'Staff compensation & payroll',
  },
  'Tools & Software': {
    label: 'Software & Subscriptions', icon: Layers,
    color: 'var(--accent-text)', bg: 'var(--accent-bg)', border: 'var(--accent-border)',
    desc: 'SaaS tools & cloud software',
  },
  'Ads & Marketing': {
    label: 'Marketing Expenses', icon: Megaphone,
    color: 'var(--warn-text)', bg: 'var(--warn-bg)', border: 'var(--warn-border)',
    desc: 'Ads & marketing expenses',
  },
  'Office & Rent': {
    label: 'Office Expenses', icon: Briefcase,
    color: 'var(--success-text)', bg: 'var(--success-bg)', border: 'var(--success-border)',
    desc: 'Studio lease & office bills',
  },
  'Freelancer Payout': {
    label: 'Freelancer & Contractor Fees', icon: Users,
    color: 'var(--info-text)', bg: 'var(--info-bg)', border: 'var(--info-border)',
    desc: 'Specialist & contractor compensation',
  },
  'Travel': {
    label: 'Other Expenses', icon: Tag,
    color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border)',
    desc: 'Travel & logistics overhead',
  },
  'Other': {
    label: 'Other Expenses', icon: Tag,
    color: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border)',
    desc: 'General miscellaneous overhead',
  },
};

/** Canonical categories offered in the add/edit form - focused on client deliverable & contractor costs for gross margin */
export const STANDARD_CATEGORIES = [
  'Freelancer & Contractor Fees',
  'Ad Spend & Media Buying',
  'Stock Assets & Specialized Tools',
  'Client Deliverable Production',
  'Brand Expenses',
  'Software & Subscriptions',
  'Employee Salaries',
  'Other Deliverable Costs',
];

export const PAYMENT_MODES = [
  'Corporate Card',
  'Bank Transfer',
  'UPI',
  'Company NetBanking',
  'Cheque',
  'Cash',
];
