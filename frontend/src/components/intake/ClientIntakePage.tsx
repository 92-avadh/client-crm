import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Building2,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Layers,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface AgencyInfo {
  agencyId: string;
  adminId?: string;
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  currency?: string;
  currencySymbol?: string;
}

export const ClientIntakePage: React.FC = () => {
  const { agencySlug, slug } = useParams<{ agencySlug?: string; slug?: string }>();
  const [searchParams] = useSearchParams();

  // Resolve agency identifier from path params or query params (?agency= or ?ref=)
  const [rawIdentifier, setRawIdentifier] = useState<string>(() => {
    return (agencySlug || slug || searchParams.get('agency') || searchParams.get('ref') || searchParams.get('id') || '').trim();
  });

  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo | null>(null);
  const [loadingAgency, setLoadingAgency] = useState<boolean>(true);
  const [agencyError, setAgencyError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

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

  // Fetch verified agency profile
  useEffect(() => {
    if (!rawIdentifier) {
      setLoadingAgency(false);
      setAgencyError('Missing agency workspace link. Please use the personalized onboarding link sent by your agency.');
      return;
    }

    setLoadingAgency(true);
    setAgencyError(null);

    api.portal.getAgency(rawIdentifier)
      .then((res: any) => {
        if (res && res.agencyId) {
          setAgencyInfo(res);
          setAgencyError(null);
        } else {
          setAgencyError('Agency workspace not found. Please confirm the link provided by your agency.');
        }
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.error || 'The agency onboarding link is invalid or expired. Please contact your agency for a valid link.';
        setAgencyError(msg);
      })
      .finally(() => {
        setLoadingAgency(false);
      });
  }, [rawIdentifier]);

  const agencyName = agencyInfo?.companyName || (rawIdentifier ? rawIdentifier.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Partner Agency');

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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#2563eb';
    e.currentTarget.style.boxShadow = '0 0 0 3.5px rgba(37, 99, 235, 0.14)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-strong, #cbd5e1)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdentifier && !agencyInfo?.agencyId) {
      setError('An agency onboarding link is required to submit. Please request a valid onboarding link from your agency.');
      return;
    }
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
        agencyId: agencyInfo?.agencyId || rawIdentifier,
        agencySlug: rawIdentifier,
        currency: agencyInfo?.currency || 'INR',
        currencySymbol: agencyInfo?.currencySymbol || '₹',
        serviceDetails: combinedServices,
        notes: form.notes ? `Client Intake Notes: ${form.notes}` : 'Self-onboarded via agency intake link',
      });

      setSuccessResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Missing or Invalid Agency Link View
  if (agencyError && !loadingAgency) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-subtle, #f8fafc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: 18,
            border: '1.5px solid var(--border, #e2e8f0)',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#dc2626',
            }}
          >
            <AlertCircle size={30} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 8px' }}>
            Agency Onboarding Link Required
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, margin: '0 0 24px' }}>
            {agencyError}
          </p>

          <div
            style={{
              padding: 16,
              background: 'var(--bg-subtle, #f8fafc)',
              borderRadius: 12,
              border: '1px solid var(--border, #e2e8f0)',
              textAlign: 'left',
              marginBottom: 20,
            }}
          >
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: 6 }}>
              Have an Agency Name or Code?
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. korvex or agency-id"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border-strong, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (manualCode.trim()) {
                    setRawIdentifier(manualCode.trim());
                  }
                }}
                style={{
                  padding: '9px 16px',
                  background: '#059639',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Go
              </button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <HelpCircle size={14} /> Please contact your agency lead to request their onboarding invitation link.
          </p>
        </div>
      </div>
    );
  }

  // Success Confirmation Screen
  if (successResult) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-subtle, #f8fafc)',
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
            background: 'var(--bg-card, #ffffff)',
            borderRadius: 20,
            border: '1.5px solid var(--border, #e2e8f0)',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(5, 150, 57, 0.12)',
              border: '2px solid rgba(5, 150, 57, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#059639',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 10px' }}>
            You're Officially Onboarded!
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary, #475569)', lineHeight: 1.6, margin: '0 0 28px' }}>
            Thank you, <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{form.ownerName || form.name}</strong>. Your account has been registered with <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{agencyName}</strong>. Your deliverables and invoices are now actively configured.
          </p>

          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1.5px solid var(--border, #e2e8f0)',
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              <ShieldCheck size={16} />
              <span>Your Secure Client Portal</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary, #64748b)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Bookmark your client portal link to track deliverables, view invoices, and communicate with {agencyName} anytime.
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
                background: '#059639',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 4px 12px rgba(5, 150, 57, 0.25)',
              }}
            >
              <span>Go to Your Client Portal</span>
              <ExternalLink size={16} />
            </a>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
            Questions? Contact {agencyInfo?.companyEmail || 'your agency account lead'}.
          </p>
        </div>
      </div>
    );
  }

  // Active Intake Form
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-subtle, #f8fafc)',
        color: 'var(--text-primary, #0f172a)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        padding: '40px 16px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Brand Header */}
      <div style={{ maxWidth: 660, width: '100%', textAlign: 'center', marginBottom: 28 }}>
        {/* Agency Logo or Monogram */}
        {agencyInfo?.companyLogo ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
              borderRadius: 14,
              background: 'var(--bg-card, #ffffff)',
              border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
              marginBottom: 16,
              maxHeight: 60,
            }}
          >
            <img
              src={agencyInfo.companyLogo}
              alt={agencyName}
              style={{ maxHeight: 42, maxWidth: 180, objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'rgba(5, 150, 57, 0.1)',
              border: '1.5px solid rgba(5, 150, 57, 0.25)',
              color: '#059639',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} /> Fast 3-Minute Client Onboarding
          </div>
        )}

        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
            color: 'var(--text-primary, #0f172a)',
          }}
        >
          Welcome to {agencyName}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, #475569)', lineHeight: 1.55, margin: 0, maxWidth: 540, marginInline: 'auto' }}>
          Please complete your business and invoicing information below so our agency team can immediately configure your account, contracts, and deliverables.
        </p>
      </div>

      {/* Main Intake Form Card */}
      <div
        style={{
          maxWidth: 660,
          width: '100%',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 20,
          border: '1.5px solid var(--border, #e2e8f0)',
          padding: '36px 32px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        }}
      >
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#b91c1c',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {/* Section 1: Business & Contact Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                }}
              >
                <Building2 size={17} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                1. Company &amp; Contact Details
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>
                  Company / Brand Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Media Corp"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Point of Contact Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={form.ownerName}
                  onChange={e => setForm({ ...form, ownerName: e.target.value })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Work Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Mobile / WhatsApp Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value.replace(/[^0-9+\s\-()]/g, '') })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border, #e2e8f0)' }} />

          {/* Section 2: Invoicing & Legal Address */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(5, 150, 57, 0.1)',
                  color: '#059639',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                }}
              >
                <FileText size={17} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                2. Invoicing &amp; Billing Address
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>
                  Billing Address (for GST Tax Invoices)
                </label>
                <input
                  type="text"
                  placeholder="Suite 400, Tech Park Road"
                  value={form.billingAddress}
                  onChange={e => setForm({ ...form, billingAddress: e.target.value })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={form.pincode}
                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
                <div>
                  <label style={labelStyle}>
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    value={form.gstNumber}
                    onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={form.pan}
                    onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border, #e2e8f0)' }} />

          {/* Section 3: Scope & Services Needed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                }}
              >
                <Layers size={17} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                3. Scope of Services
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 18 }}>
              {availableServices.map(srv => {
                const checked = selectedServices.includes(srv);
                return (
                  <label
                    key={srv}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: checked ? 'rgba(5, 150, 57, 0.06)' : 'var(--bg-card, #ffffff)',
                      border: checked ? '1.5px solid #059639' : '1.5px solid var(--border, #e2e8f0)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: checked ? 600 : 500,
                      color: checked ? '#059639' : 'var(--text-primary, #1e293b)',
                      transition: 'all 0.15s ease',
                      boxShadow: checked ? '0 2px 8px rgba(5, 150, 57, 0.12)' : 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(srv)}
                      style={{ width: 17, height: 17, accentColor: '#059639', cursor: 'pointer' }}
                    />
                    <span>{srv}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Target Start Date</label>
                <input
                  type="date"
                  value={form.contractStartDate}
                  onChange={e => setForm({ ...form, contractStartDate: e.target.value })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Specific Requirements or Asset Links</label>
                <input
                  type="text"
                  placeholder="Google Drive link or project requirements"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
              padding: '14px 26px',
              borderRadius: 12,
              background: '#059639',
              color: '#ffffff',
              border: 'none',
              fontSize: 15,
              fontWeight: 800,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 20px -4px rgba(5, 150, 57, 0.4)',
              transition: 'all 0.15s ease',
              marginTop: 10,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Configuring Your Workspace...' : 'Complete Onboarding & Enter Portal'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary, #1e293b)',
  marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: 'var(--bg-card, #ffffff)',
  border: '1.5px solid var(--border-strong, #cbd5e1)',
  color: 'var(--text-primary, #0f172a)',
  fontSize: 14,
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};