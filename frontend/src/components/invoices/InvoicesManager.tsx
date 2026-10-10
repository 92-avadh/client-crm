import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Invoice, InvoiceItem } from '../../types';
import confetti from 'canvas-confetti';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Printer,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  MessageCircle,
  DollarSign,
  Eye,
  X,
  FileCheck,
  Building,
  QrCode
} from 'lucide-react';

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2',
  borderRadius: 10, fontSize: 14, color: '#0a0a0a', background: '#fafafa',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: '#0a0a0a', color: '#fff', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: '#f5f5f5', color: '#0a0a0a',
  border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const badgeActive: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#15803d' };
const badgeWarning: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' };
const badgeDanger: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#dc2626' };
const badgeInfo: React.CSSProperties = { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' };

function getStatusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'Paid') return badgeActive;
  if (status === 'Overdue') return badgeDanger;
  return badgeWarning;
}

export const InvoicesManager: React.FC = () => {
  const {
    currentUser,
    invoices,
    brands,
    createInvoice,
    recordPayment,
    simulateRazorpayPayment,
    selectedInvoiceId,
    setSelectedInvoiceId,
    settings,
    setActiveTab
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showOfflinePayModal, setShowOfflinePayModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);
  const [recurringInvoiceIds, setRecurringInvoiceIds] = useState<Set<string>>(
    () => new Set(invoices.slice(0, 2).map((i) => i.id))
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [pausedRecurringIds, setPausedRecurringIds] = useState<Set<string>>(new Set());

  const [offlineForm, setOfflineForm] = useState({
    mode: 'Bank Transfer' as any,
    referenceNo: '',
    date: '2026-10-04'
  });

  const [builderBrandId, setBuilderBrandId] = useState(brands[0]?.id || '');
  const [builderDueDate, setBuilderDueDate] = useState('2026-10-18');
  const [builderHasGst, setBuilderHasGst] = useState(true);
  const [builderNotes, setBuilderNotes] = useState('Thank you for your business. Payment due via Razorpay online link.');
  const [builderItems, setBuilderItems] = useState<InvoiceItem[]>([
    {
      id: 'item_init',
      description: 'Monthly Retainer & Compliance Advisory (October 2026)',
      hsnSac: '998231',
      quantity: 1,
      unitPrice: brands[0]?.monthlyFee || 100000,
      amount: brands[0]?.monthlyFee || 100000
    }
  ]);

  const handleBrandSelect = (brandId: string) => {
    setBuilderBrandId(brandId);
    const b = brands.find((x) => x.id === brandId);
    if (b) {
      setBuilderItems([
        {
          id: 'item_' + Date.now(),
          description: `${b.serviceDetails} (Current Month)`,
          hsnSac: '998231',
          quantity: 1,
          unitPrice: b.monthlyFee,
          amount: b.monthlyFee
        }
      ]);
    }
  };

  const selectedBrand = brands.find((b) => b.id === builderBrandId);
  const subtotal = builderItems.reduce((acc, it) => acc + it.amount, 0);

  const isInterstate = selectedBrand?.state !== settings.companyState;
  const gstRate = 0.18;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let gstType: 'CGST_SGST' | 'IGST' | 'NONE' = 'NONE';

  if (builderHasGst) {
    if (isInterstate) {
      gstType = 'IGST';
      igst = Math.round(subtotal * gstRate);
    } else {
      gstType = 'CGST_SGST';
      cgst = Math.round(subtotal * (gstRate / 2));
      sgst = Math.round(subtotal * (gstRate / 2));
    }
  }

  const totalAmount = subtotal + cgst + sgst + igst;

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;

    try {
      const newInvoice = await createInvoice({
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        issueDate: '2026-10-04',
        dueDate: builderDueDate,
        items: builderItems,
        subtotal,
        hasGst: builderHasGst,
        gstType,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalAmount,
        notes: builderNotes
      });

      if (isRecurring && newInvoice?.id) {
        setRecurringInvoiceIds((prev) => new Set([...prev, newInvoice.id]));
      }

      setIsRecurring(false);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayOnline = async (inv: Invoice) => {
    setIsProcessingPayment(true);
    const success = await simulateRazorpayPayment(inv.id);
    setIsProcessingPayment(false);

    if (success) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      setShowPayModal(false);
      setPayingInvoice(null);
    }
  };

  const handleOfflinePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    recordPayment({
      invoiceId: payingInvoice.id,
      brandId: payingInvoice.brandId,
      brandName: payingInvoice.brandName,
      amount: payingInvoice.totalAmount - payingInvoice.paidAmount,
      paymentDate: offlineForm.date,
      mode: offlineForm.mode,
      referenceNo: offlineForm.referenceNo || `OFFLINE_${Date.now()}`
    });

    setShowOfflinePayModal(false);
    setPayingInvoice(null);
  };

  const openWhatsAppShare = (inv: Invoice) => {
    const message = `Invoice ${inv.invoiceNumber} for ₹${inv.totalAmount.toLocaleString('en-IN')} from ${settings.companyName}. Please pay by ${inv.dueDate}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.brandName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true : inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            One-Click Invoice Generator &amp; GST Billing
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Generate GST-compliant invoices in 1 click, collect payments via Razorpay, and share via WhatsApp.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowRecurringPanel(true)} style={btnSecondary}>
            <span>🔄 Recurring Schedules</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>
            <Plus style={{ width: 14, height: 14 }} />
            <span>Generate 1-Click Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '12px 16px',
          background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 12,
        }}
      >
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#888888' }} />
          <input
            type="text"
            placeholder="Search invoice # (INV-2026) or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 13, background: '#f7f7f7', border: '1px solid #e2e2e2', borderRadius: 8, color: '#0a0a0a', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#777777', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <Filter style={{ width: 13, height: 13 }} /> Filter:
          </span>
          {['All', 'Paid', 'Sent', 'Overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: statusFilter === status ? '#0a0a0a' : '#f7f7f7',
                color: statusFilter === status ? '#ffffff' : '#525252',
                border: statusFilter === status ? '1px solid #0a0a0a' : '1px solid #e2e2e2',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14, overflow: 'hidden' }}>
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
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40, color: '#909090' }}>
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{inv.invoiceNumber}</span>
                      {recurringInvoiceIds.has(inv.id) && (
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
                            background: '#eff6ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                            whiteSpace: 'nowrap', fontFamily: 'inherit',
                          }}
                        >
                          🔄 Recurring
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0a0a0a', fontSize: 12 }}>{inv.brandName}</div>
                  </td>
                  <td style={{ color: '#525252', fontSize: 12 }}>{inv.issueDate}</td>
                  <td style={{ color: '#525252', fontSize: 12 }}>{inv.dueDate}</td>
                  <td>
                    <span style={{ fontSize: 11, color: '#525252', fontFamily: 'monospace' }}>
                      {inv.hasGst ? inv.gstType : 'No GST'}
                    </span>
                  </td>
                  <td>
                    <div className="font-amount" style={{ fontWeight: 800, color: '#0a0a0a', fontSize: 13 }}>
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <span style={getStatusBadgeStyle(inv.status)}>{inv.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        style={{ padding: '5px', borderRadius: 8, background: '#f7f7f7', color: '#525252', border: '1px solid #e2e2e2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="View / Print Invoice"
                      >
                        <Eye style={{ width: 14, height: 14 }} />
                      </button>

                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => { setPayingInvoice(inv); setShowPayModal(true); }}
                          style={{ padding: '4px 8px', borderRadius: 8, background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                          title="Simulate Razorpay Payment"
                        >
                          <CreditCard style={{ width: 12, height: 12 }} />
                          <span>Pay Now</span>
                        </button>
                      )}

                      <button
                        onClick={() => openWhatsAppShare(inv)}
                        title="Share on WhatsApp"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#25D366', color: '#ffffff', border: 'none' }}
                      >
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

      {/* 1-Click Invoice Builder Modal */}
      {showCreateModal && (
        <div style={modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 768, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Sparkles style={{ width: 20, height: 20, color: '#4f46e5' }} />
                  <span>One-Click GST Invoice Generator</span>
                </h2>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 2, marginBottom: 0 }}>
                  Select a client: address, GSTIN, and monthly fee will auto-fill instantly!
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f0f0f0', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto', fontSize: 12 }}>
              {/* Client Auto-fill Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 4 }}>
                    Select Client (1-Click Pre-fill) *
                  </label>
                  <select
                    value={builderBrandId}
                    onChange={(e) => handleBrandSelect(e.target.value)}
                    style={{ ...inputFieldStyle, fontWeight: 600 }}
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (₹{b.monthlyFee.toLocaleString('en-IN')}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 4 }}>Due Date *</label>
                  <input
                    type="date"
                    required
                    value={builderDueDate}
                    onChange={(e) => setBuilderDueDate(e.target.value)}
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              {/* Pre-filled Brand Info preview */}
              {selectedBrand && (
                <div style={{ padding: 14, borderRadius: 12, background: '#f7f7f7', border: '1px solid #e2e2e2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, color: '#909090', fontWeight: 700, textTransform: 'uppercase' as const }}>Billing State</span>
                    <div style={{ color: '#0a0a0a', fontWeight: 600, marginTop: 2 }}>{selectedBrand.state}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: '#909090', fontWeight: 700, textTransform: 'uppercase' as const }}>GSTIN</span>
                    <div style={{ color: '#4f46e5', fontFamily: 'monospace', fontWeight: 600, marginTop: 2 }}>
                      {selectedBrand.gstNumber || 'Unregistered'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: '#909090', fontWeight: 700, textTransform: 'uppercase' as const }}>Tax Mechanism</span>
                    <div style={{ color: '#15803d', fontWeight: 600, marginTop: 2 }}>
                      {isInterstate ? 'Interstate (IGST 18%)' : 'Intrastate (CGST 9% + SGST 9%)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 8 }}>Invoice Line Items</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {builderItems.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{ padding: 12, borderRadius: 12, background: '#f7f7f7', border: '1px solid #e2e2e2', display: 'grid', gridTemplateColumns: '6fr 2fr 4fr', gap: 8, alignItems: 'center' }}
                    >
                      <div>
                        <label style={{ fontSize: 10, color: '#909090' }}>Service Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...builderItems];
                            updated[idx].description = e.target.value;
                            setBuilderItems(updated);
                          }}
                          style={{ ...inputFieldStyle, marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#909090' }}>SAC Code</label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => {
                            const updated = [...builderItems];
                            updated[idx].hsnSac = e.target.value;
                            setBuilderItems(updated);
                          }}
                          style={{ ...inputFieldStyle, fontFamily: 'monospace', marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, color: '#909090' }}>Amount (INR)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...builderItems];
                            updated[idx].unitPrice = val;
                            updated[idx].amount = val * updated[idx].quantity;
                            setBuilderItems(updated);
                          }}
                          className="font-amount"
                          style={{ ...inputFieldStyle, fontWeight: 700, marginTop: 4 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST Toggle and Summary */}
              <div style={{ padding: 16, borderRadius: 12, background: '#f7f7f7', border: '1px solid #e2e2e2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: 600, color: '#0a0a0a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={builderHasGst}
                      onChange={(e) => setBuilderHasGst(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                    />
                    <span>Apply Indian GST (18%) to this invoice</span>
                  </label>
                  <span className="font-amount" style={{ color: '#525252', fontSize: 13, fontWeight: 600 }}>
                    Subtotal: <strong style={{ color: '#0a0a0a' }}>₹{subtotal.toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                {builderHasGst && (
                  <div style={{ borderTop: '1px solid #e2e2e2', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4, color: '#525252' }}>
                    {isInterstate ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>IGST (18%):</span>
                        <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700 }}>₹{igst.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>CGST (9%):</span>
                          <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700 }}>₹{cgst.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>SGST (9%):</span>
                          <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700 }}>₹{sgst.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ borderTop: '1px solid #e2e2e2', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                  <span style={{ color: '#0a0a0a' }}>Total Payable Amount:</span>
                  <span className="font-amount" style={{ color: '#4f46e5', fontSize: 17, fontWeight: 850 }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Recurring Invoice Toggle */}
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 12,
                  background: isRecurring ? '#eff6ff' : '#f7f7f7',
                  border: isRecurring ? '1px solid #c7d2fe' : '1px solid #e2e2e2',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Recurring Invoice</div>
                  <div style={{ fontSize: 11, color: '#525252', marginTop: 3, maxWidth: 340 }}>
                    Auto-generate this invoice every month on the billing cycle date
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, cursor: 'pointer', marginTop: 2 }}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  />
                  <span
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24,
                      background: isRecurring ? '#6366f1' : '#e2e2e2',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute', top: 3, left: isRecurring ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </label>
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ ...btnSecondary, fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnPrimary, fontSize: 12 }}>
                  Generate &amp; Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable / Downloadable Invoice Preview Modal */}
      {activeInvoice && (
        <div style={modalOverlay} onClick={() => setSelectedInvoiceId(null)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 768, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="no-print" style={{ padding: '14px 20px', borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Invoice Preview</span>
                <span style={{ fontFamily: 'monospace', color: '#4f46e5', fontWeight: 600, fontSize: 12 }}>
                  {activeInvoice.invoiceNumber}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => window.print()} style={{ ...btnSecondary, fontSize: 12 }}>
                  <Printer style={{ width: 14, height: 14 }} />
                  <span>Print / PDF</span>
                </button>
                <button onClick={() => openWhatsAppShare(activeInvoice)} style={{ ...btnSecondary, fontSize: 12, color: '#15803d' }}>
                  <Share2 style={{ width: 14, height: 14 }} />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>
            </div>

            {/* Invoice Document Body */}
            <div className="printable-invoice" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, color: '#525252', fontSize: 12 }}>
              {/* Header: Agency branding */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #e2e2e2', paddingBottom: 24 }}>
                <div>
                  <img
                    src="/retentio-logo-horizontal.png"
                    alt={settings.companyName}
                    style={{ height: 28, width: 'auto', marginBottom: 10, objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a' }}>{settings.companyName}</div>
                  <p style={{ color: '#525252', marginTop: 4, maxWidth: 320, lineHeight: 1.6 }}>
                    {settings.companyAddress}
                  </p>
                  <div style={{ marginTop: 8, color: '#525252', fontFamily: 'monospace', fontSize: 11 }}>
                    GSTIN: <span style={{ color: '#4f46e5', fontWeight: 700 }}>{settings.companyGst}</span> • PAN: {settings.companyPan}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#4f46e5', fontFamily: 'monospace' }}>
                    TAX INVOICE
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#0a0a0a', marginTop: 4 }}>
                    {activeInvoice.invoiceNumber}
                  </div>
                  <div style={{ color: '#525252', marginTop: 4 }}>Date: {activeInvoice.issueDate}</div>
                  <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Due: {activeInvoice.dueDate}</div>
                </div>
              </div>

              {/* Billed To Client Details */}
              <div style={{ padding: 16, borderRadius: 12, background: '#f7f7f7', border: '1px solid #e2e2e2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 10, color: '#909090', textTransform: 'uppercase' as const, fontWeight: 700 }}>Billed To</span>
                  <div style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 14, marginTop: 2 }}>
                    {activeInvoice.brandName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, color: '#909090', textTransform: 'uppercase' as const, fontWeight: 700 }}>Payment Status</span>
                  <div style={{ marginTop: 4 }}>
                    <span style={getStatusBadgeStyle(activeInvoice.status)}>{activeInvoice.status}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e2e2', color: '#525252', textAlign: 'left' }}>
                    <th style={{ paddingBottom: 8 }}>Description</th>
                    <th style={{ paddingBottom: 8 }}>HSN/SAC</th>
                    <th style={{ paddingBottom: 8, textAlign: 'right' }}>Qty</th>
                    <th style={{ paddingBottom: 8, textAlign: 'right' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoice.items.map((it) => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ paddingTop: 12, paddingBottom: 12, color: '#0a0a0a', fontWeight: 500 }}>{it.description}</td>
                      <td style={{ paddingTop: 12, paddingBottom: 12, fontFamily: 'monospace', color: '#525252' }}>{it.hsnSac}</td>
                      <td style={{ paddingTop: 12, paddingBottom: 12, textAlign: 'right', fontFamily: 'monospace' }}>{it.quantity}</td>
                      <td className="font-amount" style={{ paddingTop: 12, paddingBottom: 12, textAlign: 'right', color: '#0a0a0a', fontWeight: 750, fontSize: 13 }}>
                        ₹{it.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Tax Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <div style={{ width: 288, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #e2e2e2', paddingTop: 12, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#525252' }}>
                    <span>Taxable Subtotal:</span>
                    <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700, fontSize: 13 }}>₹{activeInvoice.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {activeInvoice.hasGst && (
                    <>
                      {activeInvoice.cgstAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#525252' }}>
                          <span>CGST (9%):</span>
                          <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700 }}>₹{activeInvoice.cgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {activeInvoice.sgstAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#525252' }}>
                          <span>SGST (9%):</span>
                          <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700 }}>₹{activeInvoice.sgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {activeInvoice.igstAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#525252' }}>
                          <span>IGST (18%):</span>
                          <span className="font-amount" style={{ color: '#0a0a0a', fontWeight: 700 }}>₹{activeInvoice.igstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14, color: '#0a0a0a', paddingTop: 8, borderTop: '1px solid #e2e2e2' }}>
                    <span>Total (Incl. Taxes):</span>
                    <span className="font-amount" style={{ color: '#4f46e5', fontSize: 16, fontWeight: 850 }}>
                      ₹{activeInvoice.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banking Info */}
              <div style={{ padding: 16, borderRadius: 12, background: '#f7f7f7', border: '1px solid #e2e2e2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#909090', fontWeight: 700, textTransform: 'uppercase' as const }}>
                    Bank Account Details (NEFT / RTGS)
                  </div>
                  <div style={{ color: '#0a0a0a', marginTop: 4, fontWeight: 600 }}>{settings.bankAccountName}</div>
                  <div style={{ color: '#525252', fontFamily: 'monospace', fontSize: 11 }}>
                    A/C: {settings.bankAccountNumber} • IFSC: {settings.bankIfsc}
                  </div>
                  <div style={{ color: '#4f46e5', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>
                    UPI ID: {settings.upiId}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#525252' }}>Instant UPI Payment</div>
                    <div style={{ fontSize: 11, color: '#909090', fontFamily: 'monospace' }}>Scan to Pay</div>
                  </div>
                  <div style={{ padding: 8, borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a' }}>
                    <QrCode style={{ width: 36, height: 36 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Razorpay Payment Modal Simulator */}
      {showPayModal && payingInvoice && (
        <div style={modalOverlay} onClick={() => setShowPayModal(false)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 448, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Razorpay Branded Topbar */}
            <div style={{ padding: 20, borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 12 }}>
                  R
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 14, margin: 0 }}>Razorpay Checkout</h3>
                  <div style={{ fontSize: 11, color: '#1d4ed8' }}>Secured 256-bit encrypted gateway</div>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                <span style={{ fontSize: 12, color: '#525252' }}>Paying to: {settings.companyName}</span>
                <div className="font-amount" style={{ fontSize: 28, fontWeight: 900, color: '#0a0a0a', marginTop: 4 }}>
                  ₹{(payingInvoice.totalAmount - payingInvoice.paidAmount).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: '#909090', marginTop: 4 }}>
                  Invoice #{payingInvoice.invoiceNumber} • {payingInvoice.brandName}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  disabled={isProcessingPayment}
                  onClick={() => handlePayOnline(payingInvoice)}
                  style={{ width: '100%', padding: 12, borderRadius: 12, background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: isProcessingPayment ? 'not-allowed' : 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16 }} />
                    <span>Pay via UPI / GPay / PhonePe / QR</span>
                  </div>
                  <span style={{ fontFamily: 'monospace' }}>Instant</span>
                </button>

                <button
                  disabled={isProcessingPayment}
                  onClick={() => handlePayOnline(payingInvoice)}
                  style={{ width: '100%', padding: 12, borderRadius: 12, background: '#f7f7f7', color: '#0a0a0a', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e2e2', cursor: isProcessingPayment ? 'not-allowed' : 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard style={{ width: 16, height: 16, color: '#525252' }} />
                    <span>Credit / Debit Card (Visa, Mastercard, Rupay)</span>
                  </div>
                </button>
              </div>

              {isProcessingPayment && (
                <div style={{ textAlign: 'center', paddingTop: 12, paddingBottom: 12, fontSize: 12, color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin"></div>
                  <span>Verifying payment mandate with bank...</span>
                </div>
              )}

              <div style={{ paddingTop: 12, borderTop: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#909090' }}>
                <button
                  onClick={() => { setShowPayModal(false); setShowOfflinePayModal(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', fontSize: 11 }}
                >
                  Record Offline Payment instead
                </button>
                <span>Razorpay Route Settle</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Schedules Panel */}
      {showRecurringPanel && (
        <div style={modalOverlay} onClick={() => setShowRecurringPanel(false)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 768, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <span>🔄</span>
                  <span>Recurring Invoice Schedules</span>
                </h2>
                <p style={{ fontSize: 12, color: '#525252', marginTop: 2, marginBottom: 0 }}>
                  Manage auto-billing schedules. Invoices are generated on the monthly billing cycle date.
                </p>
              </div>
              <button
                onClick={() => setShowRecurringPanel(false)}
                style={{ background: '#f0f0f0', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: '75vh', overflowY: 'auto', fontSize: 12 }}>
              {recurringInvoiceIds.size === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#909090' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#525252', marginBottom: 6 }}>No Recurring Invoices Yet</div>
                  <div style={{ fontSize: 12, color: '#909090' }}>
                    Create an invoice and enable the "Recurring Invoice" toggle to auto-schedule it monthly.
                  </div>
                </div>
              ) : (
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
                    {invoices
                      .filter((inv) => recurringInvoiceIds.has(inv.id))
                      .map((inv) => {
                        const isPaused = pausedRecurringIds.has(inv.id);
                        const issueMs = new Date(inv.issueDate).getTime();
                        const nextDue = new Date(issueMs);
                        nextDue.setMonth(nextDue.getMonth() + 1);
                        const nextDueStr = nextDue.toISOString().split('T')[0];
                        return (
                          <tr key={inv.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0a0a0a', fontSize: 12 }}>{inv.brandName}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5', fontSize: 12 }}>
                              {inv.invoiceNumber}
                            </td>
                            <td>
                              <div className="font-amount" style={{ fontWeight: 800, color: '#0a0a0a', fontSize: 13 }}>
                                ₹{inv.totalAmount.toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                                Monthly
                              </span>
                            </td>
                            <td style={{ color: '#525252', fontSize: 12 }}>{nextDueStr}</td>
                            <td>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isPaused ? '#fef3c7' : '#f0fdf4', color: isPaused ? '#92400e' : '#15803d', border: isPaused ? '1px solid #fde68a' : '1px solid #86efac' }}>
                                {isPaused ? 'Paused' : 'Active'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  onClick={() => {
                                    setPausedRecurringIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(inv.id)) next.delete(inv.id);
                                      else next.add(inv.id);
                                      return next;
                                    });
                                  }}
                                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: isPaused ? '#f0fdf4' : '#fef3c7', color: isPaused ? '#15803d' : '#92400e', border: isPaused ? '1px solid #86efac' : '1px solid #fde68a' }}
                                >
                                  {isPaused ? 'Resume' : 'Pause'}
                                </button>
                                <button
                                  onClick={() => { setShowRecurringPanel(false); setShowCreateModal(true); }}
                                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: '#eff6ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}

              <div style={{ paddingTop: 20, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => setShowRecurringPanel(false)} style={{ ...btnSecondary, fontSize: 12 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Offline Payment Modal */}
      {showOfflinePayModal && payingInvoice && (
        <div style={modalOverlay} onClick={() => setShowOfflinePayModal(false)}>
          <div
            style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 448, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 20, borderBottom: '1px solid #e2e2e2', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 14, margin: 0 }}>Record Offline Payment</h3>
                <p style={{ fontSize: 11, color: '#525252', margin: '4px 0 0' }}>
                  Manual fallback for Cash, Bank NEFT, or Cheque
                </p>
              </div>
              <button
                onClick={() => setShowOfflinePayModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleOfflinePaymentSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Payment Mode</label>
                <select
                  value={offlineForm.mode}
                  onChange={(e) => setOfflineForm({ ...offlineForm, mode: e.target.value as any })}
                  style={inputFieldStyle}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>
                  Bank Reference # / Cheque No.
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR_AXIS_99812401"
                  value={offlineForm.referenceNo}
                  onChange={(e) => setOfflineForm({ ...offlineForm, referenceNo: e.target.value })}
                  style={{ ...inputFieldStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#0a0a0a', fontWeight: 600, marginBottom: 4 }}>Payment Date</label>
                <input
                  type="date"
                  required
                  value={offlineForm.date}
                  onChange={(e) => setOfflineForm({ ...offlineForm, date: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowOfflinePayModal(false)} style={{ ...btnSecondary, fontSize: 12 }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnPrimary, fontSize: 12 }}>
                  Mark Invoice Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
