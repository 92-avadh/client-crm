import React from 'react';
import { Save } from 'lucide-react';
import type { AppSettings } from '../../types';
import { fieldStyle, saveBtnStyle, fieldGridStyle, tabBodyStyle, TabHeader } from './settingsUi';

interface Props {
  formData: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onSave: (e: React.FormEvent) => void;
}

const Field: React.FC<{
  label: string; value: string | number; type?: string;
  mono?: boolean; onChange: (v: string) => void;
}> = ({ label, value, type = 'text', mono, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      style={mono ? { ...fieldStyle, fontFamily: 'monospace' } : fieldStyle} />
  </div>
);

/** Agency profile & business details (admin). */
export const CompanyTab: React.FC<Props> = ({ formData, onChange, onSave }) => (
  <form onSubmit={onSave} style={tabBodyStyle}>
    <TabHeader
      title="Agency Profile & Business Details"
      subtitle="Business entity credentials printed on formal invoices, proposals, and client contracts."
    />
    <div style={fieldGridStyle}>
      <Field label="Agency Legal Name" value={formData.companyName} onChange={(v) => onChange({ companyName: v })} />
      <Field label="Official Support Email" type="email" value={formData.companyEmail} onChange={(v) => onChange({ companyEmail: v })} />
      <Field label="Support Phone Number" type="tel" value={formData.companyPhone} onChange={(v) => onChange({ companyPhone: v })} />
      <Field label="Registered Office Address" value={formData.companyAddress} onChange={(v) => onChange({ companyAddress: v })} />
    </div>
    <div style={{ paddingTop: 4 }}>
      <button type="submit" style={saveBtnStyle}>
        <Save className="w-3.5 h-3.5" /><span>Save Agency Profile</span>
      </button>
    </div>
  </form>
);

/** GST / tax configuration (admin). */
export const TaxTab: React.FC<Props> = ({ formData, onChange, onSave }) => (
  <form onSubmit={onSave} style={tabBodyStyle}>
    <TabHeader
      title="GSTIN & Compliance Settings"
      subtitle="These statutory tax and invoicing details appear on all generated client invoices."
    />
    <div style={fieldGridStyle}>
      <Field label="Company GSTIN" value={formData.companyGst} mono
        onChange={(v) => onChange({ companyGst: v.toUpperCase() })} />
      <Field label="PAN Number" value={formData.companyPan} mono
        onChange={(v) => onChange({ companyPan: v.toUpperCase() })} />
      <Field label="Home State" value={formData.companyState}
        onChange={(v) => onChange({ companyState: v })} />
      <Field label="Default SAC Code" value={formData.defaultHsnSac} mono
        onChange={(v) => onChange({ defaultHsnSac: v })} />
      <Field label="Default GST Rate (%)" type="number" value={formData.defaultGstRate} mono
        onChange={(v) => onChange({ defaultGstRate: Number(v) })} />
      <Field label="Invoice Prefix Series" value={formData.invoicePrefix} mono
        onChange={(v) => onChange({ invoicePrefix: v })} />
    </div>
    <div style={{ paddingTop: 4 }}>
      <button type="submit" style={saveBtnStyle}>
        <Save className="w-3.5 h-3.5" /><span>Save Tax Settings</span>
      </button>
    </div>
  </form>
);

/** Banking & Razorpay credentials (admin). */
export const BankingTab: React.FC<Props> = ({ formData, onChange, onSave }) => (
  <form onSubmit={onSave} style={tabBodyStyle}>
    <TabHeader
      title="Direct Settlement Bank & Razorpay Credentials"
      subtitle="Client payments settle straight into this account via Razorpay Route."
    />

    <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Direct Settlement Architecture:</span>{' '}
      Direct bank account settlement via Razorpay Route. Funds flow directly to your business account without intermediary vendor pooling.
    </div>

    <div style={fieldGridStyle}>
      <Field label="Account Beneficiary Name" value={formData.bankAccountName}
        onChange={(v) => onChange({ bankAccountName: v })} />
      <Field label="Bank Account Number" value={formData.bankAccountNumber} mono
        onChange={(v) => onChange({ bankAccountNumber: v })} />
      <Field label="Bank IFSC Code" value={formData.bankIfsc} mono
        onChange={(v) => onChange({ bankIfsc: v.toUpperCase() })} />
      <Field label="Bank Branch Location" value={formData.bankBranch}
        onChange={(v) => onChange({ bankBranch: v })} />
      <Field label="UPI ID for Direct QR Codes" value={formData.upiId} mono
        onChange={(v) => onChange({ upiId: v })} />
      <Field label="Razorpay Key ID" value={formData.razorpayKeyId} mono
        onChange={(v) => onChange({ razorpayKeyId: v })} />
    </div>

    <div style={{ paddingTop: 4 }}>
      <button type="submit" style={saveBtnStyle}>
        <Save className="w-3.5 h-3.5" /><span>Save Banking Info</span>
      </button>
    </div>
  </form>
);
