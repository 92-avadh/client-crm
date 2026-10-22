import React from 'react';
import { Target, Wallet, Users, BarChart3, MessageSquare, Calendar, Rocket, Sparkles } from 'lucide-react';
import type { OnboardingData } from './OnboardingWizard';

const GOALS = [
  { id: 'retention', label: 'Improve client retention', desc: 'At-risk client alerts & health scores', icon: Target },
  { id: 'invoicing', label: 'Streamline invoicing', desc: 'Auto billing & payment reminders', icon: Wallet },
  { id: 'team', label: 'Manage team better', desc: 'Task allocation & workload tracker', icon: Users },
  { id: 'analytics', label: 'Track revenue & profit', desc: 'Real-time profit margins & forecasts', icon: BarChart3 },
  { id: 'communication', label: 'Better client communication', desc: 'Central chat & automated updates', icon: MessageSquare },
  { id: 'projects', label: 'Organize projects & tasks', desc: 'Deadlines, deliverables & sprints', icon: Calendar },
  { id: 'onboarding', label: 'Faster client onboarding', desc: 'Automate contracts & intake forms', icon: Rocket },
  { id: 'other_goal', label: 'Other custom priority', desc: 'Tailor your workspace to your need', icon: Sparkles },
];

interface StepGoalsProps {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  direction: 'forward' | 'backward';
  onToggleGoal: (goalId: string) => void;
  onCustomGoalChange: (val: string) => void;
}

export const StepGoals: React.FC<StepGoalsProps> = ({
  data,
  onToggleGoal,
  onCustomGoalChange,
}) => {
  return (
    <div>
      <div className="step-badge-pill">
        <Target size={14} className="badge-sparkle-icon" />
        <span>Primary Objectives</span>
      </div>

      <h2 className="step-main-title">What are your top goals?</h2>
      <p className="step-sub-caption">
        Select your primary focuses. Retentio adapts dashboard widgets and automation workflows accordingly.
      </p>

      <div className="goals-grid-layout">
        {GOALS.map(goal => {
          const Icon = goal.icon;
          const isSelected = data.goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onToggleGoal(goal.id)}
              className={`glass-card-option ${isSelected ? 'selected' : ''}`}
            >
              <div className="card-icon-box">
                <Icon size={16} />
              </div>
              <div className="card-text-block">
                <div className="card-title-text">{goal.label}</div>
                <div className="card-desc-text">{goal.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {data.goals.includes('other_goal') && (
        <div className="other-input-expand-container">
          <label className="other-input-label">
            <Sparkles size={13} className="text-emerald-500" /> Enter your custom objective:
          </label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. International multi-currency invoicing, client referral loops..."
            value={data.customGoal || ''}
            onChange={e => onCustomGoalChange(e.target.value)}
            className="glass-text-input"
          />
        </div>
      )}
    </div>
  );
};
