import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { Brand, ClientHealthScore, AgencyHealthOverview } from '../../types';
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
  Send,
  Star,
  ExternalLink,
  TrendingUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AnimatedNumber } from '../../hooks/useCountUp';

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 14px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none',
  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 14px', background: 'var(--bg-raised)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const badgeDanger: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--danger-text)' };
const badgeSuccess: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success-text)' };
const badgeWarning: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };

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
    setActiveConversationId,
    showToast
  } = useApp();

  const role = currentUser.role;

  const [healthData, setHealthData] = useState<AgencyHealthOverview | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [filterTier, setFilterTier] = useState<'all' | 'churn' | 'expansion' | 'stable'>('all');
  const [selectedBrandForLog, setSelectedBrandForLog] = useState<Brand | null>(null);
  const [callNote, setCallNote] = useState('');

  const fetchHealth = () => {
    setLoadingHealth(true);
    api.retention.getOverview()
      .then((res: AgencyHealthOverview) => setHealthData(res))
      .catch((err: any) => console.warn('Health overview fetch error:', err.message))
      .finally(() => setLoadingHealth(false));
  };

  useEffect(() => {
    fetchHealth();
  }, [brands.length]);

  const handleUpdateThreshold = (days: number) => {
    updateSettings({ retentionThresholdDays: days });
  };

  const handleLogFollowUp = (brandId: string) => {
    if (!callNote.trim()) return;
    logBrandActivity(brandId, `Logged Follow-up Call: ${callNote}`);
    showToast(`Touchpoint logged for client! Inactivity reset.`, 'success');
    setSelectedBrandForLog(null);
    setCallNote('');
    fetchHealth();
  };

  const openWhatsAppAction = (score: ClientHealthScore) => {
    const text = score.recommendation.suggestedMessage;
    const url = `https://wa.me/${score.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    logBrandActivity(score.brandId, `WhatsApp Outreach: ${score.recommendation.title}`);
    showToast('WhatsApp outreach triggered and activity logged!', 'success');
  };

  const getFilteredScores = () => {
    if (!healthData) return [];
    if (filterTier === 'churn') return healthData.scores.filter(s => s.totalScore < 60);
    if (filterTier === 'expansion') return healthData.scores.filter(s => s.totalScore >= 85);
    if (filterTier === 'stable') return healthData.scores.filter(s => s.totalScore >= 60 && s.totalScore < 85);
    return healthData.scores;
  };

  const filteredScores = getFilteredScores();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Algorithmic Client Health &amp; Retention Engine
            </h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: 11, fontWeight: 800 }}>
              v2.0 Algorithmic
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
            Computes a dynamic 0–100 health score based on Deliverable Velocity, Payment Punctuality, Strategic Review Cadence, and Client Feedback (NPS).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
          <button
            onClick={fetchHealth}
            disabled={loadingHealth}
            style={{ ...btnSecondary, fontSize: 12 }}
            title="Recalculate dynamic health scores across all active clients"
          >
            <RefreshCw style={{ width: 13, height: 13 }} className={loadingHealth ? 'animate-spin' : ''} />
            <span>Recalculate Scores</span>
          </button>

          {role === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px' }}>
              <Sliders style={{ width: 14, height: 14, color: 'var(--text-muted)', marginLeft: 4 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Lapse Trigger:</span>
              {[7, 15, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => handleUpdateThreshold(days)}
                  style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: settings.retentionThresholdDays === days ? 'var(--solid-btn-bg)' : 'transparent',
                    color: settings.retentionThresholdDays === days ? 'var(--solid-btn-text)' : 'var(--text-secondary)'
                  }}
                >
                  {days}d
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Pillars Algorithmic Formula Indicator */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            25%
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Deliverable Velocity</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasks completed vs delayed</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            25%
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Payment Punctuality</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Invoices cleared without overdue aging</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            25%
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Strategic Cadence</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Strategic review held in last 30d</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            25%
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Client NPS Feedback</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>1-click quarterly satisfaction rating</div>
          </div>
        </div>
      </div>

      {/* Retention Health Metrics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div
          onClick={() => setFilterTier('churn')}
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'churn' ? '2px solid #ef4444' : '1px solid var(--border)',
            background: filterTier === 'churn' ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="metric-label" style={{ color: '#ef4444' }}>🚨 Churn Warnings (&lt;60)</span>
            <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ color: '#ef4444' }}>
            <AnimatedNumber value={healthData?.overview.churnRisksCount || 0} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Immediate reconnect &amp; audit required</div>
        </div>

        <div
          onClick={() => setFilterTier('expansion')}
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'expansion' ? '2px solid #10b981' : '1px solid var(--border)',
            background: filterTier === 'expansion' ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="metric-label" style={{ color: '#10b981' }}>🌟 Upsell &amp; Expansion (&gt;85)</span>
            <Sparkles style={{ width: 16, height: 16, color: '#10b981' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ color: '#10b981' }}>
            <AnimatedNumber value={healthData?.overview.expansionCount || 0} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Top satisfaction; pitch Q4 scope bump</div>
        </div>

        <div
          onClick={() => setFilterTier('stable')}
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'stable' ? '2px solid var(--border-focus)' : '1px solid var(--border)',
            background: filterTier === 'stable' ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="metric-label">🟡 Stable Retainers (60-84)</span>
            <CheckCircle style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          </div>
          <div className="metric-value font-amount count-up">
            <AnimatedNumber value={healthData?.overview.stableCount || 0} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Healthy delivery &amp; active retainer cadence</div>
        </div>

        <div
          onClick={() => setFilterTier('all')}
          className="stat-card"
          style={{
            cursor: 'pointer',
            border: filterTier === 'all' ? '2px solid var(--border-focus)' : '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="metric-label">Average Health Score</span>
            <TrendingUp style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          </div>
          <div className="metric-value font-amount count-up" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <AnimatedNumber value={healthData?.overview.averageHealth || 100} />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Across {healthData?.overview.totalClients || brands.length} active agency retainers</div>
        </div>
      </div>

      {/* Interactive Tier Filter Tabs */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        {[
          { id: 'all', label: `All Clients (${healthData?.scores.length || 0})` },
          { id: 'churn', label: `🚨 Churn Warnings (${healthData?.overview.churnRisksCount || 0})` },
          { id: 'expansion', label: `🌟 Upsell Opportunities (${healthData?.overview.expansionCount || 0})` },
          { id: 'stable', label: `🟡 Stable Accounts (${healthData?.overview.stableCount || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTier(tab.id as any)}
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: filterTier === tab.id ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
              color: filterTier === tab.id ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Client Health Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredScores.length === 0 ? (
          <div style={{ padding: 48, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShieldCheck style={{ width: 44, height: 44, color: 'var(--success-text)', margin: '0 auto 12px' }} />
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', fontSize: 16 }}>No Clients in This Category</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              All client retainers in this segment have healthy touchpoint velocity and zero active blockers.
            </p>
          </div>
        ) : (
          filteredScores.map((score) => {
            const isDanger = score.totalScore < 60;
            const isExpansion = score.totalScore >= 85;
            const scoreColor = isDanger ? '#ef4444' : (isExpansion ? '#10b981' : '#38bdf8');
            const matchingBrand = brands.find(b => b.id === score.brandId);

            return (
              <div
                key={score.brandId}
                style={{
                  background: 'var(--bg-card)',
                  border: isDanger ? '1.5px solid rgba(239, 68, 68, 0.4)' : (isExpansion ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)'),
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: isDanger ? '0 8px 24px rgba(239, 68, 68, 0.08)' : 'none',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>
                        {score.brandName}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                          background: isDanger ? 'var(--danger-bg)' : (isExpansion ? 'var(--success-bg)' : 'rgba(56, 189, 248, 0.15)'),
                          color: scoreColor,
                        }}
                      >
                        {isDanger ? '🚨 Churn Warning' : (isExpansion ? '🌟 Expansion Opportunity' : '🟡 Stable Retainer')}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {score.currencySymbol}{score.monthlyFee.toLocaleString()}/mo Retainer
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Contact: {score.ownerName} · Mobile: {score.mobile}
                    </div>
                  </div>

                  {/* Health Score Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Health Score
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor, lineHeight: 1.1 }}>
                        {score.totalScore}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Factor Score Breakdown Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, background: 'var(--bg-subtle)', borderRadius: 12, padding: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deliverable Velocity</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{score.breakdown.taskVelocity.score}/25</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.taskVelocity.score / 25) * 100}%`, background: '#38bdf8' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{score.breakdown.taskVelocity.details}</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payment Health</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{score.breakdown.paymentHealth.score}/25</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.paymentHealth.score / 25) * 100}%`, background: '#10b981' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{score.breakdown.paymentHealth.details}</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Strategic Cadence</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{score.breakdown.strategicCadence.score}/25</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.strategicCadence.score / 25) * 100}%`, background: '#a855f7' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{score.breakdown.strategicCadence.details}</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Client Feedback (NPS)</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{score.breakdown.clientFeedback.score}/25</strong>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(score.breakdown.clientFeedback.score / 25) * 100}%`, background: '#f59e0b' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{score.breakdown.clientFeedback.details}</div>
                  </div>
                </div>

                {/* AI / Algorithmic Recommendation Banner */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: isDanger ? 'var(--danger-bg)' : (isExpansion ? 'var(--success-bg)' : 'var(--bg-subtle)'),
                    border: isDanger ? '1px solid var(--danger-border)' : (isExpansion ? '1px solid var(--success-border)' : '1px solid var(--border)'),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: isDanger ? 'var(--danger-text)' : (isExpansion ? 'var(--success-text)' : 'var(--text-primary)') }}>
                    {score.recommendation.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {score.recommendation.description}
                  </div>
                </div>

                {/* Action buttons row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openWhatsAppAction(score)}
                    style={{
                      ...btnPrimary,
                      background: isDanger ? '#ef4444' : (isExpansion ? '#10b981' : 'var(--solid-btn-bg)'),
                      color: '#ffffff',
                    }}
                  >
                    <Share2 style={{ width: 14, height: 14 }} />
                    <span>{isDanger ? '1-Click WhatsApp Reconnect' : (isExpansion ? '1-Click Pitch Upsell' : 'WhatsApp Check-in')}</span>
                  </button>

                  {matchingBrand?.magicToken && (
                    <button
                      onClick={() => window.open(`/portal/${matchingBrand.magicToken}`, '_blank')}
                      style={{ ...btnSecondary, fontSize: 12 }}
                      title="Open passwordless Magic Link client portal"
                    >
                      <ExternalLink style={{ width: 13, height: 13 }} />
                      <span>View Client Portal</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (matchingBrand) {
                        setSelectedBrandId(matchingBrand.id);
                        setActiveTab('clients');
                      }
                    }}
                    style={{ ...btnSecondary, fontSize: 12 }}
                  >
                    <Activity style={{ width: 13, height: 13 }} />
                    <span>Open Client Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      if (matchingBrand) setSelectedBrandForLog(matchingBrand);
                    }}
                    style={{ ...btnSecondary, fontSize: 12 }}
                  >
                    <PhoneCall style={{ width: 13, height: 13 }} />
                    <span>Log Touchpoint</span>
                  </button>

                  <button
                    onClick={() => {
                      snoozeBrandRetention(score.brandId);
                      fetchHealth();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-raised)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Snooze alert by 7 days"
                  >
                    <Clock style={{ width: 13, height: 13 }} />
                    <span>Snooze (7d)</span>
                  </button>

                  {(role === 'admin' || role === 'hr') && isDanger && (
                    <button
                      onClick={() => {
                        markBrandChurned(score.brandId);
                        fetchHealth();
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: 12,
                        marginLeft: 'auto',
                      }}
                    >
                      Archive Churned
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Touchpoint Modal */}
      {selectedBrandForLog && (
        <div style={modalOverlay} onClick={() => setSelectedBrandForLog(null)}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Log Strategic Sync: {selectedBrandForLog.name}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Logging a strategic review resets the client inactivity counter and updates their strategic cadence factor to 25/25.
              </p>
            </div>

            <textarea
              rows={4}
              placeholder="Summary of strategic discussion, deliverables discussed, next sync date..."
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              style={inputFieldStyle}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelectedBrandForLog(null)} style={btnSecondary}>
                Cancel
              </button>
              <button onClick={() => handleLogFollowUp(selectedBrandForLog.id)} style={btnPrimary}>
                <CheckCircle style={{ width: 14, height: 14 }} />
                <span>Save Touchpoint</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionEngine;
