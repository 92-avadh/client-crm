import React from 'react';
import { Building2, Users, MapPin, ArrowRight, Edit3, UserPlus } from 'lucide-react';
import type { Brand, User } from '../../types';

export type ClientRole = 'admin' | 'hr' | 'team' | 'brand';

interface Props {
  brands: Brand[];
  allUsers: User[];
  role: ClientRole;
  onView: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onAssign: (brand: Brand) => void;
}

/** Shows how long a client has been inactive. */
export const InactivityBadge: React.FC<{ lastActivityDate: string }> = ({ lastActivityDate }) => {
  const days = Math.floor(
    (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 7) return null;

  const urgent = days >= 15;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
      background: urgent ? 'var(--danger-bg)' : 'var(--warn-bg)',
      color: urgent ? 'var(--danger-text)' : 'var(--warn-text)',
      border: `1px solid ${urgent ? 'var(--danger-border)' : 'var(--warn-border)'}`,
    }}>
      {days}d inactive
    </span>
  );
};

/** Responsive grid of client cards. */
export const ClientGrid: React.FC<Props> = ({ brands, allUsers, role, onView, onEdit, onAssign }) => {
  const canManage = role === 'admin' || role === 'hr';

  if (brands.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
        <Building2 style={{ width: 36, height: 36, margin: '0 auto 12px', color: 'var(--text-muted)' }} />
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No clients found</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {role === 'team'
            ? 'You have not been assigned to any clients yet.'
            : 'Try adjusting your search or onboarding a new client.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
      {brands.map((brand) => {
        const assignedUsers = allUsers.filter((u) => brand.assignedMemberIds.includes(u.id));

        return (
          <div
            key={brand.id}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-primary)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{brand.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Users style={{ width: 13, height: 13 }} />
                    <span>{brand.ownerName}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <InactivityBadge lastActivityDate={brand.lastActivityDate} />
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                    background: brand.paymentStatus === 'Pending' ? 'var(--warn-bg)' : 'var(--success-bg)',
                    color: brand.paymentStatus === 'Pending' ? 'var(--warn-text)' : 'var(--success-text)',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: brand.paymentStatus === 'Pending' ? 'var(--warn-text)' : 'var(--success-text)' }} />
                    {brand.paymentStatus === 'Pending' ? 'Pending' : 'Paid'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16, lineHeight: 1.5 }}>
                {brand.serviceDetails}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
                    {brand.state}
                  </span>
                  {role !== 'team' && (
                    <span className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                      ₹{brand.monthlyFee.toLocaleString('en-IN')}/mo
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Billing Cycle:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {role === 'team' ? 'Managed by Admin' : `${brand.billingCycleDay}st of month`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                  <span>Assigned Team:</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {assignedUsers.length === 0 ? (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    ) : (
                      assignedUsers.map((u) => (
                        u.avatar ? (
                          <img key={u.id} src={u.avatar} alt={u.name} title={`${u.name} (${u.designation})`}
                            style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        ) : (
                          <div key={u.id} title={`${u.name} (${u.designation})`}
                            style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => onView(brand)}
                style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                <span>View Profile</span>
                <ArrowRight style={{ width: 13, height: 13 }} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {canManage && (
                  <button onClick={() => onEdit(brand)} title="Edit Client Details & Payment Status"
                    style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 style={{ width: 12, height: 12 }} />
                    <span>Edit</span>
                  </button>
                )}
                {canManage && (
                  <button onClick={() => onAssign(brand)} title="Assign Team Members"
                    style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <UserPlus style={{ width: 12, height: 12 }} />
                    <span>Assign</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientGrid;
