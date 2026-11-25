import { useState, useMemo, useCallback, useEffect } from 'react';
import type { InvoiceItem, Brand, AppSettings, BankAccount } from '../../types';
import { normalizeBankAccounts } from '../../utils/bankAccounts';

export interface InvoiceTotals {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstType: 'CGST_SGST' | 'IGST' | 'NONE';
  totalAmount: number;
  isInterstate: boolean;
}

const emptyItem = (defaultHsn = '998231'): InvoiceItem => ({
  id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  description: '',
  hsnSac: defaultHsn,
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
 * Owns all invoice-builder state, multi-line items, bank selection, and GST calculation.
 */
export function useInvoiceBuilder(brands: Brand[], settings: AppSettings) {
  const [brandId, setBrandId] = useState('');
  const [dueDate, setDueDate] = useState(getDefaultDueDate);
  const [hasGst, setHasGst] = useState(true);
  const [notes, setNotes] = useState(
    'Thank you for your business. Payment due via online payment link.'
  );
  const [items, setItems] = useState<InvoiceItem[]>(() => [emptyItem(settings.defaultHsnSac || '998231')]);

  const bankAccounts = useMemo(() => normalizeBankAccounts(settings), [settings]);
  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    const def = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    return def?.id || '';
  });

  useEffect(() => {
    if (bankAccounts.length === 0) {
      if (selectedBankId) setSelectedBankId('');
      return;
    }
    if (!bankAccounts.some((b) => b.id === selectedBankId)) {
      const def = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
      setSelectedBankId(def.id);
    }
  }, [bankAccounts, selectedBankId]);

  const selectedBank: BankAccount | null = useMemo(
    () => bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0] || null,
    [bankAccounts, selectedBankId]
  );

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
      const qty = Math.max(1, Number(next[idx].quantity || 1));
      const price = Math.max(0, Number(next[idx].unitPrice || 0));
      next[idx].quantity = qty;
      next[idx].unitPrice = price;
      next[idx].amount = qty * price;
      return next;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem(settings.defaultHsnSac || '998231')]);
  }, [settings.defaultHsnSac]);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
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
    setItems([emptyItem(settings.defaultHsnSac || '998231')]);
    const def = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
    setSelectedBankId(def?.id || '');
  }, [bankAccounts, settings.defaultHsnSac]);

  return {
    brandId, selectBrand,
    dueDate, setDueDate,
    hasGst, setHasGst,
    notes, setNotes,
    items, updateItem, addItem, removeItem,
    bankAccounts, selectedBankId, setSelectedBankId, selectedBank,
    selectedBrand, totals, reset,
  };
}
