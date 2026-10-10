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

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2',
  borderRadius: 10, fontSize: 14, color: '#0a0a0a', background: '#fafafa',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: '#0a0a0a', color: '#fff', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: '#f5f5f5', color: '#0a0a0a',
  border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};

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
    addLead({ ...leadForm, value: Number(leadForm.value) });
    setShowAddLeadModal(false);
    setLeadForm({
      name: '', company: '', contact: '', email: '', phone: '',
      source: 'Website Inbound', stage: 'New', value: 120000,
      followUpDate: '2026-10-12', notes: ''
    });
  };

  const stages: LeadStage[] = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Client Acquisition &amp; Leads Pipeline
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Track prospective retainers. Any "Won" lead converts to an active Client in 1 click with data carried over!
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddLeadModal(true)} style={btnPrimary}>
            <Plus style={{ width: 14, height: 14 }} />
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
              style={{ background: '#f7f7f7', border: '1px solid #e2e2e2', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', height: 650 }}
            >
              {/* Stage Header */}
              <div style={{ paddingBottom: 12, borderBottom: '1px solid #e2e2e2', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#0a0a0a' }}>{st}</span>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#e2e2e2', color: '#525252', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {stageLeads.length}
                  </span>
                </div>
                <div className="font-amount" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                  Value: ₹{stageTotal.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Lead Cards */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    style={{ padding: 14, borderRadius: 12, background: '#ffffff', border: '1px solid #e2e2e2', display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                        {lead.source}
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: 12, color: '#0a0a0a', marginTop: 2, marginBottom: 0 }}>
                        {lead.company}
                      </h4>
                      <div style={{ fontSize: 11, color: '#525252' }}>{lead.contact}</div>
                    </div>

                    <div className="font-amount" style={{ fontWeight: 800, fontSize: 13, color: '#15803d' }}>
                      ₹{lead.value.toLocaleString('en-IN')}/mo
                    </div>

                    {lead.notes && (
                      <p style={{ fontSize: 10, color: '#525252', background: '#f7f7f7', padding: 8, borderRadius: 8, border: '1px solid #e2e2e2', lineHeight: 1.5, margin: 0 }}>
                        {lead.notes}
                      </p>
                    )}

                    <div style={{ paddingTop: 8, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#525252' }}>
                        <span>Follow-up: {lead.followUpDate}</span>
                        <select
                          value={lead.stage}
                          onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                          style={{ fontSize: 10, color: '#0a0a0a', background: '#f7f7f7', borderRadius: 6, padding: '2px 6px', border: '1px solid #e2e2e2', outline: 'none', cursor: 'pointer' }}
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {lead.stage === 'Won' && (
                        <button
                          onClick={() => convertLeadToBrand(lead.id)}
                          style={{ width: '100%', padding: '6px 0', borderRadius: 8, background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                        >
                          <Sparkles style={{ width: 14, height: 14 }} />
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
        <div style={modalOverlay} onClick={() => setShowAddLeadModal(false)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 448, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 20, borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 14, margin: 0 }}>Add Prospective Client Lead</h3>
                <p style={{ fontSize: 11, color: '#525252', margin: '4px 0 0' }}>Track pipeline before client onboarding</p>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZenTech Logistics"
                  value={leadForm.company}
                  onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Contact Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value, contact: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98110 00000"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    style={inputFieldStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Expected Fee (INR)</label>
                  <input
                    type="number"
                    value={leadForm.value}
                    onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                    className="font-amount"
                    style={{ ...inputFieldStyle, fontWeight: 700, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Follow-up Date</label>
                  <input
                    type="date"
                    value={leadForm.followUpDate}
                    onChange={(e) => setLeadForm({ ...leadForm, followUpDate: e.target.value })}
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Lead Notes</label>
                <textarea
                  rows={2}
                  placeholder="Pain points, requirements..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  style={inputFieldStyle}
                ></textarea>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowAddLeadModal(false)} style={{ ...btnSecondary, fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnPrimary, fontSize: 12 }}>
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
