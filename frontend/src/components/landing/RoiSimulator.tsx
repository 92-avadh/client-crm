import React, { useState } from 'react';
import { Calculator, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RoiSimulator: React.FC<{ onStartTrial?: () => void }> = ({ onStartTrial }) => {
  const [clients, setClients] = useState<number>(18);
  const [retainerAmount, setRetainerAmount] = useState<number>(8500);
  const [agencyType, setAgencyType] = useState<'dev' | 'design' | 'growth'>('growth');

  // Calculations
  const monthlyRevenue = clients * retainerAmount;
  const annualRevenue = monthlyRevenue * 12;

  // Unprotected industry churn average is ~14% per year; Retentio reduces this to ~2%
  const churnSavedAnnual = Math.round(annualRevenue * 0.12);
  const adminHoursSavedMonthly = Math.round(clients * 1.75);
  const roiMultiplier = Math.round(churnSavedAnnual / 1548); // relative to Growth tier ($129 * 12)

  return (
    <section id="roi-simulator" className="py-20 md:py-28 px-4 max-w-[1200px] mx-auto">
      <div
        className="rounded-[36px] p-6 sm:p-10 md:p-14 border shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, var(--land-bg-subtle) 100%)',
          borderColor: 'var(--land-border-strong)',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: 'var(--land-emerald-400)' }}
        />

        {/* Section Header */}
        <div className="max-w-[700px] mb-12">
          <div className="land-kicker mb-3 flex items-center gap-1.5">
            <Calculator size={14} className="text-emerald-800" />
            <span>Interactive Profit Calculator</span>
          </div>
          <h2 className="land-display-section mb-3">
            Estimate Your Agency's Retention ROI
          </h2>
          <p className="land-subhead">
            Move the sliders to see how much client revenue Retentio protects for your firm each year.
          </p>
        </div>

        {/* ── Interactive Playground Grid (Linea #tune Inspired) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Column (Sliders & Segments) */}
          <div className="lg:col-span-7 space-y-7">
            {/* Agency Type Segment */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--land-text-muted)] mb-2.5">
                Agency Focus
              </label>
              <div className="inline-flex p-1.5 rounded-2xl bg-[var(--land-bg-subtle)] border border-black/5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAgencyType('growth')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    agencyType === 'growth'
                      ? 'bg-[var(--land-emerald-900)] text-white shadow-sm'
                      : 'text-[var(--land-text-secondary)] hover:text-black'
                  }`}
                >
                  Growth & Marketing
                </button>
                <button
                  type="button"
                  onClick={() => setAgencyType('dev')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    agencyType === 'dev'
                      ? 'bg-[var(--land-emerald-900)] text-white shadow-sm'
                      : 'text-[var(--land-text-secondary)] hover:text-black'
                  }`}
                >
                  Software & Dev Shop
                </button>
                <button
                  type="button"
                  onClick={() => setAgencyType('design')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    agencyType === 'design'
                      ? 'bg-[var(--land-emerald-900)] text-white shadow-sm'
                      : 'text-[var(--land-text-secondary)] hover:text-black'
                  }`}
                >
                  Design & Branding
                </button>
              </div>
            </div>

            {/* Slider 1: Active Retainers */}
            <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-[var(--land-emerald-950)]">
                  Active Retainer Clients
                </span>
                <span className="font-mono text-base font-extrabold px-3 py-1 rounded-lg bg-[var(--land-emerald-100)] text-[var(--land-emerald-900)]">
                  {clients} Clients
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={clients}
                onChange={(e) => setClients(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-700 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[0.7rem] text-slate-400 mt-2 font-mono">
                <span>3 Clients</span>
                <span>30 Clients</span>
                <span>60 Clients</span>
              </div>
            </div>

            {/* Slider 2: Average Monthly Retainer Amount */}
            <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-[var(--land-emerald-950)]">
                  Average Monthly Retainer ($)
                </span>
                <span className="font-mono text-base font-extrabold px-3 py-1 rounded-lg bg-[var(--land-emerald-100)] text-[var(--land-emerald-900)]">
                  ${retainerAmount.toLocaleString()}/mo
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="25000"
                step="500"
                value={retainerAmount}
                onChange={(e) => setRetainerAmount(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-700 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[0.7rem] text-slate-400 mt-2 font-mono">
                <span>$1,500/mo</span>
                <span>$12,500/mo</span>
                <span>$25,000/mo</span>
              </div>
            </div>
          </div>

          {/* Results Display Column (Linea #tune Output) */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-6 sm:p-8 text-white relative shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, var(--land-emerald-950), #061510)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                  Annual Impact Forecast
                </span>
                <span className="text-[0.7rem] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  {roiMultiplier}x Estimated ROI
                </span>
              </div>

              {/* Major Output: Revenue Saved */}
              <div className="mb-6">
                <span className="text-xs text-slate-400 block mb-1">
                  Projected Saved Client Revenue (Annual)
                </span>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                  +${churnSavedAnnual.toLocaleString()}
                </div>
                <span className="text-xs text-slate-300 mt-1 block">
                  Based on preventing 12% avoidable client drop-offs.
                </span>
              </div>

              {/* Sub-Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mb-6">
                <div>
                  <span className="text-xs text-slate-400 block">Monthly Invoiced</span>
                  <strong className="text-base sm:text-lg font-bold text-white font-mono">
                    ${monthlyRevenue.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Admin Hours Saved</span>
                  <strong className="text-base sm:text-lg font-bold text-emerald-300 font-mono">
                    ~{adminHoursSavedMonthly} hrs/mo
                  </strong>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onStartTrial}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Protect This Revenue Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
