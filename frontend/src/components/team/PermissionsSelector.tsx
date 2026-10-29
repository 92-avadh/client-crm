import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  Receipt,
  Wallet,
  CreditCard,
  Users,
  Inbox,
  MessageSquare,
  CalendarDays,
  Target,
  Settings,
  Shield,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  AVAILABLE_PERMISSIONS,
  ALL_PERMISSION_IDS,
  PERMISSION_PRESETS,
  type ModulePermission,
} from './permissionsConfig';

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  clients: Building2,
  projects: FolderKanban,
  tasks: CheckSquare,
  invoices: Receipt,
  finance: Wallet,
  expenses: CreditCard,
  team: Users,
  inbox: Inbox,
  chat: MessageSquare,
  meetings: CalendarDays,
  leads: Target,
  settings: Settings,
};

interface Props {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  role: string;
}

export const PermissionsSelector: React.FC<Props> = ({
  selectedPermissions,
  onChange,
  role,
}) => {
  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      onChange(selectedPermissions.filter((p) => p !== id));
    } else {
      onChange([...selectedPermissions, id]);
    }
  };

  const selectAll = () => onChange([...ALL_PERMISSION_IDS]);
  const clearAll = () => onChange([]);

  const isAllSelected = selectedPermissions.length === ALL_PERMISSION_IDS.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header & Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield style={{ width: 15, height: 15, color: 'var(--text-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
            Dashboard & Feature Permissions
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              background: selectedPermissions.length > 0 ? 'var(--info-bg, #eff6ff)' : 'var(--danger-bg, #fef2f2)',
              color: selectedPermissions.length > 0 ? 'var(--info-text, #2563eb)' : 'var(--danger-text, #ef4444)',
              border: `1px solid ${selectedPermissions.length > 0 ? 'var(--info-border, #bfdbfe)' : 'var(--danger-border, #fecaca)'}`,
            }}
          >
            {selectedPermissions.length} of {ALL_PERMISSION_IDS.length} active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={isAllSelected ? clearAll : selectAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-text, #16a34a)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Specify exactly what features and sidebar sections will be included in this member's dashboard upon login.
      </p>

      {/* Quick Presets Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>
          Presets:
        </span>
        {PERMISSION_PRESETS.map((preset) => {
          const isCurrentPreset =
            preset.permissions.length === selectedPermissions.length &&
            preset.permissions.every((p) => selectedPermissions.includes(p));

          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange([...preset.permissions])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isCurrentPreset ? 'var(--solid-btn-bg, #0a0a0a)' : 'var(--bg-subtle, #f5f5f5)',
                color: isCurrentPreset ? 'var(--solid-btn-text, #ffffff)' : 'var(--text-secondary, #525252)',
                border: isCurrentPreset ? '1px solid var(--solid-btn-bg, #0a0a0a)' : '1px solid var(--border)',
              }}
              title={preset.description}
            >
              <Sparkles style={{ width: 10, height: 10 }} />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Permissions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 8,
          maxHeight: 260,
          overflowY: 'auto',
          padding: '4px 2px',
        }}
      >
        {AVAILABLE_PERMISSIONS.map((perm) => {
          const Icon = ICON_MAP[perm.id] || LayoutDashboard;
          const isChecked = selectedPermissions.includes(perm.id);

          return (
            <div
              key={perm.id}
              onClick={() => togglePermission(perm.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                border: isChecked ? '1.5px solid var(--border-focus, #16a34a)' : '1px solid var(--border)',
                background: isChecked ? 'var(--bg-raised, #f0fdf4)' : 'var(--bg-card)',
                transition: 'all 0.12s ease',
                userSelect: 'none',
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: isChecked ? 'none' : '1.5px solid var(--border)',
                  background: isChecked ? 'var(--accent-text, #16a34a)' : 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                  color: '#ffffff',
                }}
              >
                {isChecked && <Check style={{ width: 12, height: 12, strokeWidth: 3 }} />}
              </div>

              {/* Icon & Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon
                    style={{
                      width: 13,
                      height: 13,
                      color: isChecked ? 'var(--accent-text, #16a34a)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {perm.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 10.5,
                    color: 'var(--text-muted)',
                    margin: '3px 0 0',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {perm.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
