import React from 'react';
import { X, Check } from 'lucide-react';
import type { Brand, User } from '../../types';

interface Props {
  brand: Brand | null;
  allUsers: User[];
  draftIds: string[];
  onToggle: (userId: string) => void;
  onClose: () => void;
  onSave: () => void;
}

/** Assign team members to a client. */
export const AssignMembersModal: React.FC<Props> = ({
  brand, allUsers, draftIds, onToggle, onClose, onSave,
}) => {
  if (!brand) return null;

  const candidates = allUsers.filter((u) => u.role !== 'brand' && u.role !== 'admin');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: 'min(90vh, 640px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)', overflow: 'hidden', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Assign Team: {brand.name}
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
              Selected members will gain view-only access to this client.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
          {candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No team members available to assign.
            </div>
          ) : (
            candidates.map((user) => {
              const checked = draftIds.includes(user.id);
              return (
                <label
                  key={user.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 10, cursor: 'pointer',
                    background: checked ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                    border: checked ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: checked ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
                      border: checked ? 'none' : '1px solid var(--border-strong)',
                      color: 'var(--solid-btn-text)',
                    }}
                  >
                    {checked && <Check style={{ width: 13, height: 13 }} />}
                  </span>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(user.id)} style={{ display: 'none' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {user.designation || user.role}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {draftIds.length} selected
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ padding: '9px 16px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={onSave}
              style={{ padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Save Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignMembersModal;
