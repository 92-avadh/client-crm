import React from 'react';
import { Activity, ShieldCheck, DollarSign, CheckCircle2, TrendingUp, Users, ArrowUpRight, MessageSquare, Clock } from 'lucide-react';

interface PhoneMockupProps {
  screen?: 'hero-radar' | 'client-health' | 'retainer-billing' | 'portal-view' | 'chat-sync' | 'cashflow';
  className?: string;
  style?: React.CSSProperties;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  screen = 'hero-radar',
  className = '',
  style = {},
}) => {
  return (
    <div className={`iphone-frame-shell ${className}`} style={style}>
      {/* Screen Canvas */}
      <div className="iphone-screen-canvas">
        {/* Dynamic Island */}
        <div className="iphone-dynamic-island">
          <div className="camera-lens" />
          <div className="sensor-dot" />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[0.7rem] font-bold text-slate-900 select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[0.65rem]">
            <span>5G</span>
            <div className="w-4 h-2 border border-slate-800 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-900 rounded-xs" />
            </div>
          </div>
        </div>

        {/* ── Screen Content Switcher ── */}
        <div className="flex-1 px-4 pt-5 pb-4 overflow-hidden flex flex-col justify-between text-left select-none">
          {screen === 'hero-radar' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--land-forest-base)] text-white flex items-center justify-center font-bold text-xs">
                      R
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--land-forest-dark)]">Retentio OS</div>
                      <div className="text-[0.65rem] text-slate-500">Agency Operations 360</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>

                {/* Big Score Card */}
                <div className="p-4 rounded-2xl bg-[var(--land-surface-subtle)] border border-black/5 text-center mb-4">
                  <div className="text-[0.68rem] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                    Deliverables &amp; Invoicing Rate
                  </div>
                  <div className="text-4xl font-black text-[var(--land-forest-base)] tracking-tight">
                    99.4%
                  </div>
                  <div className="text-[0.7rem] text-emerald-700 font-bold mt-1">
                    100% invoices cleared on schedule
                  </div>
                </div>

                {/* Live Client Tickers */}
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Acme Global</div>
                      <div className="text-[0.65rem] text-slate-500">$16,000/mo Retainer</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[0.68rem] font-bold">
                      Flourishing
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Vortex Capital</div>
                      <div className="text-[0.65rem] text-slate-500">$22,500/mo Retainer</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[0.68rem] font-bold">
                      Renewed
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Solaria Media</div>
                      <div className="text-[0.65rem] text-slate-500">$12,000/mo Retainer</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[0.68rem] font-bold">
                      Auto-Charged
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Pill */}
              <div className="p-2.5 rounded-xl bg-[var(--land-forest-base)] text-white text-center text-xs font-bold shadow-md">
                <span>$148,500 MRR Active</span>
              </div>
            </div>
          )}

          {(screen === 'client-health' || (screen as string) === 'client-overview') && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Client Deliverables Overview
                </div>
                <div className="p-4 rounded-2xl bg-[var(--land-forest-base)] text-white text-center mb-4">
                  <div className="text-3xl font-black mb-1">98%</div>
                  <div className="text-xs text-emerald-300 font-semibold">Deliverables: 100% On-Track</div>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-black/5 text-xs flex justify-between">
                    <span className="text-slate-700">Response Time</span>
                    <strong className="text-emerald-700">24 mins (Fast)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-black/5 text-xs flex justify-between">
                    <span className="text-slate-700">Meeting Attendance</span>
                    <strong className="text-emerald-700">100% On-Time</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-black/5 text-xs flex justify-between">
                    <span className="text-slate-700">Milestone Approvals</span>
                    <strong className="text-emerald-700">6 of 6 Signed</strong>
                  </div>
                </div>
              </div>
              <div className="text-[0.68rem] text-slate-400 text-center font-mono">
                Updated live with your email & team
              </div>
            </div>
          )}

          {screen === 'retainer-billing' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Stripe Retainer Engine
                </div>
                <div className="p-4 rounded-2xl bg-[var(--land-surface-subtle)] border border-black/5 mb-4 text-center">
                  <div className="text-[0.7rem] text-slate-500 font-bold mb-1">This Month Retainers</div>
                  <div className="text-3xl font-black text-slate-900">$148,500.00</div>
                  <div className="text-xs text-emerald-700 font-bold mt-1">100% Invoices Cleared</div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 flex justify-between">
                    <div>
                      <strong className="block text-slate-900">Alpha Design</strong>
                      <span className="text-[0.65rem] text-slate-400">ACH Auto-Debit</span>
                    </div>
                    <span className="font-bold text-emerald-700">$18,000</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 flex justify-between">
                    <div>
                      <strong className="block text-slate-900">Beacon Labs</strong>
                      <span className="text-[0.65rem] text-slate-400">Stripe Card</span>
                    </div>
                    <span className="font-bold text-emerald-700">$24,000</span>
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs font-bold">
                Auto-Recurring Enabled
              </div>
            </div>
          )}

          {screen === 'portal-view' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Client Portal 2.0
                </div>
                <div className="p-3 rounded-2xl bg-[var(--land-surface-subtle)] border border-black/5 mb-4">
                  <div className="text-xs font-bold text-slate-900 mb-1">Acme Global Workspace</div>
                  <div className="text-[0.7rem] text-slate-500 font-mono">portal.agencybrand.com</div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Q3 Campaign Sprint</strong>
                      <span className="text-[0.65rem] text-slate-400">Approved 2h ago</span>
                    </div>
                    <span className="text-emerald-700 font-bold">✓ Signed</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Invoice #1094</strong>
                      <span className="text-[0.65rem] text-slate-400">Paid in 1-click</span>
                    </div>
                    <span className="text-emerald-700 font-bold">$16,000</span>
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[var(--land-forest-base)] text-white text-center text-xs font-bold">
                Zero Password Logins
              </div>
            </div>
          )}

          {screen === 'chat-sync' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Live Client Thread
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800">
                    <strong className="block text-[0.7rem] text-slate-900 mb-0.5">Client CMO:</strong>
                    "The new branding deliverables look incredible! Ready to renew for Q4."
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--land-forest-base)] text-white ml-4">
                    <strong className="block text-[0.7rem] text-emerald-300 mb-0.5">Agency Partner:</strong>
                    "Thank you Sarah! Retainer agreement has been auto-extended."
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs font-bold">
                Synced with your email & team
              </div>
            </div>
          )}

          {screen === 'cashflow' && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Cashflow Overview
                </div>
                <div className="p-4 rounded-2xl bg-[var(--land-forest-base)] text-white text-center mb-4">
                  <div className="text-xs text-emerald-300 font-bold mb-1">Annual Retained Run-Rate</div>
                  <div className="text-3xl font-black">$1,782,000</div>
                  <div className="text-[0.7rem] text-emerald-300 mt-1">↑ 24% YoY Compound Growth</div>
                </div>
              </div>
              <div className="text-[0.68rem] text-slate-400 text-center font-mono">
                Predictable Agency Cashflow
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
