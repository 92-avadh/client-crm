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
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Automated Retention & Anti-Churn Engine
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Detects client inactivity across chats, meetings, tasks, and payments to alert account leads before churn occurs.
          </p>
        </div>

        {/* Global Threshold Selector (Admin only per SRD Section 3.6) */}
        {role === 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 8, padding: '4px 8px' }}>
            <Sliders className="w-3.5 h-3.5 text-gray-500 ml-1" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#666666' }}>Trigger Threshold:</span>
            {[7, 15, 30].map((days) => (
              <button
                key={days}
                onClick={() => handleUpdateThreshold(days)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: settings.retentionThresholdDays === days ? '#0a0a0a' : 'transparent',
                  color: settings.retentionThresholdDays === days ? '#ffffff' : '#666666',
                }}
              >
                {days}d
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Retention Health Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="stat-card" style={retentionAlerts.length > 0 ? { border: '1.5px solid #0a0a0a' } : {}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="metric-label">Urgent Churn Risks</span>
            <AlertTriangle className="w-4 h-4 text-black" />
          </div>
          <div className="metric-value">
            {retentionAlerts.length}
          </div>
          <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>
            Clients inactive for &gt;{settings.retentionThresholdDays} days
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="metric-label">Active Client Retainers</span>
            <CheckCircle className="w-4 h-4 text-black" />
          </div>
          <div className="metric-value">
            {brands.filter((b) => b.status === 'Active').length}
          </div>
          <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>
            Healthy touchpoints logged recently
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="metric-label">Total Churned Accounts</span>
            <XCircle className="w-4 h-4 text-black" />
          </div>
          <div className="metric-value">
            {brands.filter((b) => b.status === 'Churned').length}
          </div>
          <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>
            Historical retained records
          </div>
        </div>
      </div>

      {/* Churn Risk Command Center */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Clients Requiring Immediate Reconnection</span>
              <span className="badge badge-danger text-xs">{retentionAlerts.length} Alerts</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated trigger: "No activity with [Client Name] for {settings.retentionThresholdDays} days. Reconnect now."
            </p>
          </div>
        </div>

        {retentionAlerts.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#131c2e] text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-bold text-white">All Client Retainers Are Healthy!</h3>
            <p className="text-xs text-slate-400 mt-1">
              No clients have crossed the {settings.retentionThresholdDays}-day inactivity threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {retentionAlerts.map(({ brand, daysInactive }) => (
              <div
                key={brand.id}
                className="p-4 rounded-xl bg-[#131c2e] border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{brand.name}</span>
                    <span className="badge badge-danger text-[10px]">
                      {daysInactive} Days Inactive
                    </span>
                    {/* Financial value hidden from team members strictly per SRD Section 3.6 */}
                    {role !== 'team' && (
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        ₹{brand.monthlyFee.toLocaleString('en-IN')}/mo Retainer at risk
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Contact: {brand.ownerName} ({brand.mobile})</span>
                    <span>•</span>
                    <span>Last touchpoint: {brand.lastActivityDate}</span>
                  </div>
                </div>

                {/* 1-Click Retention Actions per SRD Section 3.6 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* WhatsApp Click-to-Share Retention Template */}
                  <button
                    onClick={() => openWhatsAppRetentionShare(brand, daysInactive)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp Reconnect</span>
                  </button>

                  {/* Open Chat */}
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                    }}
                    className="btn-secondary text-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </button>

                  {/* Log Follow-up */}
                  <button
                    onClick={() => setSelectedBrandForLog(brand)}
                    className="btn-secondary text-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Log Call</span>
                  </button>

                  {/* Snooze 7 days */}
                  <button
                    onClick={() => snoozeBrandRetention(brand.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                    title="Snooze alert by 7 days"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>

                  {/* Mark as Churned (Admin/HR only) */}
                  {(role === 'admin' || role === 'hr') && (
                    <button
                      onClick={() => markBrandChurned(brand.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 text-xs font-semibold"
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
        <div className="modal-overlay" onClick={() => setSelectedBrandForLog(null)}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  Log Reconnect Call: {selectedBrandForLog.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Reset the retention inactivity timer by recording client engagement
                </p>
              </div>
              <button
                onClick={() => setSelectedBrandForLog(null)}
                className="p-1 rounded text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Call Notes / Agreed Next Steps
                </label>
                <textarea
                  rows={3}
                  placeholder="Discussed Q3 deliverables with Vikram. Sent revised timeline..."
                  value={callNote}
                  onChange={(e) => setCallNote(e.target.value)}
                  className="input-field"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-2">
                <button
                  onClick={() => setSelectedBrandForLog(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLogFollowUp(selectedBrandForLog.id)}
                  className="btn-primary text-xs"
                >
                  Save & Reset Inactivity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
