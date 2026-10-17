import React from 'react';
import { X, FileText, Users, MessageSquare, CheckCircle } from 'lucide-react';
import type { Brand, User, Invoice, Task } from '../../types';
import { useApp } from '../../context/AppContext';

export type ProfileTab = 'overview' | 'team' | 'financials' | 'tasks' | 'timeline';

interface Props {
  brand: Brand | null;
  role: string;
  allUsers: User[];
  invoices: Invoice[];
  tasks: Task[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onClose: () => void;
  onChat: (brandId: string) => void;
}

const cardStyle: React.CSSProperties = {
  padding: 14, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)',
};
const capStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)',
};

/** Client profile drawer with tabbed detail panes. */
export const ClientProfileDrawer: React.FC<Props> = ({
  brand, role, allUsers, invoices, tasks, activeTab, onTabChange, onClose, onChat,
}) => {
  const { currencySymbol = '₹' } = useApp();
  const formatAmt = (n: number) => `${currencySymbol}${Number(n || 0).toLocaleString()}`;
  if (!brand) return null;

  const assignedUsers = allUsers.filter((u) => (brand.assignedMemberIds || []).includes(u.id));
  const brandInvoices = invoices.filter((i) => i.brandId === brand.id);
  const brandTasks = tasks.filter((t) => t.brandId === brand.id);

  const tabs = [
    { id: 'overview' as const, label: 'Overview & Contacts' },
    { id: 'team' as const, label: 'Assigned Team' },
    ...(role !== 'team' ? [{ id: 'financials' as const, label: 'Billing & Invoices' }] : []),
    { id: 'tasks' as const, label: 'Deliverables & Tasks' },
    { id: 'timeline' as const, label: 'Activity Timeline' },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 900 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(720px, 100vw)', background: 'var(--bg-card)', zIndex: 901, boxShadow: '-12px 0 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, background: 'var(--bg-subtle)' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{brand.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {brand.ownerName} · {brand.state}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--bg-subtle)', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '12px 16px', fontSize: 12, fontWeight: 600, border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--border-focus)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={cardStyle}>
                  <span style={capStyle}>Phone &amp; Email</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{brand.mobile}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{brand.email}</div>
                </div>
                <div style={cardStyle}>
                  <span style={capStyle}>Billing Address</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{brand.billingAddress}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{brand.state} - {brand.pincode}</div>
                </div>
              </div>

              {role !== 'team' && (
                <div className="rg-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={cardStyle}>
                    <span style={capStyle}>GSTIN</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                      {brand.gstNumber || 'Unregistered'}
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <span style={capStyle}>PAN</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                      {brand.pan || 'N/A'}
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <span style={capStyle}>Monthly Retainer</span>
                    <div className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontSize: 14 }}>
                      {formatAmt(brand.monthlyFee)}
                    </div>
                  </div>
                </div>
              )}

              <div style={cardStyle}>
                <span style={capStyle}>Contracted Service &amp; Scope</span>
                <p style={{ color: 'var(--text-primary)', marginTop: 6, lineHeight: 1.5 }}>{brand.serviceDetails}</p>
              </div>

              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                  Attached Contracts &amp; KYC
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {brand.documents.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 12, background: 'var(--bg-subtle)', borderRadius: 8 }}>
                      No documents uploaded yet.
                    </div>
                  ) : (
                    brand.documents.map((doc) => (
                      <div key={doc.id} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({doc.size})</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Uploaded {doc.uploadDate}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assignedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No team members assigned to this client yet.
                </div>
              ) : (
                assignedUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.designation || u.role}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'financials' && role !== 'team' && (
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
              {brandInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No invoices raised for this client yet.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Invoice #</th><th>Issue</th><th>Due</th><th style={{ textAlign: 'right' }}>Total</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {brandInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.issueDate}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.dueDate}</td>
                        <td className="font-amount" style={{ textAlign: 'right', fontWeight: 800 }}>{formatAmt(inv.totalAmount)}</td>
                        <td style={{ fontSize: 12 }}>{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brandTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No deliverables recorded for this client yet.
                </div>
              ) : (
                brandTasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle style={{ width: 15, height: 15, color: t.status === 'Completed' ? 'var(--success-text)' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.status}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Client onboarded', value: brand.onboardingDate },
                { label: 'Last activity', value: brand.lastActivityDate },
                { label: 'Last payment', value: brand.lastPaymentDate || 'No payment recorded' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Users style={{ width: 14, height: 14 }} />
            {assignedUsers.length} team member{assignedUsers.length !== 1 ? 's' : ''}
          </div>
          <button onClick={() => onChat(brand.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <MessageSquare style={{ width: 14, height: 14 }} />
            Open Chat
          </button>
        </div>
      </div>
    </>
  );
};

export default ClientProfileDrawer;
