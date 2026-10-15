import React from 'react';
import { Save, Coins, Briefcase, Layout, Target, Check } from 'lucide-react';
import type { AppSettings } from '../../types';
import { fieldStyle, saveBtnStyle, fieldGridStyle, tabBodyStyle, TabHeader } from './settingsUi';
import { SUPPORTED_CURRENCIES, getCurrencyConfig, formatCurrency } from '../../utils/currency';

interface Props {
  formData: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onSave: (e: React.FormEvent) => void;
}

const Field: React.FC<{
  label: string;
  value: string | number;
  type?: string;
  mono?: boolean;
  onChange: (v: string) => void;
}> = ({ label, value, type = 'text', mono, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={mono ? { ...fieldStyle, fontFamily: 'monospace' } : fieldStyle}
    />
  </div>
);

const INDUSTRIES = [
  'Digital Marketing',
  'Web Development',
  'Design / Creative',
  'IT / Software Services',
  'Consulting',
  'E-commerce',
  'Real Estate',
  'Healthcare',
  'Education',
  'Other',
];

const TEAM_SIZES = [
  { id: 'solo', label: 'Just me (1 person)' },
  { id: 'small', label: 'Small team (2–10 people)' },
  { id: 'medium', label: 'Medium team (11–50 people)' },
  { id: 'large', label: 'Large team (50+ people)' },
];

const GOALS_LIST = [
  { id: 'retain_clients', label: 'Retain High-Value Retainers' },
  { id: 'invoicing_speed', label: 'Faster Automated Invoicing' },
  { id: 'prevent_churn', label: 'Proactive Churn Prevention' },
  { id: 'client_transparency', label: 'Direct Client Transparency' },
  { id: 'multi_currency', label: 'Multi-Currency Financials' },
];

/** Agency profile, currency configuration & onboarding preferences (admin). */
export const CompanyTab: React.FC<Props> = ({ formData, onChange, onSave }) => {
  const activeCurrencyConfig = getCurrencyConfig(formData.currency || 'INR');

  const handleCurrencyChange = (code: string) => {
    const config = getCurrencyConfig(code);
    onChange({
      currency: config.code,
      currencySymbol: config.symbol,
    });
  };

  const toggleGoal = (goalId: string) => {
    const current = formData.goals || [];
    const next = current.includes(goalId)
      ? current.filter((g) => g !== goalId)
      : [...current, goalId];
    onChange({ goals: next });
  };

  return (
    <form onSubmit={onSave} style={tabBodyStyle}>
      <TabHeader
        title="Agency Profile & Business Details"
        subtitle="Business credentials, statutory operating currency, and workspace preferences configured during onboarding."
      />

      {/* ── Section 1: Business Identity ─────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          Business Credentials & Contact
        </h3>
        <div style={fieldGridStyle}>
          <Field label="Agency Legal Name" value={formData.companyName} onChange={(v) => onChange({ companyName: v })} />
          <Field label="Official Support Email" type="email" value={formData.companyEmail} onChange={(v) => onChange({ companyEmail: v })} />
          <Field label="Support Phone Number" type="tel" value={formData.companyPhone} onChange={(v) => onChange({ companyPhone: v })} />
          <Field label="Registered Office Address" value={formData.companyAddress} onChange={(v) => onChange({ companyAddress: v })} />
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

      {/* ── Section 2: Operating Currency & Financial Unit ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins size={16} className="text-emerald-500" />
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Operating Currency &amp; Financial Unit
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Primary Operating Currency *
            </label>
            <select
              value={formData.currency || 'INR'}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              style={{
                ...fieldStyle,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Currency Symbol Display
            </label>
            <input
              type="text"
              value={formData.currencySymbol || activeCurrencyConfig.symbol}
              onChange={(e) => onChange({ currencySymbol: e.target.value })}
              style={{
                ...fieldStyle,
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: 14,
              }}
              placeholder="e.g. $, ₹, €, £"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>Active Currency Formatting:</strong> Invoices, retainer metrics, payments, and dashboards will render as:
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              background: 'var(--bg-card)',
              padding: '4px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-strong)',
            }}
          >
            {formatCurrency(50000, formData.currencySymbol || activeCurrencyConfig.symbol)} / month
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

      {/* ── Section 3: Workspace Profile & Onboarding Choices ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={16} className="text-emerald-500" />
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Workspace Profile &amp; Onboarding Configurations
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Industry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Agency Industry
            </label>
            <select
              value={formData.industry || ''}
              onChange={(e) => onChange({ industry: e.target.value })}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Team Scale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Team Scale
            </label>
            <select
              value={formData.teamSize || ''}
              onChange={(e) => onChange({ teamSize: e.target.value })}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              <option value="">Select team scale...</option>
              {TEAM_SIZES.map((ts) => (
                <option key={ts.id} value={ts.id}>
                  {ts.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dashboard Layout & Focus */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layout size={13} /> Dashboard Layout Preference
            </label>
            <select
              value={formData.dashboardLayout || 'default'}
              onChange={(e) => onChange({ dashboardLayout: e.target.value as any })}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              <option value="default">Default (Balanced Analytics &amp; Feed)</option>
              <option value="compact">Compact (High Information Density)</option>
              <option value="expanded">Expanded (Spacious Visual Cards)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={13} /> Dashboard Focus Mode
            </label>
            <select
              value={formData.dashboardFocus || 'balanced'}
              onChange={(e) => onChange({ dashboardFocus: e.target.value as any })}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              <option value="balanced">Balanced (Overall Operations)</option>
              <option value="financial">Financial-Heavy (Cash Flow &amp; Collections First)</option>
              <option value="retention">Retention-First (Client Health &amp; Churn Defense)</option>
            </select>
          </div>
        </div>

        {/* Goals selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Primary Strategic Goals
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOALS_LIST.map((g) => {
              const isSelected = (formData.goals || []).includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid var(--border-focus)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--bg-raised)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && <Check size={12} className="text-emerald-500" strokeWidth={3} />}
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 10 }}>
        <button type="submit" style={saveBtnStyle}>
          <Save className="w-3.5 h-3.5" />
          <span>Save Agency Profile &amp; Preferences</span>
        </button>
      </div>
    </form>
  );
};

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
        <Save className="w-3.5 h-3.5" /><span>Save Banking Details</span>
      </button>
    </div>
  </form>
);
