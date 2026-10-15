import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import {
  ChevronDown,
  Check,
  Users,
  UserCheck,
  Briefcase,
  Sliders,
  DollarSign,
  TrendingUp,
  Target,
  Award,
  Palette,
  Code2,
  ShieldCheck,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { CORPORATE_ROLES } from './permissionsConfig';

interface RoleSelectorProps {
  role: string;
  onChange: (role: string) => void;
  allowAdmin?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  team: <Users style={{ width: 14, height: 14 }} />,
  hr: <UserCheck style={{ width: 14, height: 14 }} />,
  project_manager: <Briefcase style={{ width: 14, height: 14 }} />,
  operations_manager: <Sliders style={{ width: 14, height: 14 }} />,
  finance: <DollarSign style={{ width: 14, height: 14 }} />,
  sales: <TrendingUp style={{ width: 14, height: 14 }} />,
  marketing: <Target style={{ width: 14, height: 14 }} />,
  account_executive: <Award style={{ width: 14, height: 14 }} />,
  creative_designer: <Palette style={{ width: 14, height: 14 }} />,
  developer: <Code2 style={{ width: 14, height: 14 }} />,
  admin: <ShieldCheck style={{ width: 14, height: 14 }} />,
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  role,
  onChange,
  allowAdmin = true,
  label = 'Role',
  required = true,
  error,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  // Check if current role matches any predefined corporate preset
  const isPredefined = CORPORATE_ROLES.some((r) => r.value === role);
  const [isOther, setIsOther] = useState(!isPredefined && Boolean(role));
  const [customRoleInput, setCustomRoleInput] = useState(isPredefined ? '' : role);

  // Keep in sync if parent changes role externally
  useEffect(() => {
    const isKnown = CORPORATE_ROLES.some((r) => r.value === role);
    if (!isKnown && role) {
      setIsOther(true);
      setCustomRoleInput(role);
    } else if (isKnown) {
      setIsOther(false);
    }
  }, [role]);

  const availableRoles = CORPORATE_ROLES.filter((r) => allowAdmin || !r.adminOnly);
  const currentRoleObj = availableRoles.find((r) => r.value === role);

  const handleSelectPreset = (value: string) => {
    setIsOther(false);
    setOpen(false);
    onChange(value);
  };

  const handleSelectOther = () => {
    setIsOther(true);
    setOpen(false);
    const initialCustom = customRoleInput.trim() || 'Custom Role';
    onChange(initialCustom);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomRoleInput(val);
    onChange(val);
  };

  const displayText = isOther
    ? customRoleInput.trim()
      ? `Other: ${customRoleInput.trim()}`
      : 'Other (Custom Role)'
    : currentRoleObj?.label || (role ? role : 'Select role');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontWeight: 650,
            color: 'var(--text-primary)',
            fontSize: 12,
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--danger-text, #ef4444)' }}> *</span>}
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
              color: 'var(--text-primary)',
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
              boxShadow: open ? '0 0 0 3px rgba(5, 150, 57, 0.12)' : 'none',
              borderColor: open ? 'var(--brand-green, #059639)' : error ? 'var(--danger-border, #ef4444)' : 'var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
              <span style={{ color: 'var(--brand-green, #059639)', display: 'flex' }}>
                {isOther ? <Edit3 style={{ width: 14, height: 14 }} /> : ROLE_ICONS[role] || <Users style={{ width: 14, height: 14 }} />}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 550 }}>
                {displayText}
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
            minWidth: 260,
            maxHeight: 330,
            overflowY: 'auto',
            padding: 6,
          }}
        >
          <DropdownMenuLabel style={{ fontSize: 11, fontWeight: 750, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '6px 10px' }}>
            Corporate Roles
          </DropdownMenuLabel>

          {availableRoles.map((r) => {
            const isSelected = !isOther && r.value === role;
            return (
              <DropdownMenuItem
                key={r.value}
                onSelect={() => handleSelectPreset(r.value)}
                onClick={() => handleSelectPreset(r.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--brand-green-subtle, #ECFDF5)' : undefined,
                  color: isSelected ? 'var(--brand-green, #059639)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 650 : 500,
                  marginBottom: 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span style={{ color: isSelected ? 'var(--brand-green, #059639)' : 'var(--text-muted)', display: 'flex' }}>
                    {ROLE_ICONS[r.value] || <Users style={{ width: 14, height: 14 }} />}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{r.label}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 400 }}>{r.category}</span>
                  </div>
                </div>
                {isSelected && <Check size={14} style={{ color: 'var(--brand-green, #059639)', flexShrink: 0 }} />}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator style={{ margin: '6px 0' }} />

          <DropdownMenuItem
            onSelect={handleSelectOther}
            onClick={handleSelectOther}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 10px',
              borderRadius: 8,
              fontSize: 12.5,
              cursor: 'pointer',
              background: isOther ? 'var(--brand-green-subtle, #ECFDF5)' : undefined,
              color: isOther ? 'var(--brand-green, #059639)' : 'var(--text-primary)',
              fontWeight: isOther ? 700 : 550,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ color: isOther ? 'var(--brand-green, #059639)' : 'var(--brand-green, #059639)', display: 'flex' }}>
                <Edit3 style={{ width: 14, height: 14 }} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>Other (Custom Role...)</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 400 }}>Type your own corporate role title</span>
              </div>
            </div>
            {isOther && <Check size={14} style={{ color: 'var(--brand-green, #059639)', flexShrink: 0 }} />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Role Input field when "Other" is active */}
      {isOther && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brand-green, #059639)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles style={{ width: 12, height: 12 }} /> Specify Custom Role Title *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={customRoleInput}
            placeholder="e.g. Chief Marketing Officer, Legal Counsel, QA Lead"
            onChange={handleCustomInputChange}
            style={{
              width: '100%',
              padding: '9px 13px',
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--brand-green, #059639)',
              borderRadius: 9,
              fontSize: 13,
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 0 0 3px rgba(5, 150, 57, 0.08)',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            This custom role is persisted in the database and visible across all team directories and chats.
          </span>
        </div>
      )}
    </div>
  );
};
