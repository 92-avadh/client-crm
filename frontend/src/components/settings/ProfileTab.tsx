import React from 'react';
import { Save } from 'lucide-react';
import type { AppSettings, User } from '../../types';
import { fieldStyle, saveBtnStyle, tabBodyStyle, TabHeader, ToggleRow } from './settingsUi';

/* ------------------------------------------------------------------ */
/*  User Profile tab                                                   */
/* ------------------------------------------------------------------ */
interface ProfileProps {
  currentUser: User;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  onProfileChange: (patch: { name?: string; email?: string; phone?: string }) => void;
  onSave: (e: React.FormEvent) => void;
}

export const ProfileTab: React.FC<ProfileProps> = ({
  currentUser, profileName, profileEmail, profilePhone, onProfileChange, onSave,
}) => (
  <div style={tabBodyStyle}>
    <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <img src={currentUser.avatar} alt={currentUser.name}
        style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{currentUser.name}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{currentUser.designation}</p>
      </div>
    </div>

    <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Full Name</label>
          <input type="text" value={profileName} onChange={(e) => onProfileChange({ name: e.target.value })} style={fieldStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Email Address</label>
          <input type="email" value={profileEmail} onChange={(e) => onProfileChange({ email: e.target.value })} style={fieldStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Phone Number</label>
          <input type="tel" value={profilePhone} onChange={(e) => onProfileChange({ phone: e.target.value })} style={fieldStyle} />
        </div>
      </div>

      <div>
        <button type="submit" style={saveBtnStyle}>
          <Save className="w-3.5 h-3.5" />
          <span>Save Profile</span>
        </button>
      </div>
    </form>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Retention & Notifications tab                                      */
/* ------------------------------------------------------------------ */
interface NotificationsProps {
  isAdmin: boolean;
  formData: AppSettings;
  onThresholdChange: (days: number) => void;
  onWhatsAppToggle: (v: boolean) => void;
}

export const NotificationsTab: React.FC<NotificationsProps> = ({
  isAdmin, formData, onThresholdChange, onWhatsAppToggle,
}) => (
  <div style={tabBodyStyle}>
    <TabHeader
      title="Retention Alert Rules & Channels"
      subtitle="Configure how and when the system alerts team leads about inactive clients."
    />

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isAdmin && (
        <div style={{ padding: '18px 20px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Inactivity Churn Threshold (Days)</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Trigger warning when no chat, task, meeting or payment is detected for this many days:
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[7, 15, 30, 45].map((d) => (
              <button key={d} type="button" onClick={() => onThresholdChange(d)}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: formData.retentionThresholdDays === d ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                  background: formData.retentionThresholdDays === d ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
                  color: formData.retentionThresholdDays === d ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}>
                {d} Days
              </button>
            ))}
          </div>
        </div>
      )}

      <ToggleRow
        title="WhatsApp Click-to-Share Links"
        description="Enable 1-click WhatsApp messaging for payment reminders & retention re-engagement."
        checked={formData.whatsappClickToShareEnabled}
        onChange={onWhatsAppToggle}
      />

      <ToggleRow
        title="In-App Push & Toast Notifications"
        description="Notify on client assignments, task due dates, and received Razorpay payments."
        checked
        onChange={() => {}}
      />
    </div>
  </div>
);
