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
  'Brand Expenses': {
    label: 'Brand Expenses', icon: Building2,
    color: 'var(--text-primary)', bg: 'var(--bg-raised)', border: 'var(--border)',
    desc: 'Direct client ad spend, creative assets, shoot costs & deliverables',
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
    label: 'Employee Salaries', icon: Users,
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

/** Canonical categories offered in the add/edit form. */
export const STANDARD_CATEGORIES = [
  'Brand Expenses',
  'Employee Salaries',
  'Office Expenses',
  'Software & Subscriptions',
  'Marketing Expenses',
  'Other Expenses',
];

export const PAYMENT_MODES = [
  'Corporate Card',
  'Bank Transfer',
  'UPI',
  'Company NetBanking',
  'Cheque',
  'Cash',
];
