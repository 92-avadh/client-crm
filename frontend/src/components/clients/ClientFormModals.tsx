import React from 'react';
import { X, Plus, Loader2, Save } from 'lucide-react';
import { FormField, FormSelect, FieldRow, ErrorBanner, type FieldErrors } from './clientFormUi';
import { useConfirm } from '../../hooks/useConfirm';
import { isDirty } from '../../hooks/isDirty';

export interface ClientFormData {
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  billingAddress: string;
  state: string;
  pincode: string;
  gstNumber: string;
  pan: string;
  serviceDetails: string;
  monthlyFee: string;
  billingCycleDay: number;
  paymentStatus: 'Paid' | 'Pending';
  status?: string;
  notes?: string;
}

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Churned', label: 'Churned' },
];

const PAYMENT_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
];

const modalShell: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 18, width: '100%',
  maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
};

const footerStyle: React.CSSProperties = {
  padding: '16px 24px', borderTop: '1px solid var(--border)',
  display: 'flex', justifyContent: 'flex-end', gap: 12,
  background: 'var(--bg-subtle)', flexShrink: 0,
};

/* ------------------------------------------------------------------ */
/*  Onboard new client                                                 */
/* ------------------------------------------------------------------ */
interface OnboardProps {
  open: boolean;
  formData: ClientFormData;
  onFormChange: (patch: Partial<ClientFormData>) => void;
  errors: FieldErrors;
  submitError: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const OnboardClientModal: React.FC<OnboardProps> = ({
  open, formData, onFormChange, errors, submitError, submitting, onClose, onSubmit,
}) => {
  const { confirm, element: confirmDialog } = useConfirm();
  const baseline = React.useRef<ClientFormData | null>(null);

  // Capture the pristine form the first time this modal opens, so we can tell
  // whether the user has actually typed anything worth protecting.
  React.useEffect(() => {
    if (open) baseline.current = formData;
    else baseline.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const requestClose = async () => {
    if (submitting) return;
    if (baseline.current && isDirty(formData as any, baseline.current as any)) {
      const ok = await confirm({
        title: 'Discard this new client?',
        description: 'The details you entered have not been saved yet.',
        confirmText: 'Discard',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
    <div className="modal-overlay" onClick={() => requestClose()}>
      <div style={{ ...modalShell, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Onboard New Client</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Add a client with GST details, retainer amount and billing cycle.
            </p>
          </div>
          <button onClick={onClose} disabled={submitting}
            style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
            <ErrorBanner message={submitError} />

            <FieldRow>
              <FormField label="Client Name" required value={formData.name} error={errors.name}
                placeholder="e.g. Apex Media Pvt Ltd" onChange={(v) => onFormChange({ name: v })} />
              <FormField label="Contact Person (Owner)" required value={formData.ownerName} error={errors.ownerName}
                placeholder="e.g. Vikram Seth" onChange={(v) => onFormChange({ ownerName: v })} />
            </FieldRow>

            <FieldRow>
              <FormField label="Mobile Number" required value={formData.mobile} error={errors.mobile}
                type="tel" placeholder="e.g. +91 99880 11223" onChange={(v) => onFormChange({ mobile: v })} />
              <FormField label="Email Address" required value={formData.email} error={errors.email}
                type="email" placeholder="e.g. accounts@apexmedia.in" onChange={(v) => onFormChange({ email: v })} />
            </FieldRow>

            <FormField label="Billing Address" required value={formData.billingAddress} error={errors.billingAddress}
              placeholder="Street, area, city" onChange={(v) => onFormChange({ billingAddress: v })} />

            <FieldRow>
              <FormField label="State" required value={formData.state} error={errors.state}
                placeholder="e.g. Gujarat" onChange={(v) => onFormChange({ state: v })} />
              <FormField label="Pincode" required value={formData.pincode} error={errors.pincode}
                placeholder="e.g. 395006" onChange={(v) => onFormChange({ pincode: v })} />
            </FieldRow>

            <FieldRow>
              <FormField label="GSTIN" value={formData.gstNumber} error={errors.gstNumber} mono
                placeholder="24AAAAA0000A1Z5" onChange={(v) => onFormChange({ gstNumber: v.toUpperCase() })} />
              <FormField label="PAN" value={formData.pan} error={errors.pan} mono
                placeholder="AAAAA0000A" onChange={(v) => onFormChange({ pan: v.toUpperCase() })} />
            </FieldRow>

            <FormField label="Service Details" required value={formData.serviceDetails} error={errors.serviceDetails}
              placeholder="e.g. Social media management, performance marketing"
              onChange={(v) => onFormChange({ serviceDetails: v })} />

            <FieldRow>
              <FormField label="Monthly Retainer (₹)" required value={formData.monthlyFee} error={errors.monthlyFee}
                type="number" placeholder="e.g. 100000" onChange={(v) => onFormChange({ monthlyFee: v })} />
              <FormField label="Billing Cycle Day" value={formData.billingCycleDay}
                type="number" placeholder="1-31" onChange={(v) => onFormChange({ billingCycleDay: Number(v) })} />
            </FieldRow>

            <FormSelect label="Initial Payment Status" value={formData.paymentStatus}
              options={PAYMENT_OPTIONS} onChange={(v) => onFormChange({ paymentStatus: v as any })} />
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={requestClose} disabled={submitting}
              style={{ padding: '9px 18px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '9px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {submitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Plus style={{ width: 14, height: 14 }} />}
              <span>{submitting ? 'Creating Profile...' : 'Create Client Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    {confirmDialog}
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Edit existing client                                               */
/* ------------------------------------------------------------------ */
interface EditProps extends OnboardProps {
  title?: string;
}

export const EditClientModal: React.FC<EditProps> = ({
  open, formData, onFormChange, errors, submitError, submitting, onClose, onSubmit,
}) => {
  const { confirm, element: confirmDialog } = useConfirm();
  const baseline = React.useRef<ClientFormData | null>(null);

  // Snapshot the loaded client when the modal opens; anything diverging from
  // this counts as an unsaved edit worth confirming.
  React.useEffect(() => {
    if (open) baseline.current = formData;
    else baseline.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const requestClose = async () => {
    if (submitting) return;
    if (baseline.current && isDirty(formData as any, baseline.current as any)) {
      const ok = await confirm({
        title: 'Discard unsaved changes?',
        description: 'Your edits to this client will be lost.',
        confirmText: 'Discard Changes',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
    <div className="modal-overlay" onClick={() => requestClose()}>
      <div style={{ ...modalShell, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Edit Client</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Update client details, account status and payment state.
            </p>
          </div>
          <button onClick={requestClose} disabled={submitting}
            style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
            <ErrorBanner message={submitError} />

            <FieldRow>
              <FormField label="Client Name" required value={formData.name} error={errors.name}
                onChange={(v) => onFormChange({ name: v })} />
              <FormField label="Contact Person (Owner)" required value={formData.ownerName} error={errors.ownerName}
                onChange={(v) => onFormChange({ ownerName: v })} />
            </FieldRow>

            <FieldRow>
              <FormField label="Mobile Number" required value={formData.mobile} error={errors.mobile}
                type="tel" onChange={(v) => onFormChange({ mobile: v })} />
              <FormField label="Email Address" required value={formData.email} error={errors.email}
                type="email" onChange={(v) => onFormChange({ email: v })} />
            </FieldRow>

            <FormField label="Billing Address" value={formData.billingAddress} error={errors.billingAddress}
              onChange={(v) => onFormChange({ billingAddress: v })} />

            <FieldRow>
              <FormField label="State" value={formData.state} error={errors.state}
                onChange={(v) => onFormChange({ state: v })} />
              <FormField label="Pincode" value={formData.pincode} error={errors.pincode}
                onChange={(v) => onFormChange({ pincode: v })} />
            </FieldRow>

            <FieldRow>
              <FormField label="GSTIN" value={formData.gstNumber} mono
                onChange={(v) => onFormChange({ gstNumber: v.toUpperCase() })} />
              <FormField label="PAN" value={formData.pan} mono
                onChange={(v) => onFormChange({ pan: v.toUpperCase() })} />
            </FieldRow>

            <FormField label="Service Details" value={formData.serviceDetails}
              onChange={(v) => onFormChange({ serviceDetails: v })} />

            <FieldRow>
              <FormField label="Monthly Retainer (₹)" value={formData.monthlyFee}
                type="number" onChange={(v) => onFormChange({ monthlyFee: v })} />
              <FormField label="Billing Cycle Day" value={formData.billingCycleDay}
                type="number" onChange={(v) => onFormChange({ billingCycleDay: Number(v) })} />
            </FieldRow>

            <FormField label="Internal Notes" value={formData.notes || ''}
              onChange={(v) => onFormChange({ notes: v })} />

            <FieldRow>
              <FormSelect label="Account Status" value={formData.status || 'Active'}
                options={STATUS_OPTIONS} onChange={(v) => onFormChange({ status: v })} />
              <FormSelect label="Payment Status" value={formData.paymentStatus}
                options={PAYMENT_OPTIONS} onChange={(v) => onFormChange({ paymentStatus: v as any })} />
            </FieldRow>
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={requestClose} disabled={submitting}
              style={{ padding: '9px 18px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '9px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {submitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    {confirmDialog}
    </>
  );
};
