import React, { useState, useMemo } from 'react';
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
  X,
  Lock
} from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { getPlanLimits } from '../../utils/subscriptionPlan';
import { PlanUpgradeModal } from '../common/PlanUpgradeModal';

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--bg-raised)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};

export const LeadsPipeline: React.FC = () => {
  const {
    leads,
    addLead,
    updateLeadStage,
    convertLeadToBrand,
    currencySymbol,
    settings,
  } = useApp();

  const planLimits = useMemo(() => getPlanLimits(settings), [settings]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    company: '',
    contact: '',
    email: '',
    phone: '',
    source: 'Website Inbound',
    stage: 'New' as LeadStage,
    value: 0,
    followUpDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.company || !leadForm.name) return;
    addLead({ ...leadForm, value: Number(leadForm.value) || 0 });
    setShowAddLeadModal(false);
    setLeadForm({
      name: '', company: '', contact: '', email: '', phone: '',
      source: 'Website Inbound', stage: 'New', value: 0,
      followUpDate: new Date().toISOString().split('T')[0], notes: ''
    });
  };

  const stages: LeadStage[] = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];

  // Plan Lock Check for Free Starter Plan
  if (!planLimits.canAccessLeads) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px 20px', maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            background: 'rgba(5, 150, 57, 0.1)',
            color: '#059639',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '1px solid rgba(5, 150, 57, 0.25)',
          }}
        >
          <Target size={36} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Lock size={12} />
          <span>Growth Plan Feature</span>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Leads CRM Pipeline is Locked
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 auto 28px' }}>
          Track prospective client leads, manage deal progression across Kanban stages, and convert "Won" leads to active retainer clients in 1 click. Upgrade to Growth (₹3,999/mo) to unlock the full pipeline.
        </p>
        <button
          type="button"
          onClick={() => setShowUpgradeModal(true)}
          style={{
            padding: '12px 28px',
            background: 'var(--solid-btn-bg, #059639)',
            color: 'var(--solid-btn-text, #ffffff)',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(5, 150, 57, 0.3)',
          }}
        >
          <span>Upgrade to Growth (₹3,999/mo)</span>
          <ArrowRight size={16} />
        </button>

        <PlanUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Unlock Leads CRM Pipeline"
          description="Upgrade to the Growth Plan to track prospective clients, manage pipeline stages, and grow recurring retainers."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Client Acquisition &amp; Leads Pipeline
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Track prospective retainers. Any "Won" lead converts to an active Client in 1 click with data carried over!
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
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
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', height: 650 }}
            >
              {/* Stage Header */}
              <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{st}</span>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {stageLeads.length}
                  </span>
                </div>
                <div className="font-amount" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Total: {currencySymbol}<AnimatedNumber value={stageTotal} />
                </div>
              </div>

              {/* Cards Container */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>{lead.company}</span>
                      <span className="font-amount" style={{ fontWeight: 800, fontSize: 12, color: 'var(--success-text)' }}>
                        {currencySymbol}{lead.value.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 style={{ width: 12, height: 12 }} /> {lead.name}
                    </div>

                    {lead.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-subtle)', padding: '4px 6px', borderRadius: 4 }}>
                        "{lead.notes}"
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar style={{ width: 10, height: 10 }} /> Follow-up: {lead.followUpDate}
                    </div>

                    {/* Stage Transition Control */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                      <select
                        value={lead.stage}
                        onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                        style={{ fontSize: 11, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 4px', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        {stages.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      {lead.stage === 'Won' && (
                        <button
                          type="button"
                          onClick={() => convertLeadToBrand(lead.id)}
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            background: 'var(--success-bg)',
                            color: 'var(--success-text)',
                            border: '1px solid var(--success-border)',
                            borderRadius: 6,
                            padding: '3px 6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                          title="Convert to Active Client"
                        >
                          <CheckCircle2 style={{ width: 10, height: 10 }} /> Convert
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
        <div style={modalOverlay}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target style={{ width: 18, height: 18, color: 'var(--solid-btn-bg)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Add Prospective Lead</h3>
              </div>
              <button type="button" onClick={() => setShowAddLeadModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Company / Brand *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={leadForm.company}
                  onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Primary Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    style={inputFieldStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Expected Fee ({currencySymbol})</label>
                  <input
                    type="number"
                    value={leadForm.value}
                    onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                    className="font-amount"
                    style={{ ...inputFieldStyle, fontWeight: 700, fontSize: 13 }}
                  />
                </div>
                <div>
                  <DatePicker
                    value={leadForm.followUpDate}
                    onChange={(date) => setLeadForm({ ...leadForm, followUpDate: date })}
                    label="Follow-up Date"
                    placeholder="Select follow-up date"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Lead Notes</label>
                <textarea
                  rows={2}
                  placeholder="Pain points, requirements..."
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  style={inputFieldStyle}
                ></textarea>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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

      <PlanUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Unlock Leads CRM Pipeline"
        description="Upgrade to the Growth Plan to track prospective clients, manage pipeline stages, and grow recurring retainers."
      />
    </div>
  );
};
