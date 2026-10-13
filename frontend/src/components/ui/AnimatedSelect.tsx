import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface AnimatedSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
}

export const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required,
  disabled = false,
  style,
  buttonStyle,
}) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div style={{ ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontSize: 12,
            marginBottom: 6,
          }}
        >
          {label}
          {required ? <span style={{ color: 'var(--danger-text, #ef4444)' }}> *</span> : null}
        </label>
      )}

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: error ? '1px solid var(--danger-border, #ef4444)' : '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 13,
              color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
              background: error ? 'var(--danger-bg, #fef2f2)' : 'var(--bg-subtle)',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: open
                ? '0 0 0 3px rgba(5, 150, 57, 0.12)'
                : error
                ? '0 0 0 3px rgba(239, 68, 68, 0.08)'
                : 'none',
              borderColor: open
                ? 'var(--brand-green, #059639)'
                : error
                ? 'var(--danger-border, #ef4444)'
                : 'var(--border)',
              ...buttonStyle,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              {selectedOption?.icon}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                transform: open ? 'rotate(180deg)' : 'none',
                marginLeft: 8,
              }}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={4}
          style={{
            width: 'var(--radix-dropdown-menu-trigger-width)',
            minWidth: 160,
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--brand-green-subtle, #ECFDF5)' : undefined,
                  color: isSelected ? 'var(--brand-green, #059639)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} style={{ color: 'var(--brand-green, #059639)', flexShrink: 0 }} />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--danger-text)',
            marginTop: 4,
            display: 'block',
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
