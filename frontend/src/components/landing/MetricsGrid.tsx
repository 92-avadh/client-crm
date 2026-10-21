import React from 'react';
import { DollarSign, RefreshCw, Zap, Globe2 } from 'lucide-react';

const METRICS = [
  {
    value: '500k+',
    label: 'Client Deliverables Managed',
    description: 'Tracked across global client accounts with zero forgotten scope items.',
    icon: Zap,
  },
  {
    value: '98.4%',
    label: 'On-Time Renewal Rate',
    description: 'Agencies using Retentio renew client agreements before contracts lapse.',
    icon: RefreshCw,
  },
  {
    value: '$84M+',
    label: 'Client ARR Protected',
    description: 'Safeguarded against avoidable churn via proactive early-warning radar.',
    icon: DollarSign,
  },
  {
    value: '42',
    label: 'Countries Worldwide',
    description: 'Leading dev shops, design studios, and advisory firms scaling on one OS.',
    icon: Globe2,
  },
];

export const MetricsGrid: React.FC = () => {
  return (
    <section className="py-12 md:py-16 px-4 max-w-[1240px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {METRICS.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl border border-[var(--land-border-subtle)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              style={{
                boxShadow: '0 10px 30px -5px rgba(14, 46, 35, 0.05)',
              }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--land-mint-pill)] text-[var(--land-forest-base)] flex items-center justify-center mb-5">
                  <Icon size={20} />
                </div>
                <div
                  className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-[var(--land-forest-base)]"
                  style={{ fontFamily: 'var(--land-font-head)' }}
                >
                  {metric.value}
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                  {metric.label}
                </div>
              </div>
              <p className="text-xs text-[var(--land-text-subtle)] leading-relaxed mt-2 font-medium">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
