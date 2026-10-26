import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Layers
} from 'lucide-react';

export const ClientIntakePage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const agencyTitle = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Retentio Workspace';

  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    mobile: '',
    billingAddress: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    pan: '',
    serviceDetails: '',
    contractStartDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const availableServices = [
    'Performance Marketing (Meta & Google Ads)',
    'Social Media Management & Content',
    'Brand Identity & Graphic Design',
    'SEO & Content Strategy',
    'Website Development & Maintenance',
    'Email Marketing & Retention',
  ];

  const toggleService = (srv: string) => {
    setSelectedServices(prev =>
      prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please provide your company or brand name.');
      return;
    }
    if (!form.ownerName.trim()) {
      setError('Please enter your name as the point of contact.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const combinedServices = [
        ...selectedServices,
        form.serviceDetails ? form.serviceDetails : '',
      ].filter(Boolean).join(' · ');

      const res = await api.portal.intake({
        ...form,
        serviceDetails: combinedServices,
        notes: form.notes ? `Client Intake Notes: ${form.notes}` : 'Self-onboarded via intake link',
      });

      setSuccessResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg, #090e17)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: 'var(--bg-card, #101827)',
            borderRadius: 20,
            border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#10b981',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px' }}>
            You're Officially Onboarded!
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 28px' }}>
            Thank you, <strong style={{ color: '#f8fafc' }}>{form.ownerName || form.name}</strong>. Your account has been registered in the agency workspace. Your invoices, milestones, and deliverables are now live.
          </p>

          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              <ShieldCheck size={16} />
              <span>Your Secure Client Portal</span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.5 }}>
              Bookmark this passwordless portal link to view project progress, invoices, and share feedback anytime.
            </p>
            <a
              href={successResult.portalUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '12px 18px',
                borderRadius: 10,
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <span>Go to Your Client Portal</span>
              <ExternalLink size={16} />
            </a>
          </div>

          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Questions? Reach out to your account lead anytime.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #0b111e)',
        color: 'var(--text-primary, #f8fafc)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        padding: '40px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Brand Header */}
      <div style={{ maxWidth: 640, width: '100%', textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          <Sparkles size={14} /> Fast 3-Minute Client Onboarding
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 8px', color: '#f8fafc' }}>
          Welcome to {agencyTitle}
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
          Please complete your business and invoicing information below so our team can immediately configure your account, contracts, and deliverables.
        </p>
      </div>

      {/* Main Intake Form Card */}
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          background: 'var(--bg-card, #111a2b)',
          borderRadius: 20,
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          padding: '32px 28px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4)',
        }}
      >
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Business & Contact Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#38bdf8' }}>
              <Building2 size={18} />
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                1. Company &amp; Contact Details
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Company / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Media Corp"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Point of Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={form.ownerName}
                  onChange={e => setForm({ ...form, ownerName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Section 2: Invoicing & Legal Address */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#38bdf8' }}>
              <FileText size={18} />
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                2. Invoicing &amp; Billing Address
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Billing Address (for GST Tax Invoices)
                </label>
                <input
                  type="text"
                  placeholder="Suite 400, Tech Park Road"
                  value={form.billingAddress}
                  onChange={e => setForm({ ...form, billingAddress: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={form.pincode}
                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    value={form.gstNumber}
                    onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={form.pan}
                    onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Section 3: Scope & Services Needed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#38bdf8' }}>
              <Layers size={18} />
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                3. Scope of Services
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {availableServices.map(srv => {
                const checked = selectedServices.includes(srv);
                return (
                  <label
                    key={srv}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: checked ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: checked ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: checked ? '#f8fafc' : '#cbd5e1',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(srv)}
                      style={{ width: 16, height: 16, accentColor: '#38bdf8' }}
                    />
                    <span>{srv}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Target Start Date
                </label>
                <input
                  type="date"
                  value={form.contractStartDate}
                  onChange={e => setForm({ ...form, contractStartDate: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Specific Requirements or Assets Link
                </label>
                <input
                  type="text"
                  placeholder="Google Drive link or initial notes"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontSize: 15,
              fontWeight: 800,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.15s ease',
              marginTop: 8,
            }}
          >
            {submitting ? 'Setting Up Your Workspace...' : 'Complete Onboarding & Enter Portal'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#f8fafc',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
