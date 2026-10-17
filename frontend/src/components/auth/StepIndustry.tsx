import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Plus, Sparkles, Coins, Check, ChevronDown } from 'lucide-react';
import type { OnboardingData } from './OnboardingWizard';
import { SUPPORTED_CURRENCIES, getCurrencyConfig } from '../../utils/currency';

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
  onSelectCurrency: (code: string, symbol: string) => void;
}

export const StepIndustry: React.FC<StepIndustryProps> = ({
  data,
  setData,
  onSelectIndustry,
  onCustomIndustryChange,
  onSelectCurrency,
}) => {
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const activeCurrencyConfig = getCurrencyConfig(data.currency);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setIsIndustryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCurrencyOpen(false);
        setIsIndustryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      <div className="step-badge-pill">
        <Briefcase size={14} className="badge-sparkle-icon" />
        <span>Workspace & Financial Profile</span>
      </div>

      <h2 className="step-main-title">Workspace & Financial Unit</h2>
      <p className="step-sub-caption">
        Configure your industry, team scale, and operating currency to customize billing and dashboard metrics.
      </p>

      {/* Operating Currency Dropdown */}
      <div className="section-block" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="section-group-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Coins size={14} className="text-emerald-500" />
            <span>Primary Operating Currency</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Required)</span>
          </label>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
            Sample: {activeCurrencyConfig.symbol}50,000 / mo
          </span>
        </div>

        {/* Currency Dropdown: Only currency symbol/sign and currency name */}
        <div className="currency-dropdown-wrap" ref={currencyDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsIndustryOpen(false);
              setIsCurrencyOpen(prev => !prev);
            }}
            className={`currency-dropdown-trigger ${isCurrencyOpen ? 'open' : ''}`}
            aria-haspopup="listbox"
            aria-expanded={isCurrencyOpen}
          >
            <div className="currency-trigger-content">
              <span className="currency-trigger-symbol">{activeCurrencyConfig.symbol}</span>
              <span className="currency-trigger-name">{activeCurrencyConfig.name}</span>
            </div>
            <ChevronDown
              size={16}
              style={{
                transform: isCurrencyOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                color: 'var(--text-muted, #94a3b8)',
                flexShrink: 0,
              }}
            />
          </button>

          {isCurrencyOpen && (
            <div className="currency-dropdown-menu" role="listbox">
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = data.currency === curr.code;
                return (
                  <div
                    key={curr.code}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => {
                      onSelectCurrency(curr.code, curr.symbol);
                      setIsCurrencyOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectCurrency(curr.code, curr.symbol);
                        setIsCurrencyOpen(false);
                      }
                    }}
                    className={`currency-dropdown-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="currency-item-symbol">{curr.symbol}</span>
                      <span className="currency-item-name">{curr.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="currency-item-check" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Agency / Company Industry Dropdown */}
      <div className="section-block" style={{ marginBottom: 18 }}>
        <label className="section-group-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Briefcase size={14} className="text-emerald-500" />
          <span>Agency / Company Industry</span>
          <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Required)</span>
        </label>

        <div className="currency-dropdown-wrap" ref={industryDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsCurrencyOpen(false);
              setIsIndustryOpen(prev => !prev);
            }}
            className={`currency-dropdown-trigger ${isIndustryOpen ? 'open' : ''}`}
            aria-haspopup="listbox"
            aria-expanded={isIndustryOpen}
          >
            <div className="currency-trigger-content">
              <span
                className="currency-trigger-name"
                style={{
                  fontWeight: data.industry ? 700 : 500,
                  color: data.industry ? 'inherit' : 'var(--text-muted, #94a3b8)',
                }}
              >
                {data.industry || 'Select your industry...'}
              </span>
            </div>
            <ChevronDown
              size={16}
              style={{
                transform: isIndustryOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                color: 'var(--text-muted, #94a3b8)',
                flexShrink: 0,
              }}
            />
          </button>

          {isIndustryOpen && (
            <div className="currency-dropdown-menu" role="listbox">
              {INDUSTRIES.map((ind) => {
                const isSelected = data.industry === ind;
                return (
                  <div
                    key={ind}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => {
                      onSelectIndustry(ind);
                      setIsIndustryOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectIndustry(ind);
                        setIsIndustryOpen(false);
                      }
                    }}
                    className={`currency-dropdown-item ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="currency-item-name">{ind}</span>
                    {isSelected && <Check size={14} className="currency-item-check" />}
                  </div>
                );
              })}
            </div>
          )}
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
        <label className="section-group-label" style={{ marginBottom: 8 }}>Team scale *</label>
        <div className="team-size-grid">
          {TEAM_SIZES.map(ts => {
            const isSelected = data.teamSize === ts.id;
            return (
              <button
                key={ts.id}
                type="button"
                onClick={() => setData(prev => ({ ...prev, teamSize: ts.id }))}
                className={`glass-card-option compact ${isSelected ? 'selected' : ''}`}
                aria-pressed={isSelected}
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

export default StepIndustry;
