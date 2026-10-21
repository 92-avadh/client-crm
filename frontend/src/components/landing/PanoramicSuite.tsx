import React from 'react';
import { PhoneMockup } from './PhoneMockup';

export const PanoramicSuite: React.FC = () => {
  return (
    <section className="py-24 md:py-36 px-4 overflow-hidden relative" style={{ background: 'var(--land-forest-dark)' }}>
      {/* ── Monank Massive Watermark Typography ── */}
      <div
        className="text-center select-none pointer-events-none mb-10 text-white"
        style={{
          fontFamily: 'var(--land-font-head)',
          fontSize: 'clamp(2.75rem, 6.5vw, 6.5rem)',
          fontWeight: 850,
          lineHeight: 1.05,
          letterSpacing: '-0.04em',
        }}
      >
        Keeping Your Retainers
        <br />
        In One App.
      </div>

      <div className="max-w-[1400px] mx-auto text-center relative z-10">
        <p className="text-base sm:text-xl text-slate-300 max-w-[680px] mx-auto leading-relaxed mb-16 font-medium">
          Say goodbye to six disconnected tools. Retentio combines client sentiment radar, recurring billing, white-label portals, and agency chat into one synced command center.
        </p>

        {/* ── Monank 5-Phone Panoramic Fan Suite ── */}
        <div className="flex flex-wrap lg:flex-nowrap justify-center items-end gap-4 lg:gap-6 pt-4 pb-8 overflow-visible">
          {/* Phone 1: Cashflow (Far Left - tilted left) */}
          <div className="fan-device-phone transform lg:-rotate-6 lg:translate-y-6">
            <PhoneMockup screen="cashflow" className="h-[520px] shadow-2xl" />
          </div>

          {/* Phone 2: Retainer Billing (Center Left - slight tilt) */}
          <div className="fan-device-phone transform lg:-rotate-3 lg:translate-y-2">
            <PhoneMockup screen="retainer-billing" className="h-[550px] shadow-2xl" />
          </div>

          {/* Phone 3: Master Radar Overview (Center - Elevated & Tallest) */}
          <div className="fan-device-phone transform lg:-translate-y-4 z-20">
            <PhoneMockup screen="hero-radar" className="h-[580px] shadow-2xl ring-2 ring-emerald-500/40" />
          </div>

          {/* Phone 4: Client Portal (Center Right - slight tilt) */}
          <div className="fan-device-phone transform lg:rotate-3 lg:translate-y-2">
            <PhoneMockup screen="portal-view" className="h-[550px] shadow-2xl" />
          </div>

          {/* Phone 5: Live Chat Sync (Far Right - tilted right) */}
          <div className="fan-device-phone transform lg:rotate-6 lg:translate-y-6">
            <PhoneMockup screen="chat-sync" className="h-[520px] shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
