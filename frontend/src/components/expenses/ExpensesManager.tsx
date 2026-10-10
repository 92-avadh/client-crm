import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Expense, ExpenseCategory } from '../../types';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Briefcase,
  Megaphone,
  UserCheck,
  TrendingDown,
  LayoutGrid,
  ListFilter,
  ArrowUpDown,
  FileSpreadsheet,
  Users,
  DollarSign,
  Clock,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Check,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

// ─── Categories Configuration (Per User Request) ──────────────────────────────
// 1. Brand Expenses
// 2. Employee Salaries
// 3. Office Expenses
// 4. Software & Subscriptions
// 5. Marketing Expenses
// 6. Other Expenses
export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string; desc: string }
> = {
  'Brand Expenses': {
    label: 'Brand Expenses',
    icon: Building2,
    color: '#0F2A42', // Retentio Deep Navy
    bg: '#F0F4F8',
    border: '#D4E0EB',
    desc: 'Direct client ad spend, creative assets, shoot costs & deliverables',
  },
  'Employee Salaries': {
    label: 'Employee Salaries',
    icon: Users,
    color: '#0284c7', // Sky Blue
    bg: '#f0f9ff',
    border: '#bae6fd',
    desc: 'Staff compensation, payroll & strategist monthly retainer fees',
  },
  'Office Expenses': {
    label: 'Office Expenses',
    icon: Briefcase,
    color: '#059669', // Emerald
    bg: '#ecfdf5',
    border: '#a7f3d0',
    desc: 'Studio lease, utilities, office broadband & maintenance',
  },
  'Software & Subscriptions': {
    label: 'Software & Subscriptions',
    icon: Layers,
    color: '#7c3aed', // Purple
    bg: '#f5f3ff',
    border: '#ddd6fe',
    desc: 'SaaS tools, cloud infrastructure, Figma, Google Workspace & AI APIs',
  },
  'Marketing Expenses': {
    label: 'Marketing Expenses',
    icon: Megaphone,
    color: '#ea580c', // Orange
    bg: '#fff7ed',
    border: '#ffedd5',
    desc: 'Agency promotions, LinkedIn ads, PR & acquisition marketing',
  },
  'Other Expenses': {
    label: 'Other Expenses',
    icon: Tag,
    color: '#475569', // Slate
    bg: '#f8fafc',
    border: '#e2e8f0',
    desc: 'Client dinners, business travel, statutory compliance & petty cash',
  },

  // Legacy Category Normalization Mappings
  'Salary': {
    label: 'Employee Salaries',
    icon: Users,
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    desc: 'Staff compensation & payroll',
  },
  'Tools & Software': {
    label: 'Software & Subscriptions',
    icon: Layers,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    desc: 'SaaS tools & cloud software',
  },
  'Ads & Marketing': {
    label: 'Marketing Expenses',
    icon: Megaphone,
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#ffedd5',
    desc: 'Ads & marketing expenses',
  },
  'Office & Rent': {
    label: 'Office Expenses',
    icon: Briefcase,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    desc: 'Studio lease & office bills',
  },
  'Freelancer Payout': {
    label: 'Employee Salaries',
    icon: Users,
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    desc: 'Specialist & contractor compensation',
  },
  'Travel': {
    label: 'Other Expenses',
    icon: Tag,
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
    desc: 'Travel & logistics overhead',
  },
  'Other': {
    label: 'Other Expenses',
    icon: Tag,
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
    desc: 'General miscellaneous overhead',
  },
};

const STANDARD_CATEGORIES = [
  'Brand Expenses',
  'Employee Salaries',
  'Office Expenses',
  'Software & Subscriptions',
  'Marketing Expenses',
  'Other Expenses',
];

const PAYMENT_MODES = [
  'Corporate Card',
  'Bank Transfer',
  'UPI',
  'Company NetBanking',
  'Cheque',
  'Cash',
];

export const ExpensesManager: React.FC = () => {
  const {
    currentUser,
    expenses,
    brands,
    allUsers,
    addExpense,
    updateExpense,
    deleteExpense,
    showToast,
  } = useApp();

  const role = currentUser.role;
  const canManage = role === 'admin' || role === 'hr';

  // ─── Filter & Search States ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this_month' | 'last_month' | 'this_quarter' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedBrandForFocus, setSelectedBrandForFocus] = useState<string | null>(null);

  // ─── Modal States ────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'standard' | 'salary' | 'brand'>('standard');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // ─── Form State ──────────────────────────────────────────────
  const initialForm = {
    title: '',
    description: '',
    category: 'Brand Expenses' as ExpenseCategory,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentStatus: 'Paid' as 'Paid' | 'Pending',
    paymentMode: 'Bank Transfer',
    brandId: '' as string,
    employeeName: '',
    employeeId: '' as string | null,
    isRecurring: false,
  };
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique list of employees recorded across expenses + current active team members
  const teamMemberList = useMemo(() => {
    return (allUsers || []).filter((u: any) => u.role !== 'brand');
  }, [allUsers]);

  const distinctEmployees = useMemo(() => {
    const names = new Set<string>();
    teamMemberList.forEach((u: any) => { if (u.name) names.add(u.name.trim()); });
    expenses.forEach((e: any) => { if (e.employeeName) names.add(e.employeeName.trim()); });
    return Array.from(names).sort();
  }, [teamMemberList, expenses]);

  // ─── Financial Summaries & Metrics ───────────────────────────
  const metrics = useMemo(() => {
    const paidExpenses = expenses.filter((e) => (e.paymentStatus || 'Paid') === 'Paid');
    const pendingExpenses = expenses.filter((e) => e.paymentStatus === 'Pending');

    // Total expenses accounts ONLY for expenses actually paid (matches Dashboard & Finance)
    const total = paidExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const grossTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthExpenses = paidExpenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Brand-linked expenses (Paid)
    const brandExpenses = paidExpenses.filter((e) => Boolean(e.brandId) && e.brandId !== 'other');
    const brandExpensesTotal = brandExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Employee salaries
    const salaryExpenses = expenses.filter(
      (e) => e.category === 'Employee Salaries' || e.category === 'Salary' || Boolean(e.employeeName)
    );
    const paidSalaries = salaryExpenses.filter((e) => (e.paymentStatus || 'Paid') === 'Paid');
    const salaryTotal = paidSalaries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingSalaries = salaryExpenses.filter((e) => e.paymentStatus === 'Pending');

    // Pending payouts (all categories)
    const pendingTotal = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Category breakdown (Paid)
    const categoryTotals: Record<string, number> = {};
    paidExpenses.forEach((e) => {
      const canonicalCat = CATEGORY_CONFIG[e.category]?.label || e.category || 'Other Expenses';
      categoryTotals[canonicalCat] = (categoryTotals[canonicalCat] || 0) + (Number(e.amount) || 0);
    });

    // Brand-wise expenses breakdown (Paid & Pending tracked separately)
    const brandTotals: Record<string, { total: number; count: number; brandName: string; brand: any; paidTotal: number; pendingTotal: number }> = {};
    let otherBrandTotal = 0;
    let otherBrandCount = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      const isPaid = (e.paymentStatus || 'Paid') === 'Paid';
      if (e.brandId && e.brandId !== 'other') {
        const linkedBrand = brands.find((b: any) => b.id === e.brandId);
        const name = linkedBrand ? linkedBrand.name : 'Unknown Brand';
        if (!brandTotals[e.brandId]) {
          brandTotals[e.brandId] = { total: 0, count: 0, brandName: name, brand: linkedBrand, paidTotal: 0, pendingTotal: 0 };
        }
        brandTotals[e.brandId].total += amt;
        brandTotals[e.brandId].count += 1;
        if (isPaid) {
          brandTotals[e.brandId].paidTotal += amt;
        } else {
          brandTotals[e.brandId].pendingTotal += amt;
        }
      } else {
        if (isPaid) {
          otherBrandTotal += amt;
        }
        otherBrandCount += 1;
      }
    });

    return {
      total,
      grossTotal,
      paidCount: paidExpenses.length,
      count: expenses.length,
      thisMonthTotal,
      thisMonthCount: thisMonthExpenses.length,
      brandExpensesTotal,
      brandExpensesCount: brandExpenses.length,
      salaryTotal,
      salaryCount: salaryExpenses.length,
      paidSalariesCount: paidSalaries.length,
      pendingSalariesCount: pendingSalaries.length,
      pendingTotal,
      pendingCount: pendingExpenses.length,
      categoryTotals,
      brandTotals,
      otherBrandTotal,
      otherBrandCount,
    };
  }, [expenses, brands]);

  // ─── Filtered & Sorted Expenses ──────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const linkedBrand = brands.find((b: any) => b.id === e.brandId);
          const brandName = linkedBrand ? linkedBrand.name.toLowerCase() : '';
          const matchTitle = (e.title || '').toLowerCase().includes(q);
          const matchDesc = (e.description || e.note || '').toLowerCase().includes(q);
          const matchCategory = (e.category || '').toLowerCase().includes(q);
          const matchMode = (e.paymentMode || '').toLowerCase().includes(q);
          const matchEmp = (e.employeeName || '').toLowerCase().includes(q);
          const matchBrand = brandName.includes(q);
          if (!matchTitle && !matchDesc && !matchCategory && !matchMode && !matchEmp && !matchBrand) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'all') {
          const canonical = CATEGORY_CONFIG[e.category]?.label || e.category;
          if (canonical !== categoryFilter && e.category !== categoryFilter) {
            return false;
          }
        }

        // Brand filter
        if (brandFilter === 'other') {
          if (e.brandId && e.brandId !== 'other') return false;
        } else if (brandFilter !== 'all') {
          if (e.brandId !== brandFilter) return false;
        }

        // Employee filter
        if (employeeFilter !== 'all') {
          if (!e.employeeName || e.employeeName.trim().toLowerCase() !== employeeFilter.toLowerCase()) {
            return false;
          }
        }

        // Payment status filter
        if (paymentStatusFilter !== 'all') {
          const status = e.paymentStatus || 'Paid';
          if (status !== paymentStatusFilter) return false;
        }

        // Date range filter
        if (dateRangePreset === 'this_month') {
          if (!e.date) return false;
          const d = new Date(e.date);
          const now = new Date();
          if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return false;
        } else if (dateRangePreset === 'last_month') {
          if (!e.date) return false;
          const d = new Date(e.date);
          const now = new Date();
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (d.getFullYear() !== lastMonthYear || d.getMonth() !== lastMonth) return false;
        } else if (dateRangePreset === 'this_quarter') {
          if (!e.date) return false;
          const d = new Date(e.date);
          const now = new Date();
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const expenseQuarter = Math.floor(d.getMonth() / 3);
          if (d.getFullYear() !== now.getFullYear() || expenseQuarter !== currentQuarter) return false;
        } else if (dateRangePreset === 'custom') {
          if (customStartDate && (!e.date || e.date < customStartDate)) return false;
          if (customEndDate && (!e.date || e.date > customEndDate)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'amount') {
          const amtA = Number(a.amount) || 0;
          const amtB = Number(b.amount) || 0;
          return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
        } else {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        }
      });
  }, [
    expenses,
    searchQuery,
    categoryFilter,
    brandFilter,
    employeeFilter,
    paymentStatusFilter,
    dateRangePreset,
    customStartDate,
    customEndDate,
    sortField,
    sortOrder,
    brands,
  ]);

  const hasActiveFilters =
    searchQuery !== '' ||
    categoryFilter !== 'all' ||
    brandFilter !== 'all' ||
    employeeFilter !== 'all' ||
    paymentStatusFilter !== 'all' ||
    dateRangePreset !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBrandFilter('all');
    setEmployeeFilter('all');
    setPaymentStatusFilter('all');
    setDateRangePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedBrandForFocus(null);
  };

  // ─── Export CSV Report ───────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Expense Title',
      'Category',
      'Amount (INR)',
      'Payment Status',
      'Payment Mode',
      'Associated Brand/Client',
      'Employee Name',
      'Description / Purpose',
    ];
    const rows = filteredExpenses.map((e) => {
      const linkedBrand = brands.find((b: any) => b.id === e.brandId);
      return [
        e.date || 'N/A',
        `"${(e.title || e.category || 'Expense').replace(/"/g, '""')}"`,
        CATEGORY_CONFIG[e.category]?.label || e.category,
        e.amount,
        e.paymentStatus || 'Paid',
        e.paymentMode || 'Corporate Card',
        linkedBrand ? `"${linkedBrand.name}"` : 'General / Other (Overhead)',
        e.employeeName ? `"${e.employeeName}"` : 'N/A',
        `"${(e.description || e.note || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `retentio-expenses-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredExpenses.length} expense records to CSV`, 'success');
  };

  const handlePrint = () => {
    showToast('Preparing printable expense report...', 'info');
    window.print();
  };

  // ─── Open Add Modal ──────────────────────────────────────────
  const handleOpenAdd = (type: 'standard' | 'salary' | 'brand' = 'standard') => {
    setEditingExpense(null);
    setModalMode(type);

    let defaultCategory: ExpenseCategory = 'Other Expenses';
    let defaultBrandId = '';
    let defaultEmpName = '';

    if (type === 'salary') {
      defaultCategory = 'Employee Salaries';
      if (teamMemberList.length > 0) {
        defaultEmpName = teamMemberList[0].name;
      }
    } else if (type === 'brand') {
      defaultCategory = 'Brand Expenses';
      if (brands.length > 0) {
        defaultBrandId = brands[0].id;
      }
    } else {
      defaultCategory = 'Software & Subscriptions';
    }

    setFormData({
      title: '',
      description: '',
      category: defaultCategory,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'Paid',
      paymentMode: type === 'salary' ? 'Bank Transfer' : 'Corporate Card',
      brandId: defaultBrandId,
      employeeName: defaultEmpName,
      employeeId: null,
      isRecurring: type === 'salary',
    });
    setModalOpen(true);
  };

  // ─── Open Edit Modal ─────────────────────────────────────────
  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    const canonicalCat = CATEGORY_CONFIG[expense.category]?.label || expense.category;
    const isSalary = canonicalCat === 'Employee Salaries' || Boolean(expense.employeeName);
    const isBrand = canonicalCat === 'Brand Expenses' || (Boolean(expense.brandId) && expense.brandId !== 'other');

    setModalMode(isSalary ? 'salary' : isBrand ? 'brand' : 'standard');
    setFormData({
      title: expense.title || expense.note || expense.category,
      description: expense.description || expense.note || '',
      category: (canonicalCat as ExpenseCategory) || 'Brand Expenses',
      amount: String(expense.amount || ''),
      date: expense.date || new Date().toISOString().split('T')[0],
      paymentStatus: (expense.paymentStatus as any) || 'Paid',
      paymentMode: expense.paymentMode || 'Corporate Card',
      brandId: expense.brandId || '',
      employeeName: expense.employeeName || '',
      employeeId: expense.employeeId || null,
      isRecurring: Boolean(expense.isRecurring),
    });
    setModalOpen(true);
  };

  // ─── Form Submission (Add / Edit) ────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('Please enter an expense title', 'error');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
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
        amount: numAmount,
        date: formData.date || new Date().toISOString().split('T')[0],
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentMode,
        brandId: (formData.brandId && formData.brandId !== 'other') ? formData.brandId : null,
        employeeName: formData.category === 'Employee Salaries' ? formData.employeeName.trim() : (formData.employeeName || ''),
        employeeId: formData.employeeId || null,
        note: formData.description.trim() || formData.title.trim(),
        isRecurring: formData.isRecurring,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await addExpense(payload);
      }

      setModalOpen(false);
      setEditingExpense(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save expense record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete Action ───────────────────────────────────────────
  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  // ─── Fast Toggle Payment Status (Paid <-> Pending) ───────────
  const handleToggleStatus = async (expense: Expense) => {
    if (!canManage) return;
    const currentStatus = (expense.paymentStatus || 'Paid') === 'Paid' ? 'Paid' : 'Pending';
    const targetStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    await updateExpense(expense.id, { paymentStatus: targetStatus });
  };

  // Helper: Get brand info
  const getBrandInfo = (brandId?: string | null) => {
    if (!brandId || brandId === 'other') return null;
    return brands.find((b: any) => b.id === brandId) || null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── 1. Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 20, borderBottom: '1px solid #E2E8F0' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#0F2A42', // Retentio Deep Navy
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(15, 42, 66, 0.16)',
            }}
          >
            <CreditCard style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F2A42', letterSpacing: '-0.02em', margin: 0 }}>
              Expenses &amp; Payouts Ledger
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 3, marginBottom: 0 }}>
              Track brand-specific ad spend &amp; costs, staff monthly salaries, SaaS tools, and overhead expenses.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 650,
              cursor: 'pointer',
              background: '#ffffff',
              color: '#0F2A42',
              border: '1px solid #CBD5E1',
              transition: 'all 0.15s ease',
            }}
          >
            <Download style={{ width: 14, height: 14 }} />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 650,
              cursor: 'pointer',
              background: '#ffffff',
              color: '#0F2A42',
              border: '1px solid #CBD5E1',
              transition: 'all 0.15s ease',
            }}
          >
            <Printer style={{ width: 14, height: 14 }} />
            Print Report
          </button>

          {canManage && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleOpenAdd('salary')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                }}
                title="Quickly record staff salary payout"
              >
                <Users style={{ width: 14, height: 14 }} />
                Record Salary
              </button>
              <button
                onClick={() => handleOpenAdd('standard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0F2A42 0%, #163C5E 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(15, 42, 66, 0.2)',
                }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                Add Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Summary KPI Metric Cards ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          {
            label: 'Total Expenses',
            value: `₹${metrics.total.toLocaleString('en-IN')}`,
            sub: metrics.pendingCount > 0 ? `${metrics.paidCount} paid · ${metrics.pendingCount} pending` : `${metrics.paidCount} paid records`,
            icon: CreditCard,
            color: '#0F2A42',
            bg: '#ffffff',
            border: '#D4E0EB',
            accent: '#0F2A42',
          },
          {
            label: 'This Month',
            value: `₹${metrics.thisMonthTotal.toLocaleString('en-IN')}`,
            sub: `${metrics.thisMonthCount} entries in current cycle`,
            icon: Calendar,
            color: '#0F2A42',
            bg: '#ffffff',
            border: '#E2E8F0',
            accent: '#058D32',
          },
          {
            label: 'Brand Expenses',
            value: `₹${metrics.brandExpensesTotal.toLocaleString('en-IN')}`,
            sub: `${metrics.brandExpensesCount} client-linked costs`,
            icon: Building2,
            color: '#0F2A42',
            bg: '#F0F4F8',
            border: '#D4E0EB',
            accent: '#0F2A42',
          },
          {
            label: 'Employee Salaries',
            value: `₹${metrics.salaryTotal.toLocaleString('en-IN')}`,
            sub: `${metrics.paidSalariesCount} paid (${metrics.pendingSalariesCount} pending)`,
            icon: Users,
            color: '#0284c7',
            bg: '#f0f9ff',
            border: '#bae6fd',
            accent: '#0284c7',
          },
          {
            label: 'Pending Payouts',
            value: `₹${metrics.pendingTotal.toLocaleString('en-IN')}`,
            sub: `${metrics.pendingCount} awaiting payment clearance`,
            icon: Clock,
            color: metrics.pendingTotal > 0 ? '#b45309' : '#0F2A42',
            bg: metrics.pendingTotal > 0 ? '#fffbeb' : '#ffffff',
            border: metrics.pendingTotal > 0 ? '#fde68a' : '#E2E8F0',
            accent: '#b45309',
          },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              className="stat-card"
              style={{
                background: k.bg,
                border: `1px solid ${k.border}`,
                borderRadius: 14,
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(15, 42, 66, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="metric-label" style={{ color: '#64748B' }}>{k.label}</span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${k.color}14`,
                    color: k.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                </div>
              </div>
              <div className="metric-value" style={{ fontSize: '1.45rem', color: k.color }}>
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Brand-Wise Expense Tracking (Dedicated Section) ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 2px 10px rgba(15, 42, 66, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#F0F4F8',
                color: '#0F2A42',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F2A42', margin: 0, letterSpacing: '-0.01em' }}>
                Brand-Wise Expense Tracking
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                See how much is spent on each specific client vs general agency overhead. Click any brand to filter.
              </p>
            </div>
          </div>

          {selectedBrandForFocus && (
            <button
              onClick={() => {
                setSelectedBrandForFocus(null);
                setBrandFilter('all');
              }}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#04592B',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 20,
                padding: '4px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              Viewing: {brands.find((b: any) => b.id === selectedBrandForFocus)?.name || 'Filtered'}
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {/* Brand cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {/* List all registered brands */}
          {brands.map((brand: any) => {
            const data = metrics.brandTotals[brand.id] || { total: 0, count: 0, brandName: brand.name, brand, paidTotal: 0, pendingTotal: 0 };
            const isSelected = brandFilter === brand.id;
            const paidSpend = data.paidTotal || 0;
            const pendingSpend = data.pendingTotal || 0;
            const pctOfTotal = metrics.total > 0 ? Math.round((paidSpend / metrics.total) * 100) : 0;
            const monthlyFee = Number(brand.monthlyFee) || 0;
            const netMargin = monthlyFee - paidSpend;

            return (
              <div
                key={brand.id}
                onClick={() => {
                  if (brandFilter === brand.id) {
                    setBrandFilter('all');
                    setSelectedBrandForFocus(null);
                  } else {
                    setBrandFilter(brand.id);
                    setSelectedBrandForFocus(brand.id);
                  }
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: isSelected ? '#F0F4F8' : '#F8FAFC',
                  border: isSelected ? '2px solid #0F2A42' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: '#0F2A42',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 750, color: '#0F2A42', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {brand.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#e2e8f0', color: '#475569' }}>
                    {data.count} cost{data.count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Client Spend (Paid):</span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-amount" style={{ fontSize: 14, fontWeight: 800, color: '#0F2A42' }}>
                      ₹{paidSpend.toLocaleString('en-IN')}
                    </span>
                    {pendingSpend > 0 && (
                      <div style={{ fontSize: 10, color: '#B45309', fontWeight: 650 }}>
                        +₹{pendingSpend.toLocaleString('en-IN')} pending
                      </div>
                    )}
                  </div>
                </div>

                {monthlyFee > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748B', borderTop: '1px solid #e2e2e2', paddingTop: 6 }}>
                    <span>Client Retainer: <strong className="font-amount" style={{ fontWeight: 750 }}>₹{monthlyFee.toLocaleString('en-IN')}</strong></span>
                    <span className="font-amount" style={{ color: netMargin >= 0 ? '#04592B' : '#DC2626', fontWeight: 800 }}>
                      {netMargin >= 0 ? `+₹${netMargin.toLocaleString('en-IN')} profit` : `-₹${Math.abs(netMargin).toLocaleString('en-IN')} deficit`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* General / Other Overhead card */}
          <div
            onClick={() => {
              if (brandFilter === 'other') {
                setBrandFilter('all');
                setSelectedBrandForFocus(null);
              } else {
                setBrandFilter('other');
                setSelectedBrandForFocus('other');
              }
            }}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: brandFilter === 'other' ? '#F0F4F8' : '#F8FAFC',
              border: brandFilter === 'other' ? '2px solid #0F2A42' : '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: '#64748B',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Tag style={{ width: 14, height: 14 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 750, color: '#0F2A42' }}>
                  Other / Non-Brand Overhead
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#e2e8f0', color: '#475569' }}>
                {metrics.otherBrandCount}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Salaries, SaaS &amp; Office:</span>
              <span className="font-amount" style={{ fontSize: 14, fontWeight: 800, color: '#0F2A42' }}>
                ₹{metrics.otherBrandTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748B', borderTop: '1px solid #e2e2e2', paddingTop: 6 }}>
              Internal operational and payroll costs
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Filtering, Search & Reporting Controls ─────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 1px 3px rgba(15, 42, 66, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Search box */}
          <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search expenses, title, employee, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 12,
                fontSize: 13,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                color: '#0F2A42',
                outline: 'none',
              }}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0F2A42',
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              {STANDARD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setSelectedBrandForFocus(e.target.value === 'all' ? null : e.target.value);
              }}
              style={{
                height: 38,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0F2A42',
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Brands &amp; Overheads</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>Brand: {b.name}</option>
              ))}
              <option value="other">Other / General Overhead</option>
            </select>

            {/* Employee Filter */}
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0F2A42',
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Employees</option>
              {distinctEmployees.map((emp) => (
                <option key={emp} value={emp}>Employee: {emp}</option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0F2A42',
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Status: Paid</option>
              <option value="Pending">Status: Pending</option>
            </select>

            {/* Date Range Preset */}
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value as any)}
              style={{
                height: 38,
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0F2A42',
                background: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Date: All Time</option>
              <option value="this_month">Date: This Month</option>
              <option value="last_month">Date: Last Month</option>
              <option value="this_quarter">Date: This Quarter</option>
              <option value="custom">Date: Custom Range...</option>
            </select>

            {/* Reset button */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                style={{
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X style={{ width: 13, height: 13 }} />
                Reset
              </button>
            )}

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  height: 36,
                  padding: '0 10px',
                  background: viewMode === 'table' ? '#0F2A42' : '#ffffff',
                  color: viewMode === 'table' ? '#ffffff' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Table View"
              >
                <ListFilter style={{ width: 15, height: 15 }} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  height: 36,
                  padding: '0 10px',
                  background: viewMode === 'cards' ? '#0F2A42' : '#ffffff',
                  color: viewMode === 'cards' ? '#ffffff' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Cards View"
              >
                <LayoutGrid style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Custom date range inputs if custom selected */}
        {dateRangePreset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F2A42' }}>Filter from date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F2A42' }}>to:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
            />
          </div>
        )}
      </div>

      {/* ── 5. Main Ledger View (Table or Cards) ───────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(15, 42, 66, 0.04)',
        }}
      >
        {/* Ledger Header bar */}
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F2A42' }}>
            Showing {filteredExpenses.length} of {expenses.length} Records
            {hasActiveFilters && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                (Total: <span className="font-amount" style={{ fontWeight: 800, color: '#0F2A42' }}>₹{filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('en-IN')}</span>)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748B' }}>
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortField === 'date') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else { setSortField('date'); setSortOrder('desc'); }
              }}
              style={{ background: 'none', border: 'none', fontWeight: sortField === 'date' ? 700 : 500, color: sortField === 'date' ? '#0F2A42' : '#64748B', cursor: 'pointer' }}
            >
              Date {sortField === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button
              onClick={() => {
                if (sortField === 'amount') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                else { setSortField('amount'); setSortOrder('desc'); }
              }}
              style={{ background: 'none', border: 'none', fontWeight: sortField === 'amount' ? 700 : 500, color: sortField === 'amount' ? '#0F2A42' : '#64748B', cursor: 'pointer' }}
            >
              Amount {sortField === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F4F8', color: '#0F2A42', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard style={{ width: 22, height: 22 }} />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F2A42', margin: '0 0 6px' }}>
              No expenses match the selected filters
            </h4>
            <p style={{ fontSize: 13, color: '#64748B', maxWidth: 400, margin: '0 auto 16px' }}>
              Try adjusting your category, brand, employee, or date filters to view more records.
            </p>
            {hasActiveFilters && (
              <button onClick={resetAllFilters} className="btn-secondary" style={{ display: 'inline-flex', margin: '0 auto' }}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Date</th>
                  <th>Expense Title &amp; Details</th>
                  <th>Category</th>
                  <th>Brand / Client</th>
                  <th>Employee / Recipient</th>
                  <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                  <th>Status</th>
                  <th>Mode</th>
                  {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG['Other Expenses'];
                  const CatIcon = catConfig.icon;
                  const linkedBrand = getBrandInfo(exp.brandId);
                  const isPaid = (exp.paymentStatus || 'Paid') === 'Paid';

                  return (
                    <tr key={exp.id}>
                      {/* Date */}
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#64748B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar style={{ width: 12, height: 12, color: '#94A3B8' }} />
                          <span>{exp.date || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td style={{ minWidth: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 750, color: '#0F2A42' }}>
                          {exp.title || exp.note || exp.category}
                        </div>
                        {(exp.description || exp.note) && (
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, maxWidth: 320, lineHeight: 1.4 }}>
                            {exp.description || exp.note}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: catConfig.bg,
                            color: catConfig.color,
                            border: `1px solid ${catConfig.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CatIcon style={{ width: 12, height: 12 }} />
                          {catConfig.label}
                        </span>
                      </td>

                      {/* Associated Brand / Client */}
                      <td>
                        {linkedBrand ? (
                          <span
                            onClick={() => { setBrandFilter(linkedBrand.id); setSelectedBrandForFocus(linkedBrand.id); }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#F0F4F8',
                              color: '#0F2A42',
                              border: '1px solid #D4E0EB',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                            title="Click to filter expenses for this brand"
                          >
                            <Building2 style={{ width: 12, height: 12 }} />
                            {linkedBrand.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                            Other / General
                          </span>
                        )}
                      </td>

                      {/* Employee (for Salaries) */}
                      <td>
                        {exp.employeeName ? (
                          <span
                            onClick={() => setEmployeeFilter(exp.employeeName || '')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '2px 9px',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                            title="Click to filter payouts for this employee"
                          >
                            <User style={{ width: 11, height: 11 }} />
                            {exp.employeeName}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span className="font-amount" style={{ fontSize: 14, fontWeight: 800, color: '#0F2A42' }}>
                          ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exp)}
                          disabled={!canManage}
                          title={canManage ? `Click to toggle status: currently ${isPaid ? 'Paid' : 'Pending'}` : undefined}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 750,
                            background: isPaid ? '#ECFDF5' : '#FFFBEB',
                            color: isPaid ? '#04592B' : '#B45309',
                            border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}`,
                            whiteSpace: 'nowrap',
                            cursor: canManage ? 'pointer' : 'default',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: isPaid ? '#058D32' : '#D97706',
                            }}
                          />
                          {isPaid ? 'Paid' : 'Pending'}
                        </button>
                      </td>

                      {/* Payment Mode */}
                      <td style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {exp.paymentMode || 'Corporate Card'}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            {!isPaid ? (
                              <button
                                onClick={() => handleToggleStatus(exp)}
                                title="Mark as Paid to reflect in Dashboard"
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: '#ECFDF5',
                                  border: '1px solid #86EFAC',
                                  color: '#034726',
                                  fontSize: 11,
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 1px 3px rgba(0, 192, 88, 0.1)',
                                }}
                              >
                                <CheckCircle2 style={{ width: 12, height: 12, color: '#059639' }} />
                                Mark Paid
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(exp)}
                                title="Mark as Pending (removes from Dashboard)"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  background: '#ffffff',
                                  border: '1px solid #CBD5E1',
                                  color: '#64748B',
                                  fontSize: 11,
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                }}
                              >
                                Mark Pending
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(exp)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                background: '#ffffff',
                                border: '1px solid #CBD5E1',
                                color: '#0F2A42',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Edit3 style={{ width: 12, height: 12 }} />
                              Edit
                            </button>
                            <button
                              onClick={() => { setExpenseToDelete(exp); setDeleteModalOpen(true); }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                background: '#ffffff',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
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
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
            {filteredExpenses.map((exp) => {
              const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG['Other Expenses'];
              const CatIcon = catConfig.icon;
              const linkedBrand = getBrandInfo(exp.brandId);
              const isPaid = (exp.paymentStatus || 'Paid') === 'Paid';

              return (
                <div
                  key={exp.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: '0 1px 3px rgba(15, 42, 66, 0.04)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '2px 9px',
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          background: catConfig.bg,
                          color: catConfig.color,
                          border: `1px solid ${catConfig.border}`,
                        }}
                      >
                        <CatIcon style={{ width: 11, height: 11 }} />
                        {catConfig.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(exp)}
                        disabled={!canManage}
                        title={canManage ? `Click to toggle status: currently ${isPaid ? 'Paid' : 'Pending'}` : undefined}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 750,
                          background: isPaid ? '#ECFDF5' : '#FFFBEB',
                          color: isPaid ? '#04592B' : '#B45309',
                          border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}`,
                          cursor: canManage ? 'pointer' : 'default',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: isPaid ? '#058D32' : '#D97706',
                          }}
                        />
                        {isPaid ? 'Paid' : 'Pending'}
                      </button>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F2A42', margin: '0 0 4px', lineHeight: 1.3 }}>
                      {exp.title || exp.note || exp.category}
                    </h4>

                    {(exp.description || exp.note) && (
                      <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px', lineHeight: 1.45 }}>
                        {exp.description || exp.note}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {linkedBrand && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F2A42', background: '#F0F4F8', border: '1px solid #D4E0EB', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Building2 style={{ width: 11, height: 11 }} />
                          {linkedBrand.name}
                        </span>
                      )}
                      {exp.employeeName && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <User style={{ width: 11, height: 11 }} />
                          {exp.employeeName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="font-amount" style={{ fontSize: 16, fontWeight: 800, color: '#0F2A42' }}>
                        ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                        {exp.date} · {exp.paymentMode || 'Corporate Card'}
                      </div>
                    </div>

                    {canManage && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {!isPaid && (
                          <button
                            onClick={() => handleToggleStatus(exp)}
                            title="Mark as Paid to reflect in Dashboard"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              background: '#ECFDF5',
                              border: '1px solid #86EFAC',
                              color: '#034726',
                              fontSize: 10,
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <CheckCircle2 style={{ width: 11, height: 11, color: '#059639' }} />
                            Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#ffffff', border: '1px solid #CBD5E1', color: '#0F2A42', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setExpenseToDelete(exp); setDeleteModalOpen(true); }}
                          style={{ padding: '6px 10px', borderRadius: 6, background: '#ffffff', border: '1px solid #FECACA', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 6. Add / Edit Expense Modal ───────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F2A42', margin: 0 }}>
                  {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                  {formData.category === 'Employee Salaries'
                    ? 'Record staff salary payroll, payment status and disbursement date'
                    : 'Track business expenses, client costs and operational overhead'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Category Selector */}
              <div>
                <label className="form-label">Expense Category *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                  {STANDARD_CATEGORIES.map((cat) => {
                    const c = CATEGORY_CONFIG[cat];
                    const Icon = c.icon;
                    const isSelected = formData.category === cat;
                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            category: cat as ExpenseCategory,
                            // auto-set title suggestion if empty
                            title: prev.title || (cat === 'Employee Salaries' ? 'Staff Monthly Salary' : ''),
                          }));
                        }}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 10,
                          border: isSelected ? '2px solid #0F2A42' : '1px solid #E2E8F0',
                          background: isSelected ? '#F0F4F8' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 5,
                          textAlign: 'center',
                        }}
                      >
                        <Icon style={{ width: 16, height: 16, color: isSelected ? '#0F2A42' : c.color }} />
                        <span style={{ fontSize: 11, fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0F2A42' : '#475569', lineHeight: 1.2 }}>
                          {c.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title & Amount Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formData.category === 'Employee Salaries'
                        ? 'e.g. October 2026 Developer Salary'
                        : 'e.g. Meta Ads Q4 Campaign, Figma License'
                    }
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Amount (₹ INR) *</label>
                  <div style={{ position: 'relative' }}>
                    <span className="font-amount" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#0F2A42', fontSize: 14 }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="e.g. 45000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="input-field font-amount"
                      style={{ paddingLeft: 26, fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* Special Section: Employee Salaries Details */}
              {formData.category === 'Employee Salaries' && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: '#f0f9ff',
                    border: '1.5px solid #bae6fd',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users style={{ width: 15, height: 15, color: '#0284c7' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0284c7' }}>
                      Employee Payroll Details
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>
                        Employee Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Drashti, Rahul, Priya"
                        value={formData.employeeName}
                        onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #7dd3fc', fontSize: 13, background: '#ffffff', color: '#0F2A42', outline: 'none' }}
                      />
                    </div>

                    {teamMemberList.length > 0 && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>
                          Quick pick team member:
                        </label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const found = teamMemberList.find((u: any) => u.id === e.target.value);
                              if (found) {
                                setFormData((prev) => ({
                                  ...prev,
                                  employeeName: found.name,
                                  employeeId: found.id,
                                  title: prev.title || `${found.name}'s Salary`,
                                }));
                              }
                            }
                          }}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #7dd3fc', fontSize: 12, background: '#ffffff', color: '#0F2A42', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">Select from team list...</option>
                          {teamMemberList.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Brand Association */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>Associated Brand / Client</label>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Choose &quot;Other&quot; if not linked to a client</span>
                </div>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Other / General Business Overhead (Not linked to a brand)</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      Client: {b.name} (Retainer: ₹{Number(b.monthlyFee || 0).toLocaleString('en-IN')}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Payment Status & Mode Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Payment Status *</label>
                  <div style={{ display: 'flex', gap: 8, height: 38 }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentStatus: 'Paid' })}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        border: formData.paymentStatus === 'Paid' ? '2px solid #04592B' : '1px solid #CBD5E1',
                        background: formData.paymentStatus === 'Paid' ? '#ECFDF5' : '#ffffff',
                        color: formData.paymentStatus === 'Paid' ? '#04592B' : '#64748B',
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      <Check style={{ width: 13, height: 13 }} /> Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentStatus: 'Pending' })}
                      style={{
                        flex: 1,
                        borderRadius: 8,
                        border: formData.paymentStatus === 'Pending' ? '2px solid #B45309' : '1px solid #CBD5E1',
                        background: formData.paymentStatus === 'Pending' ? '#FFFBEB' : '#ffffff',
                        color: formData.paymentStatus === 'Pending' ? '#B45309' : '#64748B',
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      <Clock style={{ width: 13, height: 13 }} /> Pending
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="form-label">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="form-label">Description &amp; Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional details, invoice/bill number, vendor name, or payroll note..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    background: '#0F2A42',
                    color: '#ffffff',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Delete Confirmation Modal ──────────────────────── */}
      {deleteModalOpen && expenseToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F2A42', margin: 0 }}>
                  Delete Expense Record?
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>
                  This will remove the expense and immediately update your dashboard totals.
                </p>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 750, color: '#0F2A42' }}>
                {expenseToDelete.title || expenseToDelete.note || expenseToDelete.category}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 12, color: '#64748B' }}>
                <span>{CATEGORY_CONFIG[expenseToDelete.category]?.label || expenseToDelete.category}</span>
                <span className="font-amount" style={{ fontWeight: 800, color: '#DC2626', fontSize: 14 }}>
                  ₹{Number(expenseToDelete.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Yes, Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
