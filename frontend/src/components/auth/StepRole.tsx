import React from 'react';
import { Building2, Users, UserCheck, Globe, Sparkles, Plus } from 'lucide-react';
import type { OnboardingData } from './OnboardingWizard';

const ROLES = [
  { id: 'owner', label: 'Agency Owner', desc: 'Full access to manage everything', icon: Building2 },
  { id: 'manager', label: 'Manager / HR', desc: 'Manage team, clients & operations', icon: Users },
  { id: 'team', label: 'Team Member', desc: 'Execute tasks & manage assigned clients', icon: UserCheck },
  { id: 'client', label: 'Client / Brand', desc: 'View projects, invoices & communicate', icon: Globe },
  { id: 'other', label: 'Other Role', desc: 'Custom position or specialization', icon: Sparkles },
];

interface StepRoleProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  direction: 'forward' | 'backward';
  userCompany: string;
  firstName: string;
  onSelectRole: (roleId: string) => void;
  onCustomRoleChange: (val: string) => void;
}

export const StepRole: React.FC<StepRoleProps> = ({
  data,
  userCompany,
  firstName,
  onSelectRole,
  onCustomRoleChange,
}) => {
  return (
    <div>
      <div className="step-badge-pill">
        <Sparkles size={14} className="badge-sparkle-icon" />
        <span>Getting started</span>
      </div>

      <h2 className="step-main-title">
        Welcome, {firstName}!
      </h2>
      <p className="step-sub-caption">
        Let's configure <strong>{userCompany || 'your workspace'}</strong> for high-growth operations. First, what is your role?
      </p>

      <div className="roles-grid-layout">
        {ROLES.map(role => {
          const Icon = role.icon;
          const isSelected = data.role === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`glass-card-option ${isSelected ? 'selected' : ''}`}
            >
              <div className="card-icon-box">
                <Icon size={17} />
              </div>
              <div className="card-text-block">
                <div className="card-title-text">{role.label}</div>
                <div className="card-desc-text">{role.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {data.role === 'other' && (
        <div className="other-input-expand-container">
          <label className="other-input-label">
            <Sparkles size={13} className="text-emerald-500" /> Specify your custom role / designation:
          </label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Creative Director, Growth Lead, Solutions Architect..."
            value={data.customRole || ''}
            onChange={e => onCustomRoleChange(e.target.value)}
            className="glass-text-input"
          />
        </div>
      )}
    </div>
  );
};
