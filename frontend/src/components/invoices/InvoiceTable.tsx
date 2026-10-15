import React from 'react';
import { Eye, CreditCard, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import type { Invoice } from '../../types';
import { getStatusBadgeStyle } from './invoiceStyles';

interface Props {
  invoices: Invoice[];
  recurringIds: Set<string>;
  onView: (id: string) => void;
  onPay: (inv: Invoice) => void;
  onWhatsApp: (inv: Invoice) => void;
  onDelete?: (inv: Invoice) => void;
  deletingId?: string | null;
  canDelete?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (select: boolean) => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const InvoiceTable: React.FC<Props> = ({
  invoices, recurringIds, onView, onPay, onWhatsApp, onDelete, deletingId, canDelete = true,
  selectedIds, onToggleSelect, onSelectAll,
}) => {
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  const allSelected = invoices.length > 0 && Boolean(selectedIds) && invoices.every(inv => selectedIds?.has(inv.id));
  const someSelected = Boolean(selectedIds && invoices.some(inv => selectedIds.has(inv.id)) && !allSelected);

  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="table-scroll" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {canDelete && onToggleSelect && (
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
            <th>Invoice #</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>GST Type</th>
            <th>Total (INR)</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={canDelete && onToggleSelect ? 9 : 8} style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40, color: 'var(--text-muted)' }}>
                No invoices found matching criteria.
              </td>
            </tr>
          ) : (
            invoices.map((inv) => {
              const isSelected = Boolean(selectedIds?.has(inv.id));
              return (
                <tr
                  key={inv.id}
                  style={{
                    background: isSelected ? 'var(--bg-raised)' : undefined,
                    transition: 'background 0.15s ease',
                  }}
                >
                  {canDelete && onToggleSelect && (
                    <td style={{ width: 42, textAlign: 'center', padding: '0 8px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(inv.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--text-primary)', width: 16, height: 16 }}
                      />
                    </td>
                  )}
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-text)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{inv.invoiceNumber}</span>
                      {recurringIds.has(inv.id) && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          🔄 Recurring
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{inv.brandName}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{inv.issueDate}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{inv.dueDate}</td>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {inv.hasGst ? inv.gstType : 'No GST'}
                    </span>
                  </td>
                  <td>
                    <div className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                      {inr(inv.totalAmount)}
                    </div>
                  </td>
                  <td>
                    <span style={getStatusBadgeStyle(inv.status)}>{inv.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <button onClick={() => onView(inv.id)} title="View / Print Invoice"
                        style={{ padding: '5px', borderRadius: 8, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Eye style={{ width: 14, height: 14 }} />
                      </button>

                      {inv.status !== 'Paid' && (
                        <button onClick={() => onPay(inv)} title="Simulate Razorpay Payment"
                          style={{ padding: '4px 8px', borderRadius: 8, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                          <CreditCard style={{ width: 12, height: 12 }} />
                          <span>Pay Now</span>
                        </button>
                      )}

                      <button onClick={() => onWhatsApp(inv)} title="Share on WhatsApp"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--success-text)', color: 'var(--solid-btn-text)', border: 'none' }}>
                        <MessageCircle style={{ width: 13, height: 13 }} />
                        <span>WhatsApp</span>
                      </button>

                      {canDelete && onDelete && (
                        <button
                          onClick={() => onDelete(inv)}
                          disabled={deletingId === inv.id}
                          title="Delete Invoice"
                          style={{
                            padding: '5px',
                            borderRadius: 8,
                            background: 'var(--danger-bg, #fef2f2)',
                            color: 'var(--danger-text, #ef4444)',
                            border: '1px solid var(--danger-border, #fecaca)',
                            cursor: deletingId === inv.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: deletingId === inv.id ? 0.6 : 1,
                          }}
                        >
                          {deletingId === inv.id ? (
                            <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 style={{ width: 14, height: 14 }} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
