import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Save
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const {
    currentUser,
    settings,
    updateSettings,
    auditLogs,
    showToast
  } = useApp();

  const role = currentUser.role;
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<string>('profile');
  const [formData, setFormData] = useState({ ...settings });
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile preferences updated successfully', 'success');
  };

  const tabs = [
    { id: 'profile', label: 'User Profile & Preferences' },
    { id: 'notifications', label: 'Retention & Notifications' },
    ...(isAdmin
      ? [
          { id: 'company', label: 'Agency Profile & Business Details' },
          { id: 'tax', label: 'Tax & GST Configuration' },
          { id: 'banking', label: 'Banking & Razorpay Keys' },
          { id: 'subscription', label: 'Software Plan & Billing' },
          { id: 'security', label: 'Security & Audit Logs' }
        ]
      : [{ id: 'security', label: 'Account Security' }])
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Platform Settings & Configuration
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            {isAdmin
              ? 'Manage agency taxation, Razorpay gateway credentials, invoice templates, and user security.'
              : 'Update your personal profile, notification preferences, and login credentials.'}
          </p>
        </div>
      </div>

      {/* ── Tabs Navigation ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#ffffff',
          border: '1px solid #e2e2e2',
          borderRadius: 12,
          padding: '4px',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab.id ? '#0a0a0a' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#666666',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: User Profile ───────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid #e2e2e2' }}
            />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>{currentUser.name}</h3>
              <p style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>{currentUser.designation}</p>
              <span className="badge badge-neutral" style={{ marginTop: 6, display: 'inline-block', textTransform: 'capitalize' }}>
                Role: {currentUser.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Mobile Phone</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Timezone</label>
                <input
                  type="text"
                  disabled
                  value="Asia/Kolkata (IST +05:30)"
                  className="input-field"
                  style={{ background: '#f7f7f7', color: '#909090' }}
                />
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <button type="submit" className="btn-primary">
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Retention & Notifications ─────────────────── */}
      {activeTab === 'notifications' && (
        <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Retention Alert Rules & Channels</h3>
            <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>
              Configure how and when the system alerts team leads about inactive clients.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isAdmin && (
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 10,
                  background: '#f7f7f7',
                  border: '1px solid #e2e2e2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
                    Inactivity Churn Threshold (Days)
                  </div>
                  <div style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>
                    Trigger warning when no chat, task, meeting or payment is detected for this many days:
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[7, 15, 30, 45].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, retentionThresholdDays: d });
                        updateSettings({ retentionThresholdDays: d });
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: formData.retentionThresholdDays === d ? '1px solid #0a0a0a' : '1px solid #e2e2e2',
                        background: formData.retentionThresholdDays === d ? '#0a0a0a' : '#ffffff',
                        color: formData.retentionThresholdDays === d ? '#ffffff' : '#525252',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label
              style={{
                padding: '18px 20px',
                borderRadius: 10,
                background: '#f7f7f7',
                border: '1px solid #e2e2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>WhatsApp Click-to-Share Links</div>
                <div style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>
                  Enable 1-click WhatsApp messaging for payment reminders & retention re-engagement.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.whatsappClickToShareEnabled}
                onChange={(e) => {
                  setFormData({ ...formData, whatsappClickToShareEnabled: e.target.checked });
                  updateSettings({ whatsappClickToShareEnabled: e.target.checked });
                }}
                style={{ width: 18, height: 18, accentColor: '#0a0a0a', cursor: 'pointer', flexShrink: 0 }}
              />
            </label>

            <label
              style={{
                padding: '18px 20px',
                borderRadius: 10,
                background: '#f7f7f7',
                border: '1px solid #e2e2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>In-App Push & Toast Notifications</div>
                <div style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>
                  Notify on client assignments, task due dates, and received Razorpay payments.
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                style={{ width: 18, height: 18, accentColor: '#0a0a0a', cursor: 'pointer', flexShrink: 0 }}
              />
            </label>
          </div>
        </div>
      )}

      {/* ── Tab: Agency Profile & Business Details (Admin Only) ─────── */}
      {activeTab === 'company' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Agency Profile & Business Details</h3>
            <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>
              Business entity credentials printed on formal invoices, proposals, and client contracts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Agency Legal Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Official Support Email</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Support Phone Number</label>
              <input
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Registered Office Address</label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ paddingTop: 4 }}>
            <button type="submit" className="btn-primary">
              <Save className="w-3.5 h-3.5" />
              <span>Save Agency Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Tax & GST Configuration (Admin Only) ───────── */}
      {activeTab === 'tax' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>GSTIN & Compliance Settings</h3>
            <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>
              These statutory tax and invoicing details appear on all generated client invoices.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Company GSTIN</label>
              <input
                type="text"
                value={formData.companyGst}
                onChange={(e) => setFormData({ ...formData, companyGst: e.target.value.toUpperCase() })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>PAN Number</label>
              <input
                type="text"
                value={formData.companyPan}
                onChange={(e) => setFormData({ ...formData, companyPan: e.target.value.toUpperCase() })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Home State</label>
              <input
                type="text"
                value={formData.companyState}
                onChange={(e) => setFormData({ ...formData, companyState: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Default SAC Code</label>
              <input
                type="text"
                value={formData.defaultHsnSac}
                onChange={(e) => setFormData({ ...formData, defaultHsnSac: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Default GST Rate (%)</label>
              <input
                type="number"
                value={formData.defaultGstRate}
                onChange={(e) => setFormData({ ...formData, defaultGstRate: Number(e.target.value) })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Invoice Prefix Series</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div style={{ paddingTop: 4 }}>
            <button type="submit" className="btn-primary">
              <Save className="w-3.5 h-3.5" />
              <span>Save Tax Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Banking & Razorpay Keys (Admin Only) ───────── */}
      {activeTab === 'banking' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Direct Settlement Bank & Razorpay Credentials</h3>
            <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>
              Client payments settle straight into this account via Razorpay Route.
            </p>
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              background: '#f7f7f7',
              border: '1px solid #e2e2e2',
              fontSize: 12,
              color: '#525252',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 800, color: '#0a0a0a' }}>Direct Settlement Architecture:</span> Direct bank account settlement via Razorpay Route. Funds flow directly to your business account without intermediary vendor pooling.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Account Beneficiary Name</label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Bank Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Bank IFSC Code</label>
              <input
                type="text"
                value={formData.bankIfsc}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Bank Branch Location</label>
              <input
                type="text"
                value={formData.bankBranch}
                onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>UPI ID for Direct QR Codes</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Razorpay Key ID</label>
              <input
                type="text"
                value={formData.razorpayKeyId}
                onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div style={{ paddingTop: 4 }}>
            <button type="submit" className="btn-primary">
              <Save className="w-3.5 h-3.5" />
              <span>Save Banking Info</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Software Subscription Billing (Admin Only) ─── */}
      {activeTab === 'subscription' && isAdmin && (
        <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Retentio Platform Subscription</h3>
            <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>
              Monthly recurring fee billed via Razorpay Subscriptions API with auto-debit mandate.
            </p>
          </div>

          <div
            style={{
              padding: '20px 24px',
              borderRadius: 12,
              background: '#f7f7f7',
              border: '1px solid #e2e2e2',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#909090' }}>
                  Current Plan
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', marginTop: 3 }}>
                  {formData.subscriptionPlan.name}
                </div>
                <div style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>
                  Next renewal: {formData.subscriptionPlan.renewalDate} · {formData.subscriptionPlan.billingCycle}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#0a0a0a' }}>
                  ₹{formData.subscriptionPlan.price.toLocaleString('en-IN')}<span style={{ fontSize: 13, fontWeight: 600, color: '#909090' }}>/mo</span>
                </div>
                <span className="badge badge-neutral" style={{ marginTop: 6, display: 'inline-block' }}>
                  E-Mandate Active
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
              Subscription Payment History
            </div>
            {[
              { id: 'RET-SUB-2026-09', date: 'Sep 01, 2026', method: 'Razorpay Mandate', amount: '₹3,499', status: 'Paid' },
              { id: 'RET-SUB-2026-08', date: 'Aug 01, 2026', method: 'Razorpay Mandate', amount: '₹3,499', status: 'Paid' },
            ].map((rcpt) => (
              <div
                key={rcpt.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: '#f7f7f7',
                  border: '1px solid #e2e2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Receipt #{rcpt.id}</div>
                  <div style={{ fontSize: 11, color: '#909090', marginTop: 2 }}>
                    {rcpt.date} · {rcpt.method}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0a0a0a' }}>
                    {rcpt.amount}
                  </span>
                  <span className="badge badge-neutral">{rcpt.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Security & Audit Log ──────────────────────── */}
      {activeTab === 'security' && (
        <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid #e2e2e2' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Two-Factor Authentication & Audit Trail</h3>
            <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>
              Full accountability log for financial transactions and client assignment changes.
            </p>
          </div>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: 10,
              background: '#f7f7f7',
              border: '1px solid #e2e2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#ebebeb',
                  border: '1px solid #e2e2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0a0a0a',
                  flexShrink: 0,
                }}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Two-Factor Authentication (2FA)</div>
                <div style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>
                  Required for sensitive operations: invoice generation, payment recording & team assignments.
                </div>
              </div>
            </div>
            <span className="badge badge-neutral">Enabled</span>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Recent System Audit Logs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 10,
                      background: '#f7f7f7',
                      border: '1px solid #e2e2e2',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{log.action}</span>
                        <span style={{ fontSize: 11, color: '#909090' }}>
                          by {log.actorName} ({log.actorRole})
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#909090', fontFamily: 'var(--font-mono)' }}>
                        {log.timestamp} · IP: {log.ipAddress}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#525252' }}>{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
