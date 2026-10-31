import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getNaturalErrorMessage } from '../../services/errors';
import type { ExpenseCategory } from '../../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  CreditCard,
  Building2,
  Receipt,
  FileSpreadsheet,
  Download,
  AlertCircle,
  PieChart,
  CheckCircle,
  Clock,
  ArrowUpRight,
  X,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { DeleteExpenseModal } from '../expenses/ExpenseFormModal';
import { AnimatedNumber } from '../../hooks/useCountUp';
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/animate-ui/components/base/alert-dialog';

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
const badgeActive: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success-text)' };
const badgeInfo: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--info-bg)', color: 'var(--info-text)' };
const badgeWarning: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--warn-bg)', color: 'var(--warn-text)' };
const badgeDanger: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--danger-text)' };
const badgeNeutral: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--bg-raised)', color: 'var(--text-secondary)' };

function getMarginBadgeStyle(margin: number): React.CSSProperties {
  if (margin >= 60) return badgeActive;
  if (margin > 0) return badgeWarning;
  return badgeDanger;
}

export const FinanceManager: React.FC = () => {
  const {
    currentUser,
    payments,
    expenses,
    brands,
    deleteExpense,
    deleteExpenses,
    invoices,
    updatePaymentStatus,
    deletePayment,
    deletePayments,
    showToast,
    setActiveTab: setNavTab,
    currencySymbol,
    formatCurrency,
  } = useApp();

  const role = currentUser.role;
  const isAdmin = role === 'admin';

  /* ── Expense selection state ─────────────────────────────────── */
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [expensesToDelete, setExpensesToDelete] = useState<any[]>([]);
  const [isDeletingExpenses, setIsDeletingExpenses] = useState(false);

  /* ── Payment action state ────────────────────────────────────── */
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  const allExpensesSelected = expenses.length > 0 && selectedExpenseIds.size > 0 && expenses.every(e => selectedExpenseIds.has(e.id));
  const someExpensesSelected = selectedExpenseIds.size > 0 && expenses.some(e => selectedExpenseIds.has(e.id)) && !allExpensesSelected;

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someExpensesSelected;
    }
  }, [someExpensesSelected]);

  const handleToggleSelectExpense = (id: string) => {
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllExpenses = (checked: boolean) => {
    if (checked) {
      setSelectedExpenseIds(new Set(expenses.map((e) => e.id)));
    } else {
      setSelectedExpenseIds(new Set());
    }
  };

  const handleOpenBulkDeleteExpenses = () => {
    const selected = expenses.filter((e) => selectedExpenseIds.has(e.id));
    if (selected.length === 0) return;
    setExpensesToDelete(selected);
    setExpenseToDelete(null);
    setDeleteModalOpen(true);
  };

  const confirmDeleteExpenses = async () => {
    setIsDeletingExpenses(true);
    try {
      if (expensesToDelete.length > 1) {
        await deleteExpenses(expensesToDelete.map((e) => e.id));
        setSelectedExpenseIds((prev) => {
          const next = new Set(prev);
          expensesToDelete.forEach((e) => next.delete(e.id));
          return next;
        });
      } else if (expensesToDelete.length === 1 || expenseToDelete) {
        const target = expensesToDelete[0] || expenseToDelete;
        if (target) {
          await deleteExpense(target.id);
          setSelectedExpenseIds((prev) => {
            const next = new Set(prev);
            next.delete(target.id);
            return next;
          });
        }
      }
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      setExpensesToDelete([]);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setIsDeletingExpenses(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'profitability'>('payments');
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<'all' | 'Success' | 'Pending'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  // ── STRICT USER DATA SCOPING: Associate data exclusively with the active user ──
  // An account must only see payments, revenue, and expenses belonging to their own clients/brands
  const userBrandIds = React.useMemo(() => new Set((brands || []).map((b) => b.id)), [brands]);

  const scopedPayments = React.useMemo(() => {
    return (payments || []).filter((p) => {
      if (!p) return false;
      // If the current account has no brands, they must not see unassociated client payments
      if (userBrandIds.size === 0) return false;
      return Boolean(p.brandId && userBrandIds.has(p.brandId));
    });
  }, [payments, userBrandIds]);

  const scopedExpenses = React.useMemo(() => {
    return (expenses || []).filter((e) => {
      if (!e) return false;
      if (e.brandId && !userBrandIds.has(e.brandId)) return false;
      return true;
    });
  }, [expenses, userBrandIds]);

  const scopedInvoices = React.useMemo(() => {
    return (invoices || []).filter((i) => {
      if (!i) return false;
      if (userBrandIds.size === 0) return false;
      return Boolean(i.brandId && userBrandIds.has(i.brandId));
    });
  }, [invoices, userBrandIds]);

  // Filtered payments list — strictly scoped to active user
  const filteredPayments = scopedPayments.filter(p => {
    if (!p) return false;
    if (paymentFilterStatus !== 'all' && p.status !== paymentFilterStatus) return false;
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      const matchBrand = (p.brandName || '').toLowerCase().includes(q);
      const matchRef = (p.referenceNo || '').toLowerCase().includes(q);
      const matchMode = (p.mode || '').toLowerCase().includes(q);
      if (!matchBrand && !matchRef && !matchMode) return false;
    }
    return true;
  });

  /* ── Payment selection state ─────────────────────────────────── */
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [showPaymentDeleteDialog, setShowPaymentDeleteDialog] = useState(false);
  const [isDeletingPayments, setIsDeletingPayments] = useState(false);

  const paymentHeaderCheckboxRef = React.useRef<HTMLInputElement>(null);
  const allPaymentsSelected = filteredPayments.length > 0 && selectedPaymentIds.size > 0 && filteredPayments.every(p => selectedPaymentIds.has(p.id));
  const somePaymentsSelected = selectedPaymentIds.size > 0 && filteredPayments.some(p => selectedPaymentIds.has(p.id)) && !allPaymentsSelected;

  React.useEffect(() => {
    if (paymentHeaderCheckboxRef.current) {
      paymentHeaderCheckboxRef.current.indeterminate = somePaymentsSelected;
    }
  }, [somePaymentsSelected]);

  const handleToggleSelectPayment = (id: string) => {
    setSelectedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPayments = (checked: boolean) => {
    if (checked) {
      setSelectedPaymentIds(new Set(filteredPayments.map((p) => p.id)));
    } else {
      setSelectedPaymentIds(new Set());
    }
  };

  const handleOpenBulkDeletePayments = () => {
    const selected = filteredPayments.filter((p) => selectedPaymentIds.has(p.id));
    if (selected.length === 0) return;
    setShowPaymentDeleteDialog(true);
  };

  const confirmDeletePayments = async () => {
    const idsToDelete = Array.from(selectedPaymentIds);
    if (idsToDelete.length === 0) return;
    setIsDeletingPayments(true);
    try {
      await deletePayments(idsToDelete);
      setSelectedPaymentIds(new Set());
      setShowPaymentDeleteDialog(false);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setIsDeletingPayments(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Amount', 'Mode', 'Reference', 'Status'];
    const rows = payments.filter(Boolean).map(p => [p.paymentDate, p.brandName, p.amount, p.mode, p.referenceNo, p.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'retentio-payments.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Payments exported as CSV', 'success');
  };

  const exportToPDF = () => {
    showToast('Opening print dialog for PDF export...', 'info');
    window.print();
  };

  const handleDeletePayment = (p: any) => {
    if (!isAdmin) return;
    setPaymentToDelete(p);
  };

  const confirmDeleteSinglePayment = async () => {
    if (!paymentToDelete) return;
    setDeletingPaymentId(paymentToDelete.id);
    try {
      await deletePayment(paymentToDelete.id);
      setSelectedPaymentIds(prev => {
        const next = new Set(prev);
        next.delete(paymentToDelete.id);
        return next;
      });
      setPaymentToDelete(null);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, status: 'Success' | 'Pending') => {
    setUpdatingPaymentId(id);
    try {
      await updatePaymentStatus(id, status);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const churnedBrandIds = React.useMemo(() => new Set(
    (brands || []).filter(b => b && (b.status === 'Churned' || b.status === 'Inactive')).map(b => b.id)
  ), [brands]);

  // ── STRICT CALCULATION LOGIC: Only payments actually received count as collected revenue ──
  const receivedPayments = scopedPayments.filter(p => {
    if (!p || p.status !== 'Success') return false;
    if (p.brandId && churnedBrandIds.has(p.brandId) && (p.referenceNo || '').startsWith('RET-')) return false;
    return true;
  });
  const pendingPaymentsList = scopedPayments.filter(p => {
    if (!p || p.status !== 'Pending') return false;
    if (p.brandId && churnedBrandIds.has(p.brandId) && (p.referenceNo || '').startsWith('RET-')) return false;
    return true;
  });

  const paymentsTotal = receivedPayments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);

  // Unrecorded brand fees ONLY for active brands explicitly marked 'Paid' that don't have a payment row yet
  const unrecordedBrandFees = (brands || [])
    .filter(b => b && b.status === 'Active' && (Number(b.monthlyFee) || 0) > 0 && b.paymentStatus === 'Paid' && !scopedPayments.some(p => p && p.brandId === b.id && p.status === 'Success'))
    .reduce((acc, b) => acc + (Number(b.monthlyFee) || 0), 0);

  const totalCollections = paymentsTotal + unrecordedBrandFees;

  // Total expenses accounts ONLY for expenses actually paid (paymentStatus === 'Paid')
  // Pending expenses are excluded from Total Expenses and Net Profit until marked Paid
  const paidExpenses = scopedExpenses.filter(e => e && (e.paymentStatus || 'Paid') === 'Paid');
  const pendingExpenses = scopedExpenses.filter(e => e && e.paymentStatus === 'Pending');
  const totalExpenses = paidExpenses.reduce((acc, e) => acc + (Number(e?.amount) || 0), 0);
  const pendingExpensesTotal = pendingExpenses.reduce((acc, e) => acc + (Number(e?.amount) || 0), 0);
  const netAgencyProfit = totalCollections - totalExpenses;
  const netMargin = totalCollections > 0 ? Math.round((netAgencyProfit / totalCollections) * 100) : 0;

  // Pending Collections / Unpaid client fees (NEVER counted in totalCollections)
  const pendingPaymentsTotal = pendingPaymentsList.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
  const pendingBrandFees = (brands || [])
    .filter(b => b && b.status === 'Active' && (Number(b.monthlyFee) || 0) > 0 && b.paymentStatus === 'Pending' && !scopedPayments.some(p => p.brandId === b.id))
    .reduce((acc, b) => acc + (Number(b.monthlyFee) || 0), 0);
  const invoicePendingTotal = scopedInvoices
    .filter(i => i && (i.status === 'Sent' || i.status === 'Overdue') && (!i.brandId || !churnedBrandIds.has(i.brandId)))
    .reduce((acc, i) => acc + Math.max(0, (Number(i.totalAmount) || 0) - (Number(i.paidAmount) || 0)), 0);
  const totalPending = invoicePendingTotal + pendingPaymentsTotal + pendingBrandFees;

  const brandProfitability = (brands || []).map((b) => {
    const isChurned = b.status === 'Churned' || b.status === 'Inactive';
    // Only actual received payments for this brand count as collected revenue
    const revenue = scopedPayments
      .filter((p) => p && p.brandId === b.id && p.status === 'Success' && (!isChurned || !(p.referenceNo || '').startsWith('RET-')))
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0) + (b.status === 'Active' && b.paymentStatus === 'Paid' && !scopedPayments.some(p => p && p.brandId === b.id && p.status === 'Success') ? (Number(b.monthlyFee) || 0) : 0);
    const pendingRevenue = scopedPayments
      .filter((p) => p && p.brandId === b.id && p.status === 'Pending' && (!isChurned || !(p.referenceNo || '').startsWith('RET-')))
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0) + (b.status === 'Active' && b.paymentStatus === 'Pending' && !scopedPayments.some(p => p.brandId === b.id) ? (Number(b.monthlyFee) || 0) : 0);
    const directExpenses = scopedExpenses
      .filter((e) => e && e.brandId === b.id && (e.paymentStatus || 'Paid') === 'Paid')
      .reduce((acc, e) => acc + (Number(e?.amount) || 0), 0);
    const profit = revenue - directExpenses;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    return { brand: b, revenue, pendingRevenue, directExpenses, profit, margin };
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {isAdmin ? 'Financial Hub & Profitability' : 'Client Payments Ledger'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {isAdmin
              ? 'Complete cashflow control: client collections, agency expenses, and client-level margin analysis.'
              : 'View client payments and Razorpay settlement statuses.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            <Download style={{ width: 13, height: 13 }} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            <Download style={{ width: 13, height: 13 }} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — EXACTLY Matching Dashboard Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 16 }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.4rem 1.5rem' }}>
          <div className="metric-label" style={{ marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-text)' }} />
            Total Collections Received
          </div>
          <div className="metric-value font-amount count-up" style={{ color: 'var(--text-primary)' }}>
            <AnimatedNumber value={totalCollections} prefix={currencySymbol} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle style={{ width: 14, height: 14, color: 'var(--success-text)' }} />
            <span>{receivedPayments.length} verified received payments</span>
          </div>
        </div>

        {isAdmin && (
          <div
            className="stat-card"
            style={{
              background: totalPending > 0 ? 'linear-gradient(135deg, var(--warn-bg) 0%, var(--grad-amber-end) 100%)' : 'var(--bg-card)',
              border: totalPending > 0 ? '1px solid var(--warn-border)' : '1px solid var(--border)',
              borderRadius: 14,
              padding: '1.4rem 1.5rem',
            }}
          >
            <div className="metric-label" style={{ marginBottom: 12, color: totalPending > 0 ? 'var(--warn-text)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock style={{ width: 14, height: 14, color: 'var(--warn-text)' }} />
              Pending Collections
            </div>
            <div className="metric-value font-amount count-up" style={{ color: totalPending > 0 ? 'var(--warn-text)' : 'var(--text-primary)' }}>
              <AnimatedNumber value={totalPending} prefix={currencySymbol} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--warn-text)', marginTop: 8 }}>
              {pendingPaymentsList.length} client payments awaiting clearance
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.4rem 1.5rem' }}>
            <div className="metric-label" style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Total Expenses</div>
            <div className="metric-value font-amount count-up" style={{ color: 'var(--text-primary)' }}>
              <AnimatedNumber value={totalExpenses} prefix={currencySymbol} />
            </div>
            <div style={{ fontSize: 11, color: pendingExpensesTotal > 0 ? 'var(--warn-text)' : 'var(--text-secondary)', marginTop: 8 }}>
              {pendingExpensesTotal > 0
                ? `₹${pendingExpensesTotal.toLocaleString('en-IN')} pending payouts (${pendingExpenses.length})`
                : 'Salaries, SaaS & operational spend'}
            </div>
          </div>
        )}

        {isAdmin && (
          <div
            className="stat-card"
            style={{
              background: totalCollections > 0 ? 'linear-gradient(135deg, var(--brand-green-subtle) 0%, var(--grad-green-end) 100%)' : 'var(--bg-card)',
              border: totalCollections > 0 ? '1.5px solid var(--success-border)' : '1px solid var(--border)',
              borderRadius: 14,
              padding: '1.4rem 1.5rem',
            }}
          >
            <div className="metric-label" style={{ marginBottom: 12, color: totalCollections > 0 ? 'var(--success-text)' : 'var(--text-secondary)' }}>Net Agency Profit</div>
            <div className="metric-value font-amount count-up" style={{ color: netAgencyProfit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
              <AnimatedNumber value={netAgencyProfit} prefix={currencySymbol} />
            </div>
            <div style={{ fontSize: 11, color: totalCollections > 0 ? 'var(--success-text)' : 'var(--text-secondary)', fontWeight: 600, marginTop: 8 }}>
              {netMargin}% Agency Margin
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '4px 12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'payments' ? 'var(--solid-btn-bg)' : 'transparent', color: activeTab === 'payments' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}
        >
          Client Payments Ledger ({payments.length})
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('expenses')}
              style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'expenses' ? 'var(--solid-btn-bg)' : 'transparent', color: activeTab === 'expenses' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}
            >
              Agency Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'profitability' ? 'var(--solid-btn-bg)' : 'transparent', color: activeTab === 'profitability' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}
            >
              Client-Wise Profitability Matrix
            </button>
          </>
        )}
      </div>

      {/* Tab: Client Payments */}
      {activeTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sub-Filter toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setPaymentFilterStatus('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: paymentFilterStatus === 'all' ? 'var(--solid-btn-bg)' : 'var(--bg-raised)',
                  color: paymentFilterStatus === 'all' ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                }}
              >
                All Payments ({payments.length})
              </button>
              <button
                onClick={() => setPaymentFilterStatus('Success')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--success-border)',
                  background: paymentFilterStatus === 'Success' ? 'var(--success-text)' : 'var(--success-bg)',
                  color: paymentFilterStatus === 'Success' ? 'var(--solid-btn-text)' : 'var(--success-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <CheckCircle style={{ width: 13, height: 13 }} />
                Received &amp; Settled ({receivedPayments.length} • <span className="font-amount" style={{ fontWeight: 800 }}>₹{paymentsTotal.toLocaleString('en-IN')}</span>)
              </button>
              <button
                onClick={() => setPaymentFilterStatus('Pending')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--warn-border)',
                  background: paymentFilterStatus === 'Pending' ? 'var(--warn-text)' : 'var(--warn-bg)',
                  color: paymentFilterStatus === 'Pending' ? 'var(--solid-btn-text)' : 'var(--warn-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Clock style={{ width: 13, height: 13 }} />
                Pending Clearance ({pendingPaymentsList.length} • <span className="font-amount" style={{ fontWeight: 800 }}>₹{pendingPaymentsTotal.toLocaleString('en-IN')}</span>)
              </button>
            </div>

            <div style={{ position: 'relative', width: 240, maxWidth: '100%' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search client or reference..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  outline: 'none',
                  background: 'var(--bg-subtle)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Bulk Action Toolbar for Payments */}
          {isAdmin && selectedPaymentIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: 12,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-sm)',
                animation: 'fadeIn 0.2s ease',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: 'var(--solid-btn-bg)',
                    color: 'var(--solid-btn-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {selectedPaymentIds.size}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedPaymentIds.size} payment record{selectedPaymentIds.size > 1 ? 's' : ''} selected
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  (₹{filteredPayments
                    .filter((p) => selectedPaymentIds.has(p.id))
                    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    .toLocaleString('en-IN')})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentIds(new Set())}
                  className="btn-secondary"
                  style={{ height: 32, padding: '0 12px', fontSize: 12, borderRadius: 8 }}
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={handleOpenBulkDeletePayments}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 8,
                    background: 'var(--danger-bg)',
                    color: 'var(--danger-text)',
                    border: '1px solid var(--danger-border)',
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                  Delete Selected ({selectedPaymentIds.size})
                </button>
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {isAdmin && (
                    <th style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                      <input
                        ref={paymentHeaderCheckboxRef}
                        type="checkbox"
                        checked={allPaymentsSelected}
                        onChange={(e) => handleSelectAllPayments(e.target.checked)}
                        title="Select all payments"
                        style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                      />
                    </th>
                  )}
                  <th>Date</th>
                  <th>Client</th>
                  <th>Amount (INR)</th>
                  <th>Payment Mode</th>
                  <th>Reference #</th>
                  <th>Settlement Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                      No payments found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    if (!p) return null;
                    const isSuccess = p?.status === 'Success';
                    const isPending = p?.status === 'Pending';
                    const isSelected = selectedPaymentIds.has(p.id);

                    return (
                      <tr
                        key={p.id}
                        style={{
                          background: isSelected ? 'var(--bg-raised)' : undefined,
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {isAdmin && (
                          <td style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectPayment(p.id)}
                              style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                            />
                          </td>
                        )}
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.paymentDate}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>{p.brandName}</div>
                        </td>
                        <td>
                          <div className="font-amount" style={{ fontWeight: 800, color: isSuccess ? 'var(--success-text)' : 'var(--warn-text)', fontSize: 13 }}>
                            ₹{Number(p?.amount || 0).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td>
                          <span style={{ ...badgeInfo, fontFamily: 'monospace', fontSize: 11 }}>{p.mode}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: 12 }}>{p.referenceNo}</td>
                        <td>
                          {isSuccess ? (
                            <span style={{ ...badgeActive, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                              <CheckCircle style={{ width: 12, height: 12 }} /> Settled to Bank
                            </span>
                          ) : (
                            <span style={{ ...badgeWarning, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                              <Clock style={{ width: 12, height: 12 }} /> Pending Clearance
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {isPending ? (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, 'Success')}
                                  disabled={updatingPaymentId === p.id || deletingPaymentId === p.id}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 8,
                                    background: 'var(--success-text)',
                                    color: 'var(--solid-btn-text)',
                                    border: 'none',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: (updatingPaymentId === p.id || deletingPaymentId === p.id) ? 'not-allowed' : 'pointer',
                                    opacity: updatingPaymentId === p.id ? 0.7 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    boxShadow: '0 1px 4px rgba(4, 89, 43, 0.2)',
                                  }}
                                >
                                  {updatingPaymentId === p.id ? (
                                    <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                  ) : (
                                    <CheckCircle style={{ width: 12, height: 12 }} />
                                  )}
                                  <span>{updatingPaymentId === p.id ? 'Settling...' : 'Mark Received'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, 'Pending')}
                                  disabled={updatingPaymentId === p.id || deletingPaymentId === p.id}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    background: 'var(--bg-raised)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: (updatingPaymentId === p.id || deletingPaymentId === p.id) ? 'not-allowed' : 'pointer',
                                    opacity: updatingPaymentId === p.id ? 0.7 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  {updatingPaymentId === p.id ? (
                                    <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                  ) : null}
                                  <span>{updatingPaymentId === p.id ? 'Reverting...' : 'Revert to Pending'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeletePayment(p)}
                                disabled={deletingPaymentId === p.id || updatingPaymentId === p.id}
                                title="Delete payment record"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 8,
                                  background: 'var(--danger-bg, #fef2f2)',
                                  color: 'var(--danger-text, #ef4444)',
                                  border: '1px solid var(--danger-border, #fecaca)',
                                  cursor: (deletingPaymentId === p.id || updatingPaymentId === p.id) ? 'not-allowed' : 'pointer',
                                  opacity: deletingPaymentId === p.id ? 0.6 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {deletingPaymentId === p.id ? (
                                  <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <Trash2 style={{ width: 12, height: 12 }} />
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Agency Expenses (Admin Only) */}
      {activeTab === 'expenses' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'var(--bg-subtle)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Full Business Expenses Workspace Available</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Filter by category or client, attach receipt proofs, edit and delete records in the dedicated Expenses section.
              </div>
            </div>
            <button
              onClick={() => setNavTab('expenses')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                background: 'var(--solid-btn-bg)',
                color: 'var(--solid-btn-text)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Open Expenses Section →
            </button>
          </div>

          {/* Bulk Action Toolbar for Expenses */}
          {isAdmin && selectedExpenseIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: 12,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-sm)',
                animation: 'fadeIn 0.2s ease',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: 'var(--solid-btn-bg)',
                    color: 'var(--solid-btn-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {selectedExpenseIds.size}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedExpenseIds.size} expense record{selectedExpenseIds.size > 1 ? 's' : ''} selected
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  (₹{expenses
                    .filter((e) => selectedExpenseIds.has(e.id))
                    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                    .toLocaleString('en-IN')})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedExpenseIds(new Set())}
                  className="btn-secondary"
                  style={{ height: 32, padding: '0 12px', fontSize: 12, borderRadius: 8 }}
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={handleOpenBulkDeleteExpenses}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 8,
                    background: 'var(--danger-bg)',
                    color: 'var(--danger-text)',
                    border: '1px solid var(--danger-border)',
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                  Delete Selected ({selectedExpenseIds.size})
                </button>
              </div>
            </div>
          )}

          <div className="table-scroll" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && (
                  <th style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allExpensesSelected}
                      onChange={(e) => handleSelectAllExpenses(e.target.checked)}
                      title="Select all expenses"
                      style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                    />
                  </th>
                )}
                <th>Date</th>
                <th>Category</th>
                <th>Amount (INR)</th>
                <th>Mode</th>
                <th>Note / Purpose</th>
                <th>Linked Client</th>
                <th>Type</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const linkedBrand = brands.find((b) => b.id === e.brandId);
                const isSelected = selectedExpenseIds.has(e.id);
                return (
                  <tr
                    key={e.id}
                    style={{
                      background: isSelected ? 'var(--bg-raised)' : undefined,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {isAdmin && (
                      <td style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectExpense(e.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                        />
                      </td>
                    )}
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{e.date}</td>
                    <td>
                      <span style={badgeNeutral}>{e.category}</span>
                    </td>
                    <td>
                      <div className="font-amount" style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: 13 }}>
                        ₹{Number(e?.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontSize: 12 }}>{e.paymentMode}</td>
                    <td style={{ color: 'var(--text-primary)', fontSize: 12, maxWidth: 240 }}>{e.note}</td>
                    <td style={{ fontSize: 12 }}>
                      {linkedBrand ? (
                        <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{linkedBrand.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>General Overhead</span>
                      )}
                    </td>
                    <td>
                      {e.isRecurring ? (
                        <span style={{ ...badgeInfo, fontSize: 10 }}>Monthly Recurring</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>One-time</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => {
                            setExpenseToDelete(e);
                            setExpensesToDelete([e]);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete expense record"
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--danger-border)',
                            color: 'var(--danger-text)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tab: Client-Wise Profitability Matrix (Admin Only) */}
      {activeTab === 'profitability' && isAdmin && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Client Margin &amp; Profitability Breakdown</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Realized profitability per client account based on revenues actually collected vs client-linked contractor/ad costs.
            </p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Agreed Retainer</th>
                <th>Collected Revenue</th>
                <th>Pending Amount</th>
                <th>Direct Client Costs</th>
                <th>Net Realized Margin</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {brandProfitability.map((bp) => (
                <tr key={bp.brand?.id || Math.random()}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>{bp.brand?.name || 'Unnamed Client'}</span>
                      {bp.brand?.status && bp.brand.status !== 'Active' && (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 750,
                          background: bp.brand.status === 'Churned' ? 'var(--danger-bg)' : 'var(--bg-subtle)',
                          color: bp.brand.status === 'Churned' ? 'var(--danger-text)' : 'var(--text-muted)',
                          border: `1px solid ${bp.brand.status === 'Churned' ? 'var(--danger-border)' : 'var(--border)'}`,
                        }}>
                          {bp.brand.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{bp.brand?.ownerName || '—'}</div>
                  </td>
                  <td className="font-amount" style={{ color: bp.brand?.status === 'Active' ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13, fontWeight: 650, textDecoration: bp.brand?.status === 'Active' ? 'none' : 'line-through' }}>
                    ₹{Number(bp.brand?.monthlyFee || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="font-amount" style={{ fontWeight: 800, color: bp.revenue > 0 ? 'var(--success-text)' : 'var(--text-secondary)', fontSize: 13 }}>
                    ₹{Number(bp.revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    {bp.pendingRevenue > 0 ? (
                      <span className="font-amount" style={{ ...badgeWarning, fontSize: 11, fontWeight: 700 }}>
                        ₹{Number(bp.pendingRevenue || 0).toLocaleString('en-IN')} (Pending)
                      </span>
                    ) : (
                      <span className="font-amount" style={{ color: 'var(--text-muted)', fontSize: 12 }}>₹0</span>
                    )}
                  </td>
                  <td className="font-amount" style={{ color: 'var(--danger-text)', fontSize: 13, fontWeight: 700 }}>
                    ₹{Number(bp.directExpenses || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="font-amount" style={{ fontWeight: 800, color: bp.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)', fontSize: 13 }}>
                    ₹{Number(bp.profit || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span style={{ ...getMarginBadgeStyle(bp.margin), fontSize: 10 }}>
                      {bp.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Delete confirmation modal */}
      <DeleteExpenseModal
        expense={deleteModalOpen ? expenseToDelete : null}
        expenses={deleteModalOpen ? expensesToDelete : []}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
          setExpensesToDelete([]);
        }}
        onConfirm={confirmDeleteExpenses}
        deleting={isDeletingExpenses}
      />

      {/* Payment bulk delete confirmation */}
      <AlertDialog open={showPaymentDeleteDialog} onOpenChange={(o) => { if (!o && !isDeletingPayments) setShowPaymentDeleteDialog(false); }}>
        <AlertDialogPopup from="bottom">
          <AlertDialogHeader>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <AlertTriangle style={{ width: 19, height: 19 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <AlertDialogTitle>Delete {selectedPaymentIds.size} Payment Record{selectedPaymentIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Permanently remove {selectedPaymentIds.size} selected payment record{selectedPaymentIds.size > 1 ? 's' : ''}. Linked invoice balances will be recalculated.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPayments}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePayments}
              disabled={isDeletingPayments}
              style={{ background: 'var(--danger-text)', color: 'var(--solid-btn-text)', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: isDeletingPayments ? 0.7 : 1, cursor: isDeletingPayments ? 'not-allowed' : 'pointer' }}
            >
              {isDeletingPayments && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
              Yes, Delete {selectedPaymentIds.size} Payment Record{selectedPaymentIds.size > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      {/* Single Payment Delete confirmation (Animated AlertDialog) */}
      <AlertDialog
        open={Boolean(paymentToDelete)}
        onOpenChange={(o) => {
          if (!o && !deletingPaymentId) setPaymentToDelete(null);
        }}
      >
        <AlertDialogPopup from="bottom" className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Trash2 style={{ width: 19, height: 19 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the payment record of {paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''} for {paymentToDelete?.brandName}.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingPaymentId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSinglePayment}
              disabled={Boolean(deletingPaymentId)}
              style={{
                background: 'var(--danger-text)',
                color: 'var(--solid-btn-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: deletingPaymentId ? 0.7 : 1,
                cursor: deletingPaymentId ? 'not-allowed' : 'pointer',
              }}
            >
              {deletingPaymentId && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
};
