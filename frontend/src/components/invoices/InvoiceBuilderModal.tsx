import React from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Brand, InvoiceItem } from '../../types';
import { inputFieldStyle, btnPrimary, btnSecondary, modalOverlay, modalCard, modalHeader } from './invoiceStyles';
import type { InvoiceTotals } from './useInvoiceBuilder';
import { AnimatedSelect } from '../ui/AnimatedSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  brands: Brand[];
  brandId: string;
  onSelectBrand: (id: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  items: InvoiceItem[];
  onUpdateItem: (idx: number, patch: Partial<InvoiceItem>) => void;
  hasGst: boolean;
  onHasGstChange: (v: boolean) => void;
  isRecurring: boolean;
  onIsRecurringChange: (v: boolean) => void;
  selectedBrand?: Brand;
  totals: InvoiceTotals;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** One-click GST invoice generator modal. */
export const InvoiceBuilderModal: React.FC<Props> = ({
  open, onClose, onSubmit, brands, brandId, onSelectBrand,
  dueDate, onDueDateChange, items, onUpdateItem,
  hasGst, onHasGstChange, isRecurring, onIsRecurringChange,
  selectedBrand, totals,
}) => {
  if (!open) return null;

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
                value={brandId}
                onChange={onSelectBrand}
                options={brands.map((b) => ({
                  value: b.id,
                  label: `${b.name} (₹${b.monthlyFee.toLocaleString('en-IN')}/mo)`,
                }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Due Date *</label>
              <input type="date" required value={dueDate} onChange={(e) => onDueDateChange(e.target.value)} style={inputFieldStyle} />
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
                  {totals.isInterstate ? 'Interstate (IGST 18%)' : 'Intrastate (CGST 9% + SGST 9%)'}
                </div>
              </div>
            </div>
          )}

          {/* Line items */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Invoice Line Items</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, idx) => (
                <div key={item.id} className="rg-inv"
                  style={{ padding: 12, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '6fr 2fr 4fr', gap: 8, alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Service Description</label>
                    <input type="text" value={item.description}
                      onChange={(e) => onUpdateItem(idx, { description: e.target.value })}
                      style={{ ...inputFieldStyle, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>SAC Code</label>
                    <input type="text" value={item.hsnSac}
                      onChange={(e) => onUpdateItem(idx, { hsnSac: e.target.value })}
                      style={{ ...inputFieldStyle, fontFamily: 'monospace', marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Amount (INR)</label>
                    <input type="number" value={item.unitPrice}
                      onChange={(e) => onUpdateItem(idx, { unitPrice: Number(e.target.value) })}
                      className="font-amount" style={{ ...inputFieldStyle, fontWeight: 700, marginTop: 4 }} />
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
                <span>Apply Indian GST (18%) to this invoice</span>
              </label>
              <span className="font-amount" style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                Subtotal: <strong style={{ color: 'var(--text-primary)' }}>{inr(totals.subtotal)}</strong>
              </span>
            </div>

            {hasGst && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
                {totals.isInterstate ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IGST (18%):</span>
                    <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inr(totals.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST (9%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inr(totals.cgst)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST (9%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inr(totals.sgst)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total Payable Amount:</span>
              <span className="font-amount" style={{ color: 'var(--accent-text)', fontSize: 17, fontWeight: 850 }}>{inr(totals.totalAmount)}</span>
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

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onClose} style={{ ...btnSecondary, fontSize: 12 }}>Cancel</button>
            <button type="submit" style={{ ...btnPrimary, fontSize: 12 }}>Generate &amp; Send Invoice</button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default InvoiceBuilderModal;
