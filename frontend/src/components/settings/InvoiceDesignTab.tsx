import React from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import type { AppSettings } from '../../types';
import { fieldStyle, saveBtnStyle, fieldGridStyle, tabBodyStyle, TabHeader, ToggleRow } from './settingsUi';

export interface InvoiceDesign {
  primaryColor: string;
  accentColor: string;
  template: string;
  headerText: string;
  footerText: string;
  termsAndConditions: string;
  showLogo: boolean;
  showSignature: boolean;
}

interface Props {
  design: InvoiceDesign;
  onChange: (patch: Partial<InvoiceDesign>) => void;
  settings: AppSettings;
  onSave: () => void;
}

/** Invoice design & branding (admin). */
export const InvoiceDesignTab: React.FC<Props> = ({ design, onChange, settings, onSave }) => (
  <div style={tabBodyStyle}>
    <TabHeader
      title="Invoice Design & Branding"
      subtitle="Customize the look and feel of invoices sent to clients."
    />

    {/* Logo */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Company Logo</label>
      <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: '6px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/retentio-logo-horizontal.png" alt="Retentio Logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Official Retentio Brand Logo</div>
            <div style={{ fontSize: 11, color: 'var(--success-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Active across navigation, invoices & client views
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Colors */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
      {([
        ['Primary Color', 'primaryColor'],
        ['Accent Color', 'accentColor'],
      ] as const).map(([label, key]) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={design[key]}
              onChange={(e) => onChange({ [key]: e.target.value } as Partial<InvoiceDesign>)}
              style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{design[key]}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Template */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Default Template Style</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {([
          { id: 'modern', label: 'Modern Clean', sub: 'DMart / Amazon Style' },
          { id: 'classic', label: 'Classic Framed', sub: 'Tata Motors GST Style' },
          { id: 'navy', label: 'Vibrant Navy', sub: 'Samsung Style' },
          { id: 'executive', label: 'Executive Card', sub: 'Marico Style' },
        ] as const).map((t) => (
          <button key={t.id} type="button" onClick={() => {
            onChange({ template: t.id });
            localStorage.setItem('retentio_invoice_template', t.id);
          }}
            style={{
              padding: '12px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: design.template === t.id ? '2px solid var(--accent, #2563eb)' : '1px solid var(--border)',
              background: design.template === t.id ? 'var(--bg-subtle)' : 'var(--bg-card)',
              color: 'var(--text-primary)', textAlign: 'left', transition: 'all 0.15s ease',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
            <span style={{ fontSize: 13 }}>{t.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{t.sub}</span>
          </button>
        ))}
      </div>
    </div>

    {/* Header / footer */}
    <div style={fieldGridStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Header Text</label>
        <input type="text" value={design.headerText} placeholder="e.g. Thank you for your business"
          onChange={(e) => onChange({ headerText: e.target.value })} style={fieldStyle} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Footer Text</label>
        <input type="text" value={design.footerText} placeholder="e.g. Registered office address"
          onChange={(e) => onChange({ footerText: e.target.value })} style={fieldStyle} />
      </div>
    </div>

    {/* Terms */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Terms & Conditions</label>
      <textarea rows={3} value={design.termsAndConditions}
        onChange={(e) => onChange({ termsAndConditions: e.target.value })}
        style={{ ...fieldStyle, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
    </div>

    {/* Toggles */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ToggleRow title="Show Logo on Invoice" description="Display your brand mark in the invoice header."
        checked={design.showLogo} onChange={(v) => onChange({ showLogo: v })} />
      <ToggleRow title="Show Signature Block" description="Add an authorised signatory area to the invoice."
        checked={design.showSignature} onChange={(v) => onChange({ showSignature: v })} />
    </div>

    <div style={{ paddingTop: 4 }}>
      <button type="button" style={saveBtnStyle} onClick={onSave}>
        <Save className="w-3.5 h-3.5" /><span>Save Invoice Design</span>
      </button>
    </div>

    {/* Live preview */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Live Preview
      </div>
      <div style={{ border: `2px solid ${design.primaryColor}`, borderRadius: 12, padding: '24px 28px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: design.primaryColor }}>{settings.companyName || 'Your Agency'}</div>
            {design.showLogo && (
              <div style={{ marginTop: 6, display: 'inline-flex', padding: '3px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid var(--border)' }}>
                <img src="/retentio-logo-horizontal.png" alt="Logo" style={{ height: 20, width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: design.primaryColor, marginTop: 2 }}>
              INV-2026-0001
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${design.accentColor}`, paddingTop: 12 }}>
          <div className="rg-1-auto" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Description</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Qty</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Amount</span>
            <span>Social Media Management</span>
            <span>1</span>
            <span className="font-amount" style={{ fontWeight: 750 }}>₹25,000</span>
          </div>
          <div style={{ borderTop: `1px solid ${design.accentColor}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</span>
            <span className="font-amount" style={{ fontSize: 14, fontWeight: 900, color: design.primaryColor }}>₹29,500</span>
          </div>
        </div>

        {design.termsAndConditions && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', borderTop: `1px solid ${design.accentColor}`, paddingTop: 10 }}>
            {design.termsAndConditions}
          </div>
        )}
      </div>
    </div>
  </div>
);
