import React from 'react';

const INTEGRATIONS = [
  { name: 'Razorpay', symbol: '◈ Razorpay' },
  { name: 'WhatsApp', symbol: '✆ WhatsApp' },
  { name: 'Slack', symbol: '⌘ Slack' },
  { name: 'Discord', symbol: '◉ Discord' },
  { name: 'SMTP Email', symbol: '✉ Email' },
];

const CAPABILITIES = [
  'Client Portal & Approvals',
  'GST Invoicing & Recurring Billing',
  'Razorpay Online Payments',
  'Offline Payment Recording',
  'Deliverable Milestones & Deadlines',
  'Agency Finance & Profit Analytics',
  'Projects, Tasks & Meetings',
  'Leads Pipeline to Conversion',
  '13-Currency Support',
  'Slack & Discord Alerts',
  'WhatsApp Click-to-Share',
  'Audit Log & Notifications',
];

export const VelocityMarquee: React.FC = () => {
  return (
    <section className="w-full py-6 md:py-10 overflow-hidden border-y border-[var(--land-border)] bg-[var(--land-bg-subtle)] land-marquee-container">
      {/* Top Track: Real integrations */}
      <div className="mb-4">
        <div className="text-center text-xs font-bold uppercase tracking-widest text-[var(--land-text-muted)] mb-3 px-4">
          Works with the tools your agency already uses
        </div>
        <div className="flex overflow-hidden select-none">
          <div className="land-marquee-track items-center gap-10 sm:gap-16 pr-10 sm:pr-16">
            {[...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm sm:text-base md:text-lg font-bold text-[var(--land-text-secondary)] opacity-70 hover:opacity-100 transition-opacity cursor-default font-mono tracking-tight"
              >
                <span>{item.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Track: Deep Forest Green Contrast Strip */}
      <div
        className="py-2.5 sm:py-3 px-2 sm:px-4 mx-2 sm:mx-4 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(90deg, var(--land-emerald-950), var(--land-emerald-900), var(--land-emerald-950))',
          color: '#ffffff',
        }}
      >
        <div className="flex overflow-hidden select-none">
          <div className="land-marquee-track-reverse items-center gap-6 sm:gap-8 pr-6 sm:pr-8 text-xs sm:text-sm font-semibold tracking-wide">
            {[...CAPABILITIES, ...CAPABILITIES, ...CAPABILITIES].map((cap, idx) => (
              <div key={idx} className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--land-emerald-400)] shrink-0" />
                <span className="text-emerald-100 font-medium">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
