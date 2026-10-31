import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { AppSettings } from '../../types';
import { ProfileTab, NotificationsTab } from './ProfileTab';
import { CompanyTab, TaxTab, BankingTab } from './CompanyTabs';
import { SubscriptionTab, HolidaysTab, SecurityTab } from './AdminTabs';
import { InvoiceDesignTab, type InvoiceDesign } from './InvoiceDesignTab';
import {
  User,
  Bell,
  Building2,
  Percent,
  Landmark,
  Sparkles,
  Palette,
  Calendar,
  ShieldCheck,
  Search,
  X,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

/**
 * Settings orchestrator with Shopify Polaris-inspired Master-Detail Sub-Sidebar.
 *
 * Provides a responsive two-column layout with categorized sub-navigation,
 * instant search filtering, active state indicators, and snappy animations.
 */
export const SettingsManager: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    settings,
    updateSettings,
    auditLogs,
    showToast,
    holidays,
    addHoliday,
    deleteHoliday,
    updateTeamMember,
    resetWorkspaceData,
  } = useApp();

  const role = currentUser.role;
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<string>('profile');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);

  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ title: '', date: '', type: 'Agency Custom' });

  const [invoiceDesign, setInvoiceDesign] = useState<InvoiceDesign>(() => {
    let saved: Partial<InvoiceDesign> = {};
    try {
      const raw = localStorage.getItem('retentio_invoice_design');
      if (raw) saved = JSON.parse(raw);
    } catch {}
    const savedTemplate = localStorage.getItem('retentio_invoice_template') || 'modern';
    return {
      primaryColor: 'var(--text-primary)',
      accentColor: 'var(--bg-raised)',
      template: savedTemplate,
      headerText: '',
      footerText: '',
      termsAndConditions: 'Payment due within 15 days of invoice date. Late payment may attract interest.',
      showLogo: true,
      showSignature: false,
      ...(settings.invoiceDesign || {}),
      ...saved,
    };
  });

  const patchSettings = (patch: Partial<AppSettings>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  // ─── Shopify Polaris Sub-Sidebar Categorization ───────────────────────
  const categories = useMemo(
    () => [
      {
        title: 'Account & Personal',
        items: [
          {
            id: 'profile',
            label: 'User Profile & Preferences',
            shortLabel: 'Profile & Preferences',
            description: 'Personal details, avatar, and contact info',
            icon: User,
          },
          {
            id: 'notifications',
            label: 'Notifications & Alerts',
            shortLabel: 'Notifications & Alerts',
            description: 'Alert rules and WhatsApp messaging',
            icon: Bell,
          },
        ],
      },
      ...(isAdmin
        ? [
            {
              title: 'Agency & Financials',
              items: [
                {
                  id: 'company',
                  label: 'Agency Profile & Business Details',
                  shortLabel: 'Agency Details',
                  description: 'Legal entity name, GSTIN, PAN, and address',
                  icon: Building2,
                },
                {
                  id: 'tax',
                  label: 'Tax & GST Configuration',
                  shortLabel: 'Tax & GST',
                  description: 'State tax rates and invoicing rules',
                  icon: Percent,
                },
                {
                  id: 'banking',
                  label: 'Banking & Razorpay Keys',
                  shortLabel: 'Banking & Gateways',
                  description: 'Bank payouts and payment gateway APIs',
                  icon: Landmark,
                },
                {
                  id: 'subscription',
                  label: 'Software Plan & Billing',
                  shortLabel: 'Software Plan',
                  description: 'Active subscription tier and usage limits',
                  icon: Sparkles,
                  badge: 'Active Tier',
                },
              ],
            },
            {
              title: 'Operations & Templates',
              items: [
                {
                  id: 'invoiceDesign',
                  label: 'Invoice Design & Templates',
                  shortLabel: 'Invoice Design',
                  description: 'Branded colors, logo, and footer terms',
                  icon: Palette,
                },
                {
                  id: 'holidays',
                  label: 'Holidays & Calendar',
                  shortLabel: 'Holidays & Calendar',
                  description: 'Agency work calendar and official holidays',
                  icon: Calendar,
                },
              ],
            },
          ]
        : []),
      {
        title: 'Governance & Security',
        items: [
          {
            id: 'security',
            label: isAdmin ? 'Security & Audit Logs' : 'Account Security',
            shortLabel: 'Security & Access',
            description: isAdmin
              ? 'Audit activity, role permissions, and session protection'
              : 'Password management and active credentials',
            icon: ShieldCheck,
          },
        ],
      },
    ],
    [isAdmin]
  );

  // ─── Filtered Categories based on Sub-Sidebar Search ───────────────────
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.shortLabel.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            cat.title.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  // ─── Active Item Metadata ─────────────────────────────────────────────
  const activeItem = useMemo(() => {
    for (const cat of categories) {
      const found = cat.items.find((i) => i.id === activeTab);
      if (found) return { ...found, category: cat.title };
    }
    return null;
  }, [categories, activeTab]);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* ─── Top Master Header ───────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          {/* Breadcrumb Hierarchy */}
          <div className="flex items-center gap-1.5 text-xs text-muted mb-1.5">
            <span className="font-semibold text-secondary">Settings</span>
            <ChevronRight size={12} />
            <span>{activeItem?.category || 'General'}</span>
            <ChevronRight size={12} />
            <span className="font-medium text-primary">{activeItem?.shortLabel || 'Configuration'}</span>
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            {activeItem?.label || 'Platform Settings'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {activeItem?.description ||
              (isAdmin
                ? 'Manage agency taxation, Razorpay gateway credentials, invoice templates, and user security.'
                : 'Update your personal profile, notification preferences, and login credentials.')}
          </p>
        </div>

        {/* Status Pill Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {isAdmin ? <Shield size={13} className="text-amber-500" /> : <Layers size={13} />}
            <span>{isAdmin ? 'Admin Console' : 'Member Portal'}</span>
          </div>
        </div>
      </div>

      {/* ─── Master-Detail Layout ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* ─── Left Sub-Sidebar (Shopify Polaris Pattern) ─────────────── */}
        <aside
          className="w-full md:w-[270px] shrink-0 flex flex-col gap-3"
          style={{
            position: 'sticky',
            top: 80,
          }}
        >
          {/* Search Box in Sub-Sidebar */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <Search size={14} className="text-muted shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full bg-transparent border-none outline-none text-xs"
              style={{ color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted hover:text-primary transition-colors p-0.5"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Categorized Sub-Navigation List */}
          <div
            className="flex flex-col gap-2.5"
            style={{
              maxHeight: 'calc(100vh - 160px)',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {filteredCategories.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                No matching settings found for "{searchQuery}".
              </div>
            ) : (
              filteredCategories.map((cat, catIdx) => (
                <div key={cat.title} className="flex flex-col gap-1">
                  {/* Category Header */}
                  <div
                    className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted select-none"
                    style={{ letterSpacing: '0.06em' }}
                  >
                    {cat.title}
                  </div>

                  {/* Category Items */}
                  <div className="flex flex-col gap-0.5">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            if (window.innerWidth < 768) {
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }
                          }}
                          className={`polaris-subnav-item ${isSelected ? 'active' : ''}`}
                        >
                          <Icon
                            size={16}
                            className={`shrink-0 transition-colors ${
                              isSelected ? 'text-primary' : 'text-muted'
                            }`}
                          />
                          <span className="flex-1 truncate text-left">{item.shortLabel}</span>
                          {item.badge && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                background: isSelected ? 'var(--brand-navy-subtle)' : 'var(--bg-raised)',
                                color: isSelected ? 'var(--brand-navy)' : 'var(--text-muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {catIdx < filteredCategories.length - 1 && (
                    <div
                      className="my-1.5 mx-3"
                      style={{ borderBottom: '1px solid var(--border)', opacity: 0.7 }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ─── Right Content Canvas ──────────────────────────────────── */}
        <main className="flex-1 min-w-0 w-full">
          <div key={activeTab} className="polaris-tab-content">
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
                onAvatarChange={async (dataUrl: string) => {
                  try {
                    await updateTeamMember(currentUser.id, { avatar: dataUrl });
                    showToast(
                      dataUrl ? 'Profile photo updated successfully!' : 'Profile photo removed',
                      'success'
                    );
                  } catch {
                    setCurrentUser((prev: any) => {
                      const next = { ...prev, avatar: dataUrl };
                      try {
                        localStorage.setItem('retentio_user', JSON.stringify(next));
                      } catch {}
                      return next;
                    });
                    showToast(
                      dataUrl ? 'Profile photo updated successfully!' : 'Profile photo removed',
                      'success'
                    );
                  }
                }}
                onSave={async (e) => {
                  e.preventDefault();
                  try {
                    await updateTeamMember(currentUser.id, {
                      name: profileName,
                      email: profileEmail,
                      phone: profilePhone,
                    });
                  } catch {
                    setCurrentUser((prev: any) => {
                      const next = {
                        ...prev,
                        name: profileName,
                        email: profileEmail,
                        phone: profilePhone,
                      };
                      try {
                        localStorage.setItem('retentio_user', JSON.stringify(next));
                      } catch {}
                      return next;
                    });
                  }
                  showToast('Profile preferences updated successfully', 'success');
                }}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                isAdmin={isAdmin}
                formData={formData}
                onThresholdChange={(d: number) => {
                  patchSettings({ retentionThresholdDays: d });
                  updateSettings({ retentionThresholdDays: d });
                }}
                onWhatsAppToggle={(v: boolean) => {
                  patchSettings({ whatsappClickToShareEnabled: v });
                  updateSettings({ whatsappClickToShareEnabled: v });
                }}
                onPatchSettings={patchSettings}
              />
            )}

            {activeTab === 'company' && isAdmin && (
              <CompanyTab
                formData={formData}
                onChange={patchSettings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'tax' && isAdmin && (
              <TaxTab
                formData={formData}
                onChange={patchSettings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'banking' && isAdmin && (
              <BankingTab
                formData={formData}
                onChange={patchSettings}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === 'subscription' && isAdmin && (
              <SubscriptionTab formData={formData} />
            )}

            {activeTab === 'invoiceDesign' && isAdmin && (
              <InvoiceDesignTab
                design={invoiceDesign}
                onChange={(patch) => setInvoiceDesign((prev) => ({ ...prev, ...patch }))}
                settings={settings}
                onSave={async () => {
                  try {
                    localStorage.setItem('retentio_invoice_template', invoiceDesign.template);
                    localStorage.setItem('retentio_invoice_design', JSON.stringify(invoiceDesign));
                    await updateSettings({ invoiceDesign });
                    showToast('Invoice design saved successfully', 'success');
                  } catch {
                    showToast('Failed to save invoice design', 'error');
                  }
                }}
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

            {activeTab === 'security' && (
              <SecurityTab isAdmin={isAdmin} auditLogs={auditLogs} onResetWorkspace={resetWorkspaceData} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsManager;
