import React from 'react';
import { Save, CalendarX } from 'lucide-react';
import type { AppSettings } from '../../types';
import { fieldStyle, saveBtnStyle, tabBodyStyle, TabHeader } from './settingsUi';
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/animate-ui/components/base/alert-dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import Pagination from '@/components/ui/Pagination';

interface Props {
  formData: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onSave: (e: React.FormEvent) => void;
}

/** Platform subscription & billing history (admin, read-only). */
export const SubscriptionTab: React.FC<{ formData: AppSettings }> = ({ formData }) => {
  return (
    <div style={tabBodyStyle}>
      <TabHeader
        title="Retentio Platform Subscription"
        subtitle="Monthly recurring fee billed via Razorpay Subscriptions API with auto-debit mandate."
      />

      <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Current Plan
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginTop: 3 }}>
              {formData.subscriptionPlan.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Next renewal: {formData.subscriptionPlan.renewalDate} · {formData.subscriptionPlan.billingCycle}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-amount" style={{ fontSize: 24, fontWeight: 850, color: 'var(--text-primary)' }}>
              ₹{formData.subscriptionPlan.price.toLocaleString('en-IN')}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>/mo</span>
            </div>
            <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success-text)', marginTop: 6 }}>
              E-Mandate Active
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Subscription Payment History</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Receipts are issued by Razorpay and are not stored in this workspace. Download them from your
          Razorpay merchant dashboard.
        </p>
      </div>
    </div>
  );
};

/** Holidays & calendar (admin). */
interface HolidaysProps {
  holidays: any[];
  showAdd: boolean;
  onToggleAdd: () => void;
  newHoliday: { title: string; date: string; type: string };
  onNewHolidayChange: (h: { title: string; date: string; type: string }) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const HolidaysTab: React.FC<HolidaysProps> = ({
  holidays, showAdd, onToggleAdd, newHoliday, onNewHolidayChange, onAdd, onDelete,
}) => {
  const [holidayToDelete, setHolidayToDelete] = React.useState<{ id: string; title: string } | null>(null);

  return (
  <div style={tabBodyStyle}>
    <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <TabHeader title="Holiday Calendar" subtitle="Manage national, regional, and agency-specific holidays." />
      <button type="button" style={saveBtnStyle} onClick={onToggleAdd}>
        <span>{showAdd ? 'Cancel' : 'Add Holiday'}</span>
      </button>
    </div>

    {showAdd && (
      <div style={{ padding: '18px 20px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>New Holiday</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Title</label>
            <input type="text" value={newHoliday.title} placeholder="e.g. Diwali"
              onChange={(e) => onNewHolidayChange({ ...newHoliday, title: e.target.value })}
              style={fieldStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <DatePicker
              value={newHoliday.date}
              onChange={(date) => onNewHolidayChange({ ...newHoliday, date })}
              label="Holiday Date"
              placeholder="Select date"
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Type</label>
            <select value={newHoliday.type}
              onChange={(e) => onNewHolidayChange({ ...newHoliday, type: e.target.value })}
              style={fieldStyle}>
              <option value="National">National</option>
              <option value="Regional">Regional</option>
              <option value="Agency Custom">Agency Custom</option>
            </select>
          </div>
        </div>
        <div>
          <button type="button" style={saveBtnStyle} onClick={onAdd}>
            <Save className="w-3.5 h-3.5" /><span>Save Holiday</span>
          </button>
        </div>
      </div>
    )}

    {(['National', 'Regional', 'Agency Custom'] as const).map((type) => {
      const group = holidays.filter((h: any) => h.type === type);
      if (group.length === 0) return null;
      const badgeColor =
        type === 'National' ? { background: 'var(--danger-bg)', color: 'var(--danger-text)' }
        : type === 'Regional' ? { background: 'var(--warn-bg)', color: 'var(--warn-text)' }
        : { background: 'var(--info-bg)', color: 'var(--text-primary)' };

      return (
        <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {type}
          </div>
          {group.map((h: any) => (
            <div key={h.id} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', minWidth: 80 }}>{h.date}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, ...badgeColor }}>{h.type}</span>
              </div>
              <button type="button" onClick={() => setHolidayToDelete({ id: h.id, title: h.title })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      );
    })}

    {holidays.length === 0 && (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
        No holidays configured yet. Click "Add Holiday" to get started.
      </div>
    )}

    {/* Delete holiday confirmation — animated alert dialog */}
    {holidayToDelete && (
      <AlertDialog open onOpenChange={(o) => { if (!o) setHolidayToDelete(null); }}>
        <AlertDialogPopup from="bottom" className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarX style={{ width: 18, height: 18 }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <AlertDialogTitle>Remove “{holidayToDelete.title}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This holiday will no longer appear on the team calendar.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(holidayToDelete.id); setHolidayToDelete(null); }}
              style={{ background: 'var(--danger-text)', color: 'var(--solid-btn-text)' }}
            >
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    )}
  </div>
  );
};

/** Security & audit trail. */
export const SecurityTab: React.FC<{
  isAdmin: boolean;
  auditLogs: any[];
  onResetWorkspace?: (mode?: 'empty') => void;
}> = ({ isAdmin, auditLogs, onResetWorkspace }) => {
  const [auditPage, setAuditPage] = React.useState(0);
  const [auditPageSize, setAuditPageSize] = React.useState(10);

  // The audit trail grows without bound, so page it rather than rendering
  // every entry at once — hundreds of styled cards would lag the tab.
  const pageCount = Math.max(1, Math.ceil(auditLogs.length / auditPageSize));
  const safePage = Math.min(auditPage, pageCount - 1);
  const pagedAuditLogs = auditLogs.slice(safePage * auditPageSize, (safePage + 1) * auditPageSize);

  return (
  <div style={tabBodyStyle}>
    <TabHeader
      title="Two-Factor Authentication & Audit Trail"
      subtitle="Full accountability log for financial transactions and client assignment changes."
    />

    <div style={{ padding: '18px 20px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
          📱
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Two-Factor Authentication (2FA)</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Required for sensitive operations: invoice generation, payment recording & team assignments.
          </div>
        </div>
      </div>
      <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>Enabled</span>
    </div>

    {isAdmin && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent System Audit Logs</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pagedAuditLogs.map((log) => (
            <div key={log.id} style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {log.actorName} ({log.actorRole})</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {log.timestamp} · IP: {log.ipAddress}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.details}</div>
            </div>
          ))}
        </div>
        {auditLogs.length > 0 && (
          <Pagination
            page={safePage}
            pageSize={auditPageSize}
            total={auditLogs.length}
            onPageChange={setAuditPage}
            onPageSizeChange={setAuditPageSize}
          />
        )}
      </div>
    )}

    {isAdmin && (
      <div style={{ marginTop: 12, padding: '20px 24px', borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🛠️ Workspace Data Management</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Permanently removes all workspace records from the database and clears cached browser data.
            This cannot be undone. You will need to sign in again afterwards.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onResetWorkspace?.('empty')}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--danger-text, #dc2626)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Clear All Current Data
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
          There is no demo dataset — the workspace runs on real records only.
        </p>
      </div>
    )}
  </div>
  );
};
