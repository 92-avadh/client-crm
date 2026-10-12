import React from 'react';
import { Calendar, Building2, User, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import type { Expense, Brand } from '../../types';
import { CATEGORY_CONFIG } from './expenseConfig';

interface Props {
  expenses: Expense[];
  brands: Brand[];
  canManage: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (select: boolean) => void;
  onToggleStatus: (e: Expense) => void;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
  onBrandClick: (brandId: string) => void;
  onEmployeeClick: (name: string) => void;
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Expense ledger table (scrolls horizontally on mobile). */
export const ExpenseTable: React.FC<Props> = ({
  expenses, brands, canManage, selectedIds, onToggleSelect, onSelectAll,
  onToggleStatus, onEdit, onDelete, onBrandClick, onEmployeeClick,
}) => {
  const brandFor = (id: string | null | undefined) =>
    id && id !== 'other' ? brands.find((b: any) => b.id === id) : undefined;

  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  const allSelected = expenses.length > 0 && Boolean(selectedIds) && expenses.every(e => selectedIds?.has(e.id));
  const someSelected = Boolean(selectedIds && expenses.some(e => selectedIds.has(e.id)) && !allSelected);

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="table-scroll" style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            {canManage && onToggleSelect && (
              <th style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  title="Select all"
                  style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                />
              </th>
            )}
            <th>Date</th>
            <th>Expense</th>
            <th>Category</th>
            <th>Client</th>
            <th>Employee</th>
            <th style={{ textAlign: 'right' }}>Amount (INR)</th>
            <th>Status</th>
            <th>Mode</th>
            {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => {
            const isSelected = Boolean(selectedIds?.has(exp.id));
            const cfg = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG['Other Expenses'];
            const CatIcon = cfg.icon;
            const linkedBrand = brandFor(exp.brandId);
            const isPaid = (exp.paymentStatus || 'Paid') === 'Paid';

            return (
              <tr
                key={exp.id}
                style={{
                  background: isSelected ? 'var(--bg-raised)' : undefined,
                  transition: 'background 0.15s ease',
                }}
              >
                {canManage && onToggleSelect && (
                  <td style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(exp.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                    />
                  </td>
                )}
                <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar style={{ width: 12, height: 12 }} />
                    <span>{exp.date || 'N/A'}</span>
                  </div>
                </td>

                <td style={{ minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text-primary)' }}>
                    {exp.title || exp.note || exp.category}
                  </div>
                  {(exp.description || exp.note) && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 320, lineHeight: 1.4 }}>
                      {exp.description || exp.note}
                    </div>
                  )}
                </td>

                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
                    <CatIcon style={{ width: 12, height: 12 }} />
                    {cfg.label}
                  </span>
                </td>

                <td>
                  {linkedBrand ? (
                    <span
                      onClick={() => onBrandClick(linkedBrand.id)}
                      title="Click to filter expenses for this brand"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <Building2 style={{ width: 12, height: 12 }} />
                      {linkedBrand.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Other / General</span>
                  )}
                </td>

                <td>
                  {exp.employeeName ? (
                    <span
                      onClick={() => onEmployeeClick(exp.employeeName || '')}
                      title="Click to filter payouts for this employee"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--info-border)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <User style={{ width: 11, height: 11 }} />
                      {exp.employeeName}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>—</span>
                  )}
                </td>

                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span className="font-amount" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {inr(exp.amount)}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(exp)}
                    disabled={!canManage}
                    title={canManage ? `Click to toggle status: currently ${isPaid ? 'Paid' : 'Pending'}` : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 750, background: isPaid ? 'var(--success-bg)' : 'var(--warn-bg)', color: isPaid ? 'var(--success-text)' : 'var(--warn-text)', border: `1px solid ${isPaid ? 'var(--success-border)' : 'var(--warn-border)'}`, whiteSpace: 'nowrap', cursor: canManage ? 'pointer' : 'default', transition: 'all 0.15s ease' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPaid ? 'var(--success-text)' : 'var(--warn-text)' }} />
                    {isPaid ? 'Paid' : 'Pending'}
                  </button>
                </td>

                <td style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {exp.paymentMode || 'Corporate Card'}
                </td>

                {canManage && (
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      {!isPaid ? (
                        <button onClick={() => onToggleStatus(exp)} title="Mark as Paid to reflect in Dashboard"
                          style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success-text)', fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 style={{ width: 12, height: 12 }} />
                          Mark Paid
                        </button>
                      ) : (
                        <button onClick={() => onToggleStatus(exp)} title="Mark as Pending (removes from Dashboard)"
                          style={{ padding: '5px 8px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 650, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          Mark Pending
                        </button>
                      )}

                      <button onClick={() => onEdit(exp)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Edit3 style={{ width: 12, height: 12 }} />
                        Edit
                      </button>

                      <button onClick={() => onDelete(exp)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;
