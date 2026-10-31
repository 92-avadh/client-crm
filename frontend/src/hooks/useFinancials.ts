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
    const safePayments = (payments || []).filter(Boolean);
    const safeExpenses = (expenses || []).filter(Boolean);
    const safeBrands = (brands || []).filter(Boolean);

    const churnedOrInactiveBrandIds = new Set(
      safeBrands.filter(b => b.status === 'Churned' || b.status === 'Inactive').map(b => b.id)
    );

    const totalReceived = safePayments
      .filter(p => {
        if (!p || p?.status !== 'Success') return false;
        if (p.brandId && churnedOrInactiveBrandIds.has(p.brandId) && (p.referenceNo || '').startsWith('RET-')) return false;
        return true;
      })
      .reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);

    const totalExpenses = safeExpenses
      .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

    const netProfit = totalReceived - totalExpenses;

    const pendingBrandFees = safeBrands
      .filter(b => b && b.status === 'Active' && b.paymentStatus !== 'Paid')
      .reduce((sum, b) => sum + (Number(b?.monthlyFee) || 0), 0);

    const unrecordedBrandFees = safeBrands
      .filter(b => b && b.status === 'Active' && !b.lastPaymentDate)
      .reduce((sum, b) => sum + (Number(b?.monthlyFee) || 0), 0);

    return { totalReceived, totalExpenses, netProfit, pendingBrandFees, unrecordedBrandFees };
  }, [payments, expenses, brands]);
}
