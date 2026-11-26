import React, { useState } from 'react';
import { X, Sparkles, Loader2, Send, FileText, Plus, Trash2, Landmark, QrCode, Upload, Check, AlertCircle } from 'lucide-react';
import type { Brand, InvoiceItem, BankAccount } from '../../types';
import { inputFieldStyle, btnPrimary, btnSecondary, modalOverlay, modalCard, modalHeader } from './invoiceStyles';
import type { InvoiceTotals } from './useInvoiceBuilder';
import { AnimatedSelect } from '../ui/AnimatedSelect';
import { DatePicker } from '../ui/DatePicker';
import { useApp } from '../../context/AppContext';
import { validateImageFile } from '../../utils/fileValidation';
import { MAX_BANK_ACCOUNTS } from '../../utils/bankAccounts';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent, options?: { send?: boolean }) => void;
  submitting?: boolean;
  brands: Brand[];
  brandId: string;
  onSelectBrand: (id: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  items: InvoiceItem[];
  onUpdateItem: (idx: number, patch: Partial<InvoiceItem>) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  bankAccounts: BankAccount[];
  selectedBankId: string;
  onSelectBankId: (id: string) => void;
  hasGst: boolean;
  onHasGstChange: (v: boolean) => void;
  isRecurring: boolean;
  onIsRecurringChange: (v: boolean) => void;
  selectedBrand?: Brand;
  totals: InvoiceTotals;
}

const EMPTY_DRAFT_BANK = (): Omit<BankAccount, 'id' | 'isDefault'> => ({
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankBranch: '',
  upiId: '',
  qrCodeUrl: '',
});

/** One-click GST invoice generator modal with 2-bank & QR inline management and multi-line items. */
export const InvoiceBuilderModal: React.FC<Props> = ({
  open, onClose, onSubmit, submitting = false, brands, brandId, onSelectBrand,
  dueDate, onDueDateChange, items, onUpdateItem, onAddItem, onRemoveItem,
  bankAccounts, selectedBankId, onSelectBankId,
  hasGst, onHasGstChange, isRecurring, onIsRecurringChange,
  selectedBrand, totals,
}) => {
  const { settings, updateSettings, currencySymbol = '₹', showToast } = useApp();
  const activeBrands = React.useMemo(
    () => (brands || []).filter((b) => b && b.status === 'Active'),
    [brands]
  );
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [draftBank, setDraftBank] = useState(EMPTY_DRAFT_BANK);
  const [savingBank, setSavingBank] = useState(false);
  const [bankFormError, setBankFormError] = useState('');

  const formatAmt = (n: number) => `${currencySymbol}${Number(n || 0).toLocaleString()}`;
  const effectiveGstRate = typeof settings.defaultGstRate === 'number' && settings.defaultGstRate >= 0 ? settings.defaultGstRate : 18;
  const halfGstRate = (effectiveGstRate / 2).toFixed(1).replace(/\.0$/, '');
  if (!open) return null;

  const handleQrFileChange = (file?: File) => {
    if (!file) return;
    setBankFormError('');
    const validation = validateImageFile(file, { maxSizeMB: 3, allowSvg: true });
    if (!validation.valid) {
      setBankFormError(validation.error || 'Invalid QR image file');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setBankFormError('Could not read QR image.');
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setDraftBank((prev) => ({ ...prev, qrCodeUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInlineBank = async () => {
    setBankFormError('');
    if (!draftBank.bankName.trim() && !draftBank.bankAccountNumber.trim() && !draftBank.upiId.trim()) {
      setBankFormError('Please enter at least a Bank Name & Account Number, or a UPI ID.');
      return;
    }
    if (bankAccounts.length >= MAX_BANK_ACCOUNTS) {
      setBankFormError('Maximum 2 bank accounts allowed.');
      return;
    }
    setSavingBank(true);
    try {
      const newId = bankAccounts.some((b) => b.id === 'bank_1') ? 'bank_2' : 'bank_1';
      const newEntry: BankAccount = {
        id: newId,
        bankName: draftBank.bankName.trim(),
        bankAccountName: draftBank.bankAccountName.trim(),
        bankAccountNumber: draftBank.bankAccountNumber.trim(),
        bankIfsc: draftBank.bankIfsc.trim().toUpperCase(),
        bankBranch: draftBank.bankBranch.trim(),
        upiId: draftBank.upiId.trim(),
        qrCodeUrl: draftBank.qrCodeUrl || '',
        isDefault: bankAccounts.length === 0,
      };
      const nextAccounts = [...bankAccounts, newEntry].slice(0, MAX_BANK_ACCOUNTS);
      const primary = nextAccounts.find((b) => b.isDefault) || nextAccounts[0];
      await updateSettings({
        bankAccounts: nextAccounts,
        bankName: primary?.bankName || '',
        bankAccountName: primary?.bankAccountName || '',
        bankAccountNumber: primary?.bankAccountNumber || '',
        bankIfsc: primary?.bankIfsc || '',
        bankBranch: primary?.bankBranch || '',
        upiId: primary?.upiId || '',
      });
      onSelectBankId(newId);
      setDraftBank(EMPTY_DRAFT_BANK());
      setShowAddBankForm(false);
      showToast('Bank account & QR saved for invoices!', 'success');
    } catch (err: any) {
      setBankFormError(err?.message || 'Failed to save bank account');
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <>
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 768 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Sparkles style={{ width: 20, height: 20, color: 'var(--accent-text)' }} />
              <span>One-Click GST Invoice Generator</span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
              Select a client: address, GSTIN, and monthly fee will auto-fill instantly!
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto', fontSize: 12 }}>
          {/* Client auto-fill + due date */}
          <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <AnimatedSelect
                label="Select Client (1-Click Pre-fill)"
                required
                searchable
                searchPlaceholder="Search active client by name..."
                value={brandId}
                onChange={onSelectBrand}
                placeholder={activeBrands.length === 0 ? 'No active clients available' : 'Select an active client'}
                options={activeBrands.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${currencySymbol}${(b.monthlyFee || 0).toLocaleString('en-IN')}/mo)`,
                }))}
              />
            </div>
            <div>
              <DatePicker
                label="Due Date"
                required
                value={dueDate}
                onChange={onDueDateChange}
                placeholder="Select due date"
              />
            </div>
          </div>

          {/* Pre-filled client preview */}
          {selectedBrand && (
            <div className="rg-3" style={{ padding: 14, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' as const }}>Billing State</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>{selectedBrand.state}</div>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' as const }}>GSTIN</span>
                <div style={{ color: 'var(--accent-text)', fontFamily: 'monospace', fontWeight: 600, marginTop: 2 }}>
                  {selectedBrand.gstNumber || 'Unregistered'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' as const }}>Tax Mechanism</span>
                <div style={{ color: 'var(--success-text)', fontWeight: 600, marginTop: 2 }}>
                  {totals.isInterstate ? `Interstate (IGST ${effectiveGstRate}%)` : `Intrastate (CGST ${halfGstRate}% + SGST ${halfGstRate}%)`}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Bank Details & UPI QR Box (Max 2 Accounts) */}
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Landmark style={{ width: 15, height: 15, color: 'var(--accent-text)' }} />
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 12.5 }}>
                  Bank Details &amp; UPI QR on Invoice
                </span>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {bankAccounts.length} / {MAX_BANK_ACCOUNTS} Accounts
              </span>
            </div>

            <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {bankAccounts.map((acc, idx) => {
                const isSelected = selectedBankId === acc.id || (!selectedBankId && idx === 0);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => onSelectBankId(acc.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: isSelected ? '1.5px solid var(--accent-text, #2563eb)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--info-bg, rgba(37,99,235,0.08))' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.bankName || `Bank Account ${idx + 1}`}
                        </span>
                        {isSelected && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 999, background: 'var(--accent-text, #2563eb)', color: '#ffffff' }}>
                            <Check size={9} /> Selected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 3 }}>
                        {acc.bankAccountNumber ? `A/C: ${acc.bankAccountNumber}` : 'No A/C #'}
                      </div>
                      {acc.upiId && (
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          UPI: {acc.upiId}
                        </div>
                      )}
                    </div>

                    <div style={{ width: 40, height: 40, borderRadius: 6, background: '#ffffff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {acc.qrCodeUrl ? (
                        <img src={acc.qrCodeUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <QrCode size={18} style={{ color: acc.upiId ? '#2563eb' : '#94a3b8' }} />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Pending Slot Card: allows adding Bank 1 or pending Bank 2 directly in this box */}
              {bankAccounts.length < MAX_BANK_ACCOUNTS && !showAddBankForm && (
                <button
                  type="button"
                  onClick={() => {
                    setBankFormError('');
                    setDraftBank(EMPTY_DRAFT_BANK());
                    setShowAddBankForm(true);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px dashed var(--border-strong, var(--border))',
                    background: 'var(--bg-card)',
                    color: 'var(--accent-text, #2563eb)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    minHeight: 62,
                  }}
                >
                  <Plus size={15} />
                  <span>
                    {bankAccounts.length === 0
                      ? 'Add Bank Account & UPI QR (1/2)'
                      : 'Add 2nd Bank Account & QR (Pending)'}
                  </span>
                </button>
              )}
            </div>

            {/* Inline Quick-Add Bank + QR Form */}
            {showAddBankForm && bankAccounts.length < MAX_BANK_ACCOUNTS && (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--accent-border, var(--border))', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Add Bank Account {bankAccounts.length + 1} of {MAX_BANK_ACCOUNTS}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddBankForm(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                  <input type="text" placeholder="Bank Name (e.g. HDFC Bank)" value={draftBank.bankName}
                    onChange={(e) => setDraftBank(p => ({ ...p, bankName: e.target.value }))} style={inputFieldStyle} />
                  <input type="text" placeholder="Beneficiary / A/C Name" value={draftBank.bankAccountName}
                    onChange={(e) => setDraftBank(p => ({ ...p, bankAccountName: e.target.value }))} style={inputFieldStyle} />
                  <input type="text" placeholder="Account Number" value={draftBank.bankAccountNumber}
                    onChange={(e) => setDraftBank(p => ({ ...p, bankAccountNumber: e.target.value }))} style={{ ...inputFieldStyle, fontFamily: 'monospace' }} />
                  <input type="text" placeholder="IFSC Code (e.g. HDFC0001234)" value={draftBank.bankIfsc} maxLength={11}
                    onChange={(e) => setDraftBank(p => ({ ...p, bankIfsc: e.target.value.toUpperCase() }))} style={{ ...inputFieldStyle, fontFamily: 'monospace' }} />
                  <input type="text" placeholder="Branch Location" value={draftBank.bankBranch}
                    onChange={(e) => setDraftBank(p => ({ ...p, bankBranch: e.target.value }))} style={inputFieldStyle} />
                  <input type="text" placeholder="UPI ID (e.g. agency@okhdfcbank)" value={draftBank.upiId}
                    onChange={(e) => setDraftBank(p => ({ ...p, upiId: e.target.value }))} style={{ ...inputFieldStyle, fontFamily: 'monospace' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {draftBank.qrCodeUrl && (
                      <img src={draftBank.qrCodeUrl} alt="QR Preview" style={{ width: 40, height: 40, borderRadius: 6, border: '1px solid var(--border)', background: '#fff', objectFit: 'contain' }} />
                    )}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                      <Upload size={13} />
                      <span>{draftBank.qrCodeUrl ? 'Change UPI QR Image' : 'Upload UPI QR Image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          handleQrFileChange(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveInlineBank}
                    disabled={savingBank}
                    style={{ ...btnPrimary, fontSize: 11.5, padding: '7px 14px', opacity: savingBank ? 0.7 : 1 }}
                  >
                    {savingBank ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>{savingBank ? 'Saving...' : 'Save & Select Account'}</span>
                  </button>
                </div>

                {bankFormError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--danger-text)' }}>
                    <AlertCircle size={13} />
                    <span>{bankFormError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multi-Line Items */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Invoice Line Items ({items.length})
              </label>
              <button
                type="button"
                onClick={onAddItem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent-text)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                <span>Add Line Item</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, idx) => (
                <div key={item.id} className="rg-inv"
                  style={{ padding: 12, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'minmax(160px, 5fr) minmax(80px, 2fr) minmax(65px, 1.4fr) minmax(100px, 2.5fr) auto', gap: 8, alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Service Description</label>
                    <input type="text" value={item.description} placeholder="e.g. Monthly Retainer"
                      onChange={(e) => onUpdateItem(idx, { description: e.target.value })}
                      style={{ ...inputFieldStyle, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>SAC / HSN</label>
                    <input type="text" value={item.hsnSac} placeholder="998231"
                      onChange={(e) => onUpdateItem(idx, { hsnSac: e.target.value })}
                      style={{ ...inputFieldStyle, fontFamily: 'monospace', marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Qty</label>
                    <input type="number" min={1} value={item.quantity}
                      onChange={(e) => onUpdateItem(idx, { quantity: Math.max(1, Number(e.target.value || 1)) })}
                      className="font-amount" style={{ ...inputFieldStyle, fontWeight: 700, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rate ({currencySymbol})</label>
                    <input type="number" min={0} value={item.unitPrice}
                      onChange={(e) => onUpdateItem(idx, { unitPrice: Math.max(0, Number(e.target.value || 0)) })}
                      className="font-amount" style={{ ...inputFieldStyle, fontWeight: 700, marginTop: 4 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="font-amount" style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatAmt(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      disabled={items.length <= 1}
                      title={items.length <= 1 ? 'At least 1 item required' : 'Remove item'}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: items.length <= 1 ? 'var(--text-muted)' : 'var(--danger-text)',
                        cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                        opacity: items.length <= 1 ? 0.45 : 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GST toggle + totals */}
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={hasGst} onChange={(e) => onHasGstChange(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-text)' }} />
                <span>Apply GST ({effectiveGstRate}%) to this invoice</span>
              </label>
              <span className="font-amount" style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                Subtotal: <strong style={{ color: 'var(--text-primary)' }}>{formatAmt(totals.subtotal)}</strong>
              </span>
            </div>

            {hasGst && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
                {totals.isInterstate ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IGST ({effectiveGstRate}%):</span>
                    <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatAmt(totals.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST ({halfGstRate}%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatAmt(totals.cgst)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST ({halfGstRate}%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatAmt(totals.sgst)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total Payable Amount:</span>
              <span className="font-amount" style={{ color: 'var(--accent-text)', fontSize: 17, fontWeight: 850 }}>{formatAmt(totals.totalAmount)}</span>
            </div>
          </div>

          {/* Recurring toggle */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: isRecurring ? 'var(--info-bg)' : 'var(--bg-subtle)', border: isRecurring ? '1px solid var(--accent-border)' : '1px solid var(--border)', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recurring Invoice</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, maxWidth: 340 }}>
                Auto-generate this invoice every month on the billing cycle date
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, cursor: 'pointer', marginTop: 2 }}>
              <input type="checkbox" checked={isRecurring} onChange={(e) => onIsRecurringChange(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, background: isRecurring ? 'var(--accent-text)' : 'var(--border)' }} />
              <span style={{ position: 'absolute', top: 3, left: isRecurring ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </label>
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ ...btnSecondary, fontSize: 13, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              id="btn-generate-only-invoice"
              onClick={(e) => onSubmit(e, { send: false })}
              style={{
                ...btnSecondary,
                fontSize: 13,
                padding: '9px 18px',
                fontWeight: 700,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-strong, var(--border))',
                color: 'var(--text-primary)',
              }}
              title="Save &amp; Generate invoice without sending to client"
            >
              <FileText style={{ width: 14, height: 14 }} />
              <span>Generate Invoice</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              id="btn-generate-send-invoice"
              onClick={(e) => onSubmit(e, { send: true })}
              style={{
                ...btnPrimary,
                fontSize: 13,
                padding: '9px 20px',
                fontWeight: 700,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                zIndex: 5,
              }}
              title="Generate and send invoice directly to client"
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send style={{ width: 14, height: 14 }} />
                  <span>Generate &amp; Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default InvoiceBuilderModal;
