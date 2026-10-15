import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, ArrowRight
} from 'lucide-react';
import { StepRole } from './StepRole';
import { StepIndustry } from './StepIndustry';
import { StepGoals } from './StepGoals';
import { StepTheme } from './StepTheme';
import { ONBOARDING_CSS } from './OnboardingStyles';

interface OnboardingWizardProps {
  userName: string;
  userCompany: string;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export interface OnboardingData {
  role: string;
  roleLabel?: string;
  customRole?: string;
  industry: string;
  customIndustry?: string;
  teamSize: string;
  currency: string;
  currencySymbol: string;
  goals: string[];
  customGoal?: string;
  theme: 'light' | 'dark' | 'system';
  dashboardLayout: 'default' | 'compact' | 'expanded';
  dashboardFocus: 'balanced' | 'financial' | 'retention';
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  userName,
  userCompany,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const [data, setData] = useState<OnboardingData>({
    role: '',
    roleLabel: '',
    customRole: '',
    industry: '',
    customIndustry: '',
    teamSize: '',
    currency: localStorage.getItem('retentio_currency') || 'INR',
    currencySymbol: localStorage.getItem('retentio_currency_symbol') || '₹',
    goals: [],
    customGoal: '',
    theme: (localStorage.getItem('retentio_theme') as any) || 'light',
    dashboardLayout: (localStorage.getItem('retentio_dashboard_layout') as any) || 'default',
    dashboardFocus: (localStorage.getItem('retentio_dashboard_focus') as any) || 'balanced',
  });

  // Apply theme dynamically on selection so the user sees live transformation through the glass!
  const applyThemeLive = (selectedTheme: 'light' | 'dark' | 'system') => {
    setData(prev => ({ ...prev, theme: selectedTheme }));
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('retentio_theme', 'dark');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('retentio_theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.removeItem('retentio_theme');
    }
  };

  const handleSelectRole = (roleId: string) => {
    const roleObj = [
      { id: 'owner', label: 'Agency Owner' },
      { id: 'manager', label: 'Manager / HR' },
      { id: 'team', label: 'Team Member' },
      { id: 'client', label: 'Client / Brand' },
      { id: 'other', label: 'Other Role' },
    ].find(r => r.id === roleId);
    setData(prev => ({
      ...prev,
      role: roleId,
      roleLabel: roleId === 'other' ? prev.customRole || 'Custom Role' : roleObj?.label || roleId,
    }));
  };

  const handleCustomRoleChange = (val: string) => {
    setData(prev => ({
      ...prev,
      customRole: val,
      roleLabel: val.trim() || 'Custom Role',
    }));
  };

  const handleSelectIndustry = (ind: string) => {
    setData(prev => ({
      ...prev,
      industry: ind,
    }));
  };

  const handleCustomIndustryChange = (val: string) => {
    setData(prev => ({
      ...prev,
      customIndustry: val,
    }));
  };

  const toggleGoal = (goalId: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const handleCustomGoalChange = (val: string) => {
    setData(prev => ({
      ...prev,
      customGoal: val,
    }));
  };

  const handleSelectCurrency = (code: string, symbol: string) => {
    setData(prev => ({
      ...prev,
      currency: code,
      currencySymbol: symbol,
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        if (!data.role) return false;
        if (data.role === 'other' && !data.customRole?.trim()) return false;
        return true;
      case 1:
        if (!data.industry || !data.teamSize || !data.currency) return false;
        if (data.industry === 'Other' && !data.customIndustry?.trim()) return false;
        return true;
      case 2:
        return data.goals.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setDirection('forward');
      setStep(s => s + 1);
    } else {
      // Finalize data
      const finalData: OnboardingData = {
        ...data,
        industry: data.industry === 'Other' && data.customIndustry ? data.customIndustry.trim() : data.industry,
        roleLabel: data.role === 'other' && data.customRole ? data.customRole.trim() : data.roleLabel,
      };
      onComplete(finalData);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection('backward');
      setStep(s => s - 1);
    }
  };

  const firstName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div className="onboarding-root-overlay">
      {/* ══ AMBIENT LIQUID AURORA ORBS (Refracted dynamically through apple glass) ══ */}
      <div className="ambient-mesh-container" aria-hidden="true">
        <div className="liquid-orb orb-emerald" />
        <div className="liquid-orb orb-cyan" />
        <div className="liquid-orb orb-indigo" />
        <div className="liquid-orb orb-teal" />
      </div>

      {/* ══ APPLE LIQUID GLASS MODAL ══ */}
      <div className="liquid-glass-modal" role="dialog" aria-modal="true">
        {/* Specular sheen highlight bar */}
        <div className="glass-specular-top" />

        {/* Header Progress Area */}
        <div className="modal-header-section">
          <div className="header-meta-row">
            <div className="step-indicator-chip">
              <span className="step-glow-dot" />
              <span>STEP {step + 1} OF 4</span>
            </div>
            <button
              onClick={onSkip}
              className="skip-btn-pill"
            >
              Skip for now
            </button>
          </div>

          {/* Segmented Progress Track with neon glow */}
          <div className="progress-track-row">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="progress-segment-wrapper">
                <div
                  className={`progress-segment-bar ${i <= step ? 'active' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div
          key={step}
          className={`step-content-anim ${direction === 'forward' ? 'anim-slide-forward' : 'anim-slide-backward'}`}
        >
          {step === 0 && (
            <StepRole
              data={data}
              setData={setData}
              direction={direction}
              userCompany={userCompany}
              firstName={firstName}
              onSelectRole={handleSelectRole}
              onCustomRoleChange={handleCustomRoleChange}
            />
          )}

          {step === 1 && (
            <StepIndustry
              data={data}
              setData={setData}
              direction={direction}
              onSelectIndustry={handleSelectIndustry}
              onCustomIndustryChange={handleCustomIndustryChange}
              onSelectCurrency={handleSelectCurrency}
            />
          )}

          {step === 2 && (
            <StepGoals
              data={data}
              setData={setData}
              direction={direction}
              onToggleGoal={toggleGoal}
              onCustomGoalChange={handleCustomGoalChange}
            />
          )}

          {step === 3 && (
            <StepTheme
              data={data}
              setData={setData}
              direction={direction}
              onApplyTheme={applyThemeLive}
            />
          )}
        </div>

        {/* ══ Modal Footer Navigation ══ */}
        <div className="modal-footer-nav">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0}
            className={`liquid-nav-btn secondary ${step === 0 ? 'disabled' : ''}`}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className={`liquid-nav-btn primary ${!canProceed() ? 'disabled' : ''}`}
          >
            {step === 3 ? (
              <>
                <span>Launch Workspace</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══ APPLE LIQUID GLASS STYLES & REFRACTIONS ══ */}
      <style>{ONBOARDING_CSS}</style>
    </div>
  );
};

export default OnboardingWizard;
