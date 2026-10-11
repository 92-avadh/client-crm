import React from 'react';

/**
 * Shared style tokens for the invoice module.
 * Kept in one place so the manager and its modals stay visually consistent.
 */

export const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};

export const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

export const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--bg-raised)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

export const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};

/** Card shell used by every modal in this module. */
export const modalCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 18, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
};

/** Header strip inside a modal. */
export const modalHeader: React.CSSProperties = {
  padding: '20px 24px', borderBottom: '1px solid var(--border)',
  background: 'var(--bg-subtle)', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between',
};

const badgeBase: React.CSSProperties = {
  display: 'inline-flex', padding: '2px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700,
};

export const badgeActive: React.CSSProperties = {
  ...badgeBase, background: 'var(--success-bg)', color: 'var(--success-text)',
};
export const badgeWarning: React.CSSProperties = {
  ...badgeBase, background: 'var(--warn-bg)', color: 'var(--warn-text)',
};
export const badgeDanger: React.CSSProperties = {
  ...badgeBase, background: 'var(--danger-bg)', color: 'var(--danger-text)',
};
export const badgeInfo: React.CSSProperties = {
  ...badgeBase, background: 'var(--info-bg)', color: 'var(--info-text)',
};

export function getStatusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'Paid') return badgeActive;
  if (status === 'Overdue') return badgeDanger;
  return badgeWarning;
}
