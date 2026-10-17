import { useState, useMemo, useCallback } from 'react';
import type { InvoiceItem, Brand, AppSettings } from '../../types';

export interface InvoiceTotals {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstType: 'CGST_SGST' | 'IGST' | 'NONE';
  totalAmount: number;
  isInterstate: boolean;
}

const emptyItem = (): InvoiceItem => ({
  id: 'item_' + Date.now(),
  description: '',
  hsnSac: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

const getDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

/**
 * Owns all invoice-builder state and the GST calculation.
 *
 * Extracted from InvoicesManager so the calculation rules live in one place
 * and the modal component stays presentational.
 */
export function useInvoiceBuilder(brands: Brand[], settings: AppSettings) {
  const [brandId, setBrandId] = useState('');
  const [dueDate, setDueDate] = useState(getDefaultDueDate);
  const [hasGst, setHasGst] = useState(true);
  const [notes, setNotes] = useState(
    'Thank you for your business. Payment due via online payment link.'
  );
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);

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
        hsnSac: settings.defaultHsnSac || '998231',
        quantity: 1,
        unitPrice: b.monthlyFee,
        amount: b.monthlyFee,
      }]);
    }
  }, [brands, settings.defaultHsnSac]);

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
    const gstRate = typeof settings.defaultGstRate === 'number' && settings.defaultGstRate >= 0
      ? settings.defaultGstRate / 100
      : 0.18;

    let cgst = 0, sgst = 0, igst = 0;
    let gstType: InvoiceTotals['gstType'] = 'NONE';

    if (hasGst) {
      if (isInterstate) {
        gstType = 'IGST';
        igst = Math.round(subtotal * gstRate);
      } else {
        gstType = 'CGST_SGST';
        cgst = Math.round(subtotal * (gstRate / 2));
        sgst = Math.round(subtotal * (gstRate / 2));
      }
    }

    return {
      subtotal, cgst, sgst, igst, gstType, isInterstate,
      totalAmount: subtotal + cgst + sgst + igst,
    };
  }, [items, hasGst, selectedBrand, settings.companyState, settings.defaultGstRate]);

  const reset = useCallback(() => {
    setBrandId('');
    setDueDate(getDefaultDueDate());
    setHasGst(true);
    setNotes('Thank you for your business. Payment due via online payment link.');
    setItems([emptyItem()]);
  }, []);

  return {
    brandId, selectBrand,
    dueDate, setDueDate,
    hasGst, setHasGst,
    notes, setNotes,
    items, updateItem,
    selectedBrand, totals, reset,
  };
}
