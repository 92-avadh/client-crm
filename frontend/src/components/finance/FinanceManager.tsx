import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  X
} from 'lucide-react';

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2',
  borderRadius: 10, fontSize: 14, color: '#0a0a0a', background: '#fafafa',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: '#0a0a0a', color: '#fff', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: '#f5f5f5', color: '#0a0a0a',
  border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const badgeActive: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#15803d' };
const badgeInfo: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' };
const badgeWarning: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' };
const badgeDanger: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#dc2626' };
const badgeNeutral: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f5f5f5', color: '#525252' };

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
    addExpense,
    invoices,
    updatePaymentStatus,
    showToast,
    setActiveTab: setNavTab
  } = useApp();

  const role = currentUser.role;
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'profitability'>('payments');
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<'all' | 'Success' | 'Pending'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: 'Tools & Software' as ExpenseCategory,
    amount: 15000,
    date: '2026-10-04',
    paymentMode: 'Corporate Card',
    note: '',
    brandId: '',
    isRecurring: false
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Amount', 'Mode', 'Reference', 'Status'];
    const rows = payments.map(p => [p.paymentDate, p.brandName, p.amount, p.mode, p.referenceNo, p.status]);
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

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      ...expenseForm,
      title: expenseForm.note || `${expenseForm.category} Expense`,
      description: expenseForm.note,
      paymentStatus: 'Paid',
      amount: Number(expenseForm.amount),
      brandId: expenseForm.brandId || undefined
    });
    setShowAddExpenseModal(false);
  };

  // ── STRICT CALCULATION LOGIC: Only payments actually received count as collected revenue ──
  const receivedPayments = payments.filter(p => p.status === 'Success');
  const pendingPaymentsList = payments.filter(p => p.status === 'Pending');

  const paymentsTotal = receivedPayments.reduce((acc, p) => acc + p.amount, 0);

  // Unrecorded brand fees ONLY for active brands explicitly marked 'Paid' that don't have a payment row yet
  const unrecordedBrandFees = brands
    .filter(b => b.status === 'Active' && (b.monthlyFee || 0) > 0 && b.paymentStatus === 'Paid' && !payments.some(p => p.brandId === b.id && p.status === 'Success'))
    .reduce((acc, b) => acc + (b.monthlyFee || 0), 0);

  const totalCollections = paymentsTotal + unrecordedBrandFees;

  // Total expenses accounts ONLY for expenses actually paid (paymentStatus === 'Paid')
  // Pending expenses are excluded from Total Expenses and Net Profit until marked Paid
  const paidExpenses = expenses.filter(e => (e.paymentStatus || 'Paid') === 'Paid');
  const pendingExpenses = expenses.filter(e => e.paymentStatus === 'Pending');
  const totalExpenses = paidExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const pendingExpensesTotal = pendingExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netAgencyProfit = totalCollections - totalExpenses;
  const netMargin = totalCollections > 0 ? Math.round((netAgencyProfit / totalCollections) * 100) : 0;

  // Pending Collections / Unpaid client fees (NEVER counted in totalCollections)
  const pendingPaymentsTotal = pendingPaymentsList.reduce((acc, p) => acc + p.amount, 0);
  const pendingBrandFees = brands
    .filter(b => b.status === 'Active' && (b.monthlyFee || 0) > 0 && b.paymentStatus === 'Pending' && !payments.some(p => p.brandId === b.id))
    .reduce((acc, b) => acc + (b.monthlyFee || 0), 0);
  const invoicePendingTotal = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);
  const totalPending = invoicePendingTotal + pendingPaymentsTotal + pendingBrandFees;

  const brandProfitability = brands.map((b) => {
    // Only actual received payments for this brand count as collected revenue
    const revenue = payments
      .filter((p) => p.brandId === b.id && p.status === 'Success')
      .reduce((acc, p) => acc + p.amount, 0) + (b.paymentStatus === 'Paid' && !payments.some(p => p.brandId === b.id && p.status === 'Success') ? (b.monthlyFee || 0) : 0);
    const pendingRevenue = payments
      .filter((p) => p.brandId === b.id && p.status === 'Pending')
      .reduce((acc, p) => acc + p.amount, 0) + (b.paymentStatus === 'Pending' && !payments.some(p => p.brandId === b.id) ? (b.monthlyFee || 0) : 0);
    const directExpenses = expenses
      .filter((e) => e.brandId === b.id && (e.paymentStatus || 'Paid') === 'Paid')
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const profit = revenue - directExpenses;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    return { brand: b, revenue, pendingRevenue, directExpenses, profit, margin };
  });

  // Filtered payments list
  const filteredPayments = payments.filter(p => {
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {isAdmin ? 'Financial Hub & Profitability' : 'Client Payments Ledger'}
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            {isAdmin
              ? 'Complete cashflow control: client collections, agency expenses, and client-level margin analysis.'
              : 'View client payments and Razorpay settlement statuses.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={exportToCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#ffffff', color: '#0a0a0a', border: '1px solid #d4d4d4' }}
          >
            <Download style={{ width: 13, height: 13 }} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToPDF}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#ffffff', color: '#0a0a0a', border: '1px solid #d4d4d4' }}
          >
            <Download style={{ width: 13, height: 13 }} />
            <span>Export PDF</span>
          </button>
          {isAdmin && (
            <button onClick={() => setShowAddExpenseModal(true)} style={btnPrimary}>
              <Plus style={{ width: 14, height: 14 }} />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards — EXACTLY Matching Dashboard Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 16 }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #D4E0EB', borderRadius: 14, padding: '1.4rem 1.5rem' }}>
          <div className="metric-label" style={{ marginBottom: 12, color: '#0F2A42', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#058D32' }} />
            Total Collections Received
          </div>
          <div className="metric-value" style={{ color: '#0F2A42' }}>₹{totalCollections.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle style={{ width: 14, height: 14, color: '#058D32' }} />
            <span>{receivedPayments.length} verified received payments</span>
          </div>
        </div>

        {isAdmin && (
          <div
            className="stat-card"
            style={{
              background: totalPending > 0 ? 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)' : '#FFFFFF',
              border: totalPending > 0 ? '1px solid #FDE68A' : '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '1.4rem 1.5rem',
            }}
          >
            <div className="metric-label" style={{ marginBottom: 12, color: totalPending > 0 ? '#B45309' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock style={{ width: 14, height: 14, color: '#B45309' }} />
              Pending Collections
            </div>
            <div className="metric-value" style={{ color: totalPending > 0 ? '#B45309' : '#0F2A42' }}>₹{totalPending.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: '#B45309', marginTop: 8 }}>
              {pendingPaymentsList.length} client payments awaiting clearance
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.4rem 1.5rem' }}>
            <div className="metric-label" style={{ marginBottom: 12, color: '#64748B' }}>Total Expenses</div>
            <div className="metric-value font-amount" style={{ color: '#334155' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: pendingExpensesTotal > 0 ? '#B45309' : '#64748B', marginTop: 8 }}>
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
              background: totalCollections > 0 ? 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)' : '#FFFFFF',
              border: totalCollections > 0 ? '1.5px solid #058D32' : '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '1.4rem 1.5rem',
            }}
          >
            <div className="metric-label" style={{ marginBottom: 12, color: totalCollections > 0 ? '#04592B' : '#64748B' }}>Net Agency Profit</div>
            <div className="metric-value" style={{ color: netAgencyProfit >= 0 ? '#04592B' : '#DC2626' }}>₹{netAgencyProfit.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: totalCollections > 0 ? '#04592B' : '#64748B', fontWeight: 600, marginTop: 8 }}>
              {netMargin}% Agency Margin
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 12, padding: '4px 12px' }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'payments' ? '#0a0a0a' : 'transparent', color: activeTab === 'payments' ? '#ffffff' : '#666666' }}
        >
          Client Payments Ledger ({payments.length})
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('expenses')}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'expenses' ? '#0a0a0a' : 'transparent', color: activeTab === 'expenses' ? '#ffffff' : '#666666' }}
            >
              Agency Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'profitability' ? '#0a0a0a' : 'transparent', color: activeTab === 'profitability' ? '#ffffff' : '#666666' }}
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
              background: '#ffffff',
              border: '1px solid #e2e2e2',
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
                  background: paymentFilterStatus === 'all' ? '#0a0a0a' : '#f5f5f5',
                  color: paymentFilterStatus === 'all' ? '#ffffff' : '#525252',
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
                  border: '1px solid #bbf7d0',
                  background: paymentFilterStatus === 'Success' ? '#15803d' : '#f0fdf4',
                  color: paymentFilterStatus === 'Success' ? '#ffffff' : '#15803d',
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
                  border: '1px solid #fde68a',
                  background: paymentFilterStatus === 'Pending' ? '#b45309' : '#fffbeb',
                  color: paymentFilterStatus === 'Pending' ? '#ffffff' : '#b45309',
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
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#888' }} />
              <input
                type="text"
                placeholder="Search client or reference..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: 8,
                  border: '1px solid #e2e2e2',
                  fontSize: 12,
                  outline: 'none',
                  background: '#fafafa',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
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
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '36px 16px', color: '#909090' }}>
                      No payments found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isSuccess = p.status === 'Success';
                    const isPending = p.status === 'Pending';

                    return (
                      <tr key={p.id}>
                        <td style={{ color: '#525252', fontSize: 12 }}>{p.paymentDate}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 12 }}>{p.brandName}</div>
                        </td>
                        <td>
                          <div className="font-amount" style={{ fontWeight: 800, color: isSuccess ? '#058D32' : '#B45309', fontSize: 13 }}>
                            ₹{p.amount.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td>
                          <span style={{ ...badgeInfo, fontFamily: 'monospace', fontSize: 11 }}>{p.mode}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#525252', fontSize: 12 }}>{p.referenceNo}</td>
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
                            {isPending ? (
                              <button
                                onClick={() => updatePaymentStatus(p.id, 'Success')}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  background: '#04592B',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: '0 1px 4px rgba(4, 89, 43, 0.2)',
                                }}
                              >
                                <CheckCircle style={{ width: 12, height: 12 }} />
                                Mark Received
                              </button>
                            ) : (
                              <button
                                onClick={() => updatePaymentStatus(p.id, 'Pending')}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  background: '#f5f5f5',
                                  color: '#737373',
                                  border: '1px solid #e2e2e2',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Revert to Pending
                              </button>
                            )}
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
              background: '#f9f9f9',
              borderRadius: 12,
              border: '1px solid #e2e2e2',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Full Business Expenses Workspace Available</div>
              <div style={{ fontSize: 12, color: '#737373' }}>
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
                background: '#0a0a0a',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Open Expenses Section →
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount (INR)</th>
                <th>Mode</th>
                <th>Note / Purpose</th>
                <th>Linked Client</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const linkedBrand = brands.find((b) => b.id === e.brandId);
                return (
                  <tr key={e.id}>
                    <td style={{ color: '#525252', fontSize: 12 }}>{e.date}</td>
                    <td>
                      <span style={badgeNeutral}>{e.category}</span>
                    </td>
                    <td>
                      <div className="font-amount" style={{ fontWeight: 800, color: '#dc2626', fontSize: 13 }}>
                        ₹{e.amount.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td style={{ color: '#0a0a0a', fontSize: 12 }}>{e.paymentMode}</td>
                    <td style={{ color: '#0a0a0a', fontSize: 12, maxWidth: 240 }}>{e.note}</td>
                    <td style={{ fontSize: 12 }}>
                      {linkedBrand ? (
                        <span style={{ color: '#4f46e5', fontWeight: 600 }}>{linkedBrand.name}</span>
                      ) : (
                        <span style={{ color: '#909090' }}>General Overhead</span>
                      )}
                    </td>
                    <td>
                      {e.isRecurring ? (
                        <span style={{ ...badgeInfo, fontSize: 10 }}>Monthly Recurring</span>
                      ) : (
                        <span style={{ color: '#909090', fontSize: 10 }}>One-time</span>
                      )}
                    </td>
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
        <div style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e2e2', background: '#f7f7f7' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', margin: 0 }}>Client Margin &amp; Profitability Breakdown</h3>
            <p style={{ fontSize: 12, color: '#525252', margin: '4px 0 0' }}>
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
                <tr key={bp.brand.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 12 }}>{bp.brand.name}</div>
                    <div style={{ fontSize: 11, color: '#525252' }}>{bp.brand.ownerName}</div>
                  </td>
                  <td className="font-amount" style={{ color: '#0F2A42', fontSize: 13, fontWeight: 650 }}>
                    ₹{bp.brand.monthlyFee.toLocaleString('en-IN')}
                  </td>
                  <td className="font-amount" style={{ fontWeight: 800, color: bp.revenue > 0 ? '#058D32' : '#64748B', fontSize: 13 }}>
                    ₹{bp.revenue.toLocaleString('en-IN')}
                  </td>
                  <td>
                    {bp.pendingRevenue > 0 ? (
                      <span className="font-amount" style={{ ...badgeWarning, fontSize: 11, fontWeight: 700 }}>
                        ₹{bp.pendingRevenue.toLocaleString('en-IN')} (Pending)
                      </span>
                    ) : (
                      <span className="font-amount" style={{ color: '#909090', fontSize: 12 }}>₹0</span>
                    )}
                  </td>
                  <td className="font-amount" style={{ color: '#dc2626', fontSize: 13, fontWeight: 700 }}>
                    ₹{bp.directExpenses.toLocaleString('en-IN')}
                  </td>
                  <td className="font-amount" style={{ fontWeight: 800, color: bp.profit >= 0 ? '#058D32' : '#dc2626', fontSize: 13 }}>
                    ₹{bp.profit.toLocaleString('en-IN')}
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

      {/* Record Expense Modal */}
      {showAddExpenseModal && isAdmin && (
        <div style={modalOverlay} onClick={() => setShowAddExpenseModal(false)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 448, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 20, borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 14, margin: 0 }}>Record Agency Expense</h3>
                <p style={{ fontSize: 11, color: '#525252', margin: '4px 0 0' }}>Add operational or client-specific cost</p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  style={inputFieldStyle}
                >
                  <option value="Salary">Staff & CA Payroll</option>
                  <option value="Tools & Software">Software & Cloud Subscriptions</option>
                  <option value="Ads & Marketing">Ads & Client Acquisition</option>
                  <option value="Office & Rent">Studio Lease & Utilities</option>
                  <option value="Freelancer Payout">Freelancer / Specialist Payout</option>
                  <option value="Travel">Client Travel & Meetings</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="font-amount"
                  style={{ ...inputFieldStyle, fontWeight: 700, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Payment Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Payment Mode</label>
                <input
                  type="text"
                  placeholder="Corporate Card, Bank NEFT, UPI..."
                  value={expenseForm.paymentMode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>
                  Link to Client (Optional for client profitability)
                </label>
                <select
                  value={expenseForm.brandId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, brandId: e.target.value })}
                  style={inputFieldStyle}
                >
                  <option value="">General Overhead (No client)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Note / Description</label>
                <input
                  type="text"
                  placeholder="Details of expense..."
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 4 }}>
                <input
                  type="checkbox"
                  checked={expenseForm.isRecurring}
                  onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                />
                <span style={{ color: '#0a0a0a' }}>Recurring Monthly Expense</span>
              </label>

              <div style={{ paddingTop: 12, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowAddExpenseModal(false)} style={{ ...btnSecondary, fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnPrimary, fontSize: 12 }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
