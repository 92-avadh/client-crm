import React from 'react';
import { ArrowUpRight, QrCode, Smartphone, CheckCircle, Sparkles } from 'lucide-react';

export const ClosingQrCta: React.FC<{ onStartTrial?: () => void }> = ({ onStartTrial }) => {
  return (
    <section className="py-20 md:py-24 px-4 max-w-[1240px] mx-auto">
      <div
        className="rounded-[36px] p-8 sm:p-12 md:p-16 border shadow-2xl relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, var(--land-emerald-950) 0%, var(--land-emerald-900) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Ambient Top Corner Light */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none opacity-30 blur-3xl"
          style={{ background: 'var(--land-emerald-400)' }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Column: Direct Value Proposition */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 mb-4 border border-emerald-400/30">
              <Sparkles size={13} />
              <span>Instant Agency Deployment</span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight text-white"
              style={{ fontFamily: 'var(--land-font-display)' }}
            >
              Ready to Stop Client Churn & Guarantee Your Retainers?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-[560px]">
              Join over 1,400+ leading agencies protecting $84M+ in client revenue. Set up your agency workspace and client health radar in under 2 minutes.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                onClick={onStartTrial}
                className="land-btn-primary"
                style={{
                  background: 'var(--land-emerald-400)',
                  color: 'var(--land-emerald-950)',
                  minHeight: '3.4rem',
                  padding: '0.85rem 2.25rem',
                  fontWeight: 800,
                }}
              >
                <span className="land-btn-label">
                  <span>Start Free 14-Day Trial</span>
                  <ArrowUpRight size={17} />
                </span>
                <span className="land-btn-wave" aria-hidden="true">
                  <span style={{ backgroundColor: 'var(--land-emerald-950)' }} />
                  <span style={{ backgroundColor: 'var(--land-emerald-950)' }} />
                  <span style={{ backgroundColor: 'var(--land-emerald-950)' }} />
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-400" />
                Cancel anytime in 1-click
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-400" />
                Instant Stripe integration
              </span>
            </div>
          </div>

          {/* Right Column: Live Mobile Portal QR Code Showcase (Reference Image 1) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="p-6 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center max-w-[300px]">
              {/* Stylized QR Code SVG Box */}
              <div className="w-48 h-48 rounded-2xl bg-white p-3 shadow-inner flex items-center justify-center mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                  {/* Top-Left Corner Box */}
                  <rect x="10" y="10" width="24" height="24" rx="4" fill="#0a1f18" />
                  <rect x="15" y="15" width="14" height="14" rx="2" fill="#ffffff" />
                  <rect x="18" y="18" width="8" height="8" rx="1" fill="#0a1f18" />

                  {/* Top-Right Corner Box */}
                  <rect x="66" y="10" width="24" height="24" rx="4" fill="#0a1f18" />
                  <rect x="71" y="15" width="14" height="14" rx="2" fill="#ffffff" />
                  <rect x="74" y="18" width="8" height="8" rx="1" fill="#0a1f18" />

                  {/* Bottom-Left Corner Box */}
                  <rect x="10" y="66" width="24" height="24" rx="4" fill="#0a1f18" />
                  <rect x="15" y="71" width="14" height="14" rx="2" fill="#ffffff" />
                  <rect x="18" y="74" width="8" height="8" rx="1" fill="#0a1f18" />

                  {/* Grid Bits Pattern */}
                  <rect x="38" y="10" width="6" height="6" rx="1" fill="#0a1f18" />
                  <rect x="48" y="10" width="12" height="6" rx="1" fill="#0a1f18" />
                  <rect x="38" y="22" width="10" height="6" rx="1" fill="#0a1f18" />
                  <rect x="52" y="22" width="8" height="6" rx="1" fill="#0a1f18" />

                  <rect x="10" y="38" width="8" height="8" rx="1" fill="#0a1f18" />
                  <rect x="22" y="38" width="6" height="6" rx="1" fill="#0a1f18" />
                  <rect x="32" y="38" width="14" height="6" rx="1" fill="#0a1f18" />
                  <rect x="50" y="38" width="12" height="6" rx="1" fill="#0a1f18" />
                  <rect x="66" y="38" width="6" height="6" rx="1" fill="#0a1f18" />
                  <rect x="76" y="38" width="14" height="8" rx="1" fill="#0a1f18" />

                  <rect x="38" y="48" width="8" height="12" rx="1" fill="#0a1f18" />
                  <rect x="50" y="52" width="14" height="8" rx="1" fill="#0a1f18" />
                  <rect x="68" y="50" width="8" height="10" rx="1" fill="#0a1f18" />
                  <rect x="80" y="52" width="10" height="8" rx="1" fill="#0a1f18" />

                  <rect x="38" y="66" width="10" height="8" rx="1" fill="#0a1f18" />
                  <rect x="52" y="66" width="6" height="12" rx="1" fill="#0a1f18" />
                  <rect x="64" y="66" width="12" height="8" rx="1" fill="#0a1f18" />
                  <rect x="80" y="66" width="10" height="6" rx="1" fill="#0a1f18" />

                  <rect x="38" y="78" width="8" height="12" rx="1" fill="#0a1f18" />
                  <rect x="50" y="82" width="14" height="8" rx="1" fill="#0a1f18" />
                  <rect x="68" y="78" width="8" height="12" rx="1" fill="#0a1f18" />
                  <rect x="80" y="76" width="10" height="14" rx="1" fill="#0a1f18" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
                <Smartphone size={14} />
                <span>Test Live Mobile Portal</span>
              </div>
              <p className="text-[0.72rem] text-slate-300 leading-normal">
                Scan with any phone camera to experience the client view on iOS or Android.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
