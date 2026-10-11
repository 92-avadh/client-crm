import React from 'react';
import { AlertCircle } from 'lucide-react';

/** A field value plus its validation error, if any. */
export type FieldErrors = Record<string, string>;

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
}

/** Labelled input that turns red and shows the message when invalid. */
export const FormField: React.FC<FieldProps> = ({
  label, value, onChange, error, type = 'text', placeholder, mono, required,
}) => (
  <div>
    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', fontSize: 12, marginBottom: 6 }}>
      {label}{required ? ' *' : ''}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: error ? '1px solid var(--danger-border)' : '1px solid var(--border)',
        borderRadius: 10,
        fontSize: 13,
        color: 'var(--text-primary)',
        background: error ? 'var(--danger-bg)' : 'var(--bg-subtle)',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}
    />
    {error && (
      <span style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4, display: 'block', fontWeight: 500 }}>
        {error}
      </span>
    )}
  </div>
);

/** Two-column responsive grid used by the client forms. */
export const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
    {children}
  </div>
);

/** Inline error banner for submission failures. */
export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
      <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
};

/** Select field matching FormField's styling. */
export const FormSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => (
  <div>
    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', fontSize: 12, marginBottom: 6 }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-subtle)', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
    >
      {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  </div>
);
