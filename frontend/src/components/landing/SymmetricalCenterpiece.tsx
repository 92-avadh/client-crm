import React from 'react';
import { ShieldAlert, CreditCard, ExternalLink, Activity, Check } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';

export const SymmetricalCenterpiece: React.FC = () => {
  return (
    <section id="symmetrical-showcase" className="py-24 md:py-32 px-4 max-w-[1280px] mx-auto">
      {/* ── Section Header (Reference Image 1) ── */}
      <div className="text-center max-w-[760px] mx-auto mb-20">
        <div className="monank-kicker-pill mx-auto mb-4">
          Why Choose Retentio
        </div>
        <h2 className="editorial-section-title mb-4">
          Benefits of Using Retentio
        </h2>
        <p className="editorial-lead">
          Discover how our platform transforms client retention. From automated retainer invoicing to early client health alerts, it is your agency's unfair retention advantage.
        </p>
      </div>

      {/* ── 3-Column Symmetrical Centerpiece (Reference Image 1 Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: 2 Large Floating Cards */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Feature Card 1 */}
          <div className="symmetrical-card-float">
            <div className="symmetrical-badge-circle">
              <ShieldAlert size={26} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--land-text-title)] mb-3">
              Client Health Monitor
            </h3>
            <p className="text-sm sm:text-base text-[var(--land-text-body)] leading-relaxed mb-4">
              Continuous activity monitoring across client projects. Detects inactive clients and delayed responses weeks before renewal dates.
            </p>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Check size={16} />
              <span>99.4% Predictive Accuracy</span>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="symmetrical-card-float">
            <div className="symmetrical-badge-circle">
              <ExternalLink size={26} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--land-text-title)] mb-3">
              White-Label Client Portal
            </h3>
            <p className="text-sm sm:text-base text-[var(--land-text-body)] leading-relaxed mb-4">
              Deliver a luxury client experience on your own agency domain. Sprint approvals, file deliverables, and invoice payments with zero login friction.
            </p>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Check size={16} />
              <span>Custom Domain & Brand Assets</span>
            </div>
          </div>
        </div>

        {/* Center Column: Prominent Realistic iPhone 16 Pro */}
        <div className="lg:col-span-4 flex justify-center py-4">
          <PhoneMockup
            screen="client-health"
            className="w-[280px] sm:w-[310px] md:w-[330px] h-[580px] sm:h-[630px] md:h-[660px] shadow-2xl transition-transform hover:scale-105 duration-300"
          />
        </div>

        {/* Right Column: 2 Large Floating Cards */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Feature Card 3 */}
          <div className="symmetrical-card-float">
            <div className="symmetrical-badge-circle">
              <CreditCard size={26} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--land-text-title)] mb-3">
              Smart Recurring Retainers
            </h3>
            <p className="text-sm sm:text-base text-[var(--land-text-body)] leading-relaxed mb-4">
              Automated multi-tier recurring retainer agreements. Auto-charges client credit cards or ACH accounts on the 1st of every month without manual chasing.
            </p>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Check size={16} />
              <span>Zero-Fee Stripe ACH Settlement</span>
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="symmetrical-card-float">
            <div className="symmetrical-badge-circle">
              <Activity size={26} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--land-text-title)] mb-3">
              Automated Health Scoring
            </h3>
            <p className="text-sm sm:text-base text-[var(--land-text-body)] leading-relaxed mb-4">
              Combines payment speed, milestone approvals, and communication frequency into a single clear 0–100 health score for every client.
            </p>
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Check size={16} />
              <span>Live Account Health Alerts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
