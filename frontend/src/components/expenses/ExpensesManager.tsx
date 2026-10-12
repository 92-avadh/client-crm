import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getNaturalErrorMessage } from '../../services/errors';
import type { Expense, ExpenseCategory } from '../../types';
import { CATEGORY_CONFIG } from './expenseConfig';
import { useFilteredExpenses, useExpenseMetrics, type ExpenseFilters } from './useExpenseData';
import { exportExpensesToCsv } from './exportCsv';
import { ExpenseTable } from './ExpenseTable';
import { ExpenseFormModal, DeleteExpenseModal, type ExpenseFormData } from './ExpenseFormModal';
import { AnimatedSelect } from '../ui/AnimatedSelect';

const todayIso = () => new Date().toISOString().split('T')[0];

const emptyForm = (): ExpenseFormData => ({
  title: '',
  description: '',
  category: 'Brand Expenses' as ExpenseCategory,
  amount: '',
  date: todayIso(),
  paymentStatus: 'Paid',
  paymentMode: 'Bank Transfer',
  brandId: '',
  employeeName: '',
  employeeId: null,
  isRecurring: false,
});

/**
 * Expenses orchestrator.
 *
 * Filtering, aggregation and CSV export live in separate modules; this file
 * wires them to the UI and owns the modal/form state.
 */
export const ExpensesManager: React.FC = () => {
  const {
    currentUser, expenses, brands, allUsers,
    addExpense, updateExpense, deleteExpense, showToast,
  } = useApp();

  const canManage = currentUser.role === 'admin' || currentUser.role === 'hr';

  /* ── Filters ─────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState<ExpenseFilters['dateRangePreset']>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  /* ── Modal state ─────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const teamMemberList = useMemo(
    () => (allUsers || []).filter((u: any) => u.role !== 'brand'),
    [allUsers]
  );

  const filters: ExpenseFilters = {
    searchQuery, categoryFilter, brandFilter, employeeFilter, paymentStatusFilter,
    dateRangePreset, customStartDate, customEndDate, sortField, sortOrder,
  };

  const filteredExpenses = useFilteredExpenses(expenses, brands, filters);
  const metrics = useExpenseMetrics(expenses, brands);

  const hasActiveFilters =
    searchQuery !== '' || categoryFilter !== 'all' || brandFilter !== 'all' ||
    employeeFilter !== 'all' || paymentStatusFilter !== 'all' || dateRangePreset !== 'all';

  const resetAllFilters = () => {
    setSearchQuery(''); setCategoryFilter('all'); setBrandFilter('all');
    setEmployeeFilter('all'); setPaymentStatusFilter('all');
    setDateRangePreset('all'); setCustomStartDate(''); setCustomEndDate('');
  };

  /* ── Handlers ────────────────────────────────────────────────── */

  const patchForm = (patch: Partial<ExpenseFormData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData(emptyForm());
    setModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    const canonical = CATEGORY_CONFIG[expense.category]?.label || expense.category;
    setFormData({
      title: expense.title || expense.note || expense.category,
      description: expense.description || expense.note || '',
      category: (canonical as ExpenseCategory) || 'Brand Expenses',
      amount: String(expense.amount || ''),
      date: expense.date || todayIso(),
      paymentStatus: (expense.paymentStatus as any) || 'Paid',
      paymentMode: expense.paymentMode || 'Corporate Card',
      brandId: expense.brandId || '',
      employeeName: expense.employeeName || '',
      employeeId: expense.employeeId || null,
      isRecurring: Boolean(expense.isRecurring),
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('Please enter an expense title', 'error');
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid expense amount greater than 0', 'error');
      return;
    }
    if (formData.category === 'Employee Salaries' && !formData.employeeName.trim()) {
      showToast('Please specify the employee name for salary payouts', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        amount,
        date: formData.date || todayIso(),
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentMode,
        brandId: formData.brandId && formData.brandId !== 'other' ? formData.brandId : null,
        employeeName: formData.category === 'Employee Salaries'
          ? formData.employeeName.trim()
          : formData.employeeName || '',
        employeeId: formData.employeeId || null,
        note: formData.description.trim() || formData.title.trim(),
        isRecurring: formData.isRecurring,
      };

      if (editingExpense) await updateExpense(editingExpense.id, payload);
      else await addExpense(payload);

      setModalOpen(false);
      setEditingExpense(null);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (expense: Expense) => {
    if (!canManage) return;
    const target = (expense.paymentStatus || 'Paid') === 'Paid' ? 'Pending' : 'Paid';
    await updateExpense(expense.id, { paymentStatus: target });
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    }
  };

  const handleExportCsv = () => {
    exportExpensesToCsv(filteredExpenses, brands);
    showToast(`Exported ${filteredExpenses.length} expense records to CSV`, 'success');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            Expenses &amp; Overhead Ledger
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Track client costs, payroll and operational spend with GST-ready reporting.
          </p>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExportCsv} className="btn-secondary">Export CSV</button>
            <button onClick={handleOpenAdd}
              style={{ padding: '10px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              + Record Expense
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="rg-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Paid', value: metrics.total, count: metrics.paidCount, tone: 'var(--text-primary)' },
          { label: 'This Month', value: metrics.thisMonthTotal, count: metrics.thisMonthCount, tone: 'var(--info-text)' },
          { label: 'Pending Payouts', value: metrics.pendingTotal, count: metrics.pendingCount, tone: 'var(--warn-text)' },
          { label: 'Client Expenses', value: metrics.brandExpensesTotal, count: metrics.brandExpensesCount, tone: 'var(--success-text)' },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="metric-label">{kpi.label}</div>
            <div className="metric-value" style={{ color: kpi.tone, marginTop: 6 }}>
              ₹{kpi.value.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{kpi.count} records</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <input
          type="text"
          placeholder="Search expenses, brands, employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 240px', height: 36, padding: '0 12px', fontSize: 13, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
        />

        <AnimatedSelect
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v)}
          buttonStyle={{ height: 36, padding: '0 10px', fontSize: 12, minWidth: 140 }}
          options={[
            { value: 'all', label: 'All Categories' },
            ...Object.entries(CATEGORY_CONFIG)
              .filter(([k, v]) => k === v.label)
              .map(([k, v]) => ({ value: v.label, label: v.label })),
          ]}
        />

        <AnimatedSelect
          value={brandFilter}
          onChange={(v) => setBrandFilter(v)}
          buttonStyle={{ height: 36, padding: '0 10px', fontSize: 12, minWidth: 130 }}
          options={[
            { value: 'all', label: 'All Clients' },
            { value: 'other', label: 'Other / Overhead' },
            ...brands.map((b: any) => ({ value: b.id, label: b.name })),
          ]}
        />

        <AnimatedSelect
          value={paymentStatusFilter}
          onChange={(v) => setPaymentStatusFilter(v)}
          buttonStyle={{ height: 36, padding: '0 10px', fontSize: 12, minWidth: 110 }}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'Paid', label: 'Paid' },
            { value: 'Pending', label: 'Pending' },
          ]}
        />

        <AnimatedSelect
          value={dateRangePreset}
          onChange={(v) => setDateRangePreset(v as any)}
          buttonStyle={{ height: 36, padding: '0 10px', fontSize: 12, minWidth: 120 }}
          options={[
            { value: 'all', label: 'All Time' },
            { value: 'this_month', label: 'This Month' },
            { value: 'last_month', label: 'Last Month' },
            { value: 'this_quarter', label: 'This Quarter' },
            { value: 'custom', label: 'Custom Range' },
          ]}
        />

        {dateRangePreset === 'custom' && (
          <>
            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
              style={{ height: 36, padding: '0 10px', fontSize: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
              style={{ height: 36, padding: '0 10px', fontSize: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('table')}
            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: viewMode === 'table' ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)', color: viewMode === 'table' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}>
            Table
          </button>
          <button onClick={() => setViewMode('cards')}
            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: viewMode === 'cards' ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)', color: viewMode === 'cards' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}>
            Cards
          </button>
        </div>

        {hasActiveFilters && (
          <button onClick={resetAllFilters} className="btn-secondary" style={{ fontSize: 12 }}>Reset</button>
        )}
      </div>

      {/* Ledger */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
            Showing {filteredExpenses.length} of {expenses.length} Records
            {hasActiveFilters && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                (Total: <span className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('en-IN')}
                </span>)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>Sort by:</span>
            <button onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
              style={{ background: 'none', border: 'none', fontWeight: sortField === 'date' ? 700 : 500, color: sortField === 'date' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>
              Date {sortField === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button onClick={() => { setSortField('amount'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
              style={{ background: 'none', border: 'none', fontWeight: sortField === 'amount' ? 700 : 500, color: sortField === 'amount' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>
              Amount {sortField === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No expenses match the selected filters
            </h4>
            <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto 16px' }}>
              Try adjusting your category, brand, employee, or date filters to view more records.
            </p>
            {hasActiveFilters && (
              <button onClick={resetAllFilters} className="btn-secondary" style={{ display: 'inline-flex', margin: '0 auto' }}>
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <ExpenseTable
            expenses={filteredExpenses}
            brands={brands}
            canManage={canManage}
            onToggleStatus={handleToggleStatus}
            onEdit={handleOpenEdit}
            onDelete={(exp) => { setExpenseToDelete(exp); setDeleteModalOpen(true); }}
            onBrandClick={(id) => setBrandFilter(id)}
            onEmployeeClick={(name) => setEmployeeFilter(name)}
          />
        )}
      </div>

      {/* Modals */}
      <ExpenseFormModal
        open={modalOpen}
        editing={editingExpense}
        formData={formData}
        onFormChange={patchForm}
        onClose={() => { setModalOpen(false); setEditingExpense(null); }}
        onSubmit={handleFormSubmit}
        submitting={isSubmitting}
        brands={brands}
        teamMembers={teamMemberList}
      />

      <DeleteExpenseModal
        expense={deleteModalOpen ? expenseToDelete : null}
        onClose={() => { setDeleteModalOpen(false); setExpenseToDelete(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ExpensesManager;
