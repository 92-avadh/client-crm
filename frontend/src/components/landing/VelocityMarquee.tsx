import React from 'react';

const LOGOS = [
  { name: 'Vercel', symbol: '▲ Vercel' },
  { name: 'Stripe', symbol: '/// Stripe' },
  { name: 'Linear', symbol: '✦ Linear' },
  { name: 'Figma', symbol: '❖ Figma' },
  { name: 'Framer', symbol: '■ Framer' },
  { name: 'Supabase', symbol: '⚡ Supabase' },
  { name: 'Notion', symbol: 'N Notion' },
  { name: 'GitHub', symbol: '◉ GitHub' },
];

const CAPABILITIES = [
  'AI Churn Sentinel',
  'Automated Smart Retainers',
  'Instant White-Label Portals',
  'One-Click Stripe Invoicing',
  'Team Capacity Heatmaps',
  'Multi-Currency Ledger',
  'Predictive Cash Flow Telemetry',
  'Client Satisfaction Radar',
  'Milestone Approvals',
  'Integrated Agency Chat',
];

export const VelocityMarquee: React.FC = () => {
  return (
    <section className="w-full py-8 md:py-12 overflow-hidden border-y border-[var(--land-border)] bg-[var(--land-bg-subtle)] land-marquee-container">
      {/* Top Track: Brand Trust Logos */}
      <div className="mb-4">
        <div className="text-center text-xs font-bold uppercase tracking-widest text-[var(--land-text-muted)] mb-4">
          Trusted by top digital agencies, dev shops & creative consultancies
        </div>
        <div className="flex overflow-hidden select-none">
          <div className="land-marquee-track items-center gap-12 sm:gap-16 pr-12">
            {[...LOGOS, ...LOGOS, ...LOGOS].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-base sm:text-lg font-bold text-[var(--land-text-secondary)] opacity-70 hover:opacity-100 transition-opacity cursor-default font-mono tracking-tight"
              >
                <span>{item.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Track: Deep Forest Green Contrast Strip */}
      <div
        className="py-3 sm:py-3.5 -mx-2 rounded-2xl overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(90deg, var(--land-emerald-950), var(--land-emerald-900), var(--land-emerald-950))',
          color: '#ffffff',
        }}
      >
        <div className="flex overflow-hidden select-none">
          <div className="land-marquee-track-reverse items-center gap-8 pr-8 text-xs sm:text-sm font-semibold tracking-wide">
            {[...CAPABILITIES, ...CAPABILITIES, ...CAPABILITIES].map((cap, idx) => (
              <div key={idx} className="flex items-center gap-3 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--land-emerald-400)]" />
                <span className="text-emerald-100 font-medium">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
