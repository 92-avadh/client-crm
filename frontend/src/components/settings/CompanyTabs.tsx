import React, { useState, useRef, useEffect } from 'react';
import { Save, Coins, Briefcase, Layout, Target, Check, Upload, RotateCcw, Image as ImageIcon, Info, AlertCircle, Plus, Trash2, QrCode, Star, Landmark } from 'lucide-react';
import type { AppSettings, BankAccount } from '../../types';
import { fieldStyle, saveBtnStyle, fieldGridStyle, tabBodyStyle, TabHeader } from './settingsUi';
import { SUPPORTED_CURRENCIES, getCurrencyConfig, formatCurrency } from '../../utils/currency';
import { validateImageFile, LOGO_FORMAT_HINT } from '../../utils/fileValidation';
import { isValidEmail, isValidPhone, sanitizePhone, isValidGSTIN, isValidPAN, sanitizeGstin, sanitizePan } from '../../utils/validation';
import { isDirty } from '../../hooks/isDirty';
import { normalizeBankAccounts, MAX_BANK_ACCOUNTS } from '../../utils/bankAccounts';
import { SignatoryAssetsFields } from './SignatoryAssetsFields';

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
  { id: 'retention', label: 'Improve Client Retention' },
  { id: 'invoicing', label: 'Streamline Invoicing & Reminders' },
  { id: 'team', label: 'Manage Team & Workload' },
  { id: 'analytics', label: 'Track Revenue & Profit' },
  { id: 'communication', label: 'Centralize Client Communication' },
  { id: 'projects', label: 'Organize Projects & Deadlines' },
  { id: 'onboarding', label: 'Faster Client Onboarding' },
  { id: 'other_goal', label: 'Custom Workspace Objective' },
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

        {/* Authorized Signature & Company Stamp */}
        <SignatoryAssetsFields
          signatureUrl={formData.invoiceDesign?.signatureUrl}
          stampUrl={formData.invoiceDesign?.stampUrl}
          companyName={formData.companyName}
          onChangeSignature={(url) =>
            onChange({
              invoiceDesign: {
                ...(formData.invoiceDesign || {}),
                signatureUrl: url,
                showSignature: true,
              },
            })
          }
          onChangeStamp={(url) =>
            onChange({
              invoiceDesign: {
                ...(formData.invoiceDesign || {}),
                stampUrl: url,
                showSignature: true,
              },
            })
          }
        />
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
            <select
              value={formData.currencySymbol || activeCurrencyConfig.symbol}
              onChange={(e) => onChange({ currencySymbol: e.target.value })}
              style={{
                ...fieldStyle,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14,
              }}
              title="Choose how currency amounts appear across invoices and reports"
            >
              {(() => {
                const baseSymbols = SUPPORTED_CURRENCIES.map((c) => ({
                  symbol: c.symbol,
                  label: `${c.symbol} — ${c.code} (${c.name})`,
                }));
                const extraCodes = [
                  { symbol: 'INR', label: 'INR — Text Code (Indian Rupee)' },
                  { symbol: 'USD', label: 'USD — Text Code (US Dollar)' },
                  { symbol: 'EUR', label: 'EUR — Text Code (Euro)' },
                  { symbol: 'GBP', label: 'GBP — Text Code (British Pound)' },
                  { symbol: 'AED', label: 'AED — Text Code (UAE Dirham)' },
                  { symbol: 'SAR', label: 'SAR — Text Code (Saudi Riyal)' },
                ];
                const allOptions = [...baseSymbols, ...extraCodes];
                const current = formData.currencySymbol || activeCurrencyConfig.symbol;
                if (current && !allOptions.some((o) => o.symbol === current)) {
                  allOptions.unshift({ symbol: current, label: `${current} — Custom` });
                }
                return allOptions.map((opt) => (
                  <option key={opt.symbol} value={opt.symbol}>
                    {opt.label}
                  </option>
                ));
              })()}
            </select>
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
              <option value="retention">Retention-First (Client Health &amp; Renewals Priority)</option>
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
          onChange={(v) => onChange({ companyGst: sanitizeGstin(v) })} />
        <Field label="PAN Number" value={formData.companyPan} mono maxLength={10} placeholder="e.g. ABCDE1234F"
          onChange={(v) => onChange({ companyPan: sanitizePan(v) })} />
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

/** Banking & Razorpay credentials (admin) — supports up to 2 bank accounts with per-account UPI QR upload. */
export const BankingTab: React.FC<Props> = ({ formData, onChange, onSave }) => {
  const baseline = useRef<AppSettings | null>(null);
  const [qrErrors, setQrErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!baseline.current) {
      baseline.current = { ...formData, bankAccounts: normalizeBankAccounts(formData) };
    }
  }, [formData]);

  const accounts = normalizeBankAccounts(formData);
  const isChanged = Boolean(baseline.current && isDirty(formData as any, baseline.current as any));

  const commitAccounts = (next: BankAccount[]) => {
    const trimmed = next.slice(0, MAX_BANK_ACCOUNTS);
    if (trimmed.length > 0 && !trimmed.some((a) => a.isDefault)) {
      trimmed[0] = { ...trimmed[0], isDefault: true };
    }
    const primary = trimmed.find((a) => a.isDefault) || trimmed[0];
    onChange({
      bankAccounts: trimmed,
      bankName: primary?.bankName || '',
      bankAccountName: primary?.bankAccountName || '',
      bankAccountNumber: primary?.bankAccountNumber || '',
      bankIfsc: primary?.bankIfsc || '',
      bankBranch: primary?.bankBranch || '',
      upiId: primary?.upiId || '',
    });
  };

  const updateSlot = (idx: number, patch: Partial<BankAccount>) => {
    const next = [...accounts];
    next[idx] = { ...next[idx], ...patch };
    commitAccounts(next);
  };

  const setDefaultSlot = (idx: number) => {
    const next = accounts.map((a, i) => ({ ...a, isDefault: i === idx }));
    commitAccounts(next);
  };

  const addAccountSlot = () => {
    if (accounts.length >= MAX_BANK_ACCOUNTS) return;
    const newId = accounts.some((a) => a.id === 'bank_1') ? 'bank_2' : 'bank_1';
    commitAccounts([
      ...accounts,
      {
        id: newId,
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfsc: '',
        bankBranch: '',
        upiId: '',
        qrCodeUrl: '',
        isDefault: accounts.length === 0,
      },
    ]);
  };

  const removeSlot = (idx: number) => {
    const next = accounts.filter((_, i) => i !== idx);
    commitAccounts(next);
  };

  const handleQrUpload = (idx: number, accId: string, file?: File) => {
    if (!file) return;
    setQrErrors((prev) => ({ ...prev, [accId]: '' }));
    const validation = validateImageFile(file, { maxSizeMB: 3, allowSvg: true });
    if (!validation.valid) {
      setQrErrors((prev) => ({ ...prev, [accId]: validation.error || 'Invalid QR image file' }));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setQrErrors((prev) => ({ ...prev, [accId]: 'Could not read QR image.' }));
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) updateSlot(idx, { qrCodeUrl: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={onSave} style={tabBodyStyle}>
      <TabHeader
        title="Bank Accounts, UPI QR Codes &amp; Razorpay"
        subtitle="Add up to 2 settlement bank accounts with dedicated UPI QR codes. Choose which account appears on each invoice."
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Landmark size={15} style={{ color: 'var(--accent-text)' }} />
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>Multi-Account Billing:</strong>{' '}
            {accounts.length} / {MAX_BANK_ACCOUNTS} bank accounts configured
          </span>
        </div>
        {accounts.length < MAX_BANK_ACCOUNTS ? (
          <button
            type="button"
            onClick={addAccountSlot}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 8, background: 'var(--solid-btn-bg, #0f172a)', color: '#ffffff',
              border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            <span>Add Bank Account ({accounts.length + 1} of {MAX_BANK_ACCOUNTS})</span>
          </button>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
            Max 2 / 2 Accounts Added
          </span>
        )}
      </div>

      {accounts.length === 0 ? (
        <div style={{ border: '1.5px dashed var(--border)', borderRadius: 14, padding: 28, textAlign: 'center', background: 'var(--bg-subtle)' }}>
          <Landmark size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>No Bank Accounts Added Yet</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 14px' }}>
            Add up to 2 settlement bank accounts with UPI QR codes to show on your GST invoices.
          </p>
          <button
            type="button"
            onClick={addAccountSlot}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, background: 'var(--solid-btn-bg, #0f172a)', color: '#ffffff',
              border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Add First Bank Account</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {accounts.map((acc, idx) => (
            <div
              key={acc.id}
              style={{
                border: acc.isDefault ? '1.5px solid var(--accent-text, #2563eb)' : '1px solid var(--border)',
                borderRadius: 14,
                padding: 18,
                background: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    Bank Account {idx + 1} {acc.bankName ? `· ${acc.bankName}` : ''}
                  </span>
                  {acc.isDefault && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--info-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                      <Star size={10} /> Default
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!acc.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultSlot(idx)}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--bg-card)', color: 'var(--accent-text)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSlot(idx)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div style={fieldGridStyle}>
                <Field label="Bank Name" value={acc.bankName} placeholder="e.g. HDFC Bank"
                  onChange={(v) => updateSlot(idx, { bankName: v })} />
                <Field label="Account Beneficiary Name" value={acc.bankAccountName} placeholder="e.g. Retentio Agency LLP"
                  onChange={(v) => updateSlot(idx, { bankAccountName: v })} />
                <Field label="Bank Account Number" value={acc.bankAccountNumber} mono maxLength={30} placeholder="e.g. 50100234567890"
                  onChange={(v) => updateSlot(idx, { bankAccountNumber: v })} />
                <Field label="Bank IFSC Code" value={acc.bankIfsc} mono maxLength={11} placeholder="e.g. HDFC0001234"
                  onChange={(v) => updateSlot(idx, { bankIfsc: v.toUpperCase() })} />
                <Field label="Bank Branch Location" value={acc.bankBranch} placeholder="e.g. Andheri East, Mumbai"
                  onChange={(v) => updateSlot(idx, { bankBranch: v })} />
                <Field label="UPI ID (for Tap-to-Pay &amp; Fallback QR)" value={acc.upiId} mono maxLength={50} placeholder="e.g. username@okhdfcbank"
                  onChange={(v) => updateSlot(idx, { upiId: v })} />
              </div>

              {/* UPI QR Image Upload Box */}
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 10, background: '#ffffff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {acc.qrCodeUrl ? (
                      <img src={acc.qrCodeUrl} alt={`Bank ${idx + 1} UPI QR`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <QrCode size={28} style={{ color: '#94a3b8' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {acc.qrCodeUrl ? 'Custom UPI QR Code Uploaded' : 'Upload UPI Payment QR Code'}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
                      Shown on invoices &amp; bank details for instant UPI scan-to-pay.
                    </p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      <Info size={11} style={{ color: 'var(--brand-green, #10b981)' }} />
                      PNG, JPG, WebP, SVG (max 3MB)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'var(--solid-btn-bg, #0f172a)', color: '#ffffff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                    <Upload size={13} />
                    <span>{acc.qrCodeUrl ? 'Change QR' : 'Upload QR'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        handleQrUpload(idx, acc.id, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {acc.qrCodeUrl && (
                    <button
                      type="button"
                      onClick={() => updateSlot(idx, { qrCodeUrl: '' })}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--danger-text)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <RotateCcw size={12} />
                      <span>Remove QR</span>
                    </button>
                  )}
                  {qrErrors[acc.id] && (
                    <div style={{ width: '100%', fontSize: 11, fontWeight: 600, color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} />
                      <span>{qrErrors[acc.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Razorpay Key */}
      <div style={{ paddingTop: 4 }}>
        <Field label="Razorpay Key ID (Optional Gateway)" value={formData.razorpayKeyId} mono maxLength={50} placeholder="e.g. rzp_live_xxxxxxxxx"
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
