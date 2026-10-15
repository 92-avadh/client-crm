import React from 'react';
import { X, Users, Check, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import type { Expense, Brand, ExpenseCategory, User } from '../../types';
import { CATEGORY_CONFIG, STANDARD_CATEGORIES, PAYMENT_MODES } from './expenseConfig';
import { useConfirm } from '../../hooks/useConfirm';
import { isDirty } from '../../hooks/isDirty';
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
import { AnimatedSelect } from '../ui/AnimatedSelect';
import DatePicker from '@/components/ui/DatePicker';

export interface ExpenseFormData {
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  paymentStatus: 'Paid' | 'Pending';
  paymentMode: string;
  brandId: string;
  employeeName: string;
  employeeId: string | null;
  isRecurring: boolean;
}

interface Props {
  open: boolean;
  editing: Expense | null;
  formData: ExpenseFormData;
  onFormChange: (patch: Partial<ExpenseFormData>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  brands: Brand[];
  teamMembers: User[];
}

/** Add / edit expense modal. */
export const ExpenseFormModal: React.FC<Props> = ({
  open, editing, formData, onFormChange, onClose, onSubmit, submitting, brands, teamMembers,
}) => {
  const { confirm, element: confirmDialog } = useConfirm();
  const baseline = React.useRef<ExpenseFormData | null>(null);

  React.useEffect(() => {
    if (open) baseline.current = formData;
    else baseline.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const requestClose = async () => {
    if (submitting) return;
    if (baseline.current && isDirty(formData as any, baseline.current as any)) {
      const ok = await confirm({
        title: editing ? 'Discard unsaved changes?' : 'Discard this expense?',
        description: 'The details you entered have not been saved yet.',
        confirmText: 'Discard',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!open) return null;
  const isSalary = formData.category === 'Employee Salaries';

  return (
    <>
    <div className="modal-overlay" onClick={() => requestClose()}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {editing ? 'Edit Expense Record' : 'Record New Expense'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {isSalary
                ? 'Record staff salary payroll, payment status and disbursement date'
                : 'Track business expenses, client costs and operational overhead'}
            </p>
          </div>
          <button type="button" onClick={requestClose} disabled={submitting}
            style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Category picker */}
          <div>
            <label className="form-label">Expense Category *</label>
            <div className="rg-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
              {STANDARD_CATEGORIES.map((cat) => {
                const c = CATEGORY_CONFIG[cat];
                const Icon = c.icon;
                const isSelected = formData.category === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => onFormChange({
                      category: cat as ExpenseCategory,
                      title: formData.title || (cat === 'Employee Salaries' ? 'Staff Monthly Salary' : ''),
                    })}
                    style={{ padding: '10px 8px', borderRadius: 10, border: isSelected ? '2px solid var(--solid-btn-bg)' : '1px solid var(--border)', background: isSelected ? 'var(--bg-raised)' : 'var(--bg-card)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textAlign: 'center' }}
                  >
                    <Icon style={{ width: 16, height: 16, color: isSelected ? 'var(--text-primary)' : c.color }} />
                    <span style={{ fontSize: 11, fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.2 }}>
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title + amount */}
          <div className="rg-3-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Expense Title *</label>
              <input
                type="text" required
                placeholder={isSalary ? 'e.g. October 2026 Developer Salary' : 'e.g. Meta Ads Q4 Campaign, Figma License'}
                value={formData.title}
                onChange={(e) => onFormChange({ title: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Amount (₹ INR) *</label>
              <div style={{ position: 'relative' }}>
                <span className="font-amount" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>₹</span>
                <input
                  type="number" step="any" min="0.01" required placeholder="e.g. 45000"
                  value={formData.amount}
                  onChange={(e) => onFormChange({ amount: e.target.value })}
                  className="input-field font-amount"
                  style={{ paddingLeft: 26, fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* Payroll details */}
          {isSalary && (
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--info-bg)', border: '1.5px solid var(--info-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users style={{ width: 15, height: 15, color: 'var(--info-text)' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--info-text)' }}>Employee Payroll Details</span>
              </div>

              <div className="rg-3-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--info-text)', display: 'block', marginBottom: 4 }}>
                    Employee Name *
                  </label>
                  <input
                    type="text" required placeholder="e.g. Drashti, Rahul, Priya"
                    value={formData.employeeName}
                    onChange={(e) => onFormChange({ employeeName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--info-text)', fontSize: 13, background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                {teamMembers.length > 0 && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--info-text)', display: 'block', marginBottom: 4 }}>
                      Quick pick team member:
                    </label>
                    <select
                      onChange={(e) => {
                        const found = teamMembers.find((u: any) => u.id === e.target.value);
                        if (found) {
                          onFormChange({
                            employeeName: found.name,
                            employeeId: found.id,
                            title: formData.title || `${found.name}'s Salary`,
                          });
                        }
                      }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--info-text)', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Select from team list...</option>
                      {teamMembers.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand */}
          <AnimatedSelect
            label="Associated Brand / Client"
            value={formData.brandId}
            onChange={(val) => onFormChange({ brandId: val })}
            options={[
              { value: '', label: 'Other / General Business Overhead (Not linked to a brand)' },
              ...brands.map((b: any) => ({
                value: b.id,
                label: `Client: ${b.name} (Retainer: ₹${Number(b.monthlyFee || 0).toLocaleString('en-IN')}/mo)`,
              })),
            ]}
          />

          {/* Date + status */}
          <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Payment Date *</label>
              <DatePicker
                value={formData.date}
                onChange={(date) => onFormChange({ date })}
                required
                label="Payment Date"
                placeholder="Select date"
              />
            </div>

            <div>
              <label className="form-label">Payment Status *</label>
              <div style={{ display: 'flex', gap: 8, height: 38 }}>
                <button type="button" onClick={() => onFormChange({ paymentStatus: 'Paid' })}
                  style={{ flex: 1, borderRadius: 8, border: formData.paymentStatus === 'Paid' ? '2px solid var(--success-border)' : '1px solid var(--border)', background: formData.paymentStatus === 'Paid' ? 'var(--success-bg)' : 'var(--bg-card)', color: formData.paymentStatus === 'Paid' ? 'var(--success-text)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Check style={{ width: 13, height: 13 }} /> Paid
                </button>
                <button type="button" onClick={() => onFormChange({ paymentStatus: 'Pending' })}
                  style={{ flex: 1, borderRadius: 8, border: formData.paymentStatus === 'Pending' ? '2px solid var(--warn-text)' : '1px solid var(--border)', background: formData.paymentStatus === 'Pending' ? 'var(--warn-bg)' : 'var(--bg-card)', color: formData.paymentStatus === 'Pending' ? 'var(--warn-text)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Clock style={{ width: 13, height: 13 }} /> Pending
                </button>
              </div>
            </div>
          </div>

          {/* Mode */}
          <AnimatedSelect
            label="Payment Mode"
            value={formData.paymentMode}
            onChange={(val) => onFormChange({ paymentMode: val })}
            options={PAYMENT_MODES.map((mode) => ({ value: mode, label: mode }))}
          />

          {/* Description */}
          <div>
            <label className="form-label">Description &amp; Notes</label>
            <textarea
              rows={2}
              placeholder="Additional details, invoice/bill number, vendor name, or payroll note..."
              value={formData.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              className="input-field"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={requestClose} disabled={submitting} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting}
              style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {submitting && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
              {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {confirmDialog}
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Delete confirmation                                                */
/* ------------------------------------------------------------------ */
interface DeleteProps {
  expense?: Expense | null;
  expenses?: Expense[];
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
}

export const DeleteExpenseModal: React.FC<DeleteProps> = ({ expense, expenses, onClose, onConfirm, deleting }) => {
  // Determine if this is a single item or multiple items deletion
  const items: Expense[] = expenses && expenses.length > 0
    ? expenses
    : expense
      ? [expense]
      : [];

  if (items.length === 0) return null;

  const isMultiple = items.length > 1;
  const single = items[0];
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <AlertDialog open onOpenChange={(o) => { if (!o && !deleting) onClose(); }}>
      <AlertDialogPopup from="bottom">
        <AlertDialogHeader>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'var(--danger-bg)',
                color: 'var(--danger-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <AlertTriangle style={{ width: 19, height: 19 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <AlertDialogTitle>
                {isMultiple ? `Delete ${items.length} Expense Records?` : 'Delete Expense Record?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isMultiple
                  ? `This will permanently remove ${items.length} selected expense records and update your dashboard totals.`
                  : 'This will remove the expense and immediately update your dashboard totals.'}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginTop: 18, textAlign: 'left' }}>
          {!isMultiple ? (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {single.title || single.note || single.category}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>{CATEGORY_CONFIG[single.category]?.label || single.category}</span>
                <span className="font-amount" style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: 14 }}>
                  ₹{Number(single.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Selected: {items.length} records
                </span>
                <span className="font-amount" style={{ fontSize: 14, fontWeight: 800, color: 'var(--danger-text)' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                      {item.title || item.note || item.category}
                    </span>
                    <span className="font-amount" style={{ color: 'var(--text-secondary)', fontWeight: 650, flexShrink: 0, marginLeft: 8 }}>
                      ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            style={{
              background: 'var(--danger-text)',
              color: 'var(--solid-btn-text)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: deleting ? 0.7 : 1,
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
            {isMultiple ? `Yes, Delete ${items.length} Expenses` : 'Yes, Delete Expense'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
};
