import React from 'react';
import { AlertCircle } from 'lucide-react';

/** A field value plus its validation error, if any. */
export type FieldErrors = Record<string, string>;

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  helper?: string;
  type?: string;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
}

const toDateInputValue = (val: string | number | undefined | null): string => {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (str.includes('T')) return str.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    try {
      return d.toISOString().split('T')[0];
    } catch {}
  }
  return str;
};

/** Labelled input that turns red and shows the message when invalid. */
export const FormField: React.FC<FieldProps> = ({
  label, value, onChange, onBlur, error, helper, type = 'text', placeholder, mono, required,
}) => {
  const inputValue = type === 'date' ? toDateInputValue(value) : (value ?? '');

  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', fontSize: 12, marginBottom: 6 }}>
        {label}{required ? ' *' : ''}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      onWheel={(e) => {
        if (type === 'number') {
          e.currentTarget.blur();
        }
      }}
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
    {error ? (
      <span style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4, display: 'block', fontWeight: 500 }}>
        {error}
      </span>
    ) : helper ? (
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
        {helper}
      </span>
    ) : null}
  </div>
  );
};

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

import { AnimatedSelect } from '../ui/AnimatedSelect';

/** Select field powered by animated Radix DropdownMenu. */
export const FormSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, value, onChange, options, placeholder, error, helper, required, disabled }) => (
  <div>
    <AnimatedSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      error={error}
      required={required}
      disabled={disabled}
    />
    {helper && (
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
        {helper}
      </span>
    )}
  </div>
);
