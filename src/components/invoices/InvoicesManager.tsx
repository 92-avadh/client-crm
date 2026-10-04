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

  // Offline Payment Form State
  const [offlineForm, setOfflineForm] = useState({
    mode: 'Bank Transfer' as any,
    referenceNo: '',
    date: '2026-10-04'
  });

  // Invoice Builder State (SRD Section 3.7)
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

  // Brand selection in builder triggers 1-Click pre-fill!
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

  // GST Calculation
  const isInterstate = selectedBrand?.state !== settings.companyState;
  const gstRate = 0.18; // 18% standard GST
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

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;

    createInvoice({
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

    setShowCreateModal(false);
  };

  const handlePayOnline = async (inv: Invoice) => {
    setIsProcessingPayment(true);
    const success = await simulateRazorpayPayment(inv.id);
    setIsProcessingPayment(false);

    if (success) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
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

  // WhatsApp click-to-share message generator (SRD Section 3.7)
  const openWhatsAppShare = (inv: Invoice) => {
    const text = `Hi ${inv.brandName}, here is your invoice #${inv.invoiceNumber} for ₹${inv.totalAmount.toLocaleString('en-IN')}. Due date: ${inv.dueDate}. You can pay directly online using UPI/Card via Razorpay. Thank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            One-Click Invoice Generator & GST Billing
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Generate GST-compliant invoices in 1 click, collect payments via Razorpay, and share via WhatsApp.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate 1-Click Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: '#ffffff',
          border: '1px solid #e2e2e2',
          borderRadius: 12,
        }}
      >
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#888888' }} />
          <input
            type="text"
            placeholder="Search invoice # (INV-2026) or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              paddingLeft: 34,
              paddingRight: 12,
              fontSize: 13,
              background: '#f7f7f7',
              border: '1px solid #e2e2e2',
              borderRadius: 8,
              color: '#0a0a0a',
              outline: 'none',
            }}
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
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
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
      <div className="glass-panel overflow-hidden">
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
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-500">
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono font-bold text-indigo-400 text-xs">
                    {inv.invoiceNumber}
                  </td>
                  <td>
                    <div className="font-semibold text-slate-200 text-xs">{inv.brandName}</div>
                  </td>
                  <td className="text-slate-400 text-xs">{inv.issueDate}</td>
                  <td className="text-slate-400 text-xs">{inv.dueDate}</td>
                  <td>
                    <span className="text-[11px] text-slate-300 font-mono">
                      {inv.hasGst ? inv.gstType : 'No GST'}
                    </span>
                  </td>
                  <td>
                    <div className="font-mono font-extrabold text-white text-xs">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        inv.status === 'Paid'
                          ? 'badge-active'
                          : inv.status === 'Overdue'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="p-1.5 rounded-lg bg-[#131c2e] hover:bg-[#1a263d] text-slate-300"
                        title="View / Print Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Pay Online Button via Razorpay if Unpaid */}
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => {
                            setPayingInvoice(inv);
                            setShowPayModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1"
                          title="Simulate Razorpay Payment"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay Now</span>
                        </button>
                      )}

                      {/* WhatsApp Share Link (SRD Section 3.7) */}
                      <button
                        onClick={() => openWhatsAppShare(inv)}
                        className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/20"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 1-Click Invoice Builder Modal (SRD Section 3.7) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>One-Click GST Invoice Generator</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a client: address, GSTIN, and monthly fee will auto-fill instantly!
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-[#1e293b] text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Client Auto-fill Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Client (1-Click Pre-fill) *
                  </label>
                  <select
                    value={builderBrandId}
                    onChange={(e) => handleBrandSelect(e.target.value)}
                    className="input-field font-semibold"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (₹{b.monthlyFee.toLocaleString('en-IN')}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={builderDueDate}
                    onChange={(e) => setBuilderDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Pre-filled Brand Info preview */}
              {selectedBrand && (
                <div className="p-3.5 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Billing State</span>
                    <div className="text-slate-200 font-semibold mt-0.5">{selectedBrand.state}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">GSTIN</span>
                    <div className="text-indigo-400 font-mono font-semibold mt-0.5">
                      {selectedBrand.gstNumber || 'Unregistered'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Tax Mechanism</span>
                    <div className="text-emerald-400 font-semibold mt-0.5">
                      {isInterstate ? 'Interstate (IGST 18%)' : 'Intrastate (CGST 9% + SGST 9%)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div>
                <label className="block font-semibold text-slate-300 mb-2">Invoice Line Items</label>
                <div className="space-y-2">
                  {builderItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <label className="text-[10px] text-slate-500">Service Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...builderItems];
                            updated[idx].description = e.target.value;
                            setBuilderItems(updated);
                          }}
                          className="input-field mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500">SAC Code</label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => {
                            const updated = [...builderItems];
                            updated[idx].hsnSac = e.target.value;
                            setBuilderItems(updated);
                          }}
                          className="input-field font-mono mt-1"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-500">Amount (INR)</label>
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
                          className="input-field font-mono mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST Toggle and Summary */}
              <div className="p-4 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={builderHasGst}
                      onChange={(e) => setBuilderHasGst(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <span>Apply Indian GST (18%) to this invoice</span>
                  </label>
                  <span className="text-slate-400 font-mono text-xs">
                    Subtotal: ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {builderHasGst && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] pt-2 space-y-1 text-slate-400">
                    {isInterstate ? (
                      <div className="flex justify-between">
                        <span>IGST (18%):</span>
                        <span className="font-mono text-slate-200">₹{igst.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>CGST (9%):</span>
                          <span className="font-mono text-slate-200">₹{cgst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST (9%):</span>
                          <span className="font-mono text-slate-200">₹{sgst.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="border-t border-[rgba(255,255,255,0.08)] pt-2 flex items-center justify-between font-bold text-sm">
                  <span className="text-white">Total Payable Amount:</span>
                  <span className="text-indigo-400 font-mono text-base">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Generate & Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable / Downloadable High-Fidelity Invoice Preview Modal */}
      {activeInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoiceId(null)}>
          <div
            className="modal-content max-w-3xl bg-[#0b101d]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Invoice Preview</span>
                <span className="font-mono text-indigo-400 font-semibold text-xs">
                  {activeInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => openWhatsAppShare(activeInvoice)}
                  className="btn-secondary text-xs text-emerald-400"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceId(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Document Body */}
            <div className="p-8 space-y-6 text-slate-300 printable-invoice text-xs">
              {/* Header: Agency branding */}
              <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.1)] pb-6">
                <div>
                  <div className="text-xl font-black text-white">{settings.companyName}</div>
                  <p className="text-slate-400 mt-1 max-w-sm leading-relaxed">
                    {settings.companyAddress}
                  </p>
                  <div className="mt-2 text-slate-400 font-mono text-[11px]">
                    GSTIN: <span className="text-indigo-400 font-bold">{settings.companyGst}</span> • PAN: {settings.companyPan}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    TAX INVOICE
                  </div>
                  <div className="font-mono text-sm text-slate-200 mt-1">
                    {activeInvoice.invoiceNumber}
                  </div>
                  <div className="text-slate-400 mt-1">Date: {activeInvoice.issueDate}</div>
                  <div className="text-rose-400 font-semibold mt-0.5">Due: {activeInvoice.dueDate}</div>
                </div>
              </div>

              {/* Billed To Client Details */}
              <div className="p-4 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Billed To</span>
                  <div className="font-bold text-slate-100 text-sm mt-0.5">
                    {activeInvoice.brandName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Payment Status</span>
                  <div>
                    <span
                      className={`badge mt-1 ${
                        activeInvoice.status === 'Paid'
                          ? 'badge-active'
                          : activeInvoice.status === 'Overdue'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {activeInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.1)] text-slate-400 text-left">
                    <th className="py-2">Description</th>
                    <th className="py-2">HSN/SAC</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {activeInvoice.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-3 text-slate-200 font-medium">{it.description}</td>
                      <td className="py-3 font-mono text-slate-400">{it.hsnSac}</td>
                      <td className="py-3 text-right font-mono">{it.quantity}</td>
                      <td className="py-3 text-right font-mono text-slate-100 font-bold">
                        ₹{it.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Tax Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-2 border-t border-[rgba(255,255,255,0.1)] pt-3 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono text-slate-200">
                      ₹{activeInvoice.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {activeInvoice.hasGst && (
                    <>
                      {activeInvoice.cgstAmount > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>CGST (9%):</span>
                          <span className="font-mono">₹{activeInvoice.cgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {activeInvoice.sgstAmount > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>SGST (9%):</span>
                          <span className="font-mono">₹{activeInvoice.sgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {activeInvoice.igstAmount > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>IGST (18%):</span>
                          <span className="font-mono">₹{activeInvoice.igstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-[rgba(255,255,255,0.1)]">
                    <span>Total (Incl. Taxes):</span>
                    <span className="text-indigo-400 font-mono">
                      ₹{activeInvoice.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banking & Razorpay UPI Settlement Info (SRD Section 3.10) */}
              <div className="p-4 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">
                    Bank Account Details (NEFT / RTGS)
                  </div>
                  <div className="text-slate-200 mt-1 font-semibold">{settings.bankAccountName}</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    A/C: {settings.bankAccountNumber} • IFSC: {settings.bankIfsc}
                  </div>
                  <div className="text-indigo-400 font-mono text-[11px] mt-0.5">
                    UPI ID: {settings.upiId}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Instant UPI Payment</div>
                    <div className="text-[11px] text-slate-500 font-mono">Scan in Client Portal</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white text-black">
                    <QrCode className="w-9 h-9" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Razorpay Payment Modal Simulator (SRD Section 3.10) */}
      {showPayModal && payingInvoice && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div
            className="modal-content max-w-md bg-[#0e1626]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Razorpay Branded Topbar */}
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#0d1e38] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                  R
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Razorpay Checkout</h3>
                  <div className="text-[11px] text-blue-300">Secured 256-bit encrypted gateway</div>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center p-4 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)]">
                <span className="text-xs text-slate-400">Paying to: {settings.companyName}</span>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  ₹{(payingInvoice.totalAmount - payingInvoice.paidAmount).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Invoice #{payingInvoice.invoiceNumber} • {payingInvoice.brandName}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  disabled={isProcessingPayment}
                  onClick={() => handlePayOnline(payingInvoice)}
                  className="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Pay via UPI / GPay / PhonePe / QR</span>
                  </div>
                  <span className="font-mono">Instant</span>
                </button>

                <button
                  disabled={isProcessingPayment}
                  onClick={() => handlePayOnline(payingInvoice)}
                  className="w-full p-3 rounded-xl bg-[#131c2e] hover:bg-[#1a263d] text-slate-200 font-semibold text-xs flex items-center justify-between border border-[rgba(255,255,255,0.08)]"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Credit / Debit Card (Visa, Mastercard, Rupay)</span>
                  </div>
                </button>
              </div>

              {isProcessingPayment && (
                <div className="text-center py-3 text-xs text-blue-400 font-semibold animate-pulse flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying payment mandate with bank...</span>
                </div>
              )}

              <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] text-slate-500">
                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setShowOfflinePayModal(true);
                  }}
                  className="text-slate-400 hover:text-indigo-400"
                >
                  Record Offline Payment instead
                </button>
                <span>Razorpay Route Settle</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Offline Payment Modal (Cash, Bank Transfer, Cheque per SRD Section 3.4) */}
      {showOfflinePayModal && payingInvoice && (
        <div className="modal-overlay" onClick={() => setShowOfflinePayModal(false)}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Record Offline Payment</h3>
                <p className="text-[11px] text-slate-400">
                  Manual fallback for Cash, Bank NEFT, or Cheque
                </p>
              </div>
              <button
                onClick={() => setShowOfflinePayModal(false)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOfflinePaymentSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                <select
                  value={offlineForm.mode}
                  onChange={(e) => setOfflineForm({ ...offlineForm, mode: e.target.value as any })}
                  className="input-field"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Bank Reference # / Cheque No.
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR_AXIS_99812401"
                  value={offlineForm.referenceNo}
                  onChange={(e) => setOfflineForm({ ...offlineForm, referenceNo: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={offlineForm.date}
                  onChange={(e) => setOfflineForm({ ...offlineForm, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfflinePayModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
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
