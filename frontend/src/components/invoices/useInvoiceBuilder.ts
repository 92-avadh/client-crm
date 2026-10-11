import { useState, useMemo, useCallback } from 'react';
import type { InvoiceItem, Brand, AppSettings } from '../../types';

const GST_RATE = 0.18;

export interface InvoiceTotals {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstType: 'CGST_SGST' | 'IGST' | 'NONE';
  totalAmount: number;
  isInterstate: boolean;
}

const initialItem = (brand?: Brand): InvoiceItem => ({
  id: 'item_init',
  description: 'Monthly Retainer & Compliance Advisory (October 2026)',
  hsnSac: '998231',
  quantity: 1,
  unitPrice: brand?.monthlyFee || 100000,
  amount: brand?.monthlyFee || 100000,
});

/**
 * Owns all invoice-builder state and the GST calculation.
 *
 * Extracted from InvoicesManager so the calculation rules live in one place
 * and the modal component stays presentational.
 */
export function useInvoiceBuilder(brands: Brand[], settings: AppSettings) {
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [dueDate, setDueDate] = useState('2026-10-18');
  const [hasGst, setHasGst] = useState(true);
  const [notes, setNotes] = useState(
    'Thank you for your business. Payment due via Razorpay online link.'
  );
  const [items, setItems] = useState<InvoiceItem[]>(() => [initialItem(brands[0])]);

  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === brandId),
    [brands, brandId]
  );

  /** Selecting a client pre-fills its service details and monthly fee. */
  const selectBrand = useCallback((id: string) => {
    setBrandId(id);
    const b = brands.find((x) => x.id === id);
    if (b) {
      setItems([{
        id: 'item_' + Date.now(),
        description: `${b.serviceDetails} (Current Month)`,
        hsnSac: '998231',
        quantity: 1,
        unitPrice: b.monthlyFee,
        amount: b.monthlyFee,
      }]);
    }
  }, [brands]);

  const updateItem = useCallback((idx: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      // Keep amount in sync with quantity × unit price.
      next[idx].amount = next[idx].quantity * next[idx].unitPrice;
      return next;
    });
  }, []);

  /** GST: IGST for inter-state supply, CGST+SGST for intra-state. */
  const totals: InvoiceTotals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
    const isInterstate = selectedBrand?.state !== settings.companyState;

    let cgst = 0, sgst = 0, igst = 0;
    let gstType: InvoiceTotals['gstType'] = 'NONE';

    if (hasGst) {
      if (isInterstate) {
        gstType = 'IGST';
        igst = Math.round(subtotal * GST_RATE);
      } else {
        gstType = 'CGST_SGST';
        cgst = Math.round(subtotal * (GST_RATE / 2));
        sgst = Math.round(subtotal * (GST_RATE / 2));
      }
    }

    return {
      subtotal, cgst, sgst, igst, gstType, isInterstate,
      totalAmount: subtotal + cgst + sgst + igst,
    };
  }, [items, hasGst, selectedBrand, settings.companyState]);

  const reset = useCallback(() => {
    setHasGst(true);
    setNotes('Thank you for your business. Payment due via Razorpay online link.');
    setItems([initialItem(brands[0])]);
  }, [brands]);

  return {
    brandId, selectBrand,
    dueDate, setDueDate,
    hasGst, setHasGst,
    notes, setNotes,
    items, updateItem,
    selectedBrand, totals, reset,
  };
}
