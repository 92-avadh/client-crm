import React from 'react';
import { Briefcase, Plus, Sparkles } from 'lucide-react';
import type { OnboardingData } from './OnboardingWizard';

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
  { id: 'solo', label: 'Just me', desc: '1 person', badge: 'Solo' },
  { id: 'small', label: 'Small team', desc: '2–10 people', badge: 'Fast-moving' },
  { id: 'medium', label: 'Medium team', desc: '11–50 people', badge: 'Scaling' },
  { id: 'large', label: 'Large team', desc: '50+ people', badge: 'Enterprise' },
];

interface StepIndustryProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  direction: 'forward' | 'backward';
  onSelectIndustry: (ind: string) => void;
  onCustomIndustryChange: (val: string) => void;
}

export const StepIndustry: React.FC<StepIndustryProps> = ({
  data,
  setData,
  onSelectIndustry,
  onCustomIndustryChange,
}) => {
  return (
    <div>
      <div className="step-badge-pill">
        <Briefcase size={14} className="badge-sparkle-icon" />
        <span>Workspace Profile</span>
      </div>

      <h2 className="step-main-title">Your workspace profile</h2>
      <p className="step-sub-caption">
        Tell us about your industry and team scale to customize retention benchmarks and KPIs.
      </p>

      {/* Industry Pills */}
      <div className="section-block">
        <label className="section-group-label">Agency / Company Industry</label>
        <div className="industry-pills-wrap">
          {INDUSTRIES.map(ind => {
            const isSelected = data.industry === ind;
            return (
              <button
                key={ind}
                type="button"
                onClick={() => onSelectIndustry(ind)}
                className={`glass-pill-option ${isSelected ? 'selected' : ''}`}
              >
                {ind === 'Other' && <Plus size={12} className="inline mr-1 opacity-70" />}
                {ind}
              </button>
            );
          })}
        </div>

        {data.industry === 'Other' && (
          <div className="other-input-expand-container">
            <label className="other-input-label">
              <Sparkles size={13} className="text-emerald-500" /> Enter your custom agency / workspace industry:
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. AI Automation Agency, Video Production, Legal Tech..."
              value={data.customIndustry || ''}
              onChange={e => onCustomIndustryChange(e.target.value)}
              className="glass-text-input"
            />
          </div>
        )}
      </div>

      {/* Team Size Cards */}
      <div className="section-block">
        <label className="section-group-label">Team scale</label>
        <div className="team-size-grid">
          {TEAM_SIZES.map(ts => {
            const isSelected = data.teamSize === ts.id;
            return (
              <button
                key={ts.id}
                type="button"
                onClick={() => setData(prev => ({ ...prev, teamSize: ts.id }))}
                className={`glass-card-option compact ${isSelected ? 'selected' : ''}`}
              >
                <div className="team-header-row">
                  <span className="card-title-text">{ts.label}</span>
                  <span className="team-badge-tag">{ts.badge}</span>
                </div>
                <div className="card-desc-text">{ts.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
