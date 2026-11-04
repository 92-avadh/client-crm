import React, { useState, useRef, useEffect } from 'react';
import { Save, Coins, Briefcase, Layout, Target, Check, Upload, RotateCcw, Image as ImageIcon, Info, AlertCircle } from 'lucide-react';
import type { AppSettings } from '../../types';
import { fieldStyle, saveBtnStyle, fieldGridStyle, tabBodyStyle, TabHeader } from './settingsUi';
import { SUPPORTED_CURRENCIES, getCurrencyConfig, formatCurrency } from '../../utils/currency';
import { validateImageFile, LOGO_FORMAT_HINT } from '../../utils/fileValidation';
import { isValidEmail, isValidPhone, sanitizePhone, isValidGSTIN, isValidPAN } from '../../utils/validation';
import { isDirty } from '../../hooks/isDirty';

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
  maxLength?: number;
  placeholder?: string;
  onChange: (v: string) => void;
}> = ({ label, value, type = 'text', mono, maxLength, placeholder, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength || (type === 'tel' ? 20 : 120)}
      onChange={(e) => {
        let val = e.target.value;
        if (type === 'tel') {
          val = val.replace(/[^0-9+\s\-()]/g, '');
        }
        onChange(val);
      }}
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
  { id: 'retain_clients', label: 'High-Value Client Retainers' },
  { id: 'invoicing_speed', label: 'Faster Automated Invoicing' },
  { id: 'operations_efficiency', label: 'Streamlined Team Operations' },
  { id: 'client_transparency', label: 'Direct Client Transparency' },
  { id: 'multi_currency', label: 'Multi-Currency Financials' },
];

/** Agency profile, currency configuration & onboarding preferences (admin). */
export const CompanyTab: React.FC<Props> = ({ formData, onChange, onSave }) => {
  const [logoError, setLogoError] = useState('');
  const [formError, setFormError] = useState('');
  const baseline = useRef<AppSettings | null>(null);

  useEffect(() => {
    if (!baseline.current) {
      baseline.current = { ...formData };
    }
  }, [formData]);

  const isChanged = Boolean(baseline.current && isDirty(formData as any, baseline.current as any));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (formData.companyEmail && !isValidEmail(formData.companyEmail.trim())) {
      setFormError('Please enter a valid official support email address.');
      return;
    }
    if (formData.companyPhone) {
      const cleanPhone = sanitizePhone(formData.companyPhone);
      if (!isValidPhone(cleanPhone)) {
        setFormError('Please enter a valid support phone number (7 to 15 digits).');
        return;
      }
    }
    onSave(e);
  };
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
    <form onSubmit={handleFormSubmit} style={tabBodyStyle}>
      <TabHeader
        title="Agency Profile & Business Details"
        subtitle="Business credentials, statutory operating currency, and workspace preferences configured during onboarding."
      />

      {formError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', fontSize: 12, fontWeight: 700 }}>
          <AlertCircle size={14} />
          <span>{formError}</span>
        </div>
      )}

      {/* ── Section 0: Agency Branding & Logo ─────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={16} className="text-blue-500" />
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Agency Branding &amp; Logo
          </h3>
        </div>

        <div
          style={{
            border: '1.5px solid var(--border)',
            borderRadius: 14,
            padding: '18px 20px',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 90,
                height: 52,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              {formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt={formData.companyName || 'Agency Logo'}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <img
                  src="/retentio-logo-horizontal.png"
                  alt="Default Platform Logo"
                  style={{ maxHeight: 20, maxWidth: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formData.companyLogo ? 'Custom Agency Logo Active' : 'Default Platform Logo'}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: formData.companyLogo ? 'var(--success-bg, rgba(22,163,74,0.1))' : 'var(--bg-card)',
                    color: formData.companyLogo ? 'var(--success-text, #16a34a)' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {formData.companyLogo ? 'Custom' : 'Default (Retentio)'}
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                This logo will appear on all your client invoices, receipts, and client views.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--bg-raised)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                  <Info style={{ width: 11, height: 11, color: 'var(--brand-green, #10b981)' }} />
                  Accepted: {LOGO_FORMAT_HINT}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'var(--solid-btn-bg, #0f172a)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Upload size={14} />
              <span>{formData.companyLogo ? 'Change Logo' : 'Upload Agency Logo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoError('');
                  const validation = validateImageFile(file, { maxSizeMB: 5, allowSvg: true });
                  if (!validation.valid) {
                    setLogoError(validation.error || 'Invalid logo file');
                    e.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onerror = () => setLogoError('Could not read logo image file. Please try another.');
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (result) {
                      onChange({
                        companyLogo: result,
                        invoiceDesign: { ...(formData.invoiceDesign || {}), logoUrl: result },
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
            </label>

            {formData.companyLogo && (
              <button
                type="button"
                onClick={() => {
                  setLogoError('');
                  onChange({
                    companyLogo: '',
                    invoiceDesign: { ...(formData.invoiceDesign || {}), logoUrl: '' },
                  });
                }}
                title="Reset to default platform logo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--danger-text, #ef4444)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Reset to Default</span>
              </button>
            )}

            {logoError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger-text, #ef4444)', fontSize: 11, fontWeight: 600 }}>
                <AlertCircle size={13} />
                <span>{logoError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

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
              <option value="operations">Operations-First (Deliverables &amp; Project Milestones)</option>
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
        <button
          type="submit"
          style={{
            ...saveBtnStyle,
            opacity: isChanged ? 1 : 0.45,
            cursor: isChanged ? 'pointer' : 'not-allowed',
          }}
          disabled={!isChanged}
          title={!isChanged ? 'No changes made' : undefined}
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Agency Profile &amp; Preferences</span>
        </button>
      </div>
    </form>
  );
};

/** GST / tax configuration (admin). */
export const TaxTab: React.FC<Props> = ({ formData, onChange, onSave }) => {
  const [taxError, setTaxError] = useState('');
  const baseline = useRef<AppSettings | null>(null);

  useEffect(() => {
    if (!baseline.current) {
      baseline.current = { ...formData };
    }
  }, [formData]);

  const isChanged = Boolean(baseline.current && isDirty(formData as any, baseline.current as any));

  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTaxError('');
    if (formData.companyGst && formData.companyGst.trim()) {
      if (!isValidGSTIN(formData.companyGst.trim().toUpperCase())) {
        setTaxError('Please enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5) or clear the field.');
        return;
      }
    }
    if (formData.companyPan && formData.companyPan.trim()) {
      if (!isValidPAN(formData.companyPan.trim().toUpperCase())) {
        setTaxError('Please enter a valid 10-character PAN (e.g. ABCDE1234F) or clear the field.');
        return;
      }
    }
    onSave(e);
  };

  return (
    <form onSubmit={handleTaxSubmit} style={tabBodyStyle}>
      <TabHeader
        title="GSTIN & Compliance Settings"
        subtitle="These statutory tax and invoicing details appear on all generated client invoices."
      />
      {taxError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', fontSize: 12, fontWeight: 700 }}>
          <AlertCircle size={14} />
          <span>{taxError}</span>
        </div>
      )}
      <div style={fieldGridStyle}>
        <Field label="Company GSTIN" value={formData.companyGst} mono maxLength={15} placeholder="e.g. 27AAAAA0000A1Z5"
          onChange={(v) => onChange({ companyGst: v.toUpperCase() })} />
        <Field label="PAN Number" value={formData.companyPan} mono maxLength={10} placeholder="e.g. ABCDE1234F"
          onChange={(v) => onChange({ companyPan: v.toUpperCase() })} />
        <Field label="Home State" value={formData.companyState} maxLength={60} placeholder="e.g. Maharashtra"
          onChange={(v) => onChange({ companyState: v })} />
        <Field label="Default SAC Code" value={formData.defaultHsnSac} mono maxLength={15} placeholder="e.g. 998311"
          onChange={(v) => onChange({ defaultHsnSac: v })} />
        <Field label="Default GST Rate (%)" type="number" value={formData.defaultGstRate} mono maxLength={5} placeholder="18"
          onChange={(v) => onChange({ defaultGstRate: Number(v) })} />
        <Field label="Invoice Prefix Series" value={formData.invoicePrefix} mono maxLength={10} placeholder="INV-"
          onChange={(v) => onChange({ invoicePrefix: v })} />
      </div>
      <div style={{ paddingTop: 4 }}>
        <button
          type="submit"
          style={{
            ...saveBtnStyle,
            opacity: isChanged ? 1 : 0.45,
            cursor: isChanged ? 'pointer' : 'not-allowed',
          }}
          disabled={!isChanged}
          title={!isChanged ? 'No changes made' : undefined}
        >
          <Save className="w-3.5 h-3.5" /><span>Save Tax Settings</span>
        </button>
      </div>
    </form>
  );
};

/** Banking & Razorpay credentials (admin). */
export const BankingTab: React.FC<Props> = ({ formData, onChange, onSave }) => {
  const baseline = useRef<AppSettings | null>(null);

  useEffect(() => {
    if (!baseline.current) {
      baseline.current = { ...formData };
    }
  }, [formData]);

  const isChanged = Boolean(baseline.current && isDirty(formData as any, baseline.current as any));

  return (
    <form onSubmit={onSave} style={tabBodyStyle}>
      <TabHeader
        title="Direct Settlement Bank & Razorpay Credentials"
        subtitle="Client payments settle straight into this account. These details appear automatically on all client invoices."
      />

      <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Direct Settlement Architecture:</span>{' '}
        Direct bank account settlement via Razorpay Route. Funds flow directly to your business account without intermediary vendor pooling.
      </div>

      <div style={fieldGridStyle}>
        <Field label="Bank Name" value={formData.bankName || ''}
          onChange={(v) => onChange({ bankName: v })} />
        <Field label="Account Beneficiary Name" value={formData.bankAccountName}
          onChange={(v) => onChange({ bankAccountName: v })} />
        <Field label="Bank Account Number" value={formData.bankAccountNumber} mono maxLength={30} placeholder="e.g. 50100234567890"
          onChange={(v) => onChange({ bankAccountNumber: v })} />
        <Field label="Bank IFSC Code" value={formData.bankIfsc} mono maxLength={11} placeholder="e.g. HDFC0001234"
          onChange={(v) => onChange({ bankIfsc: v.toUpperCase() })} />
        <Field label="Bank Branch Location" value={formData.bankBranch}
          onChange={(v) => onChange({ bankBranch: v })} />
        <Field label="UPI ID for Direct QR Codes" value={formData.upiId} mono maxLength={50} placeholder="e.g. username@okhdfcbank"
          onChange={(v) => onChange({ upiId: v })} />
        <Field label="Razorpay Key ID" value={formData.razorpayKeyId} mono maxLength={50} placeholder="e.g. rzp_live_xxxxxxxxx"
          onChange={(v) => onChange({ razorpayKeyId: v })} />
      </div>

      <div style={{ paddingTop: 4 }}>
        <button
          type="submit"
          style={{
            ...saveBtnStyle,
            opacity: isChanged ? 1 : 0.45,
            cursor: isChanged ? 'pointer' : 'not-allowed',
          }}
          disabled={!isChanged}
          title={!isChanged ? 'No changes made' : undefined}
        >
          <Save className="w-3.5 h-3.5" /><span>Save Banking Details</span>
        </button>
      </div>
    </form>
  );
};
