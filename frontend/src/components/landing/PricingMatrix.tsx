import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export const PricingMatrix: React.FC<{ onSelectPlan?: (tier: string) => void }> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const TIERS = [
    {
      name: 'Boutique',
      kicker: 'Solo & Emerging Studios',
      price: billingCycle === 'annual' ? 39 : 49,
      description: 'Ideal for small agencies and boutique consultancies managing up to 15 active retainer clients.',
      features: [
        'Up to 15 Active Retainer Clients',
        'Automated Recurring Invoices via Stripe',
        'Standard Client Portal with Deliverables',
        'Basic Client Health Indicators',
        'Direct Stripe & ACH Settlement',
        'Standard Email Support',
      ],
      popular: false,
      ctaText: 'Start Boutique Trial',
    },
    {
      name: 'Agency Pro',
      kicker: 'High-Growth Agencies',
      price: billingCycle === 'annual' ? 99 : 129,
      description: 'Everything an ambitious creative or engineering agency needs to eliminate churn and scale retainers.',
      features: [
        'Unlimited Active Retainer Clients',
        'AI Churn Sentinel (60-day early warnings)',
        'White-Label Portal on Custom Domain',
        'Team Capacity & Sprint Milestone Tracking',
        'Automated Late Payment Sequences',
        'Multi-Currency & Zero-Fee ACH Debits',
        'Priority 24/7 Chat & Slack Support',
      ],
      popular: true,
      ctaText: 'Start Agency Pro Trial',
    },
    {
      name: 'Enterprise',
      kicker: 'Multi-Brand & Holding Cos',
      price: billingCycle === 'annual' ? 239 : 299,
      description: 'Advanced governance, multiple distinct agency subsidiaries, and dedicated retention account advisory.',
      features: [
        'Unlimited Multi-Brand Workspaces',
        'Dedicated Retention Strategy Manager',
        'Custom Webhooks & REST API Access',
        'White-Glove Data & Client Migration',
        '99.99% Guaranteed Uptime SLA',
        'Custom Master Service Agreements (MSA)',
      ],
      popular: false,
      ctaText: 'Contact Enterprise Sales',
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 px-4 max-w-[1240px] mx-auto">
      {/* Header */}
      <div className="text-center max-w-[700px] mx-auto mb-14">
        <div className="land-kicker mx-auto mb-4">Transparent Pricing</div>
        <h2 className="land-display-section mb-4">
          One Retained Client Pays for Retentio for a Decade
        </h2>
        <p className="land-subhead mb-8">
          Simple, predictable pricing with no hidden seat fees. Try free for 14 days with zero risk.
        </p>

        {/* ── Billing Cycle Pill Switcher ── */}
        <div className="inline-flex items-center p-1.5 rounded-full bg-[var(--land-bg-subtle)] border border-black/10">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-[var(--land-emerald-900)] text-white shadow-sm'
                : 'text-[var(--land-text-secondary)] hover:text-black'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-[var(--land-emerald-900)] text-white shadow-sm'
                : 'text-[var(--land-text-secondary)] hover:text-black'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* ── Tiers Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {TIERS.map((tier, idx) => (
          <div
            key={idx}
            className={`p-8 sm:p-9 rounded-[32px] border transition-all duration-300 flex flex-col justify-between relative ${
              tier.popular
                ? 'bg-[var(--land-emerald-950)] text-white shadow-2xl border-emerald-500/40 ring-2 ring-emerald-500/20 lg:-translate-y-2'
                : 'bg-[var(--land-bg-surface)] text-[var(--land-text-primary)] border-[var(--land-border)] shadow-sm hover:shadow-lg'
            }`}
          >
            {/* Popular Badge */}
            {tier.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                <Sparkles size={12} />
                Most Popular for Agencies
              </div>
            )}

            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
                {tier.kicker}
              </div>
              <h3 className="text-2xl font-black mb-2">{tier.name}</h3>
              <p className={`text-xs leading-relaxed mb-6 ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                {tier.description}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
                  ${tier.price}
                </span>
                <span className="text-sm font-semibold opacity-70">
                  / month
                </span>
              </div>

              {/* Feature List */}
              <div className="space-y-3 pt-6 border-t border-black/10 dark:border-white/10 mb-8">
                {tier.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <Check
                      size={16}
                      className={`flex-shrink-0 mt-0.5 ${
                        tier.popular ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    />
                    <span className={tier.popular ? 'text-slate-200' : 'text-[var(--land-text-secondary)]'}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <button
              onClick={() => onSelectPlan?.(tier.name)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tier.popular
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg hover:scale-[1.02]'
                  : 'bg-[var(--land-emerald-900)] hover:bg-[var(--land-emerald-800)] text-white'
              }`}
            >
              <span>{tier.ctaText}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
