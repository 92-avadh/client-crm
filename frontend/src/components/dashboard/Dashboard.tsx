import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Target,
  Wallet,
  CreditCard,
  Receipt,
  ChevronRight,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

// ─── Retentio Brand Identity Palette ──────────────────────────────────────────
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

  amber: 'var(--warn-text, #92400E)',
  amberSubtle: 'var(--warn-bg, #FFFBEB)',
  amberBorder: 'var(--warn-border, #FDE68A)',

  danger: 'var(--danger-text, #B91C1C)',
  dangerSubtle: 'var(--danger-bg, #FEF2F2)',
  dangerBorder: 'var(--danger-border, #FECACA)',

  border: 'var(--border, #E5E7EB)',
  cardBorder: 'var(--border, #E5E7EB)',
  cardBg: 'var(--bg-card, #FFFFFF)',
  cardNestedBg: 'var(--bg-raised, #F8FAFC)',
};


/* ─── Widget Toggle Panel Component ─────────────────────────── */
const WidgetTogglePanel: React.FC<{
  visibility: Record<string, boolean>;
  onToggle: (key: string) => void;
}> = ({ visibility, onToggle }) => {
  const widgets = [
    { key: 'financial', label: 'Financial Overview', icon: <DollarSign size={14} /> },
    { key: 'operational', label: 'Operational Metrics', icon: <Activity size={14} /> },
    { key: 'revenue', label: 'Revenue & Overhead', icon: <TrendingUp size={14} /> },
    { key: 'tasks', label: 'Pending Tasks', icon: <CheckSquare size={14} /> },
    { key: 'invoices', label: 'Recent Invoices', icon: <Receipt size={14} /> },
    { key: 'activity', label: 'Recent Activity Feed', icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '12px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        minWidth: 230,
        animation: 'fadeSlideUp 0.18s ease',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        Customize Dashboard
      </div>
      {widgets.map(w => (
        <button
          key={w.key}
          onClick={() => onToggle(w.key)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 10px',
            background: 'none',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 550,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {visibility[w.key] !== false ? (
            <Eye size={14} style={{ color: BRAND.green }} />
          ) : (
            <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />
          )}
          <span style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
            {w.icon} {w.label}
          </span>
          <div
            style={{
              width: 30,
              height: 18,
              borderRadius: 9999,
              background: visibility[w.key] !== false ? BRAND.green : 'var(--bg-raised)',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: visibility[w.key] !== false ? 14 : 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#ffffff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
};

const formatDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return 'No date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
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
    currencySymbol,
    formatCurrency,
  } = useApp();

  const role = currentUser?.role;

  // ── Financial Calculations ─────────────────────────────────
  const paymentsTotal = payments
    .filter(p => p.status === 'Success')
    .reduce((a, p) => a + (Number(p.amount) || 0), 0);

  const unrecordedBrandFees = brands
    .filter(
      b =>
        b.status === 'Active' &&
        (Number(b.monthlyFee) || 0) > 0 &&
        b.paymentStatus === 'Paid' &&
        !payments.some(p => p.brandId === b.id && p.status === 'Success')
    )
    .reduce((a, b) => a + (Number(b.monthlyFee) || 0), 0);

  const totalReceived = paymentsTotal + unrecordedBrandFees;

  const paidExpenses = expenses.filter(e => (e.paymentStatus || 'Paid') === 'Paid');
  const pendingExpenses = expenses.filter(e => e.paymentStatus === 'Pending');
  const totalExpenses = paidExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const pendingExpensesTotal = pendingExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const netProfit = totalReceived - totalExpenses;
  const netMargin = totalReceived > 0 ? Math.round((netProfit / totalReceived) * 100) : 0;

  const pendingPayments = payments
    .filter(p => p.status === 'Pending')
    .reduce((a, p) => a + (Number(p.amount) || 0), 0);

  const pendingBrandFees = brands
    .filter(
      b =>
        b.status === 'Active' &&
        (Number(b.monthlyFee) || 0) > 0 &&
        b.paymentStatus === 'Pending' &&
        !payments.some(p => p.brandId === b.id && p.status === 'Success') &&
        !invoices.some(i => i.brandId === b.id && i.status !== 'Draft' && i.status !== 'Cancelled')
    )
    .reduce((a, b) => a + (Number(b.monthlyFee) || 0), 0);

  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const unpaidInvoicesBalance = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((a, i) => a + Math.max(0, (Number(i.totalAmount) || 0) - (Number(i.paidAmount) || 0)), 0);

  const totalPending = unpaidInvoicesBalance + pendingBrandFees;

  const activeBrands = brands.filter(b => b.status === 'Active');
  const relevantTasks = role === 'team' ? tasks.filter(t => t.assigneeId === currentUser?.id) : tasks;
  const pendingTasks = relevantTasks.filter(t => t.status !== 'Completed');
  const myMeetings = meetings.filter(m => (role === 'team' ? (m.attendeeIds || []).includes(currentUser?.id) : true));

  // ── Monthly Revenue / Expense Maps ─────────────────────────
  const monthlyIncomeMap: Record<string, number> = {};
  payments.forEach(p => {
    if (p.paymentDate && p.status === 'Success') {
      const key = String(p.paymentDate).slice(0, 7);
      monthlyIncomeMap[key] = (monthlyIncomeMap[key] || 0) + (Number(p.amount) || 0);
    }
  });

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  if (unrecordedBrandFees > 0) {
    monthlyIncomeMap[currentMonthKey] = (monthlyIncomeMap[currentMonthKey] || 0) + unrecordedBrandFees;
  }

  const monthlyExpenseMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.date && (e.paymentStatus || 'Paid') === 'Paid') {
      const key = String(e.date).slice(0, 7);
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

  const configuredMonthKeys = Object.keys({ ...monthlyIncomeMap, ...monthlyExpenseMap }).sort();
  const hasConfiguredRevenue = configuredMonthKeys.length > 0;

  const months = configuredMonthKeys.map(key => ({
    label: monthLabelMap[key] || key,
    income: monthlyIncomeMap[key] || 0,
    exp: monthlyExpenseMap[key] || 0,
    current: key === currentMonthKey,
  }));

  const maxRevenue = Math.max(100000, ...months.map(m => Math.max(m.income, m.exp)));

  const avgRetainer =
    activeBrands.length > 0
      ? Math.round(activeBrands.reduce((a, b) => a + (b.monthlyFee || 0), 0) / activeBrands.length)
      : 0;

  const growthRate =
    months.length >= 2 && months[months.length - 2].income > 0
      ? Math.round(
          ((months[months.length - 1].income - months[months.length - 2].income) /
            months[months.length - 2].income) *
            100
        )
      : null;

  // ── Tab for Main Revenue Card (Breakdown vs Client Share) ──
  const [revenueView, setRevenueView] = useState<'monthly' | 'clients'>('monthly');

  // ── Widget Visibility ──────────────────────────────────────
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('retentio_dashboard_widgets');
      return saved
        ? JSON.parse(saved)
        : { financial: true, operational: true, revenue: true, tasks: true, invoices: true, activity: true };
    } catch {
      return { financial: true, operational: true, revenue: true, tasks: true, invoices: true, activity: true };
    }
  });
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);

  const toggleWidget = (key: string) => {
    setWidgetVisibility(prev => {
      const next = { ...prev, [key]: prev[key] === false ? true : false };
      try {
        localStorage.setItem('retentio_dashboard_widgets', JSON.stringify(next));
      } catch {
        /* storage full */
      }
      return next;
    });
  };

  // ── Layout Density & Focus Preferences ─────────────────────
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

  // ── Recent Invoices ────────────────────────────────────────
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''))
      .slice(0, 5);
  }, [invoices]);

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
          text: `Payment received: ${formatCurrency(p.amount)} from ${p.brandName || 'Client'}`,
          time: p.paymentDate ? formatDateDisplay(p.paymentDate) : 'Recent',
          color: BRAND.green,
        });
      });

    invoices.slice(0, 2).forEach(inv => {
      items.push({
        id: `inv_${inv.id}`,
        icon: <Receipt size={14} />,
        text: `Invoice #${inv.invoiceNumber} (${inv.status}) for ${inv.brandName || 'Client'}`,
        time: inv.issueDate ? formatDateDisplay(inv.issueDate) : 'Recent',
        color: inv.status === 'Paid' ? BRAND.green : BRAND.navy,
      });
    });

    brands.slice(0, 2).forEach(b => {
      items.push({
        id: `brand_${b.id}`,
        icon: <Building2 size={14} />,
        text: `Client onboarded: ${b.name}`,
        time: b.onboardingDate ? formatDateDisplay(b.onboardingDate) : 'Recent',
        color: BRAND.navy,
      });
    });

    pendingTasks.slice(0, 2).forEach(t => {
      items.push({
        id: `task_${t.id}`,
        icon: <CheckSquare size={14} />,
        text: `Task pending: ${t.title}`,
        time: t.dueDate ? formatDateDisplay(t.dueDate) : 'No due date',
        color: BRAND.amber,
      });
    });

    myMeetings.slice(0, 2).forEach(m => {
      items.push({
        id: `meet_${m.id}`,
        icon: <Calendar size={14} />,
        text: `Meeting scheduled: ${m.title}`,
        time: m.date ? (m.time ? `${formatDateDisplay(m.date)} · ${m.time}` : formatDateDisplay(m.date)) : 'Scheduled',
        color: BRAND.green,
      });
    });

    return items.slice(0, 6);
  }, [payments, invoices, brands, pendingTasks, myMeetings]);

  const formattedCurrentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="animate-fade-in w-full min-w-0"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: layoutMode === 'compact' ? 18 : 24,
        background: 'transparent',
      }}
    >
      {/* ══ Page Header ══════════════════════════════════════ */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          paddingBottom: 20,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: BRAND.navy,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Dashboard
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
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: BRAND.greenBright,
                  boxShadow: `0 0 6px ${BRAND.greenBright}`,
                }}
              />
              Live Workspace
            </span>
          </div>
          <p style={{ fontSize: 13, color: BRAND.navyMuted, marginTop: 4 }}>
            {formattedCurrentDate}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
          {/* Widget toggle */}
          <div className="relative">
            <button
              onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              style={{
                padding: '9px 14px',
                background: showWidgetPanel ? BRAND.navySubtle : 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <Settings2 size={14} /> Customize
            </button>
            {showWidgetPanel && (
              <WidgetTogglePanel visibility={widgetVisibility} onToggle={toggleWidget} />
            )}
          </div>

          {(role === 'admin' || role === 'hr') && (
            <>
              <button
                onClick={() => setActiveTab('clients')}
                style={{
                  padding: '9px 16px',
                  background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                  color: 'var(--solid-btn-text)',
                  border: `1px solid ${BRAND.navy}`,
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 2px 8px rgba(10, 37, 64, 0.16)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus className="w-4 h-4" style={{ color: BRAND.greenBright }} /> Onboard Client
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                style={{
                  padding: '9px 16px',
                  background: `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--grad-green-end) 100%)`,
                  color: BRAND.greenDark,
                  border: `1px solid ${BRAND.greenBorder}`,
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
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

      {/* ══ SECTION A: FINANCIAL OVERVIEW ═════════════════════ */}
      {role === 'admin' && widgetVisibility.financial !== false && (
        <div>
          {dashboardFocus === 'financial' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'var(--brand-green-subtle, #ECFDF5)',
                border: '1px solid var(--brand-green-border, #86EFAC)',
                color: 'var(--brand-green-dark, #034726)',
                fontSize: 11.5,
                fontWeight: 750,
                marginBottom: 12,
              }}
            >
              <Sparkles size={13} className="text-emerald-500" />
              <span>Workspace Focus: Financial Health & Collections Priority</span>
            </div>
          )}
          {dashboardFocus === 'retention' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'var(--brand-navy-subtle, #F0F5FA)',
                border: '1px solid var(--border, #D0E0EF)',
                color: 'var(--brand-navy, #0A2540)',
                fontSize: 11.5,
                fontWeight: 750,
                marginBottom: 12,
              }}
            >
              <Target size={13} className="text-emerald-600" />
              <span>Workspace Focus: Client Retention & Churn Intelligence Priority</span>
            </div>
          )}

          <div className="dashboard-grid-kpis">
            {[
              {
                title: 'Total Collections',
                value: formatCurrency(animatedTotalReceived),
                icon: <Wallet className="w-4 h-4" />,
                iconColor: BRAND.greenDark,
                iconBg: BRAND.greenSubtle,
                iconBorder: BRAND.greenBorder,
                context: 'All payments received',
                trend: growthRate !== null ? `${growthRate >= 0 ? `+${growthRate}` : growthRate}% MoM` : null,
                trendPositive: growthRate !== null ? growthRate >= 0 : true,
                cardBorder: BRAND.border,
                accentColor: BRAND.green,
              },
              {
                title: 'Pending / Overdue',
                value: formatCurrency(animatedTotalPending),
                icon: <Clock className="w-4 h-4" />,
                iconColor: totalPending > 0 ? BRAND.amber : BRAND.navyMuted,
                iconBg: totalPending > 0 ? BRAND.amberSubtle : BRAND.navySubtle,
                iconBorder: totalPending > 0 ? BRAND.amberBorder : BRAND.border,
                context:
                  overdueInvoices.length > 0
                    ? `${overdueInvoices.length} overdue · awaiting clearance`
                    : 'Awaiting clearance',
                trend: null,
                cardBorder: overdueInvoices.length > 0 ? BRAND.amberBorder : BRAND.border,
                accentColor: overdueInvoices.length > 0 ? BRAND.amber : BRAND.navy,
              },
              {
                title: 'Total Expenses',
                value: formatCurrency(animatedTotalExpenses),
                icon: <CreditCard className="w-4 h-4" />,
                iconColor: BRAND.navyLight,
                iconBg: BRAND.navySubtle,
                iconBorder: BRAND.navyBorder,
                context:
                  pendingExpensesTotal > 0
                    ? `${formatCurrency(pendingExpensesTotal)} pending`
                    : 'Salaries & overhead',
                trend: null,
                cardBorder: BRAND.border,
                accentColor: BRAND.navy,
              },
              {
                title: 'Net Agency Profit',
                value: formatCurrency(animatedNetProfit),
                icon: <Sparkles className="w-4 h-4" />,
                iconColor: BRAND.greenDark,
                iconBg: BRAND.greenSubtle,
                iconBorder: BRAND.greenBorder,
                context: `${netMargin}% net margin`,
                trend: `${activeBrands.length} active clients`,
                trendPositive: true,
                cardBorder: BRAND.greenBorder,
                accentColor: BRAND.greenDark,
                strong: true,
              },
            ].map((c, i) => (
              <div
                key={i}
                className="stat-card card-lift stagger-item"
                style={{
                  background: c.strong
                    ? `linear-gradient(135deg, ${BRAND.greenSubtle} 0%, var(--bg-card) 100%)`
                    : 'var(--bg-card)',
                  border: `1px solid ${c.cardBorder}`,
                  borderRadius: 12,
                  padding: layoutMode === 'compact' ? '1rem 1.15rem' : '1.25rem 1.4rem',
                  boxShadow: 'var(--shadow-polaris-card, 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 120,
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {/* Card Header: Icon & Metric Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: BRAND.navyMuted,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {c.title}
                  </span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: c.iconBg,
                      border: `1px solid ${c.iconBorder}`,
                      color: c.iconColor,
                    }}
                  >
                    {c.icon}
                  </div>
                </div>

                {/* Card Metric Value */}
                <div style={{ margin: '8px 0 6px' }}>
                  <span
                    className="metric-value count-up font-amount"
                    style={{
                      fontSize: '1.65rem',
                      fontWeight: 750,
                      color: c.strong ? BRAND.greenDark : BRAND.navy,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.15,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {c.value}
                  </span>
                </div>

                {/* Card Subtitle / Contextual Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: BRAND.navyMuted,
                    }}
                  >
                    {c.context}
                  </span>
                  {c.trend && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 650,
                        background: c.trendPositive ? BRAND.greenSubtle : BRAND.dangerSubtle,
                        color: c.trendPositive ? BRAND.greenDark : BRAND.danger,
                        border: `1px solid ${c.trendPositive ? BRAND.greenBorder : BRAND.dangerBorder}`,
                      }}
                    >
                      <ArrowUpRight size={11} /> {c.trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ SECTION B: OPERATIONAL OVERVIEW ═══════════════════ */}
      {widgetVisibility.operational !== false && (
        <div className="dashboard-grid-ops">
          {[
            {
              label: 'Active Clients',
              value: animatedActiveBrands,
              sub: `${brands.length} total onboarded`,
              icon: <Building2 className="w-4 h-4" />,
              color: BRAND.greenDark,
              bg: BRAND.greenSubtle,
              border: BRAND.greenBorder,
              targetTab: 'clients',
            },
            {
              label: 'Total Tasks',
              value: animatedTasks,
              sub: `${tasks.filter(t => t.status === 'Completed').length} completed`,
              icon: <CheckSquare className="w-4 h-4" />,
              color: BRAND.navy,
              bg: BRAND.navySubtle,
              border: BRAND.navyBorder,
              targetTab: 'tasks',
            },
            {
              label: 'Pending Tasks',
              value: animatedPendingTasks,
              sub: `${relevantTasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length} urgent / high`,
              icon: <Clock className="w-4 h-4" />,
              color: pendingTasks.length > 0 ? BRAND.amber : BRAND.navyMuted,
              bg: pendingTasks.length > 0 ? BRAND.amberSubtle : BRAND.navySubtle,
              border: pendingTasks.length > 0 ? BRAND.amberBorder : BRAND.border,
              targetTab: 'tasks',
            },
            {
              label: 'Upcoming Meetings',
              value: animatedMeetings,
              sub: myMeetings.length > 0 ? `Next: ${formatDateDisplay(myMeetings[0].date)}` : 'Scheduled calls',
              icon: <Calendar className="w-4 h-4" />,
              color: BRAND.green,
              bg: BRAND.greenSubtle,
              border: BRAND.greenBorder,
              targetTab: 'meetings',
            },
          ].map((k, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab(k.targetTab)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(k.targetTab);
                }
              }}
              className="card-lift stagger-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                minHeight: 84,
                transition: 'all 0.15s ease',
                animationDelay: `${0.2 + i * 0.05}s`,
              }}
              title={`View ${k.label}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: k.bg,
                    border: `1px solid ${k.border}`,
                    color: k.color,
                  }}
                >
                  {k.icon}
                </div>
                <div>
                  <div
                    className="metric-value count-up font-amount"
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: BRAND.navy,
                      lineHeight: 1.1,
                    }}
                  >
                    {k.value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 650, color: BRAND.navyMuted, marginTop: 2 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {k.sub}
                  </div>
                </div>
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* ══ SECTION C: MAIN CONTENT AREA ══════════════════════ */}
      <div className="dashboard-grid-main">
        {/* Left Column: Revenue & Overhead / Client Distribution */}
        {widgetVisibility.revenue !== false && (
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-polaris-card, 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06))',
            }}
          >
            {/* Widget Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 18,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: BRAND.navy,
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Monthly Revenue & Overhead (FY 2026–27)
                </h3>
                <p style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2, margin: 0 }}>
                  Retainer collections vs recorded overhead
                </p>
              </div>

              {/* View Switcher: Monthly Breakdown vs Client Share */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    display: 'flex',
                    background: 'var(--bg-raised)',
                    padding: 2,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <button
                    onClick={() => setRevenueView('monthly')}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 650,
                      border: 'none',
                      cursor: 'pointer',
                      background: revenueView === 'monthly' ? 'var(--bg-card)' : 'transparent',
                      color: revenueView === 'monthly' ? BRAND.navy : BRAND.navyMuted,
                      boxShadow: revenueView === 'monthly' ? 'var(--shadow-sm)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <BarChart3 size={12} /> Monthly
                  </button>
                  <button
                    onClick={() => setRevenueView('clients')}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 650,
                      border: 'none',
                      cursor: 'pointer',
                      background: revenueView === 'clients' ? 'var(--bg-card)' : 'transparent',
                      color: revenueView === 'clients' ? BRAND.navy : BRAND.navyMuted,
                      boxShadow: revenueView === 'clients' ? 'var(--shadow-sm)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <PieChart size={12} /> Client Share
                  </button>
                </div>
              </div>
            </div>

            {/* View 1: Monthly Revenue Progress Bars */}
            {revenueView === 'monthly' && (
              <>
                {!hasConfiguredRevenue ? (
                  /* Compact Intentional Empty State */
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '28px 16px',
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: BRAND.greenSubtle,
                        border: `1px solid ${BRAND.greenBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                        color: BRAND.greenDark,
                      }}
                    >
                      <TrendingUp style={{ width: 20, height: 20, color: BRAND.green }} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.navy, marginBottom: 4 }}>
                      No revenue data yet
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: BRAND.navyMuted,
                        maxWidth: 310,
                        lineHeight: 1.4,
                        marginBottom: 14,
                      }}
                    >
                      Create your first invoice to start tracking agency revenue and financial performance.
                    </p>
                    {role === 'admin' && (
                      <button
                        onClick={() => setActiveTab('invoices')}
                        style={{
                          padding: '8px 18px',
                          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                          color: 'var(--solid-btn-text)',
                          border: `1px solid ${BRAND.navy}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Create Invoice →
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                    {months.map((m, i) => (
                      <div key={i}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: m.current ? 750 : 550,
                              color: m.current ? BRAND.greenDark : BRAND.navyMuted,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {m.label}
                            {m.current && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '1px 7px',
                                  borderRadius: 10,
                                  background: BRAND.greenSubtle,
                                  color: BRAND.greenDark,
                                  border: `1px solid ${BRAND.greenBorder}`,
                                  fontWeight: 750,
                                }}
                              >
                                current
                              </span>
                            )}
                          </span>
                          <span className="font-amount" style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.navy }}>
                            {formatCurrency(m.income)}
                            {role === 'admin' && m.exp > 0 && (
                              <span
                                style={{
                                  color: BRAND.navyMuted,
                                  fontWeight: 500,
                                  fontSize: 11,
                                  marginLeft: 6,
                                }}
                              >
                                (overhead: {formatCurrency(m.exp)})
                              </span>
                            )}
                          </span>
                        </div>
                        {/* Single Progress Bar */}
                        <div
                          className="progress-track"
                          style={{
                            height: 8,
                            position: 'relative',
                            background: 'var(--bg-raised)',
                            border: `1px solid var(--border)`,
                            borderRadius: 9999,
                          }}
                        >
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, Math.round((m.income / maxRevenue) * 100))}%`,
                              background: `linear-gradient(90deg, ${BRAND.greenDark} 0%, ${BRAND.green} 50%, ${BRAND.greenBright} 100%)`,
                              boxShadow: '0 1px 4px rgba(0, 208, 94, 0.25)',
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasConfiguredRevenue && (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 14,
                      borderTop: `1px solid ${BRAND.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      color: BRAND.navyMuted,
                    }}
                  >
                    <span>
                      Avg retainer / client:{' '}
                      <strong className="font-amount" style={{ color: BRAND.navy, fontWeight: 750 }}>
                        {formatCurrency(avgRetainer)}/mo
                      </strong>
                    </span>
                    {growthRate !== null ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 700,
                          padding: '2px 9px',
                          borderRadius: 20,
                          background: growthRate >= 0 ? BRAND.greenSubtle : BRAND.dangerSubtle,
                          color: growthRate >= 0 ? BRAND.greenDark : BRAND.danger,
                          border: `1px solid ${growthRate >= 0 ? BRAND.greenBorder : BRAND.dangerBorder}`,
                        }}
                      >
                        <TrendingUp className="w-3 h-3" /> {growthRate >= 0 ? `+${growthRate}` : growthRate}% MoM
                      </span>
                    ) : (
                      <span
                        style={{
                          fontWeight: 700,
                          color: BRAND.greenDark,
                          background: BRAND.greenSubtle,
                          padding: '2px 9px',
                          borderRadius: 20,
                          border: `1px solid ${BRAND.greenBorder}`,
                        }}
                      >
                        {activeBrands.length} Active {activeBrands.length === 1 ? 'Client' : 'Clients'}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* View 2: Client Revenue Share Distribution */}
            {revenueView === 'clients' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {brands.length === 0 ? (
                  <div
                    style={{
                      padding: '28px 16px',
                      textAlign: 'center',
                      color: BRAND.navyMuted,
                      fontSize: 13,
                    }}
                  >
                    No clients added yet.
                  </div>
                ) : (
                  brands.slice(0, 5).map(b => {
                    const total = brands.reduce((a, x) => a + (Number(x.monthlyFee) || 0), 0);
                    const fee = Number(b.monthlyFee) || 0;
                    const pct = total > 0 ? Math.round((fee / total) * 100) : 0;
                    return (
                      <div key={b.id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 5,
                            fontSize: 12.5,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 650,
                              color: BRAND.navy,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 180,
                            }}
                          >
                            {b.name}
                          </span>
                          <span className="font-amount" style={{ color: BRAND.greenDark, fontWeight: 750 }}>
                            {pct}% ({`${formatCurrency(fee)}/mo`})
                          </span>
                        </div>
                        <div
                          className="progress-track"
                          style={{
                            background: 'var(--bg-raised)',
                            border: `1px solid var(--border)`,
                            height: 7,
                            borderRadius: 9999,
                          }}
                        >
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.green} 60%, ${BRAND.greenBright} 100%)`,
                              borderRadius: 9999,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 14,
                    borderTop: `1px solid ${BRAND.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: BRAND.navyMuted }}>Active Retainer Retention</span>
                  <span
                    style={{
                      fontWeight: 750,
                      color: BRAND.greenDark,
                      background: BRAND.greenSubtle,
                      border: `1px solid ${BRAND.greenBorder}`,
                      padding: '2px 9px',
                      borderRadius: 20,
                      fontSize: 11.5,
                    }}
                  >
                    {brands.length > 0
                      ? `${Math.round((activeBrands.length / brands.length) * 100)}% Active`
                      : 'No Data'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Column: Upcoming Tasks / Pending Actions Widget */}
        {widgetVisibility.tasks !== false && (
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-polaris-card, 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06))',
            }}
          >
            {/* Widget Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: BRAND.navy,
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Pending Tasks
                </h3>
                <p style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2, margin: 0 }}>
                  {pendingTasks.length} {pendingTasks.length === 1 ? 'task' : 'tasks'} requiring attention
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                style={{
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: BRAND.green,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 6px',
                }}
              >
                View all tasks →
              </button>
            </div>

            {/* Tasks List or Empty State */}
            {pendingTasks.length === 0 ? (
              /* Compact Intentional Empty State */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '28px 16px',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: BRAND.greenSubtle,
                    border: `1px solid ${BRAND.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    color: BRAND.greenDark,
                  }}
                >
                  <CheckSquare style={{ width: 20, height: 20, color: BRAND.green }} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.navy, marginBottom: 4 }}>
                  All tasks completed
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: BRAND.navyMuted,
                    maxWidth: 290,
                    lineHeight: 1.4,
                    marginBottom: 14,
                  }}
                >
                  No pending deliverables. Create a new task to organize agency team deliverables.
                </p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  style={{
                    padding: '8px 18px',
                    background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                    color: 'var(--solid-btn-text)',
                    border: `1px solid ${BRAND.navy}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Create Task →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                {pendingTasks.slice(0, 5).map((t, i) => (
                  <div
                    key={t.id}
                    className="card-lift stagger-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg-raised)',
                      border: `1px solid var(--border)`,
                      gap: 10,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0 }}>
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 9999,
                          marginTop: 5,
                          flexShrink: 0,
                          background:
                            t.priority === 'Urgent'
                              ? 'var(--danger-text)'
                              : t.priority === 'High'
                              ? 'var(--warn-text)'
                              : BRAND.greenBright,
                          boxShadow:
                            t.priority === 'Urgent'
                              ? '0 0 5px var(--danger-text)'
                              : t.priority === 'High'
                              ? '0 0 5px var(--warn-text)'
                              : `0 0 5px ${BRAND.greenBright}`,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 650,
                            color: BRAND.navy,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: BRAND.navyMuted, marginTop: 2 }}>
                          {brands.find(b => b.id === t.brandId)?.name ? `${brands.find(b => b.id === t.brandId)?.name} · ` : ''}Due {formatDateDisplay(t.dueDate)} · {t.priority}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        padding: '2.5px 8px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 650,
                        background: 'var(--bg-card)',
                        color: BRAND.navy,
                        border: `1px solid var(--border)`,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ SECTION D: SECONDARY CONTENT ══════════════════════ */}
      <div className="dashboard-grid-secondary">
        {/* Left Column: Recent Invoices */}
        {widgetVisibility.invoices !== false && (
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-polaris-card, 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06))',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: BRAND.navy,
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Recent Invoices
                </h3>
                <p style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2, margin: 0 }}>
                  Billing transactions & payment status
                </p>
              </div>
              <button
                onClick={() => setActiveTab('invoices')}
                style={{
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: BRAND.green,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 6px',
                }}
              >
                View all invoices →
              </button>
            </div>

            {/* Invoices List or Empty State */}
            {recentInvoices.length === 0 ? (
              /* Compact Intentional Empty State */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '28px 16px',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: BRAND.greenSubtle,
                    border: `1px solid ${BRAND.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    color: BRAND.greenDark,
                  }}
                >
                  <Receipt style={{ width: 20, height: 20, color: BRAND.green }} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.navy, marginBottom: 4 }}>
                  No invoices issued yet
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: BRAND.navyMuted,
                    maxWidth: 300,
                    lineHeight: 1.4,
                    marginBottom: 14,
                  }}
                >
                  Generate your first invoice to bill clients and track incoming agency payments.
                </p>
                {role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('invoices')}
                    style={{
                      padding: '8px 18px',
                      background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
                      color: 'var(--solid-btn-text)',
                      border: `1px solid ${BRAND.navy}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Create Invoice →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {recentInvoices.map((inv, i) => {
                  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
                    Paid: {
                      bg: 'var(--success-bg, #f0fdf4)',
                      text: 'var(--success-text, #15803d)',
                      border: 'var(--success-border, #bbf7d0)',
                    },
                    Sent: {
                      bg: 'var(--info-bg, #eff6ff)',
                      text: 'var(--info-text, #1d4ed8)',
                      border: 'var(--info-border, #bfdbfe)',
                    },
                    Overdue: {
                      bg: 'var(--danger-bg, #fef2f2)',
                      text: 'var(--danger-text, #b91c1c)',
                      border: 'var(--danger-border, #fecaca)',
                    },
                    'Partially Paid': {
                      bg: 'var(--warn-bg, #fffbeb)',
                      text: 'var(--warn-text, #92400e)',
                      border: 'var(--warn-border, #fde68a)',
                    },
                    Draft: {
                      bg: 'var(--bg-raised, #f1f5f9)',
                      text: 'var(--text-secondary, #525252)',
                      border: 'var(--border, #e2e2e2)',
                    },
                  };

                  const s = statusStyles[inv.status] || statusStyles.Draft;

                  return (
                    <div
                      key={inv.id}
                      className="card-lift stagger-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--bg-raised)',
                        border: `1px solid var(--border)`,
                        gap: 12,
                        animationDelay: `${i * 0.04}s`,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 750,
                              fontFamily: 'var(--font-mono, monospace)',
                              color: BRAND.navy,
                            }}
                          >
                            #{inv.invoiceNumber}
                          </span>
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 650,
                              color: BRAND.navyMuted,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {inv.brandName}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          Due {formatDateDisplay(inv.dueDate)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span
                          className="font-amount"
                          style={{
                            fontSize: 13,
                            fontWeight: 750,
                            color: BRAND.navy,
                          }}
                        >
                          {formatCurrency(inv.totalAmount)}
                        </span>
                        <span
                          style={{
                            padding: '2.5px 8px',
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 650,
                            background: s.bg,
                            color: s.text,
                            border: `1px solid ${s.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.text }} />
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Right Column: Recent Activity Feed */}
        {widgetVisibility.activity !== false && (
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-polaris-card, 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06))',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: BRAND.navy,
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Recent Activity
                </h3>
                <p style={{ fontSize: 12, color: BRAND.navyMuted, marginTop: 2, margin: 0 }}>
                  Workspace events & operational updates
                </p>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: BRAND.greenSubtle,
                  color: BRAND.greenDark,
                  border: `1px solid ${BRAND.greenBorder}`,
                  fontSize: 11,
                  fontWeight: 750,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: BRAND.greenBright,
                    boxShadow: `0 0 5px ${BRAND.greenBright}`,
                  }}
                />
                Live
              </div>
            </div>

            {/* Activity List or Empty State */}
            {activityFeed.length === 0 ? (
              /* Compact Intentional Empty State */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '28px 16px',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: BRAND.greenSubtle,
                    border: `1px solid ${BRAND.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    color: BRAND.greenDark,
                  }}
                >
                  <Activity size={20} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 750, color: BRAND.navy, marginBottom: 4 }}>
                  No recent activity
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: BRAND.navyMuted,
                    maxWidth: 290,
                    lineHeight: 1.4,
                  }}
                >
                  Activity will appear automatically as client invoices, payments, and tasks progress.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {activityFeed.map((item, i) => (
                  <div
                    key={item.id}
                    className="feed-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 11px',
                      borderRadius: 10,
                      background: 'var(--bg-raised)',
                      border: `1px solid var(--border)`,
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: BRAND.greenSubtle,
                        border: `1px solid ${BRAND.greenBorder}`,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: BRAND.navy,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.text}
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        color: BRAND.navyMuted,
                        background: 'var(--bg-card)',
                        padding: '2.5px 8px',
                        borderRadius: 9999,
                        border: `1px solid var(--border)`,
                      }}
                    >
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
