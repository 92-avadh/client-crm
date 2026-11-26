import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { Brand, ClientHealthScore, AgencyHealthOverview } from '../../types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Wallet,
  CalendarCheck,
  Smile,
  PhoneCall,
  ShieldCheck,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  HeartPulse,
  BookOpen,
  User,
} from 'lucide-react';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { PageGuideModal } from '../common/PageGuideModal';

const inputFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14,
  color: 'var(--text-primary)',
  background: 'var(--bg-subtle)',
  outline: 'none',
  boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 15px',
  background: 'var(--solid-btn-bg)',
  color: 'var(--solid-btn-text)',
  border: 'none',
  borderRadius: 9,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 15px',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 9,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'var(--overlay)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

export const RetentionEngine: React.FC = () => {
  const {
    currentUser,
    brands,
    settings,
    updateSettings,
    markBrandChurned,
    logBrandActivity,
    setActiveTab,
    setSelectedBrandId,
    showToast,
  } = useApp();

  const role = currentUser.role;

  const [healthData, setHealthData] = useState<AgencyHealthOverview | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [filterTier, setFilterTier] = useState<'all' | 'churn' | 'expansion' | 'stable'>('all');
  const [selectedBrandForLog, setSelectedBrandForLog] = useState<Brand | null>(null);
  const [callNote, setCallNote] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const fetchHealth = () => {
    setLoadingHealth(true);
    return api.retention
      .getOverview()
      .then((res: AgencyHealthOverview) => setHealthData(res))
      .catch((err: any) => console.warn('Health overview fetch error:', err.message))
      .finally(() => setLoadingHealth(false));
  };

  useEffect(() => {
    fetchHealth();
  }, [brands.length]);

  const handleUpdateThreshold = (days: number) => {
    updateSettings({ retentionThresholdDays: days });
    showToast(`Inactivity reminder set to ${days} days`, 'info');
  };

  const handleLogFollowUp = (brandId: string) => {
    if (!callNote.trim()) return;
    logBrandActivity(brandId, `Follow-up Call: ${callNote}`);
    showToast('Call note saved!', 'success');
    setSelectedBrandForLog(null);
    setCallNote('');
    fetchHealth();
  };

  const openWhatsAppAction = (score: ClientHealthScore) => {
    const text = score.recommendation.suggestedMessage;
    const url = `https://wa.me/${score.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    logBrandActivity(score.brandId, `WhatsApp Check-in: ${score.recommendation.title}`);
    showToast('Opened WhatsApp check-in message', 'success');
  };

  const getFilteredScores = () => {
    if (!healthData) return [];
    if (filterTier === 'churn') return healthData.scores.filter((s) => s.totalScore < 60);
    if (filterTier === 'expansion') return healthData.scores.filter((s) => s.totalScore >= 85);
    if (filterTier === 'stable') return healthData.scores.filter((s) => s.totalScore >= 60 && s.totalScore < 85);
    return healthData.scores;
  };

  const filteredScores = getFilteredScores();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ── Simple Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              data-tip="Shows how happy each client is (0 to 100)"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HeartPulse size={20} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Client Health
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
            A simple 0–100 score for each active client based on tasks, payments, check-ins, and client feedback.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            data-tip="Simple explanation of this page"
            style={{
              ...btnSecondary,
              background: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#059669',
            }}
          >
            <BookOpen size={14} />
            <span>How This Works</span>
          </button>

          <button
            type="button"
            onClick={fetchHealth}
            disabled={loadingHealth}
            data-tip="Recalculate scores using latest tasks & payments"
            style={btnSecondary}
          >
            <RefreshCw style={{ width: 14, height: 14, color: '#0284c7' }} className={loadingHealth ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {role === 'admin' && (
            <select
              value={settings.retentionThresholdDays || 15}
              onChange={(e) => handleUpdateThreshold(Number(e.target.value))}
              aria-label="Inactivity reminder days"
              data-tip="Get an alert if no one talks to a client for this many days"
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <option value={7}>Alert if quiet: 7 days</option>
              <option value={15}>Alert if quiet: 15 days</option>
              <option value={30}>Alert if quiet: 30 days</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Click-to-Filter Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div
          onClick={() => setFilterTier(filterTier === 'churn' ? 'all' : 'churn')}
          data-tip="Click to show clients who need a call or message soon"
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'churn' ? '2px solid #ef4444' : '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="metric-label" style={{ color: '#ef4444' }}>Needs Attention (Under 60)</span>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ color: '#ef4444' }}>
            <AnimatedNumber value={healthData?.overview.churnRisksCount || 0} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Follow up soon</div>
        </div>

        <div
          onClick={() => setFilterTier(filterTier === 'stable' ? 'all' : 'stable')}
          data-tip="Click to show clients doing well (score 60–84)"
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'stable' ? '2px solid #0284c7' : '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="metric-label" style={{ color: '#0284c7' }}>On Track (60–84)</span>
            <ShieldCheck size={16} style={{ color: '#0284c7' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ color: '#0284c7' }}>
            <AnimatedNumber value={healthData?.overview.stableCount || 0} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Work &amp; bills on time</div>
        </div>

        <div
          onClick={() => setFilterTier(filterTier === 'expansion' ? 'all' : 'expansion')}
          data-tip="Click to show your happiest clients (score 85+)"
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'expansion' ? '2px solid #10b981' : '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="metric-label" style={{ color: '#10b981' }}>Very Happy (85+)</span>
            <TrendingUp size={16} style={{ color: '#10b981' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ color: '#10b981' }}>
            <AnimatedNumber value={healthData?.overview.expansionCount || 0} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Great for extra work</div>
        </div>

        <div
          onClick={() => setFilterTier('all')}
          data-tip="Click to show all active clients"
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'all' ? '2px solid var(--border-focus)' : '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="metric-label">Average Score</span>
            <Activity size={16} style={{ color: '#6366f1' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <AnimatedNumber value={healthData?.overview.averageHealth || 100} />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {healthData?.overview.totalClients || brands.length} active clients
          </div>
        </div>
      </div>

      {/* ── Client Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredScores.length === 0 ? (
          <div style={{ padding: 44, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <CheckCircle2 style={{ width: 40, height: 40, color: '#10b981', margin: '0 auto 10px' }} />
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', fontSize: 16 }}>
              No clients in this filter
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Click &ldquo;Show All Clients&rdquo; to see everyone.
            </p>
            {filterTier !== 'all' && (
              <button type="button" onClick={() => setFilterTier('all')} style={btnSecondary}>
                Show All Clients
              </button>
            )}
          </div>
        ) : (
          filteredScores.map((score) => {
            const isDanger = score.totalScore < 60;
            const isExpansion = score.totalScore >= 85;
            const scoreColor = isDanger ? '#ef4444' : isExpansion ? '#10b981' : '#0284c7';
            const statusBg = isDanger ? 'rgba(239, 68, 68, 0.12)' : isExpansion ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.12)';
            const matchingBrand = brands.find((b) => b.id === score.brandId);

            return (
              <div
                key={score.brandId}
                style={{
                  background: 'var(--bg-card)',
                  border: isDanger ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>
                        {score.brandName}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 800,
                          background: statusBg,
                          color: scoreColor,
                        }}
                      >
                        {isDanger ? <AlertTriangle size={12} /> : isExpansion ? <TrendingUp size={12} /> : <CheckCircle2 size={12} />}
                        <span>{isDanger ? 'Needs Attention' : isExpansion ? 'Very Happy' : 'On Track'}</span>
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {score.currencySymbol}{score.monthlyFee.toLocaleString()}/mo
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      Contact: {score.ownerName} · {score.mobile}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }} data-tip="Total score out of 100">
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Score
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor, lineHeight: 1.1 }}>
                      {score.totalScore}<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/100</span>
                    </div>
                  </div>
                </div>

                {/* Simple 4-Part Score Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, background: 'var(--bg-subtle)', borderRadius: 12, padding: 12 }}>
                  <div data-tip="Tasks finished on time (out of 25)">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <CheckSquare size={13} style={{ color: '#0284c7' }} /> Tasks Finished
                      </span>
                      <strong>{score.breakdown.taskVelocity.score}/25</strong>
                    </div>
                    <div style={{ height: 5, borderRadius: 6, background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.taskVelocity.score / 25) * 100}%`, background: '#0284c7' }} />
                    </div>
                  </div>

                  <div data-tip="Invoices paid on time (out of 25)">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Wallet size={13} style={{ color: '#10b981' }} /> Payments on Time
                      </span>
                      <strong>{score.breakdown.paymentHealth.score}/25</strong>
                    </div>
                    <div style={{ height: 5, borderRadius: 6, background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.paymentHealth.score / 25) * 100}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  <div data-tip="Recent calls or meetings (out of 25)">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <CalendarCheck size={13} style={{ color: '#8b5cf6' }} /> Recent Check-ins
                      </span>
                      <strong>{score.breakdown.strategicCadence.score}/25</strong>
                    </div>
                    <div style={{ height: 5, borderRadius: 6, background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.strategicCadence.score / 25) * 100}%`, background: '#8b5cf6' }} />
                    </div>
                  </div>

                  <div data-tip="Client rating from portal (out of 25)">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Smile size={13} style={{ color: '#f59e0b' }} /> Client Rating
                      </span>
                      <strong>{score.breakdown.clientFeedback.score}/25</strong>
                    </div>
                    <div style={{ height: 5, borderRadius: 6, background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.clientFeedback.score / 25) * 100}%`, background: '#f59e0b' }} />
                    </div>
                  </div>
                </div>

                {/* Simple Next Action Tip */}
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '10px 14px', borderRadius: 10, background: statusBg }}>
                  <strong style={{ color: scoreColor }}>Tip:</strong> {score.recommendation.description}
                </div>

                {/* Only 3 Clear, Predictable Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openWhatsAppAction(score)}
                    data-tip="Opens WhatsApp to send a quick check-in message"
                    style={{
                      ...btnPrimary,
                      background: '#059669',
                      color: '#ffffff',
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>Message on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (matchingBrand) setSelectedBrandForLog(matchingBrand);
                    }}
                    data-tip="Write down what you discussed on a call or meeting"
                    style={btnSecondary}
                  >
                    <PhoneCall size={14} style={{ color: '#0284c7' }} />
                    <span>Save Call Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (matchingBrand) {
                        setSelectedBrandId(matchingBrand.id);
                        setActiveTab('clients');
                      }
                    }}
                    data-tip="Go to this client's profile, portal link & invoices"
                    style={btnSecondary}
                  >
                    <User size={14} style={{ color: '#6366f1' }} />
                    <span>Open Client</span>
                  </button>

                  {(role === 'admin' || role === 'hr') && isDanger && (
                    <button
                      type="button"
                      onClick={async () => {
                        await markBrandChurned(score.brandId);
                        await fetchHealth();
                      }}
                      data-tip="Move client to Inactive so they stop showing in new invoices"
                      style={{
                        ...btnSecondary,
                        color: 'var(--danger-text)',
                        marginLeft: 'auto',
                      }}
                    >
                      Mark Inactive
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Call Note Modal */}
      {selectedBrandForLog && (
        <div style={modalOverlay} onClick={() => setSelectedBrandForLog(null)}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 460,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Save Call Note — {selectedBrandForLog.name}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Record what you discussed so this client stays marked as active.
              </p>
            </div>

            <textarea
              rows={4}
              placeholder="Write what you talked about and the next step..."
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              style={inputFieldStyle}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setSelectedBrandForLog(null)} style={btnSecondary}>
                Cancel
              </button>
              <button type="button" onClick={() => handleLogFollowUp(selectedBrandForLog.id)} style={btnPrimary}>
                <CheckCircle2 size={14} />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PageGuideModal open={showGuide} pageId="retention" onClose={() => setShowGuide(false)} />
    </div>
  );
};
