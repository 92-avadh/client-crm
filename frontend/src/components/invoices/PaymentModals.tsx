import React from 'react';
import { X, CreditCard } from 'lucide-react';
import type { Invoice, AppSettings } from '../../types';
import { inputFieldStyle, btnPrimary, btnSecondary, modalOverlay, modalCard } from './invoiceStyles';
import { useConfirm } from '../../hooks/useConfirm';
import { AnimatedSelect } from '../ui/AnimatedSelect';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/* ------------------------------------------------------------------ */
/*  Online (Razorpay) payment simulator                                */
/* ------------------------------------------------------------------ */
interface OnlineProps {
  invoice: Invoice | null;
  settings: AppSettings;
  processing: boolean;
  onClose: () => void;
  onPay: (inv: Invoice) => void;
  onSwitchToOffline: () => void;
}

export const RazorpayModal: React.FC<OnlineProps> = ({
  invoice, settings, processing, onClose, onPay, onSwitchToOffline,
}) => {
  if (!invoice) return null;

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 448 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--info-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--solid-btn-text)', fontSize: 12 }}>
              R
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, margin: 0 }}>Razorpay Checkout</h3>
              <div style={{ fontSize: 11, color: 'var(--info-text)' }}>Secured 256-bit encrypted gateway</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Paying to: {settings.companyName}</span>
            <div className="font-amount" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
              {inr(invoice.totalAmount - invoice.paidAmount)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Invoice #{invoice.invoiceNumber} • {invoice.brandName}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button disabled={processing} onClick={() => onPay(invoice)}
              style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--info-text)', color: 'var(--solid-btn-text)', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: processing ? 'not-allowed' : 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard style={{ width: 16, height: 16 }} />
                <span>Pay via UPI / GPay / PhonePe / QR</span>
              </div>
              <span style={{ fontFamily: 'monospace' }}>Instant</span>
            </button>

            <button disabled={processing} onClick={() => onPay(invoice)}
              style={{ width: '100%', padding: 12, borderRadius: 12, background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', cursor: processing ? 'not-allowed' : 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
                <span>Credit / Debit Card (Visa, Mastercard, Rupay)</span>
              </div>
            </button>
          </div>

          {processing && (
            <div style={{ textAlign: 'center', paddingTop: 12, paddingBottom: 12, fontSize: 12, color: 'var(--info-text)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--info-text)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              <span>Verifying payment mandate with bank...</span>
            </div>
          )}

          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <button onClick={onSwitchToOffline} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11 }}>
              Record Offline Payment instead
            </button>
            <span>Razorpay Route Settle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Offline payment recorder                                           */
/* ------------------------------------------------------------------ */
export interface OfflineForm {
  mode: string;
  referenceNo: string;
  date: string;
}

interface OfflineProps {
  invoice: Invoice | null;
  form: OfflineForm;
  onFormChange: (f: OfflineForm) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const OfflinePaymentModal: React.FC<OfflineProps> = ({
  invoice, form, onFormChange, onClose, onSubmit,
}) => {
  const { confirm, element: confirmDialog } = useConfirm();

  const requestClose = async () => {
    if (form.referenceNo?.trim()) {
      const ok = await confirm({
        title: 'Discard this payment entry?',
        description: 'The bank reference you entered has not been saved yet.',
        confirmText: 'Discard',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!invoice) return null;

  return (
    <>
    <div style={modalOverlay} onClick={requestClose}>
      <div style={{ ...modalCard, maxWidth: 448 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, margin: 0 }}>Record Offline Payment</h3>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Manual fallback for Cash, Bank NEFT, or Cheque
            </p>
          </div>
          <button onClick={requestClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
          <AnimatedSelect
            label="Payment Mode"
            value={form.mode}
            onChange={(val) => onFormChange({ ...form, mode: val })}
            options={[
              { value: 'Bank Transfer', label: 'Bank Transfer (NEFT / RTGS / IMPS)' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Cheque', label: 'Cheque' },
            ]}
          />

          <div>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
              Bank Reference # / Cheque No.
            </label>
            <input type="text" required placeholder="e.g. UTR_AXIS_99812401"
              value={form.referenceNo}
              onChange={(e) => onFormChange({ ...form, referenceNo: e.target.value })}
              style={{ ...inputFieldStyle, fontFamily: 'monospace' }} />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Payment Date</label>
            <input type="date" required value={form.date}
              onChange={(e) => onFormChange({ ...form, date: e.target.value })}
              style={inputFieldStyle} />
          </div>

          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={requestClose} style={{ ...btnSecondary, fontSize: 12 }}>Cancel</button>
            <button type="submit" style={{ ...btnPrimary, fontSize: 12 }}>Mark Invoice Paid</button>
          </div>
        </form>
      </div>
    </div>
    {confirmDialog}
    </>
  );
};
