import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Invoice } from '../../types';
import confetti from 'canvas-confetti';
import {
  Receipt,
  CreditCard,
  MessageSquare,
  Users,
  Eye,
  X
} from 'lucide-react';

export const ClientPortal: React.FC = () => {
  const {
    currentUser,
    brands,
    invoices,
    setSelectedInvoiceId,
    simulateRazorpayPayment,
    tasks,
    setActiveTab,
    allUsers,
    showToast
  } = useApp();

  // Find the brand associated with this user
  const clientBrand = brands.find((b) => b.id === (currentUser.brandId || 'brand_apex')) || brands[0];

  const brandInvoices = invoices.filter((i) => i.brandId === clientBrand.id);
  const brandTasks = tasks.filter((t) => t.brandId === clientBrand.id);
  const assignedTeam = allUsers.filter((u) => clientBrand.assignedMemberIds.includes(u.id));

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handlePayNow = async (inv: Invoice) => {
    setIsProcessing(true);
    const success = await simulateRazorpayPayment(inv.id);
    setIsProcessing(false);
    if (success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setPayingInvoice(null);
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    showToast(`Invite sent to ${inviteEmail} for access to ${clientBrand.name} portal!`, 'success');
    setShowInviteModal(false);
    setInviteEmail('');
  };

  const totalOutstanding = brandInvoices
    .filter((i) => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#0a0a0a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            {clientBrand.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {clientBrand.name}
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#f0f0f0',
                  color: '#0a0a0a',
                  border: '1px solid #d4d4d4',
                }}
              >
                Client Portal Verified
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
              Primary Contact: {clientBrand.ownerName} ({currentUser.email})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-secondary"
          >
            <Users style={{ width: 14, height: 14 }} />
            <span>Invite Accountant</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className="btn-primary"
          >
            <MessageSquare style={{ width: 14, height: 14 }} />
            <span>Chat with Account Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Overview for Client */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <div className="metric-label" style={{ marginBottom: 12 }}>Outstanding Invoices</div>
          <div className="metric-value">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>
            {totalOutstanding > 0 ? 'Pending payment via Razorpay' : 'All accounts fully settled'}
          </div>
        </div>

        <div className="stat-card">
          <div className="metric-label" style={{ marginBottom: 12 }}>Active Deliverables</div>
          <div className="metric-value">
            {brandTasks.length}
          </div>
          <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>
            Statutory audits & GST reconciliation
          </div>
        </div>

        <div className="stat-card">
          <div className="metric-label" style={{ marginBottom: 12 }}>Dedicated Account Team</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            {assignedTeam.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img
                  src={m.avatar}
                  alt={m.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e2e2' }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices & Instant Razorpay Checkout (SRD Section 3.9) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt style={{ width: 18, height: 18, color: '#0a0a0a' }} />
              <span>Your Invoices & Tax Receipts</span>
            </h3>
            <p style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
              Pay securely via UPI (Google Pay, PhonePe), NetBanking, or Credit/Debit Card
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount (INR)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {brandInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a', fontSize: 12 }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ color: '#666666', fontSize: 12 }}>{inv.issueDate}</td>
                  <td style={{ color: '#0a0a0a', fontSize: 12, fontWeight: 600 }}>{inv.dueDate}</td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0a0a0a', fontSize: 13 }}>
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: inv.status === 'Paid' ? '#0a0a0a' : '#f0f0f0',
                        color: inv.status === 'Paid' ? '#ffffff' : '#0a0a0a',
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="btn-secondary"
                        style={{ height: 28, fontSize: 11, padding: '0 8px' }}
                        title="View & Download PDF"
                      >
                        <Eye style={{ width: 12, height: 12 }} />
                        <span>View</span>
                      </button>

                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="btn-primary"
                          style={{ height: 28, fontSize: 11, padding: '0 10px' }}
                        >
                          <CreditCard style={{ width: 12, height: 12 }} />
                          <span>Pay with Razorpay</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Razorpay Modal for Client Portal */}
      {payingInvoice && (
        <div className="modal-overlay" onClick={() => setPayingInvoice(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0a0a0a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                  R
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>Razorpay Checkout</h3>
                  <div style={{ fontSize: 10, color: '#666666' }}>Fast & Secure UPI Gateway</div>
                </div>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, borderRadius: 10, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                <span style={{ fontSize: 11, color: '#666666' }}>Total Due Amount</span>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  ₹{(payingInvoice.totalAmount - payingInvoice.paidAmount).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: '#888888', marginTop: 4 }}>
                  Invoice #{payingInvoice.invoiceNumber}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  disabled={isProcessing}
                  onClick={() => handlePayNow(payingInvoice)}
                  className="btn-primary"
                  style={{ width: '100%', height: 42, justifyContent: 'space-between', padding: '0 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16 }} />
                    <span>Pay with UPI (GPay / PhonePe)</span>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>Instant</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => handlePayNow(payingInvoice)}
                  className="btn-secondary"
                  style={{ width: '100%', height: 42, justifyContent: 'space-between', padding: '0 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16 }} />
                    <span>Credit / Debit Card / NetBanking</span>
                  </div>
                </button>
              </div>

              {isProcessing && (
                <div style={{ textAlign: 'center', padding: 8, fontSize: 12, fontWeight: 600, color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span>Confirming payment with your bank...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 440, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>
                  Invite Member to {clientBrand.name} Portal
                </h3>
                <p style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>
                  Allow your accountant or finance team to view invoices and pay online.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleInviteUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="accountant@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary"
                  style={{ height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ height: 32, fontSize: 12 }}>
                  Send Invite Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
