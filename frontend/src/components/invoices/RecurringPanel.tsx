import React from 'react';
import { X } from 'lucide-react';
import type { Invoice } from '../../types';
import { btnSecondary, modalOverlay, modalCard, modalHeader } from './invoiceStyles';

interface Props {
  open: boolean;
  invoices: Invoice[];
  recurringIds: Set<string>;
  pausedIds: Set<string>;
  onTogglePause: (id: string) => void;
  onClose: () => void;
  onEdit: () => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Recurring invoice schedules panel. */
export const RecurringPanel: React.FC<Props> = ({
  open, invoices, recurringIds, pausedIds, onTogglePause, onClose, onEdit,
}) => {
  if (!open) return null;

  const scheduled = invoices.filter((inv) => recurringIds.has(inv.id));

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 768 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span>🔄</span>
              <span>Recurring Invoice Schedules</span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
              Manage auto-billing schedules. Invoices are generated on the monthly billing cycle date.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '75vh', overflowY: 'auto', fontSize: 12 }}>
          {scheduled.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No Recurring Invoices Yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Create an invoice and enable the "Recurring Invoice" toggle to auto-schedule it monthly.
              </div>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Invoice #</th>
                    <th>Amount (INR)</th>
                    <th>Frequency</th>
                    <th>Next Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduled.map((inv) => {
                    const isPaused = pausedIds.has(inv.id);
                    const nextDue = new Date(new Date(inv.issueDate).getTime());
                    nextDue.setMonth(nextDue.getMonth() + 1);
                    const nextDueStr = nextDue.toISOString().split('T')[0];

                    return (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{inv.brandName}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-text)', fontSize: 12 }}>
                          {inv.invoiceNumber}
                        </td>
                        <td>
                          <div className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                            {inr(inv.totalAmount)}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                            Monthly
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{nextDueStr}</td>
                        <td>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isPaused ? 'var(--warn-bg)' : 'var(--success-bg)', color: isPaused ? 'var(--warn-text)' : 'var(--success-text)', border: isPaused ? '1px solid var(--warn-border)' : '1px solid var(--success-border)' }}>
                            {isPaused ? 'Paused' : 'Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button onClick={() => onTogglePause(inv.id)}
                              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: isPaused ? 'var(--success-bg)' : 'var(--warn-bg)', color: isPaused ? 'var(--success-text)' : 'var(--warn-text)', border: isPaused ? '1px solid var(--success-border)' : '1px solid var(--warn-border)' }}>
                              {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button onClick={onEdit}
                              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--info-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose} style={{ ...btnSecondary, fontSize: 12 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringPanel;
