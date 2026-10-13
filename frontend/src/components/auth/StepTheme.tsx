import React from 'react';
import { Palette, Sun, Moon, Laptop } from 'lucide-react';
import type { OnboardingData } from './OnboardingWizard';

const THEMES = [
  { id: 'light' as const, label: 'Light Mode', desc: 'Crisp, bright daylight aesthetic', icon: Sun },
  { id: 'dark' as const, label: 'Dark Mode', desc: 'Sleek, eye-friendly Apple dark glass', icon: Moon },
  { id: 'system' as const, label: 'System Default', desc: 'Follows macOS / device preference', icon: Laptop },
];

interface StepThemeProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  direction: 'forward' | 'backward';
  onApplyTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const StepTheme: React.FC<StepThemeProps> = ({
  data,
  onApplyTheme,
}) => {
  return (
    <div>
      <div className="step-badge-pill">
        <Palette size={14} className="badge-sparkle-icon" />
        <span>Live Customization</span>
      </div>

      <h2 className="step-main-title">Customize your workspace</h2>
      <p className="step-sub-caption">
        Watch the application behind the liquid glass adapt in real-time as you switch choices.
      </p>

      {/* Theme Selection with LIVE on-site toggle */}
      <div className="section-block">
        <label className="section-group-label">
          <Palette size={13} className="inline mr-1" /> Interface Theme (Live Preview)
        </label>
        <div className="themes-triplet-grid">
          {THEMES.map(t => {
            const Icon = t.icon;
            const isSelected = data.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onApplyTheme(t.id)}
                className={`glass-card-option centered ${isSelected ? 'selected' : ''}`}
              >
                <div className={`theme-preview-orb ${t.id}`}>
                  <Icon size={16} />
                </div>
                <div className="card-title-text">{t.label}</div>
                <div className="card-desc-text text-center">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
