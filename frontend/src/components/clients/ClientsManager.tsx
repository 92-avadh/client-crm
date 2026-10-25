import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import type { Brand, BrandStatus } from '../../types';
import { Plus, Search, Filter } from 'lucide-react';
import { getNaturalErrorMessage } from '../../services/errors';
import { ClientGrid } from './ClientGrid';
import { ClientProfileDrawer, type ProfileTab } from './ClientProfileDrawer';
import { OnboardClientModal, EditClientModal, type ClientFormData } from './ClientFormModals';
import { AssignMembersModal } from './AssignMembersModal';
import { COUNTRIES, parsePhoneAndCountry } from '../ui/CountryCodePicker';
import Pagination from '../ui/Pagination';

const todayIso = () => new Date().toISOString().split('T')[0];

const emptyOnboard = (): ClientFormData => ({
  name: '',
  ownerName: '',
  mobile: '',
  countryCode: 'IN',
  email: '',
  billingAddress: '',
  city: '',
  state: '',
  pincode: '',
  gstNumber: '',
  pan: '',
  serviceDetails: '',
  currency: 'INR',
  currencySymbol: '₹',
  retainerHours: '40',
  contractStartDate: '',
  contractEndDate: '',
  monthlyFee: '',
  billingCycleDay: '' as any,
  status: 'Active',
  paymentStatus: 'Pending',
  notes: '',
});

export const COUNTRY_PHONE_LENGTHS: Record<string, number[]> = {
  IN: [10], US: [10], GB: [10], AE: [9], SG: [8], AU: [9], CA: [10],
  DE: [10, 11], FR: [9], IT: [9, 10], ES: [9], NL: [9], CH: [9],
  SE: [9], NO: [8], DK: [8], FI: [9, 10], IE: [9], NZ: [9, 10],
  JP: [10], KR: [10], CN: [11], HK: [8], MY: [9, 10], TH: [9],
  PH: [10], ID: [10, 11, 12], VN: [9], PK: [10], BD: [10], LK: [9],
  NP: [10], SA: [9], QA: [8], KW: [8], BH: [8], OM: [8], ZA: [9],
  NG: [10], KE: [9], EG: [10], BR: [10, 11], MX: [10], AR: [10],
  CL: [9], CO: [10], RU: [10], TR: [10], IL: [9], PL: [9], PT: [9],
  AT: [10, 11], BE: [9], CZ: [9], HU: [9], RO: [9], GR: [10],
};

/** Shared validation rules for onboard and edit. */
export function validateClientForm(f: ClientFormData, isEdit = false): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!String(f.name || '').trim()) errs.name = 'Client name is required';
  if (!String(f.ownerName || '').trim()) errs.ownerName = 'Contact person is required';
  if (!String(f.mobile || '').trim()) {
    errs.mobile = 'Mobile number is required';
  } else {
    let digits = String(f.mobile).replace(/\D/g, '');
    const expectedLengths = COUNTRY_PHONE_LENGTHS[f.countryCode] || [10];

    // If digits already include country dial code, strip it for validation
    const country = COUNTRIES.find(c => c.code === f.countryCode);
    const dialDigits = country ? country.dial.replace(/\D/g, '') : '';
    if (dialDigits && digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
      const stripped = digits.slice(dialDigits.length);
      if (expectedLengths.includes(stripped.length)) {
        digits = stripped;
      }
    }

    if (!expectedLengths.includes(digits.length)) {
      // In edit mode, allow existing valid or reasonably formatted international numbers
      if (!isEdit || digits.length < 5) {
        const expected = expectedLengths.join(' or ');
        errs.mobile = `Mobile number must be ${expected} digits for ${f.countryCode}`;
      }
    }
  }
  if (!String(f.email || '').trim()) {
    errs.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email).trim())) {
    errs.email = 'Please enter a valid email address';
  }
  if (!isEdit) {
    if (!String(f.billingAddress || '').trim()) errs.billingAddress = 'Billing address is required';
    if (!String(f.state || '').trim()) errs.state = 'State is required';
    if (!String(f.pincode || '').trim()) errs.pincode = 'Pincode is required';
    if (!String(f.serviceDetails || '').trim()) errs.serviceDetails = 'Service details are required';
    if (!String(f.monthlyFee || '').trim()) errs.monthlyFee = 'Monthly fee is required';
    if (!String(f.billingCycleDay || '').trim()) errs.billingCycleDay = 'Billing cycle day is required';
  }
  return errs;
}

/**
 * Clients orchestrator.
 *
 * Owns list filters, modal visibility and the API calls. The card grid,
 * profile drawer and all three modals are separate components.
 */
export const ClientsManager: React.FC = () => {
  const {
    currentUser, brands, allUsers, addBrand, updateBrand, assignMembersToBrand,
    selectedBrandId, setSelectedBrandId, invoices, tasks, setActiveTab, showToast,
    currencySymbol, conversations, setActiveConversationId, startDirectChat,
  } = useApp();

  const role = currentUser.role;

  /* ── List state ──────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview');

  /* ── Onboard state ───────────────────────────────────────────── */
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(emptyOnboard);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* ── Edit state ──────────────────────────────────────────────── */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editFormData, setEditFormData] = useState<ClientFormData>(emptyOnboard);
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState('');

  /* ── Assign state ────────────────────────────────────────────── */
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBrandForAssign, setSelectedBrandForAssign] = useState<Brand | null>(null);
  const [draftMemberIds, setDraftMemberIds] = useState<string[]>([]);

  const visibleBrands = (Array.isArray(brands) ? brands : []).filter(Boolean).filter((brand) => {
    const memberIds = Array.isArray(brand.assignedMemberIds) ? brand.assignedMemberIds : [];
    if (role === 'team' && currentUser && !memberIds.includes(currentUser.id)) return false;
    const q = (search || '').toLowerCase();
    const brandName = (brand.name || '').toLowerCase();
    const ownerName = (brand.ownerName || '').toLowerCase();
    const gst = (brand.gstNumber || '').toLowerCase();
    const matchesSearch =
      brandName.includes(q) ||
      ownerName.includes(q) ||
      gst.includes(q);
    const matchesStatus = statusFilter === 'All'
      ? true
      : (statusFilter === 'Paid' || statusFilter === 'Pending')
        ? (brand.paymentStatus || 'Paid') === statusFilter
        : (brand?.status || 'Active') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedBrand = (brands || []).find((b) => b && b.id === selectedBrandId) || null;

  /* ── Pagination (client-side; the full collection is already loaded) ── */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  const visibleCount = visibleBrands.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  // Clamp inside an effect: calling setState directly during render is a React
  // rules-of-hooks violation and triggers "Cannot update a component while
  // rendering a different component".
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const pagedBrands = useMemo(
    () => visibleBrands.slice(page * pageSize, (page + 1) * pageSize),
    [visibleBrands, page, pageSize]
  );

  /* ── Handlers ────────────────────────────────────────────────── */

  const openOnboard = () => {
    setFormData(emptyOnboard());
    setFormErrors({});
    setSubmitError('');
    setShowOnboardModal(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const errs = validateClientForm(formData);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setSubmitError('Please complete all required fields highlighted in red below.');
      showToast('Please fill all required fields', 'error');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const selectedStatus = formData.status || 'Active';
      const selectedPaymentStatus = formData.paymentStatus || 'Pending';
      await addBrand({
        ...formData,
        city: formData.city?.trim() || '',
        currency: formData.currency || 'INR',
        currencySymbol: formData.currencySymbol || '₹',
        retainerHours: Number(formData.retainerHours) || 40,
        contractStartDate: formData.contractStartDate || null,
        contractEndDate: formData.contractEndDate || null,
        monthlyFee: Number(formData.monthlyFee) || 0,
        billingCycleDay: Number(formData.billingCycleDay) || 1,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
      } as any);
      setShowOnboardModal(false);
      setFormData(emptyOnboard());
      // Do not auto-open the side drawer when adding a client
    } catch (err: any) {
      const msg = getNaturalErrorMessage(err);
      setSubmitError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    const { countryCode, nationalNumber } = parsePhoneAndCountry(brand.mobile, (brand as any).countryCode || 'IN');
    setEditFormData({
      name: brand.name || '',
      ownerName: brand.ownerName || '',
      mobile: nationalNumber || brand.mobile || '',
      countryCode: countryCode || 'IN',
      email: brand.email || '',
      billingAddress: brand.billingAddress || '',
      city: brand.city || '',
      state: brand.state || '',
      pincode: brand.pincode || '',
      gstNumber: brand.gstNumber || '',
      pan: brand.pan || '',
      serviceDetails: brand.serviceDetails || '',
      currency: brand.currency || 'INR',
      currencySymbol: brand.currencySymbol || '₹',
      retainerHours: brand.retainerHours != null ? String(brand.retainerHours) : '40',
      contractStartDate: brand.contractStartDate || '',
      contractEndDate: brand.contractEndDate || '',
      monthlyFee: brand.monthlyFee != null ? String(brand.monthlyFee) : '',
      billingCycleDay: brand.billingCycleDay != null ? String(brand.billingCycleDay) : '',
      status: brand.status || 'Active',
      paymentStatus: brand.paymentStatus === 'Pending' ? 'Pending' : 'Paid',
      notes: brand.notes || '',
    });
    setEditFormErrors({});
    setEditSubmitError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    const errs = validateClientForm(editFormData, true);
    if (Object.keys(errs).length > 0) {
      setEditFormErrors(errs);
      const firstField = Object.keys(errs)[0];
      const errorMsg = errs[firstField] || 'Please complete all required fields highlighted in red below.';
      setEditSubmitError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setEditFormErrors({});
    setIsEditSubmitting(true);
    setEditSubmitError('');
    try {
      await updateBrand(editingBrand.id, {
        ...editFormData,
        city: editFormData.city?.trim() || '',
        currency: editFormData.currency || 'INR',
        currencySymbol: editFormData.currencySymbol || '₹',
        retainerHours: Number(editFormData.retainerHours) || 40,
        contractStartDate: editFormData.contractStartDate || null,
        contractEndDate: editFormData.contractEndDate || null,
        monthlyFee: Number(editFormData.monthlyFee) || 0,
        billingCycleDay: Number(editFormData.billingCycleDay) || 1,
        status: editFormData.status as BrandStatus,
        paymentStatus: editFormData.paymentStatus,
      } as any);
      setShowEditModal(false);
      setEditingBrand(null);
    } catch (err: any) {
      const msg = getNaturalErrorMessage(err);
      setEditSubmitError(msg);
      showToast(msg, 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleTogglePaymentStatus = async (brand: Brand) => {
    const nextStatus = brand.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await updateBrand(brand.id, { paymentStatus: nextStatus });
      showToast(`Payment status for "${brand.name}" set to ${nextStatus}`, 'success');
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    }
  };

  const openAssignModal = (brand: Brand) => {
    setSelectedBrandForAssign(brand);
    setDraftMemberIds([...(Array.isArray(brand.assignedMemberIds) ? brand.assignedMemberIds : [])]);
    setShowAssignModal(true);
  };

  const toggleDraftMember = (userId: string) => {
    setDraftMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const saveAssignments = async () => {
    if (!selectedBrandForAssign) return;
    try {
      await assignMembersToBrand(selectedBrandForAssign.id, draftMemberIds);
      setShowAssignModal(false);
      setSelectedBrandForAssign(null);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            {role === 'team' ? 'Assigned Clients' : 'Client Management'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            {role === 'team'
              ? 'View details and chat channels for clients you are actively assigned to.'
              : 'Onboard clients, configure GST retainers, assign team members, and monitor retention health.'}
          </p>
        </div>

        {(role === 'admin' || role === 'hr') && (
          <button onClick={openOnboard}
            className="w-fit self-start sm:self-auto"
            style={{ padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard New Client</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, width: '100%' }}>
        <div className="relative w-full sm:w-80">
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by client, owner, GSTIN..."
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
            {['All', 'Active', 'Paid', 'Pending', 'Inactive', 'Paused', 'Churned'].map((status) => (
              <button key={status} onClick={() => setStatusFilter(status)}
                style={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  background: statusFilter === status ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
                  color: statusFilter === status ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                  border: statusFilter === status ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                }}>
                {status === 'Churned' ? 'Lost / Cancelled' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <ClientGrid
        brands={pagedBrands}
        allUsers={allUsers}
        role={role as any}
        onView={(b) => { setSelectedBrandId(b.id); setActiveProfileTab('overview'); }}
        onEdit={openEditModal}
        onAssign={openAssignModal}
        onTogglePaymentStatus={handleTogglePaymentStatus}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={visibleCount}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(0);
        }}
      />

      {/* Drawer */}
      <AnimatePresence>
        {selectedBrand && (
          <ClientProfileDrawer
            key={selectedBrand.id}
            brand={selectedBrand}
            role={role}
            allUsers={allUsers}
            invoices={invoices}
            tasks={tasks}
            activeTab={activeProfileTab}
            onTabChange={setActiveProfileTab}
            onClose={() => setSelectedBrandId(null)}
            onChat={async (brandId) => {
              const brand = brands.find((b) => b.id === brandId);
              const conv = (conversations || []).find(
                (c) => c.brandId === brandId || (brand && c.title?.toLowerCase() === brand.name?.toLowerCase())
              );
              if (conv) {
                setActiveConversationId(conv.id);
                setActiveTab('chat');
                return;
              }
              const assigned = (brand?.assignedMemberIds || []).filter((id) => id !== currentUser.id);
              if (assigned.length > 0 && typeof startDirectChat === 'function') {
                try {
                  await startDirectChat(assigned[0]);
                  return;
                } catch (err) {
                  console.warn('Failed to start direct chat with assigned member:', err);
                }
              }
              setActiveTab('chat');
            }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <OnboardClientModal
        open={showOnboardModal}
        formData={formData}
        onFormChange={(patch) => {
          setFormData((prev) => ({ ...prev, ...patch }));
          if (patch.name !== undefined || patch.email !== undefined) setFormErrors({});
        }}
        errors={formErrors}
        submitError={submitError}
        submitting={isSubmitting}
        onClose={() => setShowOnboardModal(false)}
        onSubmit={handleOnboardSubmit}
        currencySymbol={currencySymbol}
      />

      <EditClientModal
        open={showEditModal}
        formData={editFormData}
        onFormChange={(patch) => setEditFormData((prev) => ({ ...prev, ...patch }))}
        errors={editFormErrors}
        submitError={editSubmitError}
        submitting={isEditSubmitting}
        onClose={() => { setShowEditModal(false); setEditingBrand(null); }}
        onSubmit={handleEditSubmit}
        currencySymbol={currencySymbol}
      />

      <AssignMembersModal
        brand={showAssignModal ? selectedBrandForAssign : null}
        allUsers={allUsers}
        draftIds={draftMemberIds}
        onToggle={toggleDraftMember}
        onClose={() => { setShowAssignModal(false); setSelectedBrandForAssign(null); }}
        onSave={saveAssignments}
      />
    </div>
  );
};

export default ClientsManager;
