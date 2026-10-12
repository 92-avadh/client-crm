import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Building2,
  CheckSquare,
  Clock,
  Calendar,
  Plus,
  Settings2,
  Eye,
  EyeOff,
  Activity,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  X,
  Sparkles,
  Target,
  Wallet,
  MessageSquare,
} from 'lucide-react';

// ─── Retentio Brand Identity Palette (Derived Directly from Official Logo) ───────────
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

/* ─── Animated Counter Hook ─────────────────────────────────── */
const useCountUp = (target: number, duration = 800): number => {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) return;

    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
};

/* ─── Widget Toggle Panel Component ─────────────────────────── */
const WidgetTogglePanel: React.FC<{
  visibility: Record<string, boolean>;
  onToggle: (key: string) => void;
}> = ({ visibility, onToggle }) => {
  const widgets = [
    { key: 'financial', label: 'Financial KPIs', icon: <DollarSign size={14} /> },
    { key: 'operational', label: 'Operational KPIs', icon: <Activity size={14} /> },
    { key: 'revenue', label: 'Revenue Chart', icon: <TrendingUp size={14} /> },
    { key: 'activity', label: 'Activity Feed', icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '12px',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
      minWidth: 220,
      animation: 'fadeSlideUp 0.2s ease',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--text-muted)',
        marginBottom: 10,
      }}>Toggle Widgets</div>
      {widgets.map(w => (
        <button
          key={w.key}
          onClick={() => onToggle(w.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 10px',
            background: 'none', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 550,
            color: 'var(--text-primary)', fontFamily: 'inherit',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {visibility[w.key]
            ? <Eye size={14} style={{ color: BRAND.green }} />
            : <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />}
          <span style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
            {w.icon} {w.label}
          </span>
          <div style={{
            width: 32, height: 18, borderRadius: 9999,
            background: visibility[w.key] ? BRAND.green : 'var(--bg-raised)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute',
              top: 2, left: visibility[w.key] ? 16 : 2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#ffffff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
        </button>
      ))}
    </div>
  );
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

  // ── Financial Calculations ─────────────────────────────────
  const paymentsTotal = payments
    .filter(p => p.status === 'Success')
    .reduce((a, p) => a + p.amount, 0);
  const unrecordedBrandFees = brands
    .filter(b => b.status === 'Active' && (b.monthlyFee || 0) > 0 && b.paymentStatus === 'Paid' && !payments.some(p => p.brandId === b.id && p.status === 'Success'))
    .reduce((a, b) => a + (b.monthlyFee || 0), 0);
  const totalReceived = paymentsTotal + unrecordedBrandFees;

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

  // ── Monthly Revenue / Expense Maps ─────────────────────────
  const monthlyIncomeMap: Record<string, number> = {};
  payments.forEach(p => {
    if (p.paymentDate && p.status === 'Success') {
      const key = p.paymentDate.slice(0, 7);
      monthlyIncomeMap[key] = (monthlyIncomeMap[key] || 0) + Number(p.amount);
    }
  });

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  if (unrecordedBrandFees > 0) {
    monthlyIncomeMap[currentMonthKey] = (monthlyIncomeMap[currentMonthKey] || 0) + unrecordedBrandFees;
  }

  const monthlyExpenseMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.date && (e.paymentStatus || 'Paid') === 'Paid') {
      const key = e.date.slice(0, 7);
      monthlyExpenseMap[key] = (monthlyExpenseMap[key] || 0) + Number(e.amount || 0);
    }
  });

  const monthLabelMap: Record<string, string> = {
    '2026-04': 'Apr 26', '2026-05': 'May 26', '2026-06': 'Jun 26',
    '2026-07': 'Jul 26', '2026-08': 'Aug 26', '2026-09': 'Sep 26',
    '2026-10': 'Oct 26', '2026-11': 'Nov 26', '2026-12': 'Dec 26',
    '2027-01': 'Jan 27', '2027-02': 'Feb 27', '2027-03': 'Mar 27',
  };

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

  // ── Widget Visibility ──────────────────────────────────────
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('retentio_dashboard_widgets');
      return saved ? JSON.parse(saved) : { financial: true, operational: true, revenue: true, activity: true };
    } catch {
      return { financial: true, operational: true, revenue: true, activity: true };
    }
  });
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);

  const toggleWidget = (key: string) => {
    setWidgetVisibility(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('retentio_dashboard_widgets', JSON.stringify(next)); } catch { /* storage full */ }
      return next;
    });
  };

  // ── Layout Density & Focus Preferences (from Onboarding / Settings) ──
  const [layoutMode, setLayoutMode] = useState<'default' | 'compact' | 'expanded'>(() => {
    return (localStorage.getItem('retentio_dashboard_layout') as any) || 'default';
  });
  const [dashboardFocus, setDashboardFocus] = useState<string>(() => {
    return localStorage.getItem('retentio_dashboard_focus') || 'balanced';
  });

  useEffect(() => {
    const handlePrefUpdate = (e: any) => {
      const detail = e.detail || {};
      if (detail.dashboardLayout) setLayoutMode(detail.dashboardLayout);
      if (detail.dashboardFocus) setDashboardFocus(detail.dashboardFocus);
    };
    window.addEventListener('retentio_preferences_updated', handlePrefUpdate);
    return () => window.removeEventListener('retentio_preferences_updated', handlePrefUpdate);
  }, []);

  // ── Animated Counters ──────────────────────────────────────
  const animatedTotalReceived = useCountUp(totalReceived);
  const animatedTotalPending = useCountUp(totalPending);
  const animatedTotalExpenses = useCountUp(totalExpenses);
  const animatedNetProfit = useCountUp(netProfit);
  const animatedActiveBrands = useCountUp(activeBrands.length);
  const animatedTasks = useCountUp(tasks.length);
  const animatedPendingTasks = useCountUp(pendingTasks.length);
  const animatedMeetings = useCountUp(myMeetings.length);

  // ── Activity Feed ──────────────────────────────────────────
  const activityFeed = useMemo(() => {
    const items: { id: string; icon: React.ReactNode; text: string; time: string; color: string }[] = [];

    payments
      .filter(p => p.status === 'Success')
      .slice(0, 3)
      .forEach(p => {
        items.push({
          id: `pay_${p.id}`,
          icon: <DollarSign size={14} />,
          text: `Payment received: ₹${Number(p.amount).toLocaleString('en-IN')} from ${p.brandName}`,
          time: p.paymentDate || 'Recent',
          color: BRAND.green,
        });
      });

    brands.slice(0, 2).forEach(b => {
      items.push({
        id: `brand_${b.id}`,
        icon: <Building2 size={14} />,
        text: `Client onboarded: ${b.name}`,
        time: b.onboardingDate || 'Recent',
        color: BRAND.navy,
      });
    });

    pendingTasks.slice(0, 3).forEach(t => {
      items.push({
        id: `task_${t.id}`,
        icon: <CheckSquare size={14} />,
        text: `Task pending: ${t.title}`,
        time: t.dueDate || 'No due date',
        color: BRAND.amber,
      });
    });

    myMeetings.slice(0, 2).forEach(m => {
      items.push({
        id: `meet_${m.id}`,
        icon: <Calendar size={14} />,
        text: `Meeting: ${m.title}`,
        time: `${m.date} · ${m.time}`,
        color: BRAND.green,
      });
    });

    return items.slice(0, 6);
  }, [payments, brands, pendingTasks, myMeetings]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: layoutMode === 'compact' ? 18 : 28, background: 'transparent' }}>

      {/* ══ Page Header ══════════════════════════════════════ */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: `1.5px solid ${BRAND.navyBorder}` }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND.navy, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Good morning, {currentUser.name.split(' ')[0]}
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20,
              background: BRAND.greenSubtle, color: BRAND.greenDark,
              border: `1px solid ${BRAND.greenBorder}`,
              fontSize: 11, fontWeight: 750, letterSpacing: '0.01em',
            }}>
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

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Widget toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              style={{
                padding: '10px 14px',
                background: showWidgetPanel ? BRAND.navySubtle : 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <Settings2 size={14} /> Customize
            </button>
            {showWidgetPanel && (
              <WidgetTogglePanel
                visibility={widgetVisibility}
                onToggle={toggleWidget}
              />
            )}
          </div>

          {(role === 'admin' || role === 'hr') && (
            <>
              <button
                onClick={() => setActiveTab('clients')}
                style={{
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                  color: 'var(--solid-btn-text)',
                  border: `1px solid ${BRAND.navy}`,
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex',
                  alignItems: 'center', gap: 8,
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
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex',
                  alignItems: 'center', gap: 8,
                  boxShadow: '0 2px 8px rgba(0, 192, 88, 0.12)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus className="w-4 h-4" style={{ color: BRAND.green }} /> Create Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ Financial KPIs ═══════════════════════════════════ */}
      {role === 'admin' && (
        <div className={`widget-toggle ${widgetVisibility.financial ? '' : 'collapsed'}`}>
          {dashboardFocus === 'financial' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: 'var(--brand-green-subtle, #ECFDF5)',
              border: '1px solid var(--brand-green-border, #86EFAC)',
              color: 'var(--brand-green-dark, #034726)',
              fontSize: 11.5, fontWeight: 750, marginBottom: 12,
            }}>
              <Sparkles size={13} className="text-emerald-500" />
              <span>Workspace Focus: Financial Health & Collections Priority</span>
            </div>
          )}
          {dashboardFocus === 'retention' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: 'var(--brand-navy-subtle, #F0F5FA)',
              border: '1px solid var(--border, #D0E0EF)',
              color: 'var(--brand-navy, #0A2540)',
              fontSize: 11.5, fontWeight: 750, marginBottom: 12,
            }}>
              <Target size={13} className="text-emerald-600" />
              <span>Workspace Focus: Client Retention & Churn Intelligence Priority</span>
            </div>
          )}
          <div className="rg-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: layoutMode === 'compact' ? 10 : 16 }}>
            {[
              {
                label: 'Total Collections',
                value: `₹${animatedTotalReceived.toLocaleString('en-IN')}`,
                sub: 'All payments received',
                color: BRAND.navy, bg: BRAND.cardBg, border: BRAND.greenBorder,
                accentDot: BRAND.greenBright, badgeBg: BRAND.greenSubtle,
                badgeColor: BRAND.greenDark, badgeBorder: BRAND.greenBorder,
                shadow: '0 3px 14px rgba(0, 168, 77, 0.08)',
              },
              {
                label: 'Pending / Overdue',
                value: `₹${animatedTotalPending.toLocaleString('en-IN')}`,
                sub: 'Awaiting clearance',
                color: totalPending > 0 ? BRAND.amber : BRAND.navy,
                bg: BRAND.cardBg,
                border: totalPending > 0 ? BRAND.amberBorder : BRAND.cardBorder,
                accentDot: BRAND.amber, badgeBg: BRAND.amberSubtle,
                badgeColor: BRAND.amber, badgeBorder: BRAND.amberBorder,
                shadow: '0 3px 14px rgba(180, 83, 9, 0.06)',
              },
              {
                label: 'Total Expenses',
                value: `₹${animatedTotalExpenses.toLocaleString('en-IN')}`,
                sub: pendingExpensesTotal > 0 ? `₹${pendingExpensesTotal.toLocaleString('en-IN')} pending` : 'Salaries & tools',
                color: BRAND.navy, bg: BRAND.cardBg, border: BRAND.navyBorder,
                accentDot: BRAND.navyLight, badgeBg: BRAND.navySubtle,
                badgeColor: BRAND.navyHover, badgeBorder: BRAND.navyBorder,
                shadow: '0 3px 14px rgba(10, 37, 64, 0.05)',
              },
              {
                label: 'Net Agency Profit',
                value: `₹${animatedNetProfit.toLocaleString('en-IN')}`,
                sub: `${netMargin}% net margin`,
                strong: true,
                color: BRAND.greenDark,
                bg: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, ${BRAND.cardBg} 100%)`,
                border: BRAND.greenBright, accentDot: BRAND.greenBright,
                badgeBg: BRAND.greenSubtle, badgeColor: BRAND.greenDark,
                badgeBorder: BRAND.greenBorder,
                shadow: '0 4px 20px rgba(0, 208, 94, 0.16)',
              },
            ].map((c, i) => (
              <div
                key={i}
                className="stat-card card-lift stagger-item"
                style={{
                  background: c.bg,
                  border: c.strong ? `2px solid ${c.border}` : `1.5px solid ${c.border}`,
                  borderRadius: 14, boxShadow: c.shadow,
                  padding: layoutMode === 'compact' ? '0.95rem 1.15rem' : '1.4rem 1.5rem',
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div className="metric-label" style={{
                  marginBottom: 12,
                  color: c.strong ? BRAND.greenDark : BRAND.navyMuted,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {c.accentDot && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.accentDot, boxShadow: c.strong ? `0 0 6px ${c.accentDot}` : 'none' }} />
                  )}
                  {c.label}
                </div>
                <div className="metric-value count-up" style={{ color: c.color }}>{c.value}</div>
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 9px', borderRadius: 6,
                    background: c.badgeBg, color: c.badgeColor,
                    border: `1px solid ${c.badgeBorder}`,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {c.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Operational KPIs ═════════════════════════════════ */}
      <div className={`widget-toggle ${widgetVisibility.operational ? '' : 'collapsed'}`}>
        <div className="rg-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Active Clients', value: animatedActiveBrands, icon: <Building2 className="w-4 h-4" />, color: BRAND.greenDark, bg: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`, border: BRAND.greenBorder },
            { label: 'Total Tasks', value: animatedTasks, icon: <CheckSquare className="w-4 h-4" />, color: BRAND.navy, bg: `linear-gradient(135deg, ${BRAND.navySubtle} 0%, var(--grad-navy-end) 100%)`, border: BRAND.navyBorder },
            { label: 'Pending Tasks', value: animatedPendingTasks, icon: <Clock className="w-4 h-4" />, color: BRAND.amber, bg: `linear-gradient(135deg, ${BRAND.amberSubtle} 0%, var(--grad-amber-end) 100%)`, border: BRAND.amberBorder },
            { label: 'Meetings Scheduled', value: animatedMeetings, icon: <Calendar className="w-4 h-4" />, color: BRAND.green, bg: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`, border: BRAND.greenBorder },
          ].map((k, i) => (
            <div
              key={i}
              className="stat-card card-lift stagger-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: BRAND.cardBg,
                border: `1.5px solid ${k.border}`,
                borderRadius: 14, boxShadow: '0 2px 10px rgba(10, 37, 64, 0.04)',
                animationDelay: `${0.3 + i * 0.08}s`,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: k.bg, border: `1.5px solid ${k.border}`, color: k.color,
                boxShadow: '0 1px 4px rgba(10, 37, 64, 0.06)',
              }}>
                {k.icon}
              </div>
              <div>
                <div className="metric-value count-up" style={{ fontSize: '1.5rem', color: BRAND.navy }}>{k.value}</div>
                <div className="metric-label" style={{ color: BRAND.navyMuted }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Revenue Chart + Brand Share ══════════════════════ */}
      <div className={`widget-toggle ${widgetVisibility.revenue ? '' : 'collapsed'}`}>
        <div className="rg-1-auto" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

          {/* Revenue bars */}
          <div className="card" style={{
            background: BRAND.cardBg, border: `1.5px solid ${BRAND.navyBorder}`,
            borderRadius: 16, padding: '24px 28px',
            display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)',
          }}>
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
                  <button onClick={() => setActiveTab('invoices')} style={{
                    padding: '10px 22px',
                    background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                    color: 'var(--solid-btn-text)', border: `1px solid ${BRAND.navy}`,
                    borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(10, 37, 64, 0.2)', transition: 'all 0.15s ease',
                  }}>
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
                        <div className="progress-fill" style={{
                          width: `${Math.min(100, Math.round((m.income / maxRevenue) * 100))}%`,
                          background: `linear-gradient(90deg, ${BRAND.greenDark} 0%, ${BRAND.green} 45%, ${BRAND.greenBright} 100%)`,
                          boxShadow: '0 2px 8px rgba(0, 208, 94, 0.35)',
                        }} />
                      </div>
                      {role === 'admin' && m.exp > 0 && (
                        <div className="progress-track" style={{ height: 5, position: 'relative', background: BRAND.navySubtle, border: `1px solid ${BRAND.navyBorder}` }}>
                          <div className="progress-fill" style={{
                            width: `${Math.min(100, Math.round((m.exp / maxRevenue) * 100))}%`,
                            background: `linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 60%, ${BRAND.navyLight} 100%)`,
                            boxShadow: '0 1px 4px rgba(10, 37, 64, 0.2)',
                          }} />
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
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontWeight: 750, padding: '3px 10px', borderRadius: 20,
                    background: growthRate >= 0 ? BRAND.greenSubtle : 'var(--danger-bg)',
                    color: growthRate >= 0 ? BRAND.greenDark : 'var(--danger-text)',
                    border: growthRate >= 0 ? `1.5px solid ${BRAND.greenBorder}` : '1.5px solid var(--danger-border)',
                    boxShadow: growthRate >= 0 ? '0 1px 4px rgba(0, 208, 94, 0.12)' : 'none',
                  }}>
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
          <div className="card" style={{
            background: BRAND.cardBg, border: `1.5px solid ${BRAND.navyBorder}`,
            borderRadius: 16, padding: '24px 24px',
            display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Revenue Share</h3>
              <button onClick={() => setActiveTab('clients')} style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.green, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
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
                        <div className="progress-fill" style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.green} 60%, ${BRAND.greenBright} 100%)`,
                          boxShadow: '0 2px 6px rgba(0, 208, 94, 0.25)',
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BRAND.navyBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: BRAND.navyMuted }}>Retention health</span>
              <span style={{
                fontWeight: 750, color: BRAND.greenDark,
                background: BRAND.greenSubtle, border: `1.5px solid ${BRAND.greenBorder}`,
                padding: '3px 10px', borderRadius: 20, fontSize: 12,
                boxShadow: '0 1px 4px rgba(0, 208, 94, 0.1)',
              }}>
                {brands.length > 0 ? `${Math.round((activeBrands.length / brands.length) * 100)}% Active` : 'No Data'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Pending Tasks + Meetings ═════════════════════════ */}
      <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 24 }}>

        {/* Pending Tasks */}
        <div className="card" style={{
          background: BRAND.cardBg, border: `1.5px solid ${BRAND.navyBorder}`,
          borderRadius: 16, padding: '24px 24px', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Pending Tasks</h3>
            <button onClick={() => setActiveTab('tasks')} style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.green, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              Full Board →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingTasks.slice(0, 5).map((t, i) => (
              <div key={t.id} className="card-lift stagger-item" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 15px', borderRadius: 10,
                background: BRAND.cardNestedBg, border: `1.5px solid ${BRAND.cardBorder}`, gap: 12,
                boxShadow: '0 1px 4px rgba(10, 37, 64, 0.03)',
                animationDelay: `${i * 0.06}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 9999, marginTop: 5, flexShrink: 0,
                    background: t.priority === 'Urgent' ? 'var(--danger-text)' : t.priority === 'High' ? 'var(--warn-text)' : BRAND.greenBright,
                    boxShadow: t.priority === 'Urgent' ? '0 0 6px var(--danger-text)' : t.priority === 'High' ? '0 0 6px var(--warn-text)' : `0 0 6px ${BRAND.greenBright}`,
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2 }}>Due {t.dueDate} · {t.priority}</div>
                  </div>
                </div>
                <span style={{
                  flexShrink: 0, display: 'inline-flex', padding: '4px 11px',
                  borderRadius: 20, fontSize: 12, fontWeight: 750,
                  background: BRAND.navySubtle, color: BRAND.navy,
                  border: `1px solid ${BRAND.navyBorder}`,
                }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="card" style={{
          background: BRAND.cardBg, border: `1.5px solid ${BRAND.navyBorder}`,
          borderRadius: 16, padding: '24px 24px', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Upcoming Meetings</h3>
            <button onClick={() => setActiveTab('meetings')} style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.green, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              Full Calendar →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myMeetings.slice(0, 4).map((m, i) => (
              <div key={m.id} className="card-lift stagger-item" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 15px', borderRadius: 10,
                background: BRAND.cardNestedBg, border: `1.5px solid ${BRAND.cardBorder}`, gap: 12,
                boxShadow: '0 1px 4px rgba(10, 37, 64, 0.03)',
                animationDelay: `${i * 0.06}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`,
                    border: `1.5px solid ${BRAND.greenBorder}`,
                    boxShadow: '0 1px 4px rgba(0, 192, 88, 0.1)',
                  }}>
                    <Calendar className="w-4 h-4" style={{ color: BRAND.greenDark }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {/* ══ Activity Feed ════════════════════════════════════ */}
      <div className={`widget-toggle ${widgetVisibility.activity ? '' : 'collapsed'}`}>
        <div className="card" style={{
          background: BRAND.cardBg, border: `1.5px solid ${BRAND.navyBorder}`,
          borderRadius: 16, padding: '24px 28px', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 850, color: BRAND.navy, letterSpacing: '-0.01em' }}>Activity Feed</h3>
              <p style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 3 }}>Recent events across your workspace</p>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20,
              background: BRAND.greenSubtle, color: BRAND.greenDark,
              border: `1px solid ${BRAND.greenBorder}`,
              fontSize: 11, fontWeight: 750,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND.greenBright, boxShadow: `0 0 6px ${BRAND.greenBright}` }} />
              Live
            </div>
          </div>

          {activityFeed.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: BRAND.greenSubtle, border: `1.5px solid ${BRAND.greenBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: BRAND.greenDark,
              }}>
                <Activity size={24} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.navy, marginBottom: 4 }}>
                No Activity Yet
              </div>
              <p style={{ fontSize: 12, color: BRAND.navyMuted, maxWidth: 320, lineHeight: 1.4, margin: '0 auto' }}>
                As you onboard clients, record payments, and manage tasks, activity will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activityFeed.map((item, i) => (
                <div key={item.id} className="feed-item" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: BRAND.cardNestedBg,
                  border: `1.5px solid ${BRAND.cardBorder}`,
                  animationDelay: `${i * 0.05}s`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`,
                    border: `1.5px solid ${BRAND.greenBorder}`,
                    color: item.color,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.text}
                    </div>
                  </div>
                  <span style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 600,
                    color: BRAND.navyMuted,
                    background: BRAND.navySubtle,
                    padding: '3px 8px', borderRadius: 6,
                    border: `1px solid ${BRAND.navyBorder}`,
                  }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
