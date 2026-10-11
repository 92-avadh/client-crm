import React from 'react';

/** Shared form primitives for the settings tabs. */

export const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)',
  background: 'var(--bg-subtle)', outline: 'none', boxSizing: 'border-box',
};

export const saveBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
  background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)',
  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

export const toggleRowStyle: React.CSSProperties = {
  padding: '18px 20px', borderRadius: 10, background: 'var(--bg-subtle)',
  border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', cursor: 'pointer', gap: 16,
};

export const checkboxStyle: React.CSSProperties = {
  width: 18, height: 18, accentColor: 'var(--text-primary)',
  cursor: 'pointer', flexShrink: 0,
};

/** Standard tab body padding. */
export const tabBodyStyle: React.CSSProperties = {
  padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24,
};

/** Tab heading block with a divider. */
export const TabHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>
  </div>
);

/** Labelled text input. */
export const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  mono?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, mono }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={mono ? { ...fieldStyle, fontFamily: 'monospace' } : fieldStyle}
    />
  </div>
);

/** Toggle row with description. */
export const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ title, description, checked, onChange }) => (
  <label style={toggleRowStyle}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={checkboxStyle}
    />
  </label>
);

/** Responsive auto-fit grid used across tabs. */
export const fieldGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20,
};
