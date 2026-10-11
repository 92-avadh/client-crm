import React from 'react';
import { Eye, CreditCard, MessageCircle } from 'lucide-react';
import type { Invoice } from '../../types';
import { getStatusBadgeStyle } from './invoiceStyles';

interface Props {
  invoices: Invoice[];
  recurringIds: Set<string>;
  onView: (id: string) => void;
  onPay: (inv: Invoice) => void;
  onWhatsApp: (inv: Invoice) => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Invoice list table. */
export const InvoiceTable: React.FC<Props> = ({ invoices, recurringIds, onView, onPay, onWhatsApp }) => {
  return (
    <div className="table-scroll" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
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
              <td colSpan={8} style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40, color: 'var(--text-muted)' }}>
                No invoices found matching criteria.
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv.id}>
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
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
