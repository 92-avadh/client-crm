import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { PortalData } from '../../types';
import {
  CheckCircle,
  Clock,
  Download,
  AlertTriangle,
  Star,
  Send,
  Building2,
  Mail,
  Phone,
  FileText,
  Calendar,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Printer
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

    api.portal.get(token)
      .then((res: PortalData) => {
        setData(res);
        if (res.client.npsScore) {
          setRating(res.client.npsScore);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to load client portal. The link may have expired.');
      })
      .finally(() => setLoading(false));
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app, #f9fafb)', color: 'var(--text-secondary, #6b7280)', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border, #e5e7eb)', borderTopColor: 'var(--text-primary, #111827)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>Loading secure client portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app, #f9fafb)', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
          <AlertTriangle style={{ width: 48, height: 48, color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary, #111827)', margin: '0 0 8px' }}>Portal Link Expired or Invalid</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary, #6b7280)', lineHeight: 1.6, margin: '0 0 24px' }}>
            {error || 'This passwordless portal session could not be authenticated. Please request a fresh magic link from your agency account lead.'}
          </p>
        </div>
      </div>
    );
  }

  const { client, agency, deliverables, invoices } = data;
  const currSym = client.currencySymbol || '₹';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app, #0f172a)', color: 'var(--text-primary, #f8fafc)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', paddingBottom: 64 }}>
      {/* Top Header / Agency Bar */}
      <header style={{ background: 'var(--bg-card, #1e293b)', borderBottom: '1px solid var(--border, #334155)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--solid-btn-bg, #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
              {agency.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>{agency.companyName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>Client Success &amp; Retainer Portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-secondary, #cbd5e1)', flexWrap: 'wrap' }}>
            {agency.companyEmail && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail style={{ width: 14, height: 14 }} /> {agency.companyEmail}
              </span>
            )}
            {agency.companyPhone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone style={{ width: 14, height: 14 }} /> {agency.companyPhone}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, fontSize: 11 }}>
              <ShieldCheck style={{ width: 13, height: 13 }} /> Verified Client Session
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: 1200, margin: '32px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Welcome Client Banner */}
        <div style={{ background: 'linear-gradient(135deg, var(--bg-card, #1e293b) 0%, rgba(30, 41, 59, 0.7) 100%)', border: '1px solid var(--border, #334155)', borderRadius: 18, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8', marginBottom: 4 }}>
              Active Retainer Client
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary, #f8fafc)', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome, {client.ownerName || client.name}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #cbd5e1)', marginTop: 6, marginBottom: 0 }}>
              Live progress tracker, deliverable velocity, monthly retainer statement, and 1-click satisfaction reviews.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border, #334155)', textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)' }}>Monthly Retainer</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary, #f8fafc)', marginTop: 2 }}>
                {currSym}{client.monthlyFee.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border, #334155)', textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #94a3b8)' }}>Billing Day</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>
                Day {client.billingCycleDay || 1}
              </div>
            </div>
          </div>
        </div>

        {/* Retainer Scope & Deliverable Quota Card */}
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock style={{ width: 18, height: 18, color: '#38bdf8' }} />
                <span>Monthly Retainer Scope &amp; Hours Tracker</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                Transparent deliverable hours allocation for the active monthly cycle.
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: client.hoursUtilizationPct > 90 ? '#ef4444' : '#10b981' }}>
              {client.usedHours} / {client.retainerHours} hrs used ({client.hoursUtilizationPct}%)
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, client.hoursUtilizationPct)}%`,
                background: client.hoursUtilizationPct > 100 ? '#ef4444' : (client.hoursUtilizationPct > 80 ? '#f59e0b' : '#10b981'),
                borderRadius: 10,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 10 }}>
            <span>0 hrs</span>
            <span>Remaining: <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>{client.hoursRemaining} hrs</strong></span>
            <span>Allocated: {client.retainerHours} hrs</span>
          </div>

          {client.hoursUtilizationPct >= 100 && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>
                <strong>Scope Notice:</strong> Retainer quota reached. Any extra ad-hoc requests outside the contracted scope will be billed under standard overage terms or rolled into next month.
              </span>
            </div>
          )}
        </div>

        {/* 2-Column Section: Deliverables & Invoices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
          {/* Deliverables Tracker */}
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
                  Active Deliverables &amp; Milestones
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                  {deliverables.completed} of {deliverables.total} completed ({deliverables.progressPct}%)
                </div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>
                Velocity: {deliverables.progressPct}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
              {deliverables.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted, #94a3b8)', fontSize: 13 }}>
                  No deliverables currently scheduled.
                </div>
              ) : (
                deliverables.items.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border, #334155)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle
                        style={{
                          width: 16,
                          height: 16,
                          color: task.status === 'Completed' ? '#10b981' : 'var(--text-muted, #64748b)',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                          {task.title}
                        </div>
                        {task.dueDate && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
                            Target: {task.dueDate}
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
                        background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: task.status === 'Completed' ? '#10b981' : 'var(--text-secondary, #cbd5e1)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invoices & Retainer Billing */}
          <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
                  Invoices &amp; Retainer Statements
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                  1-click download GST/VAT statements &amp; invoices.
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                Status: {client.paymentStatus || 'Active'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted, #94a3b8)', fontSize: 13 }}>
                  No invoices raised yet.
                </div>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border, #334155)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #f8fafc)', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
                        Date: {inv.issueDate} · Due: {inv.dueDate || 'On receipt'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary, #f8fafc)' }}>
                        {inv.currencySymbol}{inv.totalAmount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleOpenInvoice(inv.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-primary, #f8fafc)',
                          border: '1px solid var(--border, #334155)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <FileText style={{ width: 12, height: 12 }} />
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
        <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: 16, padding: '28px 32px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
              <Star style={{ width: 13, height: 13 }} /> 1-Click Client Experience Feedback
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary, #f8fafc)', margin: '0 0 8px' }}>
              How satisfied are you with our agency deliverables this month?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5, margin: '0 0 24px' }}>
              Your direct score is fed directly into our Executive Retention &amp; Quality Assurance Engine to ensure your account gets top priority.
            </p>

            <form onSubmit={handleSubmitNps}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = rating === num;
                  const isHovered = hoverRating !== null && hoverRating >= num;
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
                        borderRadius: 10,
                        border: isSelected ? '2px solid #38bdf8' : '1px solid var(--border, #334155)',
                        background: isSelected ? '#38bdf8' : (isHovered ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)'),
                        color: isSelected ? '#0f172a' : 'var(--text-primary, #f8fafc)',
                        fontWeight: 800,
                        fontSize: 15,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted, #94a3b8)', maxWidth: 480, margin: '0 auto 20px' }}>
                <span>1 - Needs improvement</span>
                <span>10 - Exceptional velocity</span>
              </div>

              <div style={{ maxWidth: 500, margin: '0 auto 16px' }}>
                <input
                  type="text"
                  placeholder="Optional comment: What can our team improve or accelerate for you?"
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border, #334155)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary, #f8fafc)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!rating || isSubmittingFeedback}
                style={{
                  padding: '11px 28px',
                  borderRadius: 10,
                  background: rating ? 'var(--solid-btn-bg, #38bdf8)' : 'rgba(255,255,255,0.1)',
                  color: rating ? '#0f172a' : 'var(--text-muted, #94a3b8)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: rating ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Send style={{ width: 14, height: 14 }} />
                <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Satisfaction Rating'}</span>
              </button>

              {feedbackSuccess && (
                <div style={{ marginTop: 14, color: '#10b981', fontSize: 13, fontWeight: 700 }}>
                  ✓ Feedback submitted directly to agency leadership! Thank you.
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 16,
              maxWidth: 680,
              width: '100%',
              padding: 32,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#0f172a' }}>{selectedInvoice.agency.company_name}</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {selectedInvoice.agency.company_address}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {selectedInvoice.agency.company_email} · {selectedInvoice.agency.company_phone}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#e2e8f0', color: '#334155' }}>
                  {selectedInvoice.invoice.status}
                </span>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 6, fontFamily: 'monospace' }}>
                  {selectedInvoice.invoice.invoice_number}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Date: {selectedInvoice.invoice.issue_date}</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Billed To</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{client.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Attn: {client.ownerName} ({client.email})</div>
            </div>

            {/* Line Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 0' }}>Description</th>
                  <th style={{ padding: '8px 0', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice.invoice.items || []).map((item: any) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 0', fontWeight: 600 }}>{item.description}</td>
                    <td style={{ padding: '12px 0', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>{selectedInvoice.invoice.currency_symbol || currSym}{item.unitPrice.toLocaleString()}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.invoice.currency_symbol || currSym}{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #0f172a', paddingTop: 12, marginBottom: 24 }}>
              <div style={{ width: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>Subtotal:</span>
                  <strong>{selectedInvoice.invoice.currency_symbol || currSym}{selectedInvoice.invoice.subtotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  <span>Total Due:</span>
                  <span>{selectedInvoice.invoice.currency_symbol || currSym}{selectedInvoice.invoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bank details */}
            {selectedInvoice.agency.bank_account_number && (
              <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, marginBottom: 24 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Direct Bank Transfer Details</div>
                <div style={{ color: '#475569' }}>A/C Name: {selectedInvoice.agency.bank_account_name}</div>
                <div style={{ color: '#475569' }}>A/C Number: {selectedInvoice.agency.bank_account_number} · IFSC: {selectedInvoice.agency.bank_ifsc}</div>
                {selectedInvoice.agency.upi_id && <div style={{ color: '#475569' }}>UPI ID: {selectedInvoice.agency.upi_id}</div>}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#0f172a',
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
                <span>Print Statement</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#f1f5f9',
                  color: '#334155',
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
    </div>
  );
};

export default ClientPortal;
