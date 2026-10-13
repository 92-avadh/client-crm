import { useMemo } from 'react';
import type { Payment, Expense, Brand } from '../types';

export interface Financials {
  totalReceived: number;
  totalExpenses: number;
  netProfit: number;
  pendingBrandFees: number;
  unrecordedBrandFees: number;
}

export function useFinancials(payments: Payment[], expenses: Expense[], brands: Brand[]): Financials {
  return useMemo(() => {
    const totalReceived = payments
      .filter(p => p.status === 'Success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalExpenses = expenses
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const netProfit = totalReceived - totalExpenses;

    const pendingBrandFees = brands
      .filter(b => b.paymentStatus !== 'Paid')
      .reduce((sum, b) => sum + (b.monthlyFee || 0), 0);

    const unrecordedBrandFees = brands
      .filter(b => !b.lastPaymentDate)
      .reduce((sum, b) => sum + (b.monthlyFee || 0), 0);

    return { totalReceived, totalExpenses, netProfit, pendingBrandFees, unrecordedBrandFees };
  }, [payments, expenses, brands]);
}
