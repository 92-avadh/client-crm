import React, { useState, useEffect } from 'react';
import type { User } from '../../types';

/** Avatar colour palette — theme-aware. */
const AVATAR_COLORS = [
  'var(--text-primary)', 'var(--info-text)', 'var(--success-text)', 'var(--warn-text)',
  'var(--danger-text)', 'var(--accent-text)', 'var(--info-text)', 'var(--success-text)',
];

/** Deterministic colour from a name so the same user always looks the same. */
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Fresh realistic corporate profile avatars. */
export const AVATAR_PRESETS = [
  '/avatars/avatar-1.jpg',
  '/avatars/avatar-2.jpg',
  '/avatars/avatar-3.jpg',
  '/avatars/avatar-4.jpg',
  '/avatars/avatar-5.jpg',
  '/avatars/avatar-6.jpg',
];

/** Avatar with graceful fallback to coloured initials. */
export const Avatar: React.FC<{ user: User; size?: number }> = ({ user, size = 38 }) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [user.avatar]);

  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0, border: '1.5px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', background: 'var(--bg-raised)',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarColor(user.name), color: 'var(--solid-btn-text)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, flexShrink: 0,
    }}>
      {(user.name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin:               { bg: 'var(--text-primary)', color: 'var(--solid-btn-text)', label: 'Admin' },
  hr:                  { bg: 'var(--info-bg)',    color: 'var(--info-text)',    label: 'HR Manager' },
  team:                { bg: 'var(--success-bg)', color: 'var(--success-text)', label: 'Team Member' },
  brand:               { bg: 'var(--danger-bg)',  color: 'var(--danger-text)',  label: 'Brand' },
  project_manager:     { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', label: 'Project Manager' },
  operations_manager:  { bg: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', label: 'Operations' },
  finance:             { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', label: 'Finance' },
  sales:               { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', label: 'Sales & BD' },
  marketing:           { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', label: 'Marketing' },
  account_executive:   { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', label: 'Account Exec' },
  creative_designer:   { bg: 'rgba(217, 70, 239, 0.12)', color: '#d946ef', label: 'Creative Designer' },
  developer:           { bg: 'rgba(20, 184, 166, 0.12)', color: '#14b8a6', label: 'Developer' },
};

/** Role pill. */
export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const s = ROLE_STYLES[role] ?? {
    bg: 'rgba(100, 116, 139, 0.12)',
    color: 'var(--text-primary)',
    label: role || 'Member',
  };
  return (
    <span
      title={s.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        letterSpacing: '0.02em',
        maxWidth: 160,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
};

/** Small summary card used in the team stats row. */
export const StatCard: React.FC<{
  label: string; value: number; icon: React.ReactNode; accent?: string;
}> = ({ label, value, icon, accent }) => (
  <div style={{
    flex: '1 1 200px', padding: '18px 20px', borderRadius: 14,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: 'var(--bg-raised)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: accent || 'var(--text-primary)', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);
