import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Lead, LeadStage } from '../../types';
import {
  Target,
  Plus,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';

export const LeadsPipeline: React.FC = () => {
  const {
    leads,
    addLead,
    updateLeadStage,
    convertLeadToBrand
  } = useApp();

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    company: '',
    contact: '',
    email: '',
    phone: '',
    source: 'Website Inbound',
    stage: 'New' as LeadStage,
    value: 120000,
    followUpDate: '2026-10-12',
    notes: ''
  });

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.company || !leadForm.name) return;
    addLead({
      ...leadForm,
      value: Number(leadForm.value)
    });
    setShowAddLeadModal(false);
    setLeadForm({
      name: '',
      company: '',
      contact: '',
      email: '',
      phone: '',
      source: 'Website Inbound',
      stage: 'New',
      value: 120000,
      followUpDate: '2026-10-12',
      notes: ''
    });
  };

  const stages: LeadStage[] = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Client Acquisition & Leads Pipeline
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Track prospective retainers. Any "Won" lead converts to an active Client in 1 click with data carried over!
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddLeadModal(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Prospective Lead</span>
          </button>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {stages.map((st) => {
          const stageLeads = leads.filter((l) => l.stage === st);
          const stageTotal = stageLeads.reduce((acc, l) => acc + l.value, 0);

          return (
            <div
              key={st}
              className="glass-panel p-3 flex flex-col h-[650px] bg-[#0c121e]/80"
            >
              {/* Stage Header */}
              <div className="pb-3 border-b border-[rgba(255,255,255,0.06)] mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{st}</span>
                  <span className="w-5 h-5 rounded-full bg-[#131c2e] text-slate-300 font-bold text-[10px] flex items-center justify-center">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Value: ₹{stageTotal.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Lead Cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] hover:border-indigo-500/40 transition-all space-y-2.5"
                  >
                    <div>
                      <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                        {lead.source}
                      </div>
                      <h4 className="font-bold text-xs text-slate-100 mt-0.5">
                        {lead.company}
                      </h4>
                      <div className="text-[11px] text-slate-400">{lead.contact}</div>
                    </div>

                    <div className="font-mono font-bold text-xs text-emerald-400">
                      ₹{lead.value.toLocaleString('en-IN')}/mo
                    </div>

                    {lead.notes && (
                      <p className="text-[10px] text-slate-400 bg-[#0a0e17] p-2 rounded-lg leading-relaxed">
                        {lead.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Follow-up: {lead.followUpDate}</span>
                        <select
                          value={lead.stage}
                          onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                          className="bg-[#0a0e17] text-[10px] text-slate-300 rounded px-1.5 py-0.5 border border-[rgba(255,255,255,0.08)] outline-none"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 1-Click Convert to Client Button if Won or ready! */}
                      {lead.stage === 'Won' && (
                        <button
                          onClick={() => convertLeadToBrand(lead.id)}
                          className="w-full py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>1-Click Convert to Client</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="modal-overlay" onClick={() => setShowAddLeadModal(false)}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Add Prospective Client Lead</h3>
                <p className="text-[11px] text-slate-400">Track pipeline before client onboarding</p>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZenTech Logistics"
                  value={leadForm.company}
                  onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value, contact: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98110 00000"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Fee (INR)</label>
                  <input
                    type="number"
                    value={leadForm.value}
                    onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={leadForm.followUpDate}
                    onChange={(e) => setLeadForm({ ...leadForm, followUpDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lead Notes</label>
                <textarea
                  rows={2}
                  placeholder="Pain points, requirements..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  className="input-field"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
