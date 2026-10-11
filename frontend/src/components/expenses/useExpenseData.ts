import { useMemo } from 'react';
import type { Expense, Brand } from '../../types';
import { CATEGORY_CONFIG } from './expenseConfig';

export interface ExpenseFilters {
  searchQuery: string;
  categoryFilter: string;
  brandFilter: string;
  employeeFilter: string;
  paymentStatusFilter: string;
  dateRangePreset: 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'custom';
  customStartDate: string;
  customEndDate: string;
  sortField: 'date' | 'amount';
  sortOrder: 'desc' | 'asc';
}

const inRange = (date: string | null | undefined, preset: string, start: string, end: string) => {
  if (preset === 'all') return true;
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();

  switch (preset) {
    case 'this_month':
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    case 'last_month': {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    }
    case 'this_quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === currentQuarter;
    }
    case 'custom':
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    default:
      return true;
  }
};

/** Applies every active filter, then sorts. */
export function useFilteredExpenses(
  expenses: Expense[],
  brands: Brand[],
  filters: ExpenseFilters
): Expense[] {
  const {
    searchQuery, categoryFilter, brandFilter, employeeFilter, paymentStatusFilter,
    dateRangePreset, customStartDate, customEndDate, sortField, sortOrder,
  } = filters;

  return useMemo(() => {
    return expenses
      .filter((e) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const linked = brands.find((b: any) => b.id === e.brandId);
          const haystack = [
            e.title, e.description, e.note, e.category, e.paymentMode, e.employeeName,
            linked?.name,
          ].filter(Boolean).join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        if (categoryFilter !== 'all') {
          const canonical = CATEGORY_CONFIG[e.category]?.label || e.category;
          if (canonical !== categoryFilter && e.category !== categoryFilter) return false;
        }

        if (brandFilter === 'other') {
          if (e.brandId && e.brandId !== 'other') return false;
        } else if (brandFilter !== 'all' && e.brandId !== brandFilter) {
          return false;
        }

        if (employeeFilter !== 'all') {
          if (!e.employeeName || e.employeeName.trim().toLowerCase() !== employeeFilter.toLowerCase()) {
            return false;
          }
        }

        if (paymentStatusFilter !== 'all') {
          if ((e.paymentStatus || 'Paid') !== paymentStatusFilter) return false;
        }

        return inRange(e.date, dateRangePreset, customStartDate, customEndDate);
      })
      .sort((a, b) => {
        if (sortField === 'amount') {
          const amtA = Number(a.amount) || 0;
          const amtB = Number(b.amount) || 0;
          return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
        }
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [
    expenses, brands, searchQuery, categoryFilter, brandFilter, employeeFilter,
    paymentStatusFilter, dateRangePreset, customStartDate, customEndDate, sortField, sortOrder,
  ]);
}

export interface ExpenseMetrics {
  total: number;
  grossTotal: number;
  paidCount: number;
  count: number;
  thisMonthTotal: number;
  thisMonthCount: number;
  brandExpensesTotal: number;
  brandExpensesCount: number;
  salaryTotal: number;
  salaryCount: number;
  paidSalariesCount: number;
  pendingSalariesCount: number;
  pendingTotal: number;
  pendingCount: number;
  categoryTotals: Record<string, number>;
  brandTotals: Record<string, { total: number; count: number; brandName: string; brand: any; paidTotal: number; pendingTotal: number }>;
  otherBrandTotal: number;
  otherBrandCount: number;
}

/**
 * Aggregates spend across the whole ledger.
 *
 * `total` intentionally counts only PAID expenses so it matches the Dashboard
 * and Finance views; `grossTotal` includes pending for reference.
 */
export function useExpenseMetrics(expenses: Expense[], brands: Brand[]): ExpenseMetrics {
  return useMemo(() => {
    const paid = expenses.filter((e) => (e.paymentStatus || 'Paid') === 'Paid');
    const pending = expenses.filter((e) => e.paymentStatus === 'Pending');
    const sum = (list: Expense[]) => list.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const total = sum(paid);
    const grossTotal = sum(expenses);

    const now = new Date();
    const thisMonth = paid.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const brandExpenses = paid.filter((e) => Boolean(e.brandId) && e.brandId !== 'other');

    const salaryExpenses = expenses.filter(
      (e) => e.category === 'Employee Salaries' || e.category === 'Salary' || Boolean(e.employeeName)
    );
    const paidSalaries = salaryExpenses.filter((e) => (e.paymentStatus || 'Paid') === 'Paid');
    const pendingSalaries = salaryExpenses.filter((e) => e.paymentStatus === 'Pending');

    const categoryTotals: Record<string, number> = {};
    paid.forEach((e) => {
      const key = CATEGORY_CONFIG[e.category]?.label || e.category || 'Other Expenses';
      categoryTotals[key] = (categoryTotals[key] || 0) + (Number(e.amount) || 0);
    });

    const brandTotals: ExpenseMetrics['brandTotals'] = {};
    let otherBrandTotal = 0;
    let otherBrandCount = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      const isPaid = (e.paymentStatus || 'Paid') === 'Paid';

      if (e.brandId && e.brandId !== 'other') {
        const linked = brands.find((b: any) => b.id === e.brandId);
        if (!brandTotals[e.brandId]) {
          brandTotals[e.brandId] = {
            total: 0, count: 0,
            brandName: linked ? linked.name : 'Unknown Brand',
            brand: linked, paidTotal: 0, pendingTotal: 0,
          };
        }
        brandTotals[e.brandId].total += amt;
        brandTotals[e.brandId].count += 1;
        if (isPaid) brandTotals[e.brandId].paidTotal += amt;
        else brandTotals[e.brandId].pendingTotal += amt;
      } else {
        if (isPaid) otherBrandTotal += amt;
        otherBrandCount += 1;
      }
    });

    return {
      total, grossTotal,
      paidCount: paid.length, count: expenses.length,
      thisMonthTotal: sum(thisMonth), thisMonthCount: thisMonth.length,
      brandExpensesTotal: sum(brandExpenses), brandExpensesCount: brandExpenses.length,
      salaryTotal: sum(paidSalaries), salaryCount: salaryExpenses.length,
      paidSalariesCount: paidSalaries.length, pendingSalariesCount: pendingSalaries.length,
      pendingTotal: sum(pending), pendingCount: pending.length,
      categoryTotals, brandTotals, otherBrandTotal, otherBrandCount,
    };
  }, [expenses, brands]);
}
