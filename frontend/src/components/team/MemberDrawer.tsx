import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Camera, Trash2, Edit3, Loader2 } from 'lucide-react';
import type { User, Brand } from '../../types';
import { Avatar, RoleBadge } from './teamUi';
import { useApp } from '../../context/AppContext';

interface Props {
  member: User | null;
  isAdmin: boolean;
  assignedBrands: Brand[];
  updatingAvatar: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onAvatarChange: (file: File) => void;
  onAvatarRemove: () => void;
}

/** Deterministic colour for a brand initial. */
function brandColor(name: string): string {
  const palette = ['var(--info-text)', 'var(--success-text)', 'var(--warn-text)', 'var(--accent-text)', 'var(--danger-text)'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

/** Slide-over drawer showing one member's profile and assignments. */
export const MemberDrawer: React.FC<Props> = ({
  member, isAdmin, assignedBrands, updatingAvatar,
  onClose, onEdit, onAvatarChange, onAvatarRemove,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { currentUser, startDirectChat } = useApp();
  if (!member) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 900,
        }}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
          background: 'var(--bg-card)',
          zIndex: 901,
          boxShadow: '-12px 0 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto' as const,
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Avatar user={member} size={54} />
              {updatingAvatar && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(6, 26, 18, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <Loader2 style={{ width: 18, height: 18, color: '#4ade80' }} className="animate-spin" />
                </div>
              )}
              {isAdmin && (
                <label title="Upload or change member photo"
                  style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: updatingAvatar ? 'not-allowed' : 'pointer', border: '2px solid var(--bg)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', pointerEvents: updatingAvatar ? 'none' : 'auto' }}>
                  {updatingAvatar ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" /> : <Camera style={{ width: 11, height: 11 }} />}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} disabled={updatingAvatar}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatarChange(f); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{member.name}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 6px' }}>{member.designation || 'No designation'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RoleBadge role={member.role} />
                {isAdmin && member.avatar && (
                  <button onClick={onAvatarRemove} disabled={updatingAvatar}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-text)', fontSize: 11, fontWeight: 600, cursor: updatingAvatar ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, opacity: updatingAvatar ? 0.6 : 1 }}>
                    {updatingAvatar ? (
                      <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                    ) : (
                      <Trash2 style={{ width: 11, height: 11 }} />
                    )}
                    {updatingAvatar ? 'Updating…' : 'Remove photo'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Actions Bar */}
        {isAdmin && (
          <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => onEdit(member)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Edit3 style={{ width: 13, height: 13 }} /> Edit Team Member
            </button>
          </div>
        )}

        {/* Contact */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>Contact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Mail style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />, label: 'Email', value: member.email },
              ...(member.phone ? [{ icon: <Phone style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />, label: 'Phone', value: member.phone }] : []),
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned brands */}
        <div style={{ padding: '20px 28px', flex: 1 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>
            Assigned Brands ({assignedBrands.length})
          </h3>
          {assignedBrands.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>No brands assigned yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assignedBrands.map((brand: any) => (
                <div key={brand.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: brandColor(brand.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--solid-btn-text)', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                    {(brand.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{brand.name}</span>
                      {brand.status && brand.status !== 'Active' && (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 750,
                          background: brand.status === 'Churned' ? 'var(--danger-bg)' : 'var(--bg-subtle)',
                          color: brand.status === 'Churned' ? 'var(--danger-text)' : 'var(--text-muted)',
                          border: `1px solid ${brand.status === 'Churned' ? 'var(--danger-border)' : 'var(--border)'}`,
                        }}>
                          {brand.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {brand.status === 'Churned' ? 'Client Cancelled / Churned' : `${brand.assignedMemberIds?.length ?? 0} member${(brand.assignedMemberIds?.length ?? 0) !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default MemberDrawer;
