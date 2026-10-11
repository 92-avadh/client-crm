import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Building2,
  CheckSquare,
  Clock,
  Calendar,
  Plus,
} from 'lucide-react';

// ─── Retentio Brand Identity Palette (Derived Directly from Official Logo) ───────────
// Logo wordmark: var(--text-primary) (Deep Midnight Navy Blue)
// Logo 'R' ribbon: var(--brand-green-dark) -> var(--brand-green) -> var(--brand-green-bright) (Vibrant Emerald Gradient)
// Logo dot on 'i': var(--brand-green-bright) (Electric Emerald Accent)
const BRAND = {
  navy: 'var(--text-primary, #0A2540)',
  navyHover: 'var(--brand-navy-hover, #163C5E)',
  navyLight: 'var(--brand-navy, #1E4E7C)',
  navySubtle: 'var(--brand-navy-subtle, #F0F5FA)',
  navyBorder: 'var(--border, #D0E0EF)',
  navyMuted: 'var(--text-secondary, #50667F)',

  greenDark: 'var(--brand-green-dark, #034726)',
  green: 'var(--brand-green, #059639)',
  greenBright: 'var(--brand-green-bright, #00D05E)',
  greenSubtle: 'var(--brand-green-subtle, #ECFDF5)',
  greenBorder: 'var(--brand-green-border, #86EFAC)',

  amber: 'var(--warn-text)',
  amberSubtle: 'var(--bg-raised, #FFFBEB)',
  amberBorder: 'var(--warn-border)',

  border: 'var(--border, #D0E0EF)',
  cardBorder: 'var(--border, #DCE7F2)',
  cardBg: 'var(--bg-card, #FFFFFF)',
  cardNestedBg: 'var(--bg-raised, #F8FAFC)',
};

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    brands,
    invoices,
    payments,
    expenses,
    tasks,
    meetings,
    setActiveTab,
  } = useApp();

  const role = currentUser.role;

  // Total collections accounts ONLY for payments actually received (status === 'Success')
  // plus active clients explicitly marked Paid that do not yet have a payment row
  const paymentsTotal = payments
    .filter(p => p.status === 'Success')
    .reduce((a, p) => a + p.amount, 0);
  const unrecordedBrandFees = brands
    .filter(b => b.status === 'Active' && (b.monthlyFee || 0) > 0 && b.paymentStatus === 'Paid' && !payments.some(p => p.brandId === b.id && p.status === 'Success'))
    .reduce((a, b) => a + (b.monthlyFee || 0), 0);
  const totalReceived = paymentsTotal + unrecordedBrandFees;

  // Total expenses accounts ONLY for expenses actually paid (paymentStatus === 'Paid')
  // Pending expenses are excluded from Total Expenses and Net Profit until marked Paid
  const paidExpenses = expenses.filter(e => (e.paymentStatus || 'Paid') === 'Paid');
  const pendingExpenses = expenses.filter(e => e.paymentStatus === 'Pending');
  const totalExpenses = paidExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const pendingExpensesTotal = pendingExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const netProfit     = totalReceived - totalExpenses;
  const netMargin     = totalReceived > 0 ? Math.round((netProfit / totalReceived) * 100) : 0;

  const pendingPayments = payments
    .filter(p => p.status === 'Pending')
    .reduce((a, p) => a + p.amount, 0);
  const pendingBrandFees = brands
    .filter(b => b.status === 'Active' && (b.monthlyFee || 0) > 0 && b.paymentStatus === 'Pending' && !payments.some(p => p.brandId === b.id))
    .reduce((a, b) => a + (b.monthlyFee || 0), 0);
  const totalPending  = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((a, i) => a + (i.totalAmount - i.paidAmount), 0) + pendingPayments + pendingBrandFees;

  const activeBrands  = brands.filter(b => b.status === 'Active');
  const relevantTasks = role === 'team' ? tasks.filter(t => t.assigneeId === currentUser.id) : tasks;
  const pendingTasks  = relevantTasks.filter(t => t.status !== 'Completed');
  const myMeetings    = meetings.filter(m => role === 'team' ? m.attendeeIds.includes(currentUser.id) : true);

  // Group real payment collections by month (YYYY-MM) - ONLY verified received payments
  const monthlyIncomeMap: Record<string, number> = {};
  payments.forEach(p => {
    if (p.paymentDate && p.status === 'Success') {
      const key = p.paymentDate.slice(0, 7);
      monthlyIncomeMap[key] = (monthlyIncomeMap[key] || 0) + Number(p.amount);
    }
  });

  // Include any unrecorded active brand retainers marked Paid into the current month
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  if (unrecordedBrandFees > 0) {
    monthlyIncomeMap[currentMonthKey] = (monthlyIncomeMap[currentMonthKey] || 0) + unrecordedBrandFees;
  }

  // Group real expenses by month (YYYY-MM) - ONLY verified paid expenses
  const monthlyExpenseMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.date && (e.paymentStatus || 'Paid') === 'Paid') {
      const key = e.date.slice(0, 7);
      monthlyExpenseMap[key] = (monthlyExpenseMap[key] || 0) + Number(e.amount || 0);
    }
  });

  const monthLabelMap: Record<string, string> = {
    '2026-04': 'Apr 26',
    '2026-05': 'May 26',
    '2026-06': 'Jun 26',
    '2026-07': 'Jul 26',
    '2026-08': 'Aug 26',
    '2026-09': 'Sep 26',
    '2026-10': 'Oct 26',
    '2026-11': 'Nov 26',
    '2026-12': 'Dec 26',
    '2027-01': 'Jan 27',
    '2027-02': 'Feb 27',
    '2027-03': 'Mar 27',
  };

  // Only include months that have actual configured revenue or expense data
  const configuredMonthKeys = Object.keys({ ...monthlyIncomeMap, ...monthlyExpenseMap }).sort();
  const hasConfiguredRevenue = configuredMonthKeys.length > 0;

  const months = configuredMonthKeys.map(key => ({
    label: monthLabelMap[key] || key,
    income: monthlyIncomeMap[key] || 0,
    exp: monthlyExpenseMap[key] || 0,
    current: key === currentMonthKey,
  }));

  const maxRevenue = Math.max(100000, ...months.map(m => Math.max(m.income, m.exp)));

  const avgRetainer = activeBrands.length > 0
    ? Math.round(activeBrands.reduce((a, b) => a + (b.monthlyFee || 0), 0) / activeBrands.length)
    : 0;

  const growthRate = months.length >= 2 && months[months.length - 2].income > 0
    ? Math.round(((months[months.length - 1].income - months[months.length - 2].income) / months[months.length - 2].income) * 100)
    : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28, background: 'transparent' }}>

      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: `1.5px solid ${BRAND.navyBorder}` }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND.navy, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Good morning, {currentUser.name.split(' ')[0]}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 20,
                background: BRAND.greenSubtle,
                color: BRAND.greenDark,
                border: `1px solid ${BRAND.greenBorder}`,
                fontSize: 11,
                fontWeight: 750,
                letterSpacing: '0.01em',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND.greenBright, boxShadow: `0 0 6px ${BRAND.greenBright}` }} />
              Live Workspace
            </span>
          </div>
          <p style={{ fontSize: 13, color: BRAND.navyMuted, marginTop: 5 }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        {(role === 'admin' || role === 'hr') && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('clients')}
              style={{
                padding: '10px 20px',
                background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                color: 'var(--solid-btn-text)',
                border: `1px solid ${BRAND.navy}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 3px 12px rgba(10, 37, 64, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus className="w-4 h-4" style={{ color: BRAND.greenBright }} /> Onboard Client
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              style={{
                padding: '10px 20px',
                background: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`,
                color: BRAND.greenDark,
                border: `1.5px solid ${BRAND.greenBorder}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(0, 192, 88, 0.12)',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus className="w-4 h-4" style={{ color: BRAND.green }} /> Create Invoice
            </button>
          </div>
        )}
      </div>

      {/* ── Financial KPIs ──────────────────────────────────── */}
      {role === 'admin' && (
        <div className="rg-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            {
              label: 'Total Collections',
              value: `₹${totalReceived.toLocaleString('en-IN')}`,
              sub: 'All payments received',
              color: BRAND.navy,
              bg: BRAND.cardBg,
              border: BRAND.greenBorder,
              accentDot: BRAND.greenBright,
              badgeBg: BRAND.greenSubtle,
              badgeColor: BRAND.greenDark,
              badgeBorder: BRAND.greenBorder,
              shadow: '0 3px 14px rgba(0, 168, 77, 0.08)',
            },
            {
              label: 'Pending / Overdue',
              value: `₹${totalPending.toLocaleString('en-IN')}`,
              sub: 'Awaiting clearance',
              color: totalPending > 0 ? BRAND.amber : BRAND.navy,
              bg: BRAND.cardBg,
              border: totalPending > 0 ? BRAND.amberBorder : BRAND.cardBorder,
              accentDot: BRAND.amber,
              badgeBg: BRAND.amberSubtle,
              badgeColor: BRAND.amber,
              badgeBorder: BRAND.amberBorder,
              shadow: '0 3px 14px rgba(180, 83, 9, 0.06)',
            },
            {
              label: 'Total Expenses',
              value: `₹${totalExpenses.toLocaleString('en-IN')}`,
              sub: pendingExpensesTotal > 0 ? `₹${pendingExpensesTotal.toLocaleString('en-IN')} pending` : 'Salaries & tools',
              color: BRAND.navy,
              bg: BRAND.cardBg,
              border: BRAND.navyBorder,
              accentDot: BRAND.navyLight,
              badgeBg: BRAND.navySubtle,
              badgeColor: BRAND.navyHover,
              badgeBorder: BRAND.navyBorder,
              shadow: '0 3px 14px rgba(10, 37, 64, 0.05)',
            },
            {
              label: 'Net Agency Profit',
              value: `₹${netProfit.toLocaleString('en-IN')}`,
              sub: `${netMargin}% net margin`,
              strong: true,
              color: BRAND.greenDark,
              bg: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, ${BRAND.cardBg} 100%)`,
              border: BRAND.greenBright,
              accentDot: BRAND.greenBright,
              badgeBg: BRAND.greenSubtle,
              badgeColor: BRAND.greenDark,
              badgeBorder: BRAND.greenBorder,
              shadow: '0 4px 20px rgba(0, 208, 94, 0.16)',
            },
          ].map((c, i) => (
            <div
              key={i}
              className="stat-card"
              style={{
                background: c.bg,
                border: c.strong ? `2px solid ${c.border}` : `1.5px solid ${c.border}`,
                borderRadius: 14,
                boxShadow: c.shadow,
                padding: '1.4rem 1.5rem',
              }}
            >
              <div
                className="metric-label"
                style={{
                  marginBottom: 12,
                  color: c.strong ? BRAND.greenDark : BRAND.navyMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {c.accentDot && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.accentDot, boxShadow: c.strong ? `0 0 6px ${c.accentDot}` : 'none' }} />
                )}
                {c.label}
              </div>
              <div className="metric-value" style={{ color: c.color }}>{c.value}</div>
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 9px',
                    borderRadius: 6,
                    background: c.badgeBg,
                    color: c.badgeColor,
                    border: `1px solid ${c.badgeBorder}`,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {c.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Operational KPIs ────────────────────────────────── */}
      <div className="rg-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Clients',     value: activeBrands.length,  icon: <Building2 className="w-4 h-4" />, color: BRAND.greenDark, bg: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`, border: BRAND.greenBorder },
          { label: 'Total Tasks',        value: tasks.length,          icon: <CheckSquare className="w-4 h-4" />, color: BRAND.navy,      bg: `linear-gradient(135deg, ${BRAND.navySubtle} 0%, var(--grad-navy-end) 100%)`,  border: BRAND.navyBorder },
          { label: 'Pending Tasks',      value: pendingTasks.length,   icon: <Clock className="w-4 h-4" />, color: BRAND.amber,     bg: `linear-gradient(135deg, ${BRAND.amberSubtle} 0%, var(--grad-amber-end) 100%)`, border: BRAND.amberBorder },
          { label: 'Meetings Scheduled', value: myMeetings.length,     icon: <Calendar className="w-4 h-4" />, color: BRAND.green,     bg: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`, border: BRAND.greenBorder },
        ].map((k, i) => (
          <div
            key={i}
            className="stat-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: BRAND.cardBg,
              border: `1.5px solid ${k.border}`,
              borderRadius: 14,
              boxShadow: '0 2px 10px rgba(10, 37, 64, 0.04)',
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: k.bg, border: `1.5px solid ${k.border}`, color: k.color,
                boxShadow: '0 1px 4px rgba(10, 37, 64, 0.06)',
              }}
            >
              {k.icon}
            </div>
            <div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: BRAND.navy }}>{k.value}</div>
              <div className="metric-label" style={{ color: BRAND.navyMuted }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Brand Share ─────────────────────── */}
      <div className="rg-1-auto" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Revenue bars */}
        <div
          className="card"
          style={{
            background: BRAND.cardBg,
            border: `1.5px solid ${BRAND.navyBorder}`,
            borderRadius: 16,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Monthly Revenue (FY 2026–27)</h3>
              <p style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 3 }}>Retainer billing vs agency costs</p>
            </div>
            {hasConfiguredRevenue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: BRAND.navyMuted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(90deg, ${BRAND.greenDark}, ${BRAND.greenBright})`, display: 'block', boxShadow: '0 0 4px rgba(0, 208, 94, 0.4)' }} />
                  <span style={{ color: BRAND.greenDark, fontWeight: 750 }}>Collections</span>
                </span>
                {role === 'admin' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(90deg, ${BRAND.navy}, ${BRAND.navyLight})`, display: 'block' }} />
                    <span style={{ color: BRAND.navy, fontWeight: 700 }}>Expenses</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {!hasConfiguredRevenue ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '36px 16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: BRAND.greenSubtle, border: `1.5px solid ${BRAND.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: BRAND.greenDark, boxShadow: '0 2px 8px rgba(0, 192, 88, 0.15)' }}>
                <TrendingUp style={{ width: 24, height: 24, color: BRAND.green }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.navy, marginBottom: 4 }}>
                No Monthly Revenue Configured Yet
              </div>
              <p style={{ fontSize: 12, color: BRAND.navyMuted, maxWidth: 320, lineHeight: 1.4, marginBottom: 16 }}>
                Monthly revenue and expense comparisons will appear here once client retainer collections or billing invoices are recorded for FY 2026–27.
              </p>
              {role === 'admin' && (
                <button
                  onClick={() => setActiveTab('invoices')}
                  style={{
                    padding: '10px 22px',
                    background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                    color: 'var(--solid-btn-text)',
                    border: `1px solid ${BRAND.navy}`,
                    borderRadius: 9,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(10, 37, 64, 0.2)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Configure Invoices →
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {months.map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: m.current ? 800 : 500, color: m.current ? BRAND.greenDark : BRAND.navyMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {m.label}
                      {m.current && (
                        <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: BRAND.greenSubtle, color: BRAND.greenDark, border: `1px solid ${BRAND.greenBorder}`, fontWeight: 750 }}>
                          current
                        </span>
                      )}
                    </span>
                    <span className="font-amount" style={{ fontSize: 13, fontWeight: 700, color: BRAND.navy }}>
                      ₹{m.income.toLocaleString('en-IN')}
                      {role === 'admin' && m.exp > 0 && (
                        <span style={{ color: BRAND.navyMuted, fontWeight: 500, fontSize: 11, marginLeft: 8 }}>
                          — ₹{m.exp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div className="progress-track" style={{ height: 8, position: 'relative', background: BRAND.navySubtle, border: `1px solid ${BRAND.navyBorder}` }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, Math.round((m.income / maxRevenue) * 100))}%`,
                          background: `linear-gradient(90deg, ${BRAND.greenDark} 0%, ${BRAND.green} 45%, ${BRAND.greenBright} 100%)`,
                          boxShadow: '0 2px 8px rgba(0, 208, 94, 0.35)',
                        }}
                      />
                    </div>
                    {role === 'admin' && m.exp > 0 && (
                      <div className="progress-track" style={{ height: 5, position: 'relative', background: BRAND.navySubtle, border: `1px solid ${BRAND.navyBorder}` }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, Math.round((m.exp / maxRevenue) * 100))}%`,
                            background: `linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 60%, ${BRAND.navyLight} 100%)`,
                            boxShadow: '0 1px 4px rgba(10, 37, 64, 0.2)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasConfiguredRevenue && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${BRAND.navyBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: BRAND.navyMuted }}>
              <span>Avg retainer / client: <strong className="font-amount" style={{ color: BRAND.navy, fontWeight: 800 }}>₹{avgRetainer.toLocaleString('en-IN')}/mo</strong></span>
              {growthRate !== null ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontWeight: 750,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: growthRate >= 0 ? BRAND.greenSubtle : 'var(--danger-bg)',
                    color: growthRate >= 0 ? BRAND.greenDark : 'var(--danger-text)',
                    border: growthRate >= 0 ? `1.5px solid ${BRAND.greenBorder}` : '1.5px solid var(--danger-border)',
                    boxShadow: growthRate >= 0 ? '0 1px 4px rgba(0, 208, 94, 0.12)' : 'none',
                  }}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> {growthRate >= 0 ? `+${growthRate}` : growthRate}% MoM
                </span>
              ) : (
                <span style={{ fontWeight: 750, color: BRAND.greenDark, background: BRAND.greenSubtle, padding: '3px 10px', borderRadius: 20, border: `1px solid ${BRAND.greenBorder}` }}>
                  {activeBrands.length} Active {activeBrands.length === 1 ? 'Client' : 'Clients'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Brand Revenue Share */}
        <div
          className="card"
          style={{
            background: BRAND.cardBg,
            border: `1.5px solid ${BRAND.navyBorder}`,
            borderRadius: 16,
            padding: '24px 24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Revenue Share</h3>
            <button
              onClick={() => setActiveTab('clients')}
              style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.green, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
            >
              View all →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {brands.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: BRAND.navyMuted, fontSize: 13 }}>
                No clients added yet.
              </div>
            ) : (
              brands.map(b => {
                const total = brands.reduce((a, x) => a + (x.monthlyFee || 0), 0);
                const pct   = total > 0 ? Math.round(((b.monthlyFee || 0) / total) * 100) : 0;
                return (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13.5 }}>
                      <span style={{ fontWeight: 700, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{b.name}</span>
                      <span className="font-amount" style={{ color: BRAND.greenDark, fontWeight: 800 }}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ background: BRAND.navySubtle, border: `1px solid ${BRAND.navyBorder}`, height: 8 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.green} 60%, ${BRAND.greenBright} 100%)`,
                          boxShadow: '0 2px 6px rgba(0, 208, 94, 0.25)',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BRAND.navyBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: BRAND.navyMuted }}>Retention health</span>
            <span
              style={{
                fontWeight: 750,
                color: BRAND.greenDark,
                background: BRAND.greenSubtle,
                border: `1.5px solid ${BRAND.greenBorder}`,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                boxShadow: '0 1px 4px rgba(0, 208, 94, 0.1)',
              }}
            >
              {brands.length > 0 ? `${Math.round((activeBrands.length / brands.length) * 100)}% Active` : 'No Data'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pending Tasks + Meetings ────────────────────────── */}
      <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 24 }}>

        {/* Pending Tasks */}
        <div
          className="card"
          style={{
            background: BRAND.cardBg,
            border: `1.5px solid ${BRAND.navyBorder}`,
            borderRadius: 16,
            padding: '24px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Pending Tasks</h3>
            <button
              onClick={() => setActiveTab('tasks')}
              style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.green, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              Full Board →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingTasks.slice(0, 5).map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 15px', borderRadius: 10,
                  background: BRAND.cardNestedBg, border: `1.5px solid ${BRAND.cardBorder}`, gap: 12,
                  boxShadow: '0 1px 4px rgba(10, 37, 64, 0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: 9999, marginTop: 5, flexShrink: 0,
                      background: t.priority === 'Urgent' ? 'var(--danger-text)' : t.priority === 'High' ? 'var(--warn-text)' : BRAND.greenBright,
                      boxShadow: t.priority === 'Urgent' ? '0 0 6px var(--danger-text)' : t.priority === 'High' ? '0 0 6px var(--warn-text)' : `0 0 6px ${BRAND.greenBright}`,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2 }}>Due {t.dueDate} · {t.priority}</div>
                  </div>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    padding: '4px 11px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 750,
                    background: BRAND.navySubtle,
                    color: BRAND.navy,
                    border: `1px solid ${BRAND.navyBorder}`,
                  }}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div
          className="card"
          style={{
            background: BRAND.cardBg,
            border: `1.5px solid ${BRAND.navyBorder}`,
            borderRadius: 16,
            padding: '24px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Upcoming Meetings</h3>
            <button
              onClick={() => setActiveTab('meetings')}
              style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.green, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              Full Calendar →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myMeetings.slice(0, 4).map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 15px', borderRadius: 10,
                  background: BRAND.cardNestedBg, border: `1.5px solid ${BRAND.cardBorder}`, gap: 12,
                  boxShadow: '0 1px 4px rgba(10, 37, 64, 0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`,
                      border: `1.5px solid ${BRAND.greenBorder}`,
                      boxShadow: '0 1px 4px rgba(0, 192, 88, 0.1)',
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: BRAND.greenDark }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2 }}>{m.date} · {m.time}</div>
                  </div>
                </div>
                <a
                  href={m.linkOrLocation}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 750,
                    color: 'var(--solid-btn-text)', textDecoration: 'none', flexShrink: 0,
                    background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                    border: `1px solid ${BRAND.navy}`,
                    boxShadow: '0 2px 8px rgba(10, 37, 64, 0.2)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Join
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
