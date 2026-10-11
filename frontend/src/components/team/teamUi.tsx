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

/** Suggested profile photos for quick assignment. */
export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
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
  admin: { bg: 'var(--text-primary)', color: 'var(--solid-btn-text)', label: 'Admin' },
  hr:    { bg: 'var(--info-bg)',    color: 'var(--info-text)',    label: 'HR Manager' },
  team:  { bg: 'var(--success-bg)', color: 'var(--success-text)', label: 'Team Member' },
  brand: { bg: 'var(--danger-bg)',  color: 'var(--danger-text)',  label: 'Brand' },
};

/** Role pill. */
export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const s = ROLE_STYLES[role] ?? { bg: 'var(--bg-raised)', color: 'var(--text-secondary)', label: role };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, letterSpacing: '0.02em',
    }}>
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
