import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { PortalData } from '../../types';
import { PremiumLogoLoader } from '../common/PremiumLogoLoader';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Send,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Printer,
  Layers,
  Receipt,
  Calendar
} from 'lucide-react';

export const ClientPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NPS Feedback State
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Active Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing portal security token.');
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
          setRating(res.client.npsScore);
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

  const handleSubmitNps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rating) return;
    setIsSubmittingFeedback(true);
    try {
      await api.portal.submitFeedback(token, { score: rating, comment: feedbackNote });
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 5000);
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
        message="Authenticating secure client session..."
        size="lg"
      />
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080c14',
        padding: 24,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: 460,
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 20,
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#ef4444'
          }}>
            <AlertTriangle style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
            Portal Session Unavailable
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px' }}>
            {error || 'Unable to load the client portal session. Please check your connection or request a fresh link from your agency.'}
          </p>
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '9px 22px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              }}
            >
              ↻ Reload Portal
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Protected by Retentio Zero-Trust Client Portal Infrastructure
          </div>
        </div>
      </div>
    );
  }

  const { client, agency, deliverables, invoices } = data;
  const currSym = client.currencySymbol || '₹';
  const formatAmt = (val: number) => `${currSym}${Number(val || 0).toLocaleString()}`;

  // Get color for NPS score button
  const getRatingColor = (num: number, isSelected: boolean) => {
    if (num <= 6) return isSelected ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)';
    if (num <= 8) return isSelected ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)';
    return isSelected ? '#10b981' : 'rgba(16, 185, 129, 0.2)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c14',
      backgroundImage: 'radial-gradient(1000px circle at 50% -10%, rgba(30, 58, 138, 0.18) 0%, rgba(8, 12, 20, 0.98) 70%, #080c14 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 80,
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>
      {/* Dynamic Keyframes & Print Stylesheet */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        .portal-pulse-dot {
          animation: pulseDot 2s infinite ease-in-out;
        }
        .portal-card {
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .portal-card:hover {
          border-color: rgba(255, 255, 255, 0.14);
        }
        .portal-subcard {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .portal-subcard:hover {
          background: rgba(255, 255, 255, 0.045);
          border-color: rgba(255, 255, 255, 0.12);
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #portal-printable-invoice, #portal-printable-invoice * {
            visibility: visible !important;
          }
          #portal-printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            padding: 20px !important;
          }
          .portal-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header / Agency Bar */}
      <header style={{
        background: 'rgba(11, 16, 27, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          {/* Agency Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}>
              {(agency.companyName || 'R').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                {agency.companyName || 'Retentio Partner Agency'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Client Success &amp; Retainer Portal</span>
              </div>
            </div>
          </div>

          {/* Contact Details & Verified Session Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#cbd5e1', flexWrap: 'wrap' }}>
            {agency.companyEmail && (
              <a
                href={`mailto:${agency.companyEmail}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94a3b8',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'color 0.15s ease',
                }}
              >
                <Mail style={{ width: 13, height: 13, color: '#38bdf8' }} />
                <span>{agency.companyEmail}</span>
              </a>
            )}
            {agency.companyPhone && (
              <a
                href={`tel:${agency.companyPhone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94a3b8',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'color 0.15s ease',
                }}
              >
                <Phone style={{ width: 13, height: 13, color: '#10b981' }} />
                <span>{agency.companyPhone}</span>
              </a>
            )}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.02em',
            }}>
              <span
                className="portal-pulse-dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                  display: 'inline-block',
                }}
              />
              <span>Verified Client Session</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: 1200, margin: '32px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Welcome Client Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 30, 52, 0.9) 0%, rgba(13, 20, 36, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.22)',
          borderRadius: 20,
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#38bdf8',
              marginBottom: 8,
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '4px 10px',
              borderRadius: 6,
            }}>
              <ShieldCheck style={{ width: 13, height: 13 }} />
              Active Retainer Client
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome, {client.ownerName || client.name}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, marginBottom: 0, maxWidth: 640, lineHeight: 1.5 }}>
              Your dedicated real-time window into deliverable velocity, retainer hours utilization, GST/VAT invoices, and direct executive feedback.
            </p>
            {client.billingAddress && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
                Client Entity: <strong style={{ color: '#cbd5e1' }}>{client.name}</strong> · {client.city ? `${client.city}, ${client.state}` : client.billingAddress}
              </div>
            )}
          </div>

          {/* Metric Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              padding: '14px 20px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'right',
              minWidth: 140,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                Monthly Retainer
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginTop: 4, fontFamily: 'monospace' }}>
                {formatAmt(client.monthlyFee)}
              </div>
            </div>

            <div style={{
              padding: '14px 20px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'right',
              minWidth: 120,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                Billing Cycle
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                Day {client.billingCycleDay || 1}
              </div>
            </div>
          </div>
        </div>

        {/* Retainer Scope & Deliverable Quota Card */}
        <div className="portal-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock style={{ width: 16, height: 16 }} />
                </div>
                <span>Monthly Retainer Hours Tracker</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Transparent deliverable hours allocation for the active billing cycle.
              </div>
            </div>

            <div style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: 20,
              background: client.hoursUtilizationPct > 90
                ? 'rgba(239, 68, 68, 0.15)'
                : (client.hoursUtilizationPct > 75 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
              border: `1px solid ${client.hoursUtilizationPct > 90 ? 'rgba(239, 68, 68, 0.3)' : (client.hoursUtilizationPct > 75 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)')}`,
              color: client.hoursUtilizationPct > 90 ? '#f87171' : (client.hoursUtilizationPct > 75 ? '#fbbf24' : '#34d399'),
            }}>
              {client.usedHours} / {client.retainerHours} hrs used ({client.hoursUtilizationPct}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            height: 10,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
          }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, client.hoursUtilizationPct))}%`,
                background: client.hoursUtilizationPct > 100
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : (client.hoursUtilizationPct > 80 ? 'linear-gradient(90deg, #10b981, #f59e0b)' : 'linear-gradient(90deg, #059669, #10b981)'),
                borderRadius: 10,
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
            <span>0 hrs (Cycle start)</span>
            <span>
              Remaining:{' '}
              <strong style={{ color: client.hoursRemaining > 0 ? '#34d399' : '#f87171' }}>
                {client.hoursRemaining} hrs
              </strong>
            </span>
            <span>Included Quota: {client.retainerHours} hrs</span>
          </div>

          {client.hoursUtilizationPct >= 100 && (
            <div style={{
              marginTop: 18,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>
                <strong>Hours Scope Notice:</strong> Monthly included retainer quota reached. Additional tasks requested this month will be billed at standard contract hourly rates or scheduled for the next renewal cycle.
              </span>
            </div>
          )}
        </div>

        {/* 2-Column Section: Deliverables & Invoices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24 }}>
          {/* Deliverables Tracker */}
          <div className="portal-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers style={{ width: 16, height: 16, color: '#38bdf8' }} />
                  <span>Active Deliverables &amp; Milestones</span>
                </h2>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  {deliverables.completed} of {deliverables.total} completed ({deliverables.progressPct}%)
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 800,
              }}>
                Velocity: {deliverables.progressPct}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
              {deliverables.items.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  color: '#64748b',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                  }}>
                    <CheckCircle style={{ width: 22, height: 22 }} />
                  </div>
                  <div style={{ fontWeight: 600, color: '#94a3b8' }}>All deliverables currently up to date</div>
                  <div style={{ fontSize: 11, maxWidth: 300 }}>
                    As new milestones or sprint tasks are logged by the agency team, you will see real-time progress right here.
                  </div>
                </div>
              ) : (
                (deliverables.items || []).filter(Boolean).map((task) => (
                  <div
                    key={task.id}
                    className="portal-subcard"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CheckCircle
                        style={{
                          width: 17,
                          height: 17,
                          color: task?.status === 'Completed' ? '#10b981' : '#64748b',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
                          {task.title}
                        </div>
                        {task.dueDate && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar style={{ width: 11, height: 11 }} />
                            <span>Target: {task.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        background: task?.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: task?.status === 'Completed' ? '#34d399' : '#cbd5e1',
                        border: `1px solid ${task?.status === 'Completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task?.status || 'Active'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invoices & Retainer Statements */}
          <div className="portal-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt style={{ width: 16, height: 16, color: '#10b981' }} />
                  <span>Invoices &amp; Statements</span>
                </h2>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  1-click download GST/VAT statements &amp; invoices.
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: client.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24',
                padding: '4px 10px',
                borderRadius: 20,
                background: client.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${client.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              }}>
                Status: {client.paymentStatus || 'Active'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
              {invoices.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  color: '#64748b',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                  }}>
                    <FileText style={{ width: 22, height: 22 }} />
                  </div>
                  <div style={{ fontWeight: 600, color: '#94a3b8' }}>No invoices raised yet</div>
                  <div style={{ fontSize: 11, maxWidth: 300 }}>
                    Tax invoices and receipt statements will be generated for each billing cycle and appear here for direct download.
                  </div>
                </div>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="portal-subcard"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Date: {inv.issueDate} · Due: {inv.dueDate || 'On receipt'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                        {inv.currencySymbol || currSym}{inv.totalAmount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(inv.id)}
                        disabled={loadingInvoice}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <FileText style={{ width: 12, height: 12, color: '#38bdf8' }} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 1-Click NPS Satisfaction Feedback Widget */}
        <div className="portal-card" style={{
          padding: '32px 32px',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          background: 'linear-gradient(180deg, rgba(20, 27, 45, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 20,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fbbf24',
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 14,
              letterSpacing: '0.04em',
            }}>
              <Star style={{ width: 13, height: 13 }} /> 1-Click Client Experience Feedback
            </span>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              How satisfied are you with our agency deliverables this month?
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px' }}>
              Your rating is fed directly into our Executive Retention &amp; Quality Assurance Engine to ensure your account gets top priority and maximum velocity.
            </p>

            <form onSubmit={handleSubmitNps}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = rating === num;
                  const isHovered = hoverRating !== null && hoverRating >= num;
                  const activeColor = getRatingColor(num, true);

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      onMouseEnter={() => setHoverRating(num)}
                      onMouseLeave={() => setHoverRating(null)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        border: isSelected
                          ? `2px solid ${activeColor}`
                          : (isHovered ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)'),
                        background: isSelected
                          ? activeColor
                          : (isHovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'),
                        color: isSelected ? '#080c14' : '#f8fafc',
                        fontWeight: 900,
                        fontSize: 15,
                        cursor: 'pointer',
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isSelected ? 'scale(1.08)' : (isHovered ? 'scale(1.04)' : 'scale(1)'),
                        boxShadow: isSelected ? `0 0 16px ${activeColor}80` : 'none',
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', maxWidth: 480, margin: '0 auto 20px' }}>
                <span>1 - Needs improvement</span>
                <span>10 - Exceptional velocity</span>
              </div>

              <div style={{ maxWidth: 520, margin: '0 auto 16px' }}>
                <input
                  type="text"
                  placeholder="Optional comment: What can our team improve or accelerate for you?"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!rating || isSubmittingFeedback}
                style={{
                  padding: '12px 32px',
                  borderRadius: 12,
                  background: rating ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'rgba(255,255,255,0.08)',
                  color: rating ? '#ffffff' : '#64748b',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: rating ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: rating ? '0 4px 16px rgba(16, 185, 129, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Send style={{ width: 14, height: 14 }} />
                <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Satisfaction Rating'}</span>
              </button>

              {feedbackSuccess && (
                <div style={{
                  marginTop: 16,
                  color: '#34d399',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                  <CheckCircle style={{ width: 16, height: 16 }} />
                  <span>Feedback submitted directly to agency leadership! Thank you.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Invoice Detail & Print Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            id="portal-printable-invoice"
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 20,
              maxWidth: 680,
              width: '100%',
              padding: 32,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 20, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#f8fafc' }}>
                  {selectedInvoice.agency?.company_name || selectedInvoice.agency?.companyName || agency.companyName}
                </h3>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  {selectedInvoice.agency?.company_address || selectedInvoice.agency?.companyAddress || agency.companyAddress}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {selectedInvoice.agency?.company_email || selectedInvoice.agency?.companyEmail} · {selectedInvoice.agency?.company_phone || selectedInvoice.agency?.companyPhone}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  {selectedInvoice?.invoice?.status || 'Active'}
                </span>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', marginTop: 8, fontFamily: 'monospace' }}>
                  {selectedInvoice.invoice.invoice_number || selectedInvoice.invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Date: {selectedInvoice.invoice.issue_date || selectedInvoice.invoice.issueDate}
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div style={{ marginBottom: 24, padding: '14px 16px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
                Billed To Client Entity
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>{client.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Attn: {client.ownerName} ({client.email})</div>
              {client.billingAddress && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {client.billingAddress}{client.gstNumber ? ` · GST/Tax ID: ${client.gstNumber}` : ''}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 0' }}>Description</th>
                  <th style={{ padding: '10px 0', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice.invoice.items || []).map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 0', fontWeight: 600, color: '#f8fafc' }}>{item.description}</td>
                    <td style={{ padding: '12px 0', textAlign: 'center', color: '#94a3b8' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {selectedInvoice.invoice.currency_symbol || currSym}{Number(item.unitPrice || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                      {selectedInvoice.invoice.currency_symbol || currSym}{Number(item.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid rgba(255, 255, 255, 0.1)', paddingTop: 14, marginBottom: 24 }}>
              <div style={{ width: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#94a3b8' }}>
                  <span>Subtotal:</span>
                  <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                    {selectedInvoice.invoice.currency_symbol || currSym}{Number(selectedInvoice.invoice.subtotal || selectedInvoice.invoice.totalAmount || 0).toLocaleString()}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>
                  <span>Total Due:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                    {selectedInvoice.invoice.currency_symbol || currSym}{Number(selectedInvoice.invoice.totalAmount || selectedInvoice.invoice.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank details */}
            {(selectedInvoice.agency?.bank_account_number || selectedInvoice.agency?.bankAccountNumber) && (
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 12, marginBottom: 24 }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: 4 }}>Direct Bank Transfer Details</div>
                <div style={{ color: '#cbd5e1' }}>A/C Name: {selectedInvoice.agency.bank_account_name || selectedInvoice.agency.bankAccountName}</div>
                <div style={{ color: '#cbd5e1' }}>A/C Number: {selectedInvoice.agency.bank_account_number || selectedInvoice.agency.bankAccountNumber} · IFSC: {selectedInvoice.agency.bank_ifsc || selectedInvoice.agency.bankIfsc}</div>
                {(selectedInvoice.agency.upi_id || selectedInvoice.agency.upiId) && (
                  <div style={{ color: '#cbd5e1' }}>UPI ID: {selectedInvoice.agency.upi_id || selectedInvoice.agency.upiId}</div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="portal-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
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
    </div>
  );
};

export default ClientPortal;
