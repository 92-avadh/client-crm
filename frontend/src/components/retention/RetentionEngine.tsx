import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Brand } from '../../types';
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  PhoneCall,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
  Share2,
  Sliders,
  XCircle,
  Send
} from 'lucide-react';

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--bg-raised)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const badgeDanger: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--danger-text)' };

export const RetentionEngine: React.FC = () => {
  const {
    currentUser,
    brands,
    retentionAlerts,
    settings,
    updateSettings,
    snoozeBrandRetention,
    markBrandChurned,
    logBrandActivity,
    setActiveTab,
    setSelectedBrandId,
    showToast
  } = useApp();

  const role = currentUser.role;

  const [thresholdInput, setThresholdInput] = useState(settings.retentionThresholdDays);
  const [selectedBrandForLog, setSelectedBrandForLog] = useState<Brand | null>(null);
  const [callNote, setCallNote] = useState('');

  const handleUpdateThreshold = (days: number) => {
    setThresholdInput(days);
    updateSettings({ retentionThresholdDays: days });
  };

  const handleLogFollowUp = (brandId: string) => {
    if (!callNote.trim()) return;
    logBrandActivity(brandId, `Logged Follow-up Call: ${callNote}`);
    showToast(`Touchpoint logged for client! Inactivity reset.`, 'success');
    setSelectedBrandForLog(null);
    setCallNote('');
  };

  const openWhatsAppRetentionShare = (brand: Brand, days: number) => {
    const text = `Hi ${brand.ownerName}, hope you're having a productive week! We noticed it's been ${days} days since our last strategic sync on ${brand.name}. Wanted to touch base and ensure all your compliance & deliverables are running smoothly. When would be a good time for a quick 10-minute catch up?`;
    const url = `https://wa.me/${brand.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    logBrandActivity(brand.id, 'Sent WhatsApp Retention Reconnect Message');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Automated Retention &amp; Anti-Churn Engine
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Detects client inactivity across chats, meetings, tasks, and payments to alert account leads before churn occurs.
          </p>
        </div>

        {role === 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px' }}>
            <Sliders style={{ width: 14, height: 14, color: 'var(--text-muted)', marginLeft: 4 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Trigger Threshold:</span>
            {[7, 15, 30].map((days) => (
              <button
                key={days}
                onClick={() => handleUpdateThreshold(days)}
                style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: settings.retentionThresholdDays === days ? 'var(--solid-btn-bg)' : 'transparent', color: settings.retentionThresholdDays === days ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}
              >
                {days}d
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Retention Health Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="stat-card" style={retentionAlerts.length > 0 ? { border: '1.5px solid var(--border-focus)' } : {}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="metric-label">Urgent Churn Risks</span>
            <AlertTriangle style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          </div>
          <div className="metric-value">{retentionAlerts.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Clients inactive for &gt;{settings.retentionThresholdDays} days
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="metric-label">Active Client Retainers</span>
            <CheckCircle style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          </div>
          <div className="metric-value">{brands.filter((b) => b.status === 'Active').length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Healthy touchpoints logged recently</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="metric-label">Total Churned Accounts</span>
            <XCircle style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          </div>
          <div className="metric-value">{brands.filter((b) => b.status === 'Churned').length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Historical retained records</div>
        </div>
      </div>

      {/* Churn Risk Command Center */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span>Clients Requiring Immediate Reconnection</span>
              <span style={badgeDanger}>{retentionAlerts.length} Alerts</span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Automated trigger: "No activity with [Client Name] for {settings.retentionThresholdDays} days. Reconnect now."
            </p>
          </div>
        </div>

        {retentionAlerts.length === 0 ? (
          <div style={{ padding: 32, borderRadius: 12, background: 'var(--bg-subtle)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShieldCheck style={{ width: 48, height: 48, color: 'var(--success-text)', margin: '0 auto 8px' }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>All Client Retainers Are Healthy!</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              No clients have crossed the {settings.retentionThresholdDays}-day inactivity threshold.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {retentionAlerts.map(({ brand, daysInactive }) => (
              <div
                key={brand.id}
                style={{ padding: 16, borderRadius: 12, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{brand.name}</span>
                    <span style={badgeDanger}>{daysInactive} Days Inactive</span>
                    {role !== 'team' && (
                      <span className="font-amount" style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-text)' }}>
                        ₹{brand.monthlyFee.toLocaleString('en-IN')}/mo Retainer at risk
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span>Contact: {brand.ownerName} ({brand.mobile})</span>
                    <span>•</span>
                    <span>Last touchpoint: {brand.lastActivityDate}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openWhatsAppRetentionShare(brand, daysInactive)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <Share2 style={{ width: 14, height: 14 }} />
                    <span>WhatsApp Reconnect</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('chat'); }}
                    style={{ ...btnSecondary, fontSize: 12 }}
                  >
                    <MessageSquare style={{ width: 14, height: 14 }} />
                    <span>Open Chat</span>
                  </button>

                  <button
                    onClick={() => setSelectedBrandForLog(brand)}
                    style={{ ...btnSecondary, fontSize: 12 }}
                  >
                    <PhoneCall style={{ width: 14, height: 14 }} />
                    <span>Log Call</span>
                  </button>

                  <button
                    onClick={() => snoozeBrandRetention(brand.id)}
                    style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Snooze alert by 7 days"
                  >
                    <Clock style={{ width: 14, height: 14 }} />
                  </button>

                  {(role === 'admin' || role === 'hr') && (
                    <button
                      onClick={() => markBrandChurned(brand.id)}
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      title="Mark Client as Churned"
                    >
                      Churn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Follow-up Modal */}
      {selectedBrandForLog && (
        <div style={modalOverlay} onClick={() => setSelectedBrandForLog(null)}>
          <div
            style={{ background: 'var(--bg-card)', borderRadius: 18, width: '100%', maxWidth: 448, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, margin: 0 }}>
                  Log Reconnect Call: {selectedBrandForLog.name}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Reset the retention inactivity timer by recording client engagement
                </p>
              </div>
              <button
                onClick={() => setSelectedBrandForLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                  Call Notes / Agreed Next Steps
                </label>
                <textarea
                  rows={3}
                  placeholder="Discussed Q3 deliverables with Vikram. Sent revised timeline..."
                  value={callNote}
                  onChange={(e) => setCallNote(e.target.value)}
                  style={inputFieldStyle}
                ></textarea>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setSelectedBrandForLog(null)} style={{ ...btnSecondary, fontSize: 12 }}>
                  Cancel
                </button>
                <button
                  onClick={() => handleLogFollowUp(selectedBrandForLog.id)}
                  style={{ ...btnPrimary, fontSize: 12 }}
                >
                  Save &amp; Reset Inactivity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
