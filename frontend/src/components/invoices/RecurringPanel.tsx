import React, { useState } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import type { Brand } from '../../types';
import { btnPrimary, btnSecondary, modalOverlay, modalCard, modalHeader } from './invoiceStyles';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface Props {
  open: boolean;
  brands: Brand[];
  recurringIds: Set<string>;
  pausedIds: Set<string>;
  onTogglePause: (id: string) => void;
  onClose: () => void;
  onEdit: () => void;
  onDraftInvoices: (brandIds: string[]) => void;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getNextDueDate(billingCycleDay: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day <= billingCycleDay) {
    return new Date(year, month, billingCycleDay);
  }
  return new Date(year, month + 1, billingCycleDay);
}

/** Recurring invoice schedules panel. */
export const RecurringPanel: React.FC<Props> = ({
  open, brands, recurringIds, pausedIds, onTogglePause, onClose, onEdit, onDraftInvoices,
}) => {
  const { showToast } = useApp();
  const [runningJob, setRunningJob] = useState(false);

  if (!open) return null;

  const today = new Date();
  const todayDay = today.getDate();

  const scheduled = brands.filter((brand) => recurringIds.has(brand.id) && brand.status === 'Active');

  const dueBrands = scheduled.filter(
    (brand) => !pausedIds.has(brand.id) && brand.billingCycleDay <= todayDay,
  );

  const handleRunJobNow = async () => {
    setRunningJob(true);
    try {
      const res = await api.recurringInvoices.runNow();
      const count = res.data?.invoicesCreated ?? 0;
      showToast(`Automated monthly billing completed: ${count} invoice(s) generated`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to trigger automated billing job', 'error');
    } finally {
      setRunningJob(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 768 }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span>🔄</span>
              <span>Recurring Invoice Schedules & Automation</span>
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>
              Scheduled monthly invoices with automatic team notifications and client currency billing.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '75vh', overflowY: 'auto', fontSize: 12 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <button
              onClick={handleRunJobNow}
              disabled={runningJob}
              style={{
                ...btnSecondary,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {runningJob ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Play style={{ width: 13, height: 13 }} />}
              <span>{runningJob ? 'Processing Auto-Billing...' : '⚡ Run Auto-Billing Cron Now'}</span>
            </button>

            {dueBrands.length > 0 && (
              <button
                onClick={() => onDraftInvoices(dueBrands.map((b) => b.id))}
                style={{ ...btnPrimary, fontSize: 12 }}
              >
                Draft All Due Invoices ({dueBrands.length})
              </button>
            )}
          </div>

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
                    <th>Monthly Fee</th>
                    <th>Cycle Day</th>
                    <th>Next Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduled.map((brand) => {
                    const isPaused = pausedIds.has(brand.id);
                    const isDue = !isPaused && brand.billingCycleDay <= todayDay;
                    const nextDue = getNextDueDate(brand.billingCycleDay);
                    const nextDueStr = nextDue.toISOString().split('T')[0];

                    return (
                      <tr key={brand.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{brand.name}</div>
                        </td>
                        <td>
                          <div className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span>{(brand.currencySymbol || '₹')}{brand.monthlyFee.toLocaleString()}</span>
                            {brand.currency && brand.currency !== 'INR' && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                {brand.currency}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {ordinal(brand.billingCycleDay)} of every month
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{nextDueStr}</td>
                        <td>
                          {isPaused ? (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--warn-bg)', color: 'var(--warn-text)', border: '1px solid var(--warn-border)' }}>
                              Paused
                            </span>
                          ) : isDue ? (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--warn-bg)', color: 'var(--warn-text)', border: '1px solid var(--warn-border)' }}>
                              Due this Cycle
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
                              Active
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button onClick={() => onTogglePause(brand.id)}
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
