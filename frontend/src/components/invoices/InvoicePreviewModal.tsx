import React from 'react';
import { X, Printer, Share2, QrCode } from 'lucide-react';
import type { Invoice, AppSettings } from '../../types';
import { btnSecondary, modalOverlay, modalCard, getStatusBadgeStyle } from './invoiceStyles';

interface Props {
  invoice: Invoice | null;
  settings: AppSettings;
  onClose: () => void;
  onWhatsApp: (inv: Invoice) => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Printable / downloadable invoice document. */
export const InvoicePreviewModal: React.FC<Props> = ({ invoice, settings, onClose, onWhatsApp }) => {
  if (!invoice) return null;

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalCard, maxWidth: 768 }} onClick={(e) => e.stopPropagation()}>
        {/* Controls bar (hidden when printing) */}
        <div className="no-print" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Invoice Preview</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent-text)', fontWeight: 600, fontSize: 12 }}>
              {invoice.invoiceNumber}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => window.print()} style={{ ...btnSecondary, fontSize: 12 }}>
              <Printer style={{ width: 14, height: 14 }} />
              <span>Print / PDF</span>
            </button>
            <button onClick={() => onWhatsApp(invoice)} style={{ ...btnSecondary, fontSize: 12, color: 'var(--success-text)' }}>
              <Share2 style={{ width: 14, height: 14 }} />
              <span>WhatsApp</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        {/* Document body */}
        <div className="printable-invoice" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--text-secondary)', fontSize: 12 }}>
          {/* Agency branding */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
            <div>
              <div style={{ background: '#ffffff', padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', marginBottom: 10, width: 'fit-content' }}>
                <img src="/retentio-logo-horizontal.png" alt={settings.companyName}
                  style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{settings.companyName}</div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4, maxWidth: 320, lineHeight: 1.6 }}>{settings.companyAddress}</p>
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
                GSTIN: <span style={{ color: 'var(--accent-text)', fontWeight: 700 }}>{settings.companyGst}</span> • PAN: {settings.companyPan}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-text)', fontFamily: 'monospace' }}>TAX INVOICE</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text-primary)', marginTop: 4 }}>{invoice.invoiceNumber}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Date: {invoice.issueDate}</div>
              <div style={{ color: 'var(--danger-text)', fontWeight: 600, marginTop: 2 }}>Due: {invoice.dueDate}</div>
            </div>
          </div>

          {/* Billed to */}
          <div className="rg-2" style={{ padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' as const, fontWeight: 700 }}>Billed To</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginTop: 2 }}>{invoice.brandName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' as const, fontWeight: 700 }}>Payment Status</span>
              <div style={{ marginTop: 4 }}>
                <span style={getStatusBadgeStyle(invoice.status)}>{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ paddingBottom: 8 }}>Description</th>
                <th style={{ paddingBottom: 8 }}>HSN/SAC</th>
                <th style={{ paddingBottom: 8, textAlign: 'right' }}>Qty</th>
                <th style={{ paddingBottom: 8, textAlign: 'right' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it) => (
                <tr key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ paddingTop: 12, paddingBottom: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{it.description}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{it.hsnSac}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, textAlign: 'right', fontFamily: 'monospace' }}>{it.quantity}</td>
                  <td className="font-amount" style={{ paddingTop: 12, paddingBottom: 12, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 750, fontSize: 13 }}>
                    {inr(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <div style={{ width: 288, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Taxable Subtotal:</span>
                <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{inr(invoice.subtotal)}</span>
              </div>
              {invoice.hasGst && (
                <>
                  {invoice.cgstAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>CGST (9%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inr(invoice.cgstAmount)}</span>
                    </div>
                  )}
                  {invoice.sgstAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>SGST (9%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inr(invoice.sgstAmount)}</span>
                    </div>
                  )}
                  {invoice.igstAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>IGST (18%):</span>
                      <span className="font-amount" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{inr(invoice.igstAmount)}</span>
                    </div>
                  )}
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14, color: 'var(--text-primary)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span>Total (Incl. Taxes):</span>
                <span className="font-amount" style={{ color: 'var(--accent-text)', fontSize: 16, fontWeight: 850 }}>{inr(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Banking */}
          <div className="rg-2" style={{ padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' as const }}>
                Bank Account Details (NEFT / RTGS)
              </div>
              <div style={{ color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{settings.bankAccountName}</div>
              <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
                A/C: {settings.bankAccountNumber} • IFSC: {settings.bankIfsc}
              </div>
              <div style={{ color: 'var(--accent-text)', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>
                UPI ID: {settings.upiId}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Instant UPI Payment</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>Scan to Pay</div>
              </div>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-raised)', color: 'var(--text-primary)' }}>
                <QrCode style={{ width: 36, height: 36 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
