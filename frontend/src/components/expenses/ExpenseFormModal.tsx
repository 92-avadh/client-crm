import React from 'react';
import { X, Users, Check, Clock, AlertTriangle } from 'lucide-react';
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Associated Brand / Client</label>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Choose "Other" if not linked to a client</span>
            </div>
            <select value={formData.brandId} onChange={(e) => onFormChange({ brandId: e.target.value })}
              className="input-field" style={{ cursor: 'pointer' }}>
              <option value="">Other / General Business Overhead (Not linked to a brand)</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  Client: {b.name} (Retainer: ₹{Number(b.monthlyFee || 0).toLocaleString('en-IN')}/mo)
                </option>
              ))}
            </select>
          </div>

          {/* Date + status */}
          <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Payment Date *</label>
              <input type="date" required value={formData.date}
                onChange={(e) => onFormChange({ date: e.target.value })} className="input-field" />
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
          <div>
            <label className="form-label">Payment Mode</label>
            <select value={formData.paymentMode} onChange={(e) => onFormChange({ paymentMode: e.target.value })}
              className="input-field" style={{ cursor: 'pointer' }}>
              {PAYMENT_MODES.map((mode) => (<option key={mode} value={mode}>{mode}</option>))}
            </select>
          </div>

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
              style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
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
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteExpenseModal: React.FC<DeleteProps> = ({ expense, onClose, onConfirm }) => {
  // The animated dialog is mounted only while there is something to delete,
  // so `open` is always true for the lifetime of this component.
  if (!expense) return null;

  return (
    <AlertDialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogPopup from="bottom" className="sm:max-w-[460px]">
        <AlertDialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <AlertDialogTitle>Delete Expense Record?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the expense and immediately update your dashboard totals.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginTop: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>
            {expense.title || expense.note || expense.category}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>{CATEGORY_CONFIG[expense.category]?.label || expense.category}</span>
            <span className="font-amount" style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: 14 }}>
              ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            style={{ background: 'var(--danger-text)', color: 'var(--solid-btn-text)' }}
          >
            Yes, Delete Expense
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
};
