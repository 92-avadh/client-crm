import React from 'react';
import { Mail, Building2, ChevronRight, Edit3, UserX, Loader2, MessageSquare } from 'lucide-react';
import type { User } from '../../types';
import { Avatar, RoleBadge } from './teamUi';

interface Props {
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
  deactivatingId: string | null;
  getBrandCount: (userId: string) => number;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onDirectChat?: (userId: string) => void;
}

const GRID = '2.3fr 1.1fr 0.9fr 0.8fr 1.5fr 0.9fr';

/** Team members table (horizontally scrollable on mobile). */
export const TeamTable: React.FC<Props> = ({
  users, currentUserId, isAdmin, deactivatingId, getBrandCount, onView, onEdit, onDeactivate, onDirectChat,
}) => (
  <div className="table-scroll" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
    <div className="rg-team" style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '12px 24px', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
      <span>Member</span><span>Role</span><span>Brands</span><span>Status</span>
      <span style={{ textAlign: 'right' }}>Actions</span><span />
    </div>

    {(users || []).filter(Boolean).map((user: any, idx: number) => {
      const isActive = user?.isActive !== false && user?.status !== 'inactive';
      const brandCount = getBrandCount(user?.id);

      return (
        <div
          key={user.id}
          className="rg-team"
          style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, padding: '16px 24px', borderBottom: idx < users.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', opacity: isActive ? 1 : 0.5 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar user={user} size={42} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.designation || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Mail style={{ width: 10, height: 10 }} /> {user.email}
              </div>
            </div>
          </div>

          <div><RoleBadge role={user.role} /></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{brandCount}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>brand{brandCount !== 1 ? 's' : ''}</span>
          </div>

          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isActive ? 'var(--success-bg)' : 'var(--bg-raised)', color: isActive ? 'var(--success-text)' : 'var(--text-muted)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--success-text)' : 'var(--text-muted)', display: 'inline-block' }} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              {user.id !== currentUserId && onDirectChat && (
                <button
                  onClick={() => onDirectChat(user.id)}
                  title={`Chat with ${user.name}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 11px',
                    background: 'var(--brand-green-subtle, #ecfdf5)',
                    color: 'var(--brand-green, #059639)',
                    border: '1px solid var(--brand-green-subtle, #a7f3d0)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MessageSquare style={{ width: 13, height: 13 }} /> Chat
                </button>
              )}
              <button onClick={() => onView(user)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                View <ChevronRight style={{ width: 13, height: 13 }} />
              </button>
              {isAdmin && (
                <button onClick={() => onEdit(user)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  <Edit3 style={{ width: 13, height: 13 }} /> Edit
                </button>
              )}
            </div>
          </div>

          <div>
            {isAdmin && user.id !== currentUserId && isActive ? (
              <button onClick={() => onDeactivate(user)} disabled={deactivatingId === user.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--bg-card)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: deactivatingId === user.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const }}>
                {deactivatingId === user.id ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <UserX style={{ width: 12, height: 12 }} />}
                Deactivate
              </button>
            ) : <span />}
          </div>
        </div>
      );
    })}

    {users.length === 0 && (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        No team members yet. Click "Add Member" to get started.
      </div>
    )}
  </div>
);

export default TeamTable;
