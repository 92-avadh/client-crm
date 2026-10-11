import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Brand, BrandStatus } from '../../types';
import { Plus, Search, Filter } from 'lucide-react';
import { getNaturalErrorMessage } from '../../services/errors';
import { ClientGrid } from './ClientGrid';
import { ClientProfileDrawer, type ProfileTab } from './ClientProfileDrawer';
import { OnboardClientModal, EditClientModal, type ClientFormData } from './ClientFormModals';
import { AssignMembersModal } from './AssignMembersModal';

const todayIso = () => new Date().toISOString().split('T')[0];

const emptyOnboard = (): ClientFormData => ({
  name: '',
  ownerName: '',
  mobile: '',
  email: '',
  billingAddress: '',
  state: 'Maharashtra',
  pincode: '',
  gstNumber: '',
  pan: '',
  serviceDetails: 'Monthly CA Compliance, Retainer & Advisory',
  monthlyFee: '100000',
  billingCycleDay: 1,
  paymentStatus: 'Paid',
  notes: '',
});

/** Shared validation rules for onboard and edit. */
function validateClientForm(f: ClientFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!String(f.name).trim()) errs.name = 'Client name is required';
  if (!String(f.ownerName).trim()) errs.ownerName = 'Contact person is required';
  if (!String(f.mobile).trim()) errs.mobile = 'Mobile number is required';
  if (!String(f.email).trim()) {
    errs.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email).trim())) {
    errs.email = 'Please enter a valid email address';
  }
  if (!String(f.billingAddress).trim()) errs.billingAddress = 'Billing address is required';
  if (!String(f.pincode).trim()) errs.pincode = 'Pincode is required';
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

  const visibleBrands = brands.filter((brand) => {
    if (role === 'team' && !brand.assignedMemberIds.includes(currentUser.id)) return false;
    const q = search.toLowerCase();
    const matchesSearch =
      brand.name.toLowerCase().includes(q) ||
      brand.ownerName.toLowerCase().includes(q) ||
      (brand.gstNumber ? brand.gstNumber.toLowerCase().includes(q) : false);
    const matchesStatus = statusFilter === 'All' || brand.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null;

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
      const newBrand = await addBrand({
        ...formData,
        monthlyFee: Number(formData.monthlyFee) || 0,
        billingCycleDay: Number(formData.billingCycleDay) || 1,
        paymentStatus: formData.paymentStatus || 'Paid',
      } as any);
      setShowOnboardModal(false);
      setFormData(emptyOnboard());
      if (newBrand?.id) setSelectedBrandId(newBrand.id);
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
    setEditFormData({
      name: brand.name || '',
      ownerName: brand.ownerName || '',
      mobile: brand.mobile || '',
      email: brand.email || '',
      billingAddress: brand.billingAddress || '',
      state: brand.state || 'Maharashtra',
      pincode: brand.pincode || '',
      gstNumber: brand.gstNumber || '',
      pan: brand.pan || '',
      serviceDetails: brand.serviceDetails || '',
      monthlyFee: String(brand.monthlyFee ?? 0),
      billingCycleDay: Number(brand.billingCycleDay) || 1,
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

    const errs = validateClientForm(editFormData);
    if (Object.keys(errs).length > 0) {
      setEditFormErrors(errs);
      setEditSubmitError('Please complete all required fields highlighted in red below.');
      showToast('Please fix errors in the edit form', 'error');
      return;
    }

    setEditFormErrors({});
    setIsEditSubmitting(true);
    setEditSubmitError('');
    try {
      await updateBrand(editingBrand.id, {
        ...editFormData,
        monthlyFee: Number(editFormData.monthlyFee) || 0,
        billingCycleDay: Number(editFormData.billingCycleDay) || 1,
        status: editFormData.status as BrandStatus,
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

  const openAssignModal = (brand: Brand) => {
    setSelectedBrandForAssign(brand);
    setDraftMemberIds([...brand.assignedMemberIds]);
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
            style={{ padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard New Client</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by client, owner, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 13, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <Filter style={{ width: 13, height: 13 }} /> Filter:
          </span>
          {['All', 'Active', 'Inactive', 'Paused', 'Churned'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                background: statusFilter === status ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
                color: statusFilter === status ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                border: statusFilter === status ? '1px solid var(--border-focus)' : '1px solid var(--border)',
              }}>
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <ClientGrid
        brands={visibleBrands}
        allUsers={allUsers}
        role={role as any}
        onView={(b) => { setSelectedBrandId(b.id); setActiveProfileTab('overview'); }}
        onEdit={openEditModal}
        onAssign={openAssignModal}
      />

      {/* Drawer */}
      <ClientProfileDrawer
        brand={selectedBrand}
        role={role}
        allUsers={allUsers}
        invoices={invoices}
        tasks={tasks}
        activeTab={activeProfileTab}
        onTabChange={setActiveProfileTab}
        onClose={() => setSelectedBrandId(null)}
        onChat={() => setActiveTab('chat')}
      />

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
