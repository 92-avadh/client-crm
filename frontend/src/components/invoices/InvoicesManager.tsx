import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Invoice } from '../../types';
import confetti from 'canvas-confetti';
import { Plus, Search, Filter } from 'lucide-react';
import { btnPrimary, btnSecondary } from './invoiceStyles';
import { useInvoiceBuilder } from './useInvoiceBuilder';
import { InvoiceTable } from './InvoiceTable';
import { InvoiceBuilderModal } from './InvoiceBuilderModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { RazorpayModal, OfflinePaymentModal, type OfflineForm } from './PaymentModals';
import { RecurringPanel } from './RecurringPanel';

/**
 * Invoice module orchestrator.
 *
 * Owns only cross-cutting state (which modal is open, filters) and composes
 * the extracted pieces. All layout lives in the child components; the GST
 * math lives in useInvoiceBuilder.
 */
export const InvoicesManager: React.FC = () => {
  const {
    invoices,
    brands,
    createInvoice,
    recordPayment,
    simulateRazorpayPayment,
    selectedInvoiceId,
    setSelectedInvoiceId,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pageLoading, setPageLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showOfflinePayModal, setShowOfflinePayModal] = useState(false);
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInvoiceIds, setRecurringInvoiceIds] = useState<Set<string>>(
    () => new Set(invoices.slice(0, 2).map((i) => i.id))
  );
  const [pausedRecurringIds, setPausedRecurringIds] = useState<Set<string>>(new Set());
  const [offlineForm, setOfflineForm] = useState<OfflineForm>({
    mode: 'Bank Transfer',
    referenceNo: '',
    date: '2026-10-04',
  });

  const builder = useInvoiceBuilder(brands, settings);

  // Show loader until invoices data arrives from the API
  React.useEffect(() => {
    if (invoices.length > 0) {
      setPageLoading(false);
      return;
    }
    // Fallback: if no invoices exist, still show loader briefly then show empty state
    const timer = setTimeout(() => setPageLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [invoices]);

  const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId) || null;

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.brandName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  /* ── Handlers ────────────────────────────────────────────────── */

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builder.selectedBrand) return;

    const newInvoice = await createInvoice({
      brandId: builder.selectedBrand.id,
      brandName: builder.selectedBrand.name,
      issueDate: '2026-10-04',
      dueDate: builder.dueDate,
      items: builder.items,
      subtotal: builder.totals.subtotal,
      hasGst: builder.hasGst,
      gstType: builder.totals.gstType,
      cgstAmount: builder.totals.cgst,
      sgstAmount: builder.totals.sgst,
      igstAmount: builder.totals.igst,
      totalAmount: builder.totals.totalAmount,
      notes: builder.notes,
    });

    if (isRecurring && newInvoice?.id) {
      setRecurringInvoiceIds((prev) => new Set([...prev, newInvoice.id]));
    }
    setIsRecurring(false);
    setShowCreateModal(false);
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
      mode: offlineForm.mode as any,
      referenceNo: offlineForm.referenceNo || `OFFLINE_${Date.now()}`,
    });

    setShowOfflinePayModal(false);
    setPayingInvoice(null);
  };

  const openWhatsAppShare = (inv: Invoice) => {
    const message = `Invoice ${inv.invoiceNumber} for ₹${inv.totalAmount.toLocaleString('en-IN')} from ${settings.companyName}. Please pay by ${inv.dueDate}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const togglePauseRecurring = (id: string) => {
    setPausedRecurringIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent-text, var(--text-primary))',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading invoices…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            One-Click Invoice Generator &amp; GST Billing
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
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

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search invoice # (INV-2026) or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 13, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <Filter style={{ width: 13, height: 13 }} /> Filter:
          </span>
          {['All', 'Paid', 'Sent', 'Overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: statusFilter === status ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
                color: statusFilter === status ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                border: statusFilter === status ? '1px solid var(--border-focus)' : '1px solid var(--border)',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <InvoiceTable
        invoices={filteredInvoices}
        recurringIds={recurringInvoiceIds}
        onView={setSelectedInvoiceId}
        onPay={(inv) => { setPayingInvoice(inv); setShowPayModal(true); }}
        onWhatsApp={openWhatsAppShare}
      />

      {/* ── Modals ──────────────────────────────────────────────── */}
      <InvoiceBuilderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleGenerateInvoice}
        brands={brands}
        brandId={builder.brandId}
        onSelectBrand={builder.selectBrand}
        dueDate={builder.dueDate}
        onDueDateChange={builder.setDueDate}
        items={builder.items}
        onUpdateItem={builder.updateItem}
        hasGst={builder.hasGst}
        onHasGstChange={builder.setHasGst}
        isRecurring={isRecurring}
        onIsRecurringChange={setIsRecurring}
        selectedBrand={builder.selectedBrand}
        totals={builder.totals}
      />

      <InvoicePreviewModal
        invoice={activeInvoice}
        settings={settings}
        onClose={() => setSelectedInvoiceId(null)}
        onWhatsApp={openWhatsAppShare}
      />

      {showPayModal && payingInvoice && (
        <RazorpayModal
          invoice={payingInvoice}
          settings={settings}
          processing={isProcessingPayment}
          onClose={() => setShowPayModal(false)}
          onPay={handlePayOnline}
          onSwitchToOffline={() => { setShowPayModal(false); setShowOfflinePayModal(true); }}
        />
      )}

      {showOfflinePayModal && payingInvoice && (
        <OfflinePaymentModal
          invoice={payingInvoice}
          form={offlineForm}
          onFormChange={setOfflineForm}
          onClose={() => setShowOfflinePayModal(false)}
          onSubmit={handleOfflinePaymentSubmit}
        />
      )}

      <RecurringPanel
        open={showRecurringPanel}
        invoices={invoices}
        recurringIds={recurringInvoiceIds}
        pausedIds={pausedRecurringIds}
        onTogglePause={togglePauseRecurring}
        onClose={() => setShowRecurringPanel(false)}
        onEdit={() => { setShowRecurringPanel(false); setShowCreateModal(true); }}
      />
    </div>
  );
};

export default InvoicesManager;
