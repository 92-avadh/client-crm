import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { PortalData } from '../../types';
import { PremiumLogoLoader } from '../common/PremiumLogoLoader';
import { QrCodeImage } from '../common/QrCodeImage';
import {
  CheckCircle2,
  AlertTriangle,
  Star,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Printer,
  Layers,
  Receipt,
  Calendar,
  X,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Globe,
  CreditCard,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

function formatOrdinalDay(dayInput?: number): string {
  const day = Math.max(1, Math.min(31, Number(dayInput) || 1));
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th of every month`;
  switch (day % 10) {
    case 1:
      return `${day}st of every month`;
    case 2:
      return `${day}nd of every month`;
    case 3:
      return `${day}rd of every month`;
    default:
      return `${day}th of every month`;
  }
}

export const ClientPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');

  // 1-Click Micro-Survey State
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedSurveyChoice, setSelectedSurveyChoice] = useState<'great' | 'okay' | 'help' | null>(null);

  // Active Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 3;

    const fetchPortal = async () => {
      try {
        const res = await api.portal.get(token);
        if (!isMounted) return;
        setData(res);
        if (res.client?.npsScore) {
          if (res.client.npsScore >= 8) setSelectedSurveyChoice('great');
          else if (res.client.npsScore >= 5) setSelectedSurveyChoice('okay');
          else setSelectedSurveyChoice('help');
        } else {
          const dismissed = sessionStorage.getItem(`retentio_survey_dismissed_${token}`);
          if (!dismissed) {
            setTimeout(() => {
              if (isMounted) setShowSurveyModal(true);
            }, 1000);
          }
        }
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchPortal, 2500);
        } else {
          setError(err.message || 'Unable to connect to the client portal. Please try again shortly.');
          setLoading(false);
        }
      }
    };

    fetchPortal();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleDismissSurveyModal = async () => {
    setShowSurveyModal(false);
    sessionStorage.setItem(`retentio_survey_dismissed_${token}`, 'true');
    if (token) {
      try {
        await api.portal.scheduleSurveyReminder(token);
      } catch (err) {
        console.warn('Failed to schedule survey reminder:', err);
      }
    }
  };

  const handleSelectChoiceAndSubmit = async (choice: 'great' | 'okay' | 'help') => {
    if (!token) return;
    const score = choice === 'great' ? 10 : choice === 'okay' ? 7 : 3;
    const label = choice === 'great' ? 'Great' : choice === 'okay' ? 'Okay' : 'Need Help';
    setSelectedSurveyChoice(choice);
    setIsSubmittingFeedback(true);
    try {
      await api.portal.submitFeedback(token, {
        score,
        comment: feedbackNote || `1-Click response: ${label}`,
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowSurveyModal(false);
        setFeedbackSuccess(false);
      }, 1600);
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleOpenInvoice = async (invoiceId: string) => {
    if (!token) return;
    setLoadingInvoice(true);
    try {
      const details = await api.portal.getInvoice(token, invoiceId);
      setSelectedInvoice(details);
    } catch (err: any) {
      alert(err.message || 'Could not load invoice details.');
    } finally {
      setLoadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <PremiumLogoLoader
        variant="fullscreen"
        message="Opening your client portal..."
        size="lg"
      />
    );
  }

  if (!token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #ecfdf5 100%)',
          padding: 24,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#059669',
            }}
          >
            <Globe style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 10px' }}>
            Client Portal Access
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            Paste your secure portal link or access token from your agency to view deliverables and invoices.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              let clean = manualToken.trim();
              if (clean.includes('/portal/')) {
                clean = clean.split('/portal/')[1].split('/')[0].split('?')[0];
              }
              if (!clean) return;
              window.location.href = `/portal/${clean}`;
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}
          >
            <input
              type="text"
              placeholder="Paste portal link or access token..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                color: '#0f172a',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={!manualToken.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: manualToken.trim() ? 'pointer' : 'not-allowed',
                opacity: manualToken.trim() ? 1 : 0.6,
              }}
            >
              Open Client Portal →
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
            <a href="/login/company" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
              Agency Sign In
            </a>
            <span>·</span>
            <a href="/login/employee" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
              Team Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: '100%',
            background: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: 20,
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ef4444',
            }}
          >
            <AlertTriangle style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
            Portal Session Unavailable
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            {error || 'Unable to load this client portal link. Please ask your agency for a fresh link.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload Portal
          </button>
        </div>
      </div>
    );
  }

  const { client, agency, deliverables, invoices } = data;
  const currSym = client.currencySymbol || '₹';
  const formatAmt = (val: number) => `${currSym}${Number(val || 0).toLocaleString('en-IN')}`;
  const billingCycleLabel = formatOrdinalDay(client.billingCycleDay || 1);
  const agencyLogo = agency.companyLogo || '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        paddingBottom: 72,
      }}
    >
      <style>{`
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.65; }
        }
        .portal-pulse-dot { animation: pulseDot 2s infinite ease-in-out; }
        .portal-surface {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }
        .portal-row {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .portal-row:hover {
          background: #ffffff;
          border-color: #cbd5e1;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * { visibility: hidden !important; }
          .portal-invoice-backdrop,
          #portal-printable-invoice {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            padding: 12px !important;
            margin: 0 !important;
          }
          #portal-printable-invoice, #portal-printable-invoice * {
            visibility: visible !important;
          }
          .portal-no-print { display: none !important; }
        }
      `}</style>

      {/* Top Agency Navigation Bar */}
      <header
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {/* Agency Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {agencyLogo ? (
              <div
                style={{
                  height: 44,
                  minWidth: 44,
                  maxWidth: 160,
                  padding: '4px 10px',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={agencyLogo}
                  alt={agency.companyName || 'Agency Logo'}
                  style={{ maxHeight: 34, maxWidth: 140, width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 17,
                }}
              >
                {(agency.companyName || 'A').charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {agency.companyName || 'Agency Workspace'}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                Client Workspace &amp; Billing Portal
              </div>
            </div>
          </div>

          {/* Contact & Verified Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {agency.companyEmail && (
              <a
                href={`mailto:${agency.companyEmail}`}
                data-tip="Email your agency"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#475569',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: 9,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Mail style={{ width: 14, height: 14, color: '#0284c7' }} />
                <span>{agency.companyEmail}</span>
              </a>
            )}
            {agency.companyPhone && (
              <a
                href={`tel:${agency.companyPhone}`}
                data-tip="Call your agency"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#475569',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: 9,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Phone style={{ width: 14, height: 14, color: '#059669' }} />
                <span>{agency.companyPhone}</span>
              </a>
            )}
            <div
              data-tip="Secure private portal link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 13px',
                borderRadius: 999,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontWeight: 700,
                fontSize: 11.5,
              }}
            >
              <span
                className="portal-pulse-dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                }}
              />
              <span>Verified Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1180, margin: '28px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Clean Welcome & Summary Card */}
        <div
          className="portal-surface"
          style={{
            padding: '26px 28px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#059669',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '4px 10px',
                borderRadius: 999,
                marginBottom: 10,
              }}
            >
              <ShieldCheck style={{ width: 13, height: 13 }} />
              <span>{client.status || 'Active'} Retainer</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome, {client.ownerName || client.name}
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 8, marginBottom: 0, lineHeight: 1.55 }}>
              Track your live deliverables, view and download GST invoices, and share quick feedback with{' '}
              <strong style={{ color: '#0f172a' }}>{agency.companyName || 'your agency'}</strong>.
            </p>
            {(client.name || client.billingAddress) && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
                Account: <strong style={{ color: '#334155' }}>{client.name}</strong>
                {client.city || client.state ? ` · ${[client.city, client.state].filter(Boolean).join(', ')}` : ''}
              </div>
            )}
          </div>

          {/* Key Retainer Metrics */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, flexWrap: 'wrap' }}>
            <div
              data-tip="Your monthly retainer plan amount"
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                minWidth: 150,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                <CreditCard size={13} style={{ color: '#059669' }} />
                <span>Monthly Retainer</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 6, fontFamily: 'monospace' }}>
                {formatAmt(client.monthlyFee)}
              </div>
            </div>

            <div
              data-tip="Day of each month when billing renews"
              style={{
                padding: '14px 18px',
                borderRadius: 14,
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                minWidth: 185,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                <Calendar size={13} style={{ color: '#0284c7' }} />
                <span>Billing Cycle</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0c4a6e', marginTop: 8 }}>
                {billingCycleLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Deliverables Plan (if configured for this client) */}
        {Array.isArray((client as any).deliverablesScope) && (client as any).deliverablesScope.length > 0 && (
          <div className="portal-surface" style={{ padding: '22px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Monthly Deliverables Plan</h2>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Included deliverables for this billing cycle</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {(client as any).deliverablesScope.map((item: any) => {
                const isDone = (item.completed || 0) >= item.target;
                const pct = Math.min(100, Math.round(((item.completed || 0) / (item.target || 1)) * 100));
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: isDone ? '#ecfdf5' : '#f8fafc',
                      border: `1px solid ${isDone ? '#a7f3d0' : '#e2e8f0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: isDone ? '#059669' : '#0284c7' }}>
                        {isDone ? 'Completed' : `${item.completed} / ${item.target} ${item.unit || ''}`}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isDone ? '#10b981' : '#0284c7', borderRadius: 6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-Column Section: Active Deliverables & Invoices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 22 }}>
          {/* Active Deliverables */}
          <div className="portal-surface" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: '#f0f9ff',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Work &amp; Deliverables</h2>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {deliverables.completed} of {deliverables.total} completed
                  </div>
                </div>
              </div>
              <span
                data-tip="Percentage of tasks completed"
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                {deliverables.progressPct}% Done
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
              {deliverables.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b', fontSize: 13 }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: '#10b981', margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, color: '#334155' }}>All deliverables are up to date</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>New tasks added by your team will appear here live.</div>
                </div>
              ) : (
                (deliverables.items || []).filter(Boolean).map((task) => {
                  const done = task?.status === 'Completed';
                  return (
                    <div
                      key={task.id}
                      className="portal-row"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {done ? (
                          <CheckCircle2 size={17} style={{ color: '#10b981', flexShrink: 0 }} />
                        ) : (
                          <Clock size={17} style={{ color: '#0284c7', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </div>
                          {task.dueDate && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={11} />
                              <span>Target: {task.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: done ? '#ecfdf5' : '#ffffff',
                          color: done ? '#047857' : '#475569',
                          border: `1px solid ${done ? '#a7f3d0' : '#cbd5e1'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task?.status || 'In Progress'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Invoices & Statements */}
          <div className="portal-surface" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Invoices &amp; Statements</h2>
                  <div style={{ fontSize: 12, color: '#64748b' }}>View, pay via UPI, or download PDF</div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: client.paymentStatus === 'Paid' ? '#047857' : '#b45309',
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: client.paymentStatus === 'Paid' ? '#ecfdf5' : '#fef3c7',
                  border: `1px solid ${client.paymentStatus === 'Paid' ? '#a7f3d0' : '#fde68a'}`,
                }}
              >
                {client.paymentStatus || 'Active'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b', fontSize: 13 }}>
                  <FileText style={{ width: 28, height: 28, color: '#94a3b8', margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, color: '#334155' }}>No invoices yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Your monthly tax invoices will appear here automatically.</div>
                </div>
              ) : (
                invoices.map((inv) => {
                  const paid = inv.status === 'Paid';
                  return (
                    <div
                      key={inv.id}
                      className="portal-row"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                            {inv.invoiceNumber}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 999,
                              background: paid ? '#ecfdf5' : '#fef3c7',
                              color: paid ? '#047857' : '#b45309',
                            }}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                          Issued: {inv.issueDate} · Due: {inv.dueDate || 'On receipt'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                          {inv.currencySymbol || currSym}{inv.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(inv.id)}
                          disabled={loadingInvoice}
                          data-tip="View invoice & download PDF"
                          style={{
                            padding: '7px 12px',
                            borderRadius: 9,
                            background: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span>View</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Client Feedback Card */}
        <div
          className="portal-surface"
          style={{
            padding: '28px 28px',
            background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
            borderColor: '#a7f3d0',
          }}
        >
          <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                background: '#ffffff',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              <Star style={{ width: 13, height: 13 }} /> Quick 1-Click Check-in
            </span>

            <h2 style={{ fontSize: 21, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
              How is everything going this month?
            </h2>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              Tap one option below to let {agency.companyName || 'our team'} know how you feel about our work:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, maxWidth: 520, margin: '0 auto 16px' }}>
              <button
                type="button"
                onClick={() => handleSelectChoiceAndSubmit('great')}
                disabled={isSubmittingFeedback}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  background: selectedSurveyChoice === 'great' ? '#059669' : '#ffffff',
                  border: `2px solid ${selectedSurveyChoice === 'great' ? '#059669' : '#a7f3d0'}`,
                  color: selectedSurveyChoice === 'great' ? '#ffffff' : '#047857',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                <Smile style={{ width: 28, height: 28 }} />
                <span>Great</span>
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>Happy with work</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChoiceAndSubmit('okay')}
                disabled={isSubmittingFeedback}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  background: selectedSurveyChoice === 'okay' ? '#d97706' : '#ffffff',
                  border: `2px solid ${selectedSurveyChoice === 'okay' ? '#d97706' : '#fde68a'}`,
                  color: selectedSurveyChoice === 'okay' ? '#ffffff' : '#b45309',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                <Meh style={{ width: 28, height: 28 }} />
                <span>Okay</span>
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>Small tweaks needed</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChoiceAndSubmit('help')}
                disabled={isSubmittingFeedback}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  background: selectedSurveyChoice === 'help' ? '#dc2626' : '#ffffff',
                  border: `2px solid ${selectedSurveyChoice === 'help' ? '#dc2626' : '#fecaca'}`,
                  color: selectedSurveyChoice === 'help' ? '#ffffff' : '#b91c1c',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                <Frown style={{ width: 28, height: 28 }} />
                <span>Need Help</span>
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>Need quick support</span>
              </button>
            </div>

            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Optional note: Anything we can improve for you?"
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {feedbackSuccess && (
              <div
                style={{
                  marginTop: 12,
                  color: '#047857',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                <span>Thank you! Your feedback has been sent to the team.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Clean White-Paper Invoice Detail & Mobile-Safe Print Modal */}
      {selectedInvoice && (
        <div
          className="portal-invoice-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            id="portal-printable-invoice"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              padding: 28,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Agency Logo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: 18, marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {(selectedInvoice.agency?.companyLogo || agencyLogo) && (
                  <img
                    src={selectedInvoice.agency?.companyLogo || agencyLogo}
                    alt={selectedInvoice.agency?.companyName || agency.companyName}
                    style={{ maxHeight: 46, maxWidth: 130, width: 'auto', objectFit: 'contain', display: 'block' }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#0f172a' }}>
                    {selectedInvoice.agency?.company_name || selectedInvoice.agency?.companyName || agency.companyName}
                  </h3>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                    {selectedInvoice.agency?.company_address || selectedInvoice.agency?.companyAddress || agency.companyAddress}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                    {selectedInvoice.agency?.company_email || selectedInvoice.agency?.companyEmail}
                    {(selectedInvoice.agency?.company_phone || selectedInvoice.agency?.companyPhone)
                      ? ` · ${selectedInvoice.agency?.company_phone || selectedInvoice.agency?.companyPhone}`
                      : ''}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: selectedInvoice?.invoice?.status === 'Paid' ? '#ecfdf5' : '#fef3c7',
                    color: selectedInvoice?.invoice?.status === 'Paid' ? '#047857' : '#b45309',
                    border: `1px solid ${selectedInvoice?.invoice?.status === 'Paid' ? '#a7f3d0' : '#fde68a'}`,
                  }}
                >
                  {selectedInvoice?.invoice?.status || 'Active'}
                </span>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginTop: 8, fontFamily: 'monospace' }}>
                  {selectedInvoice.invoice.invoice_number || selectedInvoice.invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  Date: {selectedInvoice.invoice.issue_date || selectedInvoice.invoice.issueDate}
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                Client Details
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 3 }}>{client.name}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                {client.ownerName}{client.email ? ` (${client.email})` : ''}
              </div>
              {client.billingAddress && (
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  {client.billingAddress}{client.gstNumber ? ` · GSTIN: ${client.gstNumber}` : ''}
                </div>
              )}
            </div>

            {/* Services Table */}
            <div style={{ overflowX: 'auto', marginBottom: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #0f172a', textAlign: 'left', color: '#0f172a', fontSize: 11, textTransform: 'uppercase', background: '#f8fafc' }}>
                    <th style={{ padding: '9px 8px' }}>Service</th>
                    <th style={{ padding: '9px 8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '9px 8px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '9px 8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.invoice.items || []).map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0f172a' }}>{item.description}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#475569', fontFamily: 'monospace' }}>
                        {selectedInvoice.invoice.currency_symbol || currSym}{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                        {selectedInvoice.invoice.currency_symbol || currSym}{Number(item.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 12, marginBottom: 20 }}>
              <div style={{ width: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5, color: '#475569' }}>
                  <span>Subtotal:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedInvoice.invoice.currency_symbol || currSym}{Number(selectedInvoice.invoice.subtotal || selectedInvoice.invoice.totalAmount || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  <span>Total Due:</span>
                  <span style={{ color: '#059669', fontFamily: 'monospace' }}>
                    {selectedInvoice.invoice.currency_symbol || currSym}{Number(selectedInvoice.invoice.totalAmount || selectedInvoice.invoice.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank details & Accurate Local UPI QR */}
            {(() => {
              const snap = selectedInvoice.invoice?.bank_account_snapshot || selectedInvoice.invoice?.bankAccountSnapshot;
              const bankList = Array.isArray(selectedInvoice.agency?.bank_accounts)
                ? selectedInvoice.agency.bank_accounts
                : Array.isArray(selectedInvoice.agency?.bankAccounts)
                ? selectedInvoice.agency.bankAccounts
                : [];
              const fallbackBank = bankList.find((b: any) => b.isDefault) || bankList[0];
              const bankName = snap?.bankName || fallbackBank?.bankName || selectedInvoice.agency?.bank_name || selectedInvoice.agency?.bankName || '';
              const acName = snap?.bankAccountName || fallbackBank?.bankAccountName || selectedInvoice.agency?.bank_account_name || selectedInvoice.agency?.bankAccountName || '';
              const acNum = snap?.bankAccountNumber || fallbackBank?.bankAccountNumber || selectedInvoice.agency?.bank_account_number || selectedInvoice.agency?.bankAccountNumber || '';
              const ifsc = snap?.bankIfsc || fallbackBank?.bankIfsc || selectedInvoice.agency?.bank_ifsc || selectedInvoice.agency?.bankIfsc || '';
              const upi = snap?.upiId || fallbackBank?.upiId || selectedInvoice.agency?.upi_id || selectedInvoice.agency?.upiId || '';
              const qrUrl = snap?.qrCodeUrl || fallbackBank?.qrCodeUrl || '';
              const totalDueAmt =
                Number(selectedInvoice.invoice?.totalAmount || selectedInvoice.invoice?.total_amount || 0) -
                Number(selectedInvoice.invoice?.paidAmount || selectedInvoice.invoice?.paid_amount || 0);
              const invNo = selectedInvoice.invoice?.invoice_number || selectedInvoice.invoice?.invoiceNumber || '';
              const compName = selectedInvoice.agency?.company_name || selectedInvoice.agency?.companyName || agency.companyName || 'Agency';
              const upiLink = upi
                ? `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(compName)}&am=${Math.max(0, totalDueAmt).toFixed(2)}&tn=${encodeURIComponent(`Invoice ${invNo}`)}&cu=INR`
                : '';

              if (!acNum && !upi && !qrUrl) return null;
              return (
                <div style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Bank Transfer &amp; UPI Details</div>
                    {bankName && <div style={{ color: '#0f172a', fontWeight: 700 }}>{bankName}</div>}
                    {acName && <div style={{ color: '#475569' }}>A/C Name: {acName}</div>}
                    {acNum && <div style={{ color: '#475569', fontFamily: 'monospace' }}>A/C #: {acNum}{ifsc ? ` · IFSC: ${ifsc}` : ''}</div>}
                    {upi && <div style={{ color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>UPI ID: {upi}</div>}
                    {upiLink && totalDueAmt > 0 && selectedInvoice.invoice?.status !== 'Paid' && (
                      <a
                        href={upiLink}
                        className="portal-no-print"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 10,
                          padding: '7px 14px',
                          borderRadius: 8,
                          background: '#059669',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 12,
                          textDecoration: 'none',
                        }}
                      >
                        Pay via GPay / PhonePe / Paytm
                      </a>
                    )}
                  </div>
                  {(qrUrl || upiLink) && (
                    <div style={{ padding: 6, background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {qrUrl ? (
                        <img src={qrUrl} alt="UPI QR Code" style={{ width: 92, height: 92, objectFit: 'contain', display: 'block' }} />
                      ) : (
                        <QrCodeImage value={upiLink} size={92} alt={`UPI QR for ${upi}`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="portal-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Printer style={{ width: 14, height: 14 }} />
                <span>Save PDF / Print</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proactive 1-Click Micro-Survey Modal */}
      {showSurveyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: '32px 28px',
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={handleDismissSurveyModal}
              title="Remind me later"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>

            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Sparkles style={{ width: 26, height: 26 }} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              How did we do this month?
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px', lineHeight: 1.5 }}>
              1-click check-in. Tell {agency.companyName || 'your agency'} how your work is going:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => handleSelectChoiceAndSubmit('great')}
                disabled={isSubmittingFeedback}
                style={{
                  padding: '14px 8px',
                  borderRadius: 12,
                  background: selectedSurveyChoice === 'great' ? '#059669' : '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: selectedSurveyChoice === 'great' ? '#ffffff' : '#047857',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Smile style={{ width: 26, height: 26 }} />
                <span>Great</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChoiceAndSubmit('okay')}
                disabled={isSubmittingFeedback}
                style={{
                  padding: '14px 8px',
                  borderRadius: 12,
                  background: selectedSurveyChoice === 'okay' ? '#d97706' : '#fef3c7',
                  border: '1px solid #fde68a',
                  color: selectedSurveyChoice === 'okay' ? '#ffffff' : '#b45309',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Meh style={{ width: 26, height: 26 }} />
                <span>Okay</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChoiceAndSubmit('help')}
                disabled={isSubmittingFeedback}
                style={{
                  padding: '14px 8px',
                  borderRadius: 12,
                  background: selectedSurveyChoice === 'help' ? '#dc2626' : '#fef2f2',
                  border: '1px solid #fecaca',
                  color: selectedSurveyChoice === 'help' ? '#ffffff' : '#b91c1c',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <Frown style={{ width: 26, height: 26 }} />
                <span>Need Help</span>
              </button>
            </div>

            {feedbackSuccess && (
              <div style={{ color: '#047857', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                ✓ Thank you! Your feedback has been sent to the team.
              </div>
            )}

            <button
              type="button"
              onClick={handleDismissSurveyModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Remind me in an hour
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
