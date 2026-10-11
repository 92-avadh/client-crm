import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AppSettings } from '../../types';
import { ProfileTab, NotificationsTab } from './ProfileTab';
import { CompanyTab, TaxTab, BankingTab } from './CompanyTabs';
import { SubscriptionTab, HolidaysTab, SecurityTab } from './AdminTabs';
import { InvoiceDesignTab, type InvoiceDesign } from './InvoiceDesignTab';

/**
 * Settings orchestrator.
 *
 * Owns the shared form state and the tab registry; every tab body lives in
 * its own component so a change to one tab cannot affect the others.
 */
export const SettingsManager: React.FC = () => {
  const {
    currentUser,
    settings,
    updateSettings,
    auditLogs,
    showToast,
    holidays,
    addHoliday,
    deleteHoliday,
  } = useApp();

  const role = currentUser.role;
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<string>('profile');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });

  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);

  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ title: '', date: '', type: 'Agency Custom' });

  const [invoiceDesign, setInvoiceDesign] = useState<InvoiceDesign>({
    primaryColor: 'var(--text-primary)',
    accentColor: 'var(--bg-raised)',
    template: 'minimal',
    headerText: '',
    footerText: '',
    termsAndConditions: 'Payment due within 15 days of invoice date. Late payment may attract interest.',
    showLogo: true,
    showSignature: false,
  });

  const patchSettings = (patch: Partial<AppSettings>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
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
          { id: 'invoiceDesign', label: 'Invoice Design & Templates' },
          { id: 'holidays', label: 'Holidays & Calendar' },
          { id: 'security', label: 'Security & Audit Logs' },
        ]
      : [{ id: 'security', label: 'Account Security' }]),
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Platform Settings &amp; Configuration
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {isAdmin
              ? 'Manage agency taxation, Razorpay gateway credentials, invoice templates, and user security.'
              : 'Update your personal profile, notification preferences, and login credentials.'}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              borderRadius: 8, border: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              background: activeTab === tab.id ? 'var(--solid-btn-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab bodies */}
      {activeTab === 'profile' && (
        <ProfileTab
          currentUser={currentUser}
          profileName={profileName}
          profileEmail={profileEmail}
          profilePhone={profilePhone}
          onProfileChange={(patch) => {
            if (patch.name !== undefined) setProfileName(patch.name);
            if (patch.email !== undefined) setProfileEmail(patch.email);
            if (patch.phone !== undefined) setProfilePhone(patch.phone);
          }}
          onSave={(e) => {
            e.preventDefault();
            showToast('Profile preferences updated successfully', 'success');
          }}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsTab
          isAdmin={isAdmin}
          formData={formData}
          onThresholdChange={(d) => {
            patchSettings({ retentionThresholdDays: d });
            updateSettings({ retentionThresholdDays: d });
          }}
          onWhatsAppToggle={(v) => {
            patchSettings({ whatsappClickToShareEnabled: v });
            updateSettings({ whatsappClickToShareEnabled: v });
          }}
        />
      )}

      {activeTab === 'company' && isAdmin && (
        <CompanyTab formData={formData} onChange={patchSettings} onSave={handleSaveSettings} />
      )}

      {activeTab === 'tax' && isAdmin && (
        <TaxTab formData={formData} onChange={patchSettings} onSave={handleSaveSettings} />
      )}

      {activeTab === 'banking' && isAdmin && (
        <BankingTab formData={formData} onChange={patchSettings} onSave={handleSaveSettings} />
      )}

      {activeTab === 'subscription' && isAdmin && <SubscriptionTab formData={formData} />}

      {activeTab === 'invoiceDesign' && isAdmin && (
        <InvoiceDesignTab
          design={invoiceDesign}
          onChange={(patch) => setInvoiceDesign((prev) => ({ ...prev, ...patch }))}
          settings={settings}
          onSave={() => showToast('Invoice design saved', 'success')}
        />
      )}

      {activeTab === 'holidays' && isAdmin && (
        <HolidaysTab
          holidays={holidays}
          showAdd={showAddHoliday}
          onToggleAdd={() => setShowAddHoliday((v) => !v)}
          newHoliday={newHoliday}
          onNewHolidayChange={setNewHoliday}
          onAdd={async () => {
            if (!newHoliday.title || !newHoliday.date) return;
            await addHoliday(newHoliday as any);
            setNewHoliday({ title: '', date: '', type: 'Agency Custom' });
            setShowAddHoliday(false);
          }}
          onDelete={deleteHoliday}
        />
      )}

      {activeTab === 'security' && <SecurityTab isAdmin={isAdmin} auditLogs={auditLogs} />}
    </div>
  );
};

export default SettingsManager;
