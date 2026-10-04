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
  X
} from 'lucide-react';

export const FinanceManager: React.FC = () => {
  const {
    currentUser,
    payments,
    expenses,
    brands,
    addExpense,
    invoices
  } = useApp();

  const role = currentUser.role;
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'profitability'>('payments');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // New Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    category: 'Tools & Software' as ExpenseCategory,
    amount: 15000,
    date: '2026-10-04',
    paymentMode: 'Corporate Card',
    note: '',
    brandId: '',
    isRecurring: false
  });

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      ...expenseForm,
      amount: Number(expenseForm.amount),
      brandId: expenseForm.brandId || undefined
    });
    setShowAddExpenseModal(false);
  };

  // Financial calculations
  const totalCollections = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netAgencyProfit = totalCollections - totalExpenses;

  // Brand Profitability Calculation
  const brandProfitability = brands.map((b) => {
    const revenue = payments
      .filter((p) => p.brandId === b.id)
      .reduce((acc, p) => acc + p.amount, 0);

    const directExpenses = expenses
      .filter((e) => e.brandId === b.id)
      .reduce((acc, e) => acc + e.amount, 0);

    const profit = revenue - directExpenses;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      brand: b,
      revenue,
      directExpenses,
      profit,
      margin
    };
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
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

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards (Expenses & Net Profit shown ONLY to Admin per SRD Section 2 & 3.4) */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 16 }}>
        <div className="stat-card">
          <div className="metric-label" style={{ marginBottom: 12 }}>Total Collections Received</div>
          <div className="metric-value">
            ₹{totalCollections.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#909090', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle className="w-3.5 h-3.5 text-black" />
            <span>Verified via Razorpay and Bank Transfers</span>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className="stat-card">
              <div className="metric-label" style={{ marginBottom: 12 }}>Total Expenses</div>
              <div className="metric-value">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>
                Salaries, SaaS subscriptions & vendor costs
              </div>
            </div>

            <div className="stat-card" style={{ border: '1.5px solid #0a0a0a' }}>
              <div className="metric-label" style={{ marginBottom: 12 }}>Net Operating Profit</div>
              <div className="metric-value">
                ₹{netAgencyProfit.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: '#0a0a0a', fontWeight: 600, marginTop: 6 }}>
                {totalCollections > 0 ? Math.round((netAgencyProfit / totalCollections) * 100) : 0}% Agency Margin
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#ffffff',
          border: '1px solid #e2e2e2',
          borderRadius: 12,
          padding: '4px 12px',
        }}
      >
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'payments' ? '#0a0a0a' : 'transparent',
            color: activeTab === 'payments' ? '#ffffff' : '#666666',
            transition: 'all 0.15s ease',
          }}
        >
          Received Client Payments ({payments.length})
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('expenses')}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'expenses' ? '#0a0a0a' : 'transparent',
                color: activeTab === 'expenses' ? '#ffffff' : '#666666',
                transition: 'all 0.15s ease',
              }}
            >
              Agency Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'profitability' ? '#0a0a0a' : 'transparent',
                color: activeTab === 'profitability' ? '#ffffff' : '#666666',
                transition: 'all 0.15s ease',
              }}
            >
              Client-Wise Profitability Matrix
            </button>
          </>
        )}
      </div>

      {/* Tab: Received Payments */}
      {activeTab === 'payments' && (
        <div className="glass-panel overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Amount (INR)</th>
                <th>Payment Mode</th>
                <th>Reference #</th>
                <th>Settlement</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="text-slate-400 text-xs">{p.paymentDate}</td>
                  <td>
                    <div className="font-semibold text-slate-200 text-xs">{p.brandName}</div>
                  </td>
                  <td>
                    <div className="font-mono font-bold text-emerald-400 text-xs">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info text-[11px] font-mono">
                      {p.mode}
                    </span>
                  </td>
                  <td className="font-mono text-slate-400 text-xs">{p.referenceNo}</td>
                  <td>
                    <span className="badge badge-active text-[10px]">
                      <CheckCircle className="w-3 h-3" /> Settled to Bank
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Agency Expenses (Admin Only) */}
      {activeTab === 'expenses' && isAdmin && (
        <div className="glass-panel overflow-hidden">
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
                    <td className="text-slate-400 text-xs">{e.date}</td>
                    <td>
                      <span className="badge badge-neutral text-xs">{e.category}</span>
                    </td>
                    <td>
                      <div className="font-mono font-bold text-rose-400 text-xs">
                        ₹{e.amount.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="text-slate-300 text-xs">{e.paymentMode}</td>
                    <td className="text-slate-300 text-xs max-w-xs">{e.note}</td>
                    <td className="text-xs">
                      {linkedBrand ? (
                        <span className="text-indigo-400 font-semibold">{linkedBrand.name}</span>
                      ) : (
                        <span className="text-slate-500">General Overhead</span>
                      )}
                    </td>
                    <td>
                      {e.isRecurring ? (
                        <span className="badge badge-info text-[10px]">Monthly Recurring</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">One-time</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Client-Wise Profitability Matrix (Admin Only) */}
      {activeTab === 'profitability' && isAdmin && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e]">
            <h3 className="text-sm font-bold text-white">Client Margin & Profitability Breakdown</h3>
            <p className="text-xs text-slate-400">
              Direct profitability per client account based on revenues collected vs client-linked contractor/ad costs.
            </p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Agreed Monthly Fee</th>
                <th>Total Collected</th>
                <th>Direct Client Costs</th>
                <th>Net Client Margin</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {brandProfitability.map((bp) => (
                <tr key={bp.brand.id}>
                  <td>
                    <div className="font-bold text-slate-200 text-xs">{bp.brand.name}</div>
                    <div className="text-[11px] text-slate-400">{bp.brand.ownerName}</div>
                  </td>
                  <td className="font-mono text-slate-300 text-xs">
                    ₹{bp.brand.monthlyFee.toLocaleString('en-IN')}
                  </td>
                  <td className="font-mono font-bold text-emerald-400 text-xs">
                    ₹{bp.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="font-mono text-rose-400 text-xs">
                    ₹{bp.directExpenses.toLocaleString('en-IN')}
                  </td>
                  <td className="font-mono font-bold text-indigo-300 text-xs">
                    ₹{bp.profit.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span
                      className={`badge text-[10px] ${
                        bp.margin >= 60
                          ? 'badge-active'
                          : bp.margin > 0
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
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
        <div className="modal-overlay" onClick={() => setShowAddExpenseModal(false)}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Record Agency Expense</h3>
                <p className="text-[11px] text-slate-400">Add operational or client-specific cost</p>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="input-field"
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
                <label className="block text-slate-300 font-semibold mb-1">Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                <input
                  type="text"
                  placeholder="Corporate Card, Bank NEFT, UPI..."
                  value={expenseForm.paymentMode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Link to Client (Optional for client profitability)
                </label>
                <select
                  value={expenseForm.brandId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, brandId: e.target.value })}
                  className="input-field"
                >
                  <option value="">General Overhead (No client)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Note / Description</label>
                <input
                  type="text"
                  placeholder="Details of expense..."
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="input-field"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={expenseForm.isRecurring}
                  onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-slate-300">Recurring Monthly Expense</span>
              </label>

              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
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
