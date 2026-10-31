import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Invoice, Brand } from '../../types';
import confetti from 'canvas-confetti';
import { Plus, Search, Filter, Trash2, Loader2 } from 'lucide-react';
import { btnPrimary, btnSecondary } from './invoiceStyles';
import { useInvoiceBuilder } from './useInvoiceBuilder';
import { InvoiceTable } from './InvoiceTable';
import Pagination from '../ui/Pagination';
import { InvoiceBuilderModal } from './InvoiceBuilderModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { RazorpayModal, OfflinePaymentModal, type OfflineForm } from './PaymentModals';
import { RecurringPanel } from './RecurringPanel';
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/animate-ui/components/base/alert-dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Invoice module orchestrator.
 *
 * Owns only cross-cutting state (which modal is open, filters) and composes
 * the extracted pieces. All layout lives in the child components; the GST
 * math lives in useInvoiceBuilder.
 */
export const InvoicesManager: React.FC = () => {
  const {
    currentUser,
    invoices,
    brands,
    createInvoice,
    deleteInvoice,
    deleteInvoices,
    recordPayment,
    simulateRazorpayPayment,
    selectedInvoiceId,
    setSelectedInvoiceId,
    settings,
    showToast,
  } = useApp();

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'hr' || (Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('invoices'));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pageLoading, setPageLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showOfflinePayModal, setShowOfflinePayModal] = useState(false);
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInvoiceIds, setRecurringInvoiceIds] = useState<Set<string>>(
    () => new Set(invoices.slice(0, 2).map((i) => i.id))
  );
  const [pausedRecurringIds, setPausedRecurringIds] = useState<Set<string>>(new Set());
  const [offlineForm, setOfflineForm] = useState<OfflineForm>(() => ({
    mode: 'Bank Transfer',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
  }));

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

  const activeInvoice = (invoices || []).find((i) => i && i.id === selectedInvoiceId) || null;

  const filteredInvoices = useMemo(() => {
    const q = (search || '').toLowerCase();
    return (invoices || []).filter(Boolean).filter((inv) => {
      const invNum = (inv.invoiceNumber || '').toLowerCase();
      const bName = (inv.brandName || '').toLowerCase();
      const matchesSearch = invNum.includes(q) || bName.includes(q);
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  /* ── Pagination (client-side; the full collection is already loaded) ── */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const filteredCount = filteredInvoices.length;
  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const pagedInvoices = useMemo(
    () => filteredInvoices.slice(page * pageSize, (page + 1) * pageSize),
    [filteredInvoices, page, pageSize]
  );

    const dueBrands = useMemo(() => {
      const todayDay = new Date().getDate();
      return (brands || []).filter(Boolean).filter(b => b.status === 'Active' && Number(b.billingCycleDay || 0) <= todayDay);
    }, [brands]);

    /* ── Handlers ────────────────────────────────────────────────── */

  const handleGenerateInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!builder.selectedBrand) {
      showToast('Please select a client to generate the invoice', 'error');
      return;
    }
    if (!builder.dueDate) {
      showToast('Please select an invoice due date', 'error');
      return;
    }
    if (!builder.items || builder.items.length === 0 || !builder.items[0]?.description) {
      showToast('Please specify at least one invoice service line item', 'error');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const newInvoice = await createInvoice({
        brandId: builder.selectedBrand.id,
        brandName: builder.selectedBrand.name,
        issueDate: todayIso,
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

      setPage(0);
      if (isRecurring && newInvoice?.id) {
        setRecurringInvoiceIds((prev) => new Set([...prev, newInvoice.id]));
      }
      setIsRecurring(false);
      builder.reset();
      setShowCreateModal(false);
    } catch (err: any) {
      // Error notification handled in createInvoice
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleDeleteInvoice = (inv: Invoice) => {
    if (!canManage) return;
    setInvoiceToDelete(inv);
  };

  const confirmDeleteSingleInvoice = async () => {
    if (!invoiceToDelete) return;
    setDeletingInvoiceId(invoiceToDelete.id);
    try {
      await deleteInvoice(invoiceToDelete.id);
      setSelectedInvoiceIds((prev) => {
        const next = new Set(prev);
        next.delete(invoiceToDelete.id);
        return next;
      });
      setInvoiceToDelete(null);
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleToggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllInvoices = (select: boolean) => {
    if (select) {
      setSelectedInvoiceIds(new Set(filteredInvoices.map((i) => i.id)));
    } else {
      setSelectedInvoiceIds(new Set());
    }
  };

  const handleOpenBulkDelete = () => {
    const selected = filteredInvoices.filter((i) => selectedInvoiceIds.has(i.id));
    if (selected.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = Array.from(selectedInvoiceIds);
    if (idsToDelete.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await deleteInvoices(idsToDelete);
      setSelectedInvoiceIds(new Set());
      setShowBulkDeleteDialog(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete invoices', 'error');
    } finally {
      setIsBulkDeleting(false);
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

  const handleDraftInvoices = async (brandIds: string[]) => {
    const todayIso = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let successCount = 0;

    for (const brandId of brandIds) {
      const brand = brands.find(b => b.id === brandId);
      if (!brand) continue;

      try {
        const hasGst = !!brand.gstNumber;
        const defaultRate = typeof settings.defaultGstRate === 'number' && settings.defaultGstRate >= 0 ? settings.defaultGstRate : 18;
        const gstRate = defaultRate / 100;
        const subtotal = brand.monthlyFee;
        const cgst = hasGst ? (subtotal * gstRate) / 2 : 0;
        const sgst = hasGst ? (subtotal * gstRate) / 2 : 0;
        const igst = 0;
        const totalAmount = hasGst ? subtotal * (1 + gstRate) : subtotal;

        await createInvoice({
          brandId: brand.id,
          brandName: brand.name,
          issueDate: todayIso,
          dueDate: dueDate,
          items: [{
            id: `item_${brand.id}_${Date.now()}`,
            description: brand.serviceDetails,
            hsnSac: '9983',
            quantity: 1,
            unitPrice: subtotal,
            amount: subtotal,
          }],
          subtotal,
          hasGst,
          gstType: hasGst ? 'CGST_SGST' : 'NONE',
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: igst,
          totalAmount,
          notes: 'Recurring monthly billing',
        });
        successCount++;
      } catch {
        // Continue to next brand
      }
    }

    if (successCount > 0) {
      showToast(`Successfully drafted ${successCount} invoice${successCount > 1 ? 's' : ''}`, 'success');
    }
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

        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
          <button onClick={() => setShowRecurringPanel(true)} style={btnSecondary}>
            <span>🔄 Recurring Schedules</span>
          </button>
          <button
            onClick={() => {
              builder.reset();
              setShowCreateModal(true);
            }}
            style={btnPrimary}
          >
            <Plus style={{ width: 14, height: 14 }} />
            <span>Generate 1-Click Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, width: '100%' }}>
        <div className="relative w-full sm:w-80">
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search invoice # (INV-2026) or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 13, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0" style={{ maxWidth: '100%' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Filter style={{ width: 13, height: 13 }} /> Filter:
          </span>
          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', minWidth: 0, flex: 1, padding: '4px 0', WebkitOverflowScrolling: 'touch' }}>
            {['All', 'Paid', 'Sent', 'Overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
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
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      {/* Bulk Action Toolbar */}
      {canManage && selectedInvoiceIds.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: 12,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeIn 0.2s ease',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'var(--solid-btn-bg)',
                color: 'var(--solid-btn-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {selectedInvoiceIds.size}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedInvoiceIds.size} invoice{selectedInvoiceIds.size > 1 ? 's' : ''} selected
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              (₹{filteredInvoices
                .filter((i) => selectedInvoiceIds.has(i.id))
                .reduce((sum, i) => sum + (i.totalAmount || 0), 0)
                .toLocaleString('en-IN')})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedInvoiceIds(new Set())}
              className="btn-secondary"
              style={{ height: 32, padding: '0 12px', fontSize: 12, borderRadius: 8 }}
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={handleOpenBulkDelete}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--danger-bg)',
                color: 'var(--danger-text)',
                border: '1px solid var(--danger-border)',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 style={{ width: 13, height: 13 }} />
              Delete Selected ({selectedInvoiceIds.size})
            </button>
          </div>
        </div>
      )}

      <InvoiceTable
        invoices={pagedInvoices}
        recurringIds={recurringInvoiceIds}
        onView={setSelectedInvoiceId}
        onPay={(inv) => { setPayingInvoice(inv); setShowPayModal(true); }}
        onWhatsApp={openWhatsAppShare}
        onDelete={handleDeleteInvoice}
        deletingId={deletingInvoiceId}
        canDelete={canManage}
        selectedIds={selectedInvoiceIds}
        onToggleSelect={handleToggleSelectInvoice}
        onSelectAll={handleSelectAllInvoices}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredCount}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(0);
        }}
      />

      {/* ── Modals ──────────────────────────────────────────────── */}
      <InvoiceBuilderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleGenerateInvoice}
        submitting={isCreatingInvoice}
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
        brand={brands.find((b) => b.id === activeInvoice?.brandId) || (activeInvoice ? { id: activeInvoice.brandId, name: activeInvoice.brandName || 'Client' } as Brand : undefined)}
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
        brands={brands}
        recurringIds={recurringInvoiceIds}
        pausedIds={pausedRecurringIds}
        onTogglePause={togglePauseRecurring}
        onDraftInvoices={handleDraftInvoices}
        onClose={() => setShowRecurringPanel(false)}
        onEdit={() => { setShowRecurringPanel(false); setShowCreateModal(true); }}
      />

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(o) => { if (!o && !isBulkDeleting) setShowBulkDeleteDialog(false); }}>
        <AlertDialogPopup from="bottom">
          <AlertDialogHeader>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <AlertTriangle style={{ width: 19, height: 19 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <AlertDialogTitle>Delete {selectedInvoiceIds.size} Invoice{selectedInvoiceIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Permanently remove {selectedInvoiceIds.size} selected invoice{selectedInvoiceIds.size > 1 ? 's' : ''}. Linked payment records and line items will also be removed.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              style={{ background: 'var(--danger-text)', color: 'var(--solid-btn-text)', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: isBulkDeleting ? 0.7 : 1, cursor: isBulkDeleting ? 'not-allowed' : 'pointer' }}
            >
              {isBulkDeleting && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
              Yes, Delete {selectedInvoiceIds.size} Invoice{selectedInvoiceIds.size > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      {/* Single Invoice Delete confirmation (Animated AlertDialog) */}
      <AlertDialog
        open={Boolean(invoiceToDelete)}
        onOpenChange={(o) => {
          if (!o && !deletingInvoiceId) setInvoiceToDelete(null);
        }}
      >
        <AlertDialogPopup from="bottom" className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Trash2 style={{ width: 19, height: 19 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete invoice &quot;{invoiceToDelete?.invoiceNumber}&quot; for {invoiceToDelete?.brandName || 'Client'}.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingInvoiceId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSingleInvoice}
              disabled={Boolean(deletingInvoiceId)}
              style={{
                background: 'var(--danger-text)',
                color: 'var(--solid-btn-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: deletingInvoiceId ? 0.7 : 1,
                cursor: deletingInvoiceId ? 'not-allowed' : 'pointer',
              }}
            >
              {deletingInvoiceId && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
};

export default InvoicesManager;
