import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Brand, BrandStatus } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  FileText,
  ArrowRight,
  UserPlus,
  Send,
  X,
  Loader2,
  AlertCircle,
  Edit3
} from 'lucide-react';

export const ClientsManager: React.FC = () => {
  const {
    currentUser,
    brands,
    allUsers,
    addBrand,
    updateBrand,
    assignMembersToBrand,
    selectedBrandId,
    setSelectedBrandId,
    invoices,
    tasks,
    setActiveTab,
    showToast,
  } = useApp();

  const role = currentUser.role;

  // Search and filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBrandForAssign, setSelectedBrandForAssign] = useState<Brand | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'team' | 'financials' | 'tasks' | 'timeline'>('overview');

  // Form submission & validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // New Brand Onboard Form State (SRD Section 3.2)
  const [formData, setFormData] = useState({
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
    monthlyFee: 100000,
    billingCycleDay: 1,
    paymentStatus: 'Paid' as 'Paid' | 'Pending',
    notes: ''
  });

  // Edit Brand State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    ownerName: '',
    mobile: '',
    email: '',
    billingAddress: '',
    state: 'Maharashtra',
    pincode: '',
    gstNumber: '',
    pan: '',
    serviceDetails: '',
    monthlyFee: 0,
    billingCycleDay: 1,
    status: 'Active' as BrandStatus,
    paymentStatus: 'Paid' as 'Paid' | 'Pending',
    notes: ''
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const editFormScrollRef = useRef<HTMLDivElement>(null);

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
      monthlyFee: Number(brand.monthlyFee) || 0,
      billingCycleDay: Number(brand.billingCycleDay) || 1,
      status: brand.status || 'Active',
      paymentStatus: (brand.paymentStatus === 'Pending' ? 'Pending' : 'Paid') as 'Paid' | 'Pending',
      notes: brand.notes || '',
    });
    setEditFormErrors({});
    setEditSubmitError(null);
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    const errs: Record<string, string> = {};
    if (!editFormData.name.trim()) errs.name = 'Client name is required';
    if (!editFormData.ownerName.trim()) errs.ownerName = 'Contact person is required';
    if (!editFormData.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (!editFormData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!editFormData.billingAddress.trim()) errs.billingAddress = 'Billing address is required';
    if (!editFormData.pincode.trim()) errs.pincode = 'Pincode is required';
    return errs;
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingBrand) return;

    const errs = validateEditForm();
    if (Object.keys(errs).length > 0) {
      setEditFormErrors(errs);
      setEditSubmitError('Please complete all required fields highlighted in red below.');
      showToast('Please fix errors in the edit form', 'error');
      if (editFormScrollRef.current) {
        editFormScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setEditFormErrors({});
    setIsEditSubmitting(true);
    setEditSubmitError(null);

    try {
      await updateBrand(editingBrand.id, {
        ...editFormData,
        monthlyFee: Number(editFormData.monthlyFee) || 0,
        billingCycleDay: Number(editFormData.billingCycleDay) || 1,
      });
      setShowEditModal(false);
      setEditingBrand(null);
    } catch (err: any) {
      setEditSubmitError(err.message || 'Failed to update client profile');
      showToast(err.message || 'Failed to update client', 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Filter brands based on role permissions (SRD Section 3.3)
  const visibleBrands = brands.filter((brand) => {
    if (role === 'team') {
      const isAssigned = brand.assignedMemberIds.includes(currentUser.id);
      if (!isAssigned) return false;
    }

    const matchesSearch =
      brand.name.toLowerCase().includes(search.toLowerCase()) ||
      brand.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (brand.gstNumber && brand.gstNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All' ? true : brand.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null;

  const validateOnboardForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Client name is required';
    if (!formData.ownerName.trim()) errs.ownerName = 'Contact person is required';
    if (!formData.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.billingAddress.trim()) errs.billingAddress = 'Billing address is required';
    if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    return errs;
  };

  const handleOnboardSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);

    const errs = validateOnboardForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setSubmitError('Please complete all required fields highlighted in red below.');
      showToast('Please fill all required fields', 'error');
      if (formScrollRef.current) {
        formScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
      });

      setShowOnboardModal(false);
      setFormData({
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
        monthlyFee: 100000,
        billingCycleDay: 1,
        paymentStatus: 'Paid',
        notes: ''
      });

      if (newBrand?.id) {
        setSelectedBrandId(newBrand.id);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to create client. Please try again.');
      showToast(err.message || 'Failed to create client', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInactivityBadge = (lastActivityDate: string) => {
    const last = new Date(lastActivityDate);
    const now = new Date('2026-10-04');
    const diffDays = Math.floor(Math.abs(now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#0a0a0a',
            color: '#ffffff',
          }}
          title="No activity for >30 days!"
        >
          <AlertTriangle style={{ width: 12, height: 12 }} /> {diffDays}d Inactive
        </span>
      );
    } else if (diffDays >= 15) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#f0f0f0',
            color: '#0a0a0a',
            border: '1px solid #d4d4d4',
          }}
          title="No activity for >15 days"
        >
          <Clock style={{ width: 12, height: 12 }} /> {diffDays}d Inactive
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 6,
          background: '#f7f7f7',
          color: '#525252',
          border: '1px solid #e2e2e2',
        }}
      >
        <CheckCircle style={{ width: 12, height: 12 }} /> Active
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {role === 'team' ? 'Assigned Clients' : 'Client Management'}
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            {role === 'team'
              ? 'View details and chat channels for clients you are actively assigned to.'
              : 'Onboard clients, configure GST retainers, assign team members, and monitor retention health.'}
          </p>
        </div>

        {/* Action button (Admin / HR only per SRD Section 3.3) */}
        {(role === 'admin' || role === 'hr') && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowOnboardModal(true)}
              style={{ padding:'9px 16px', background:'#0a0a0a', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard New Client</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by client, owner, GSTIN..."
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
          {['All', 'Active', 'Inactive', 'Paused', 'Churned'].map((status) => (
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

      {/* Clients Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {visibleBrands.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '48px 24px',
              textAlign: 'center',
              background: '#ffffff',
              border: '1px solid #e2e2e2',
              borderRadius: 14,
            }}
          >
            <Building2 style={{ width: 36, height: 36, margin: '0 auto 12px', color: '#aaaaaa' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>No clients found</p>
            <p style={{ fontSize: 12, color: '#777777', marginTop: 4 }}>
              {role === 'team'
                ? 'You have not been assigned to any clients yet.'
                : 'Try adjusting your search or onboarding a new client.'}
            </p>
          </div>
        ) : (
          visibleBrands.map((brand) => {
            const assignedUsers = allUsers.filter((u) =>
              brand.assignedMemberIds.includes(u.id)
            );

            return (
              <div
                key={brand.id}
                style={{
                  background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14,
                  padding: '24px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0a0a0a';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e2e2';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>
                        {brand.name}
                      </h3>
                      <div style={{ fontSize: 12, color: '#777777', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Users style={{ width: 13, height: 13 }} />
                        <span>{brand.ownerName}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {getInactivityBadge(brand.lastActivityDate)}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: brand.paymentStatus === 'Pending' ? '#fef3c7' : '#e6f4ea',
                          color: brand.paymentStatus === 'Pending' ? '#b45309' : '#0f9d58',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: brand.paymentStatus === 'Pending' ? '#d97706' : '#0f9d58' }} />
                        {brand.paymentStatus === 'Pending' ? 'Pending' : 'Paid'}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: '#525252',
                      background: '#f7f7f7',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #eeeeee',
                      marginBottom: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    {brand.serviceDetails}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#666666', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin style={{ width: 13, height: 13, color: '#888888' }} />
                        {brand.state}
                      </span>
                      {role !== 'team' && (
                        <span className="font-amount" style={{ fontWeight: 800, color: '#0a0a0a', fontSize: 13 }}>
                          ₹{brand.monthlyFee.toLocaleString('en-IN')}/mo
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Billing Cycle:</span>
                      <span style={{ fontWeight: 600, color: '#0a0a0a' }}>
                        {role === 'team' ? 'Managed by Admin' : `${brand.billingCycleDay}st of month`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                      <span>Assigned Team:</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {assignedUsers.length === 0 ? (
                          <span style={{ fontSize: 11, color: '#888888', fontStyle: 'italic' }}>Unassigned</span>
                        ) : (
                          assignedUsers.map((u) => (
                            u.avatar ? (
                              <img
                                key={u.id}
                                src={u.avatar}
                                alt={u.name}
                                title={`${u.name} (${u.designation})`}
                                style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e2e2' }}
                              />
                            ) : (
                              <div
                                key={u.id}
                                title={`${u.name} (${u.designation})`}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: '#0a0a0a',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {(u.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => {
                      setSelectedBrandId(brand.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0a0a0a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <span>View Profile</span>
                    <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(role === 'admin' || role === 'hr') && (
                      <button
                        onClick={() => openEditModal(brand)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          background: '#f7f7f7',
                          border: '1px solid #e2e2e2',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#0a0a0a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Edit Client Details & Payment Status"
                      >
                        <Edit3 style={{ width: 12, height: 12 }} />
                        <span>Edit</span>
                      </button>
                    )}

                    {(role === 'admin' || role === 'hr') && (
                      <button
                        onClick={() => {
                          setSelectedBrandForAssign(brand);
                          setShowAssignModal(true);
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          background: '#f7f7f7',
                          border: '1px solid #e2e2e2',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#0a0a0a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Assign Team Members"
                      >
                        <UserPlus style={{ width: 12, height: 12 }} />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Brand Detailed Profile Drawer / Modal */}
      {selectedBrand && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setSelectedBrandId(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 760,
              maxHeight: 'min(90vh, 800px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e2e2',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e2e2',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexShrink: 0,
                background: '#ffffff',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a' }}>{selectedBrand.name}</h2>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: selectedBrand.status === 'Active' ? '#0a0a0a' : '#f0f0f0',
                      color: selectedBrand.status === 'Active' ? '#ffffff' : '#0a0a0a',
                    }}
                  >
                    {selectedBrand.status}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: selectedBrand.paymentStatus === 'Pending' ? '#fef3c7' : '#e6f4ea',
                      color: selectedBrand.paymentStatus === 'Pending' ? '#b45309' : '#0f9d58',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedBrand.paymentStatus === 'Pending' ? '#d97706' : '#0f9d58' }} />
                    {selectedBrand.paymentStatus === 'Pending' ? 'Payment: Pending' : 'Payment: Paid'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#777777', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Contact: {selectedBrand.ownerName}</span>
                  <span>•</span>
                  <span>Joined: {selectedBrand.onboardingDate}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(role === 'admin' || role === 'hr') && (
                  <button
                    onClick={() => openEditModal(selectedBrand)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: '#0a0a0a',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Edit3 style={{ width: 13, height: 13 }} />
                    <span>Edit Client</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedBrandId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666', padding: 4 }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e2e2', padding: '0 24px', background: '#fafafa', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Overview & Contacts' },
                { id: 'team', label: 'Assigned Team' },
                ...(role !== 'team'
                  ? [{ id: 'financials', label: 'Billing & Invoices' }]
                  : []),
                { id: 'tasks', label: 'Deliverables & Tasks' },
                { id: 'timeline', label: 'Activity Timeline' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id as any)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: activeProfileTab === tab.id ? '2px solid #0a0a0a' : '2px solid transparent',
                    color: activeProfileTab === tab.id ? '#0a0a0a' : '#777777',
                    background: 'transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Tab Contents */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
              {activeProfileTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div style={{ padding: 14, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888888' }}>
                        Phone & Email
                      </span>
                      <div style={{ color: '#0a0a0a', marginTop: 4, fontWeight: 600 }}>{selectedBrand.mobile}</div>
                      <div style={{ color: '#666666', marginTop: 2 }}>{selectedBrand.email}</div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888888' }}>
                        Billing Address
                      </span>
                      <div style={{ color: '#0a0a0a', marginTop: 4, fontWeight: 600 }}>{selectedBrand.billingAddress}</div>
                      <div style={{ color: '#666666', marginTop: 2 }}>{selectedBrand.state} - {selectedBrand.pincode}</div>
                    </div>
                  </div>

                  {role !== 'team' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      <div style={{ padding: 12, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888888' }}>GSTIN</span>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a', marginTop: 4 }}>
                          {selectedBrand.gstNumber || 'Unregistered'}
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888888' }}>PAN</span>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a', marginTop: 4 }}>
                          {selectedBrand.pan || 'N/A'}
                        </div>
                      </div>
                      <div style={{ padding: 12, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888888' }}>Monthly Retainer</span>
                        <div className="font-amount" style={{ fontWeight: 800, color: '#0a0a0a', marginTop: 4, fontSize: 14 }}>
                          ₹{selectedBrand.monthlyFee.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: 14, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#888888' }}>
                      Contracted Service & Scope
                    </span>
                    <p style={{ color: '#0a0a0a', marginTop: 6, lineHeight: 1.5 }}>
                      {selectedBrand.serviceDetails}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 8 }}>
                      Attached Contracts & KYC
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedBrand.documents.length === 0 ? (
                        <div style={{ color: '#888888', fontStyle: 'italic', padding: 12, background: '#f7f7f7', borderRadius: 8 }}>
                          No documents uploaded yet.
                        </div>
                      ) : (
                        selectedBrand.documents.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              background: '#f7f7f7',
                              border: '1px solid #e2e2e2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText style={{ width: 14, height: 14, color: '#0a0a0a' }} />
                              <span style={{ fontWeight: 600, color: '#0a0a0a' }}>{doc.name}</span>
                              <span style={{ color: '#888888', fontSize: 11 }}>({doc.size})</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#888888' }}>Uploaded {doc.uploadDate}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 12, color: '#666666' }}>
                      Team members actively assigned to {selectedBrand.name}.
                    </p>
                    {(role === 'admin' || role === 'hr') && (
                      <button
                        onClick={() => {
                          setSelectedBrandForAssign(selectedBrand);
                          setShowAssignModal(true);
                        }}
                        style={{ padding:'7px 14px', background:'#0a0a0a', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, height: 32 }}
                      >
                        <UserPlus style={{ width: 13, height: 13 }} />
                        <span>Manage Assignments</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allUsers
                      .filter((u) => selectedBrand.assignedMemberIds.includes(u.id))
                      .map((member) => (
                        <div
                          key={member.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#f7f7f7',
                            border: '1px solid #e2e2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e2e2' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  background: '#0a0a0a',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {(member.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>{member.name}</div>
                              <div style={{ fontSize: 11, color: '#777777' }}>{member.designation}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBrandId(null);
                              setActiveTab('chat');
                            }}
                            style={{ padding:'9px 16px', background:'#f5f5f5', color:'#0a0a0a', border:'1px solid #e2e2e2', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', height: 28 }}
                          >
                            Open Chat
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeProfileTab === 'financials' && role !== 'team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Invoices for {selectedBrand.name}
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedBrandId(null);
                        setActiveTab('invoices');
                      }}
                      style={{ padding:'7px 14px', background:'#0a0a0a', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, height: 32 }}
                    >
                      <Plus style={{ width: 13, height: 13 }} />
                      <span>New Invoice</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {invoices
                      .filter((i) => i.brandId === selectedBrand.id)
                      .map((inv) => (
                        <div
                          key={inv.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#f7f7f7',
                            border: '1px solid #e2e2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a' }}>
                              {inv.invoiceNumber}
                            </div>
                            <div style={{ fontSize: 11, color: '#777777', marginTop: 2 }}>
                              Issued: {inv.issueDate} • Due: {inv.dueDate}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="font-amount" style={{ fontWeight: 800, color: '#0a0a0a', fontSize: 13 }}>
                              ₹{inv.totalAmount.toLocaleString('en-IN')}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: inv.status === 'Paid' ? '#0a0a0a' : '#e2e2e2',
                                color: inv.status === 'Paid' ? '#ffffff' : '#0a0a0a',
                              }}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeProfileTab === 'tasks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Active Tasks</h4>
                    <button
                      onClick={() => {
                        setSelectedBrandId(null);
                        setActiveTab('tasks');
                      }}
                      style={{ padding:'9px 16px', background:'#f5f5f5', color:'#0a0a0a', border:'1px solid #e2e2e2', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', height: 28 }}
                    >
                      Add Task
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks
                      .filter((t) => t.brandId === selectedBrand.id)
                      .map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#f7f7f7',
                            border: '1px solid #e2e2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>{t.title}</div>
                            <div style={{ fontSize: 11, color: '#777777', marginTop: 2 }}>Due: {t.dueDate}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#e2e2e2', color: '#0a0a0a' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeProfileTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Account Activity History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ padding: 12, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#777777', fontSize: 11 }}>
                        <span>Recent Platform Activity</span>
                        <span>{selectedBrand.lastActivityDate}</span>
                      </div>
                      <p style={{ color: '#0a0a0a', marginTop: 4 }}>
                        Active touchpoint registered. Retention engine status is safe.
                      </p>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: '#f7f7f7', border: '1px solid #e2e2e2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#777777', fontSize: 11 }}>
                        <span>Initial Client Onboarding</span>
                        <span>{selectedBrand.onboardingDate}</span>
                      </div>
                      <p style={{ color: '#0a0a0a', marginTop: 4 }}>
                        Client master profile created with contracted fee of <strong className="font-amount" style={{ fontWeight: 800 }}>₹{selectedBrand.monthlyFee.toLocaleString('en-IN')}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Direct Chat Link */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
              <button
                onClick={() => {
                  setSelectedBrandId(null);
                  setActiveTab('chat');
                }}
                style={{ padding:'8px 16px', background:'#0a0a0a', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, height: 34 }}
              >
                <Send style={{ width: 13, height: 13 }} />
                <span>Open Client Chat Channel</span>
              </button>
              <button
                onClick={() => setSelectedBrandId(null)}
                style={{ padding:'8px 16px', background:'#f5f5f5', color:'#0a0a0a', border:'1px solid #e2e2e2', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', height: 34 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Client Modal (SRD Section 3.2 Form) */}
      {showOnboardModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowOnboardModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 640,
              maxHeight: 'min(90vh, 760px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e2e2',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.01em' }}>
                  Onboard New Client
                </h2>
                <p style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                  Complete client onboarding form with billing and GST details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666666',
                  padding: 6,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Form */}
            <form
              noValidate
              onSubmit={handleOnboardSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* Scrollable Form Body */}
              <div
                ref={formScrollRef}
                style={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {/* Submit Error Banner */}
                {submitError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Client Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Media Pvt Ltd"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: formErrors.name ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: formErrors.name ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {formErrors.name && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {formErrors.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Contact Person (Owner) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Seth"
                      value={formData.ownerName}
                      onChange={(e) => {
                        setFormData({ ...formData, ownerName: e.target.value });
                        if (formErrors.ownerName) setFormErrors({ ...formErrors, ownerName: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: formErrors.ownerName ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: formErrors.ownerName ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {formErrors.ownerName && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {formErrors.ownerName}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 99880 11223"
                      value={formData.mobile}
                      onChange={(e) => {
                        setFormData({ ...formData, mobile: e.target.value });
                        if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: formErrors.mobile ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: formErrors.mobile ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {formErrors.mobile && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {formErrors.mobile}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="accounts@client.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: formErrors.email ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: formErrors.email ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {formErrors.email && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                    Billing Address *
                  </label>
                  <input
                    type="text"
                    placeholder="Street, Building, Floor..."
                    value={formData.billingAddress}
                    onChange={(e) => {
                      setFormData({ ...formData, billingAddress: e.target.value });
                      if (formErrors.billingAddress) setFormErrors({ ...formErrors, billingAddress: '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: formErrors.billingAddress ? '1px solid #dc2626' : '1px solid #e2e2e2',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#0a0a0a',
                      background: formErrors.billingAddress ? '#fef2f2' : '#fafafa',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.billingAddress && (
                    <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                      {formErrors.billingAddress}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Maharashtra">Maharashtra (CGST+SGST)</option>
                      <option value="Karnataka">Karnataka (IGST)</option>
                      <option value="Delhi">Delhi (IGST)</option>
                      <option value="Haryana">Haryana (IGST)</option>
                      <option value="Gujarat">Gujarat (IGST)</option>
                      <option value="West Bengal">West Bengal (IGST)</option>
                      <option value="Tamil Nadu">Tamil Nadu (IGST)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Pincode *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 400050"
                      value={formData.pincode}
                      onChange={(e) => {
                        setFormData({ ...formData, pincode: e.target.value });
                        if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: formErrors.pincode ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: formErrors.pincode ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {formErrors.pincode && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {formErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      GSTIN (15 characters)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="27AABCA1234F1Z8"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      PAN
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="AABCA1234F"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Monthly Agreed Retainer (INR) *
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyFee || ''}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="font-amount"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Billing Due Day of Month *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formData.billingCycleDay || ''}
                      onChange={(e) => setFormData({ ...formData, billingCycleDay: e.target.value === '' ? 1 : Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                    Service & Project Scope *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.serviceDetails}
                    onChange={(e) => setFormData({ ...formData, serviceDetails: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e2e2',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#0a0a0a',
                      background: '#fafafa',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 8 }}>
                    Onboarding Payment Status *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentStatus: 'Paid' })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: formData.paymentStatus === 'Paid' ? '2px solid #0f9d58' : '1px solid #e2e2e2',
                        background: formData.paymentStatus === 'Paid' ? '#f0fdf4' : '#fafafa',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: formData.paymentStatus === 'Paid' ? '#15803d' : '#0a0a0a' }}>
                          ✓ Paid
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0f9d58', background: '#dcfce7', padding: '2px 8px', borderRadius: 12 }}>
                          Collections Received
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0' }}>
                        Initial retainer fee is collected and added to Total Collections.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentStatus: 'Pending' })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: formData.paymentStatus === 'Pending' ? '2px solid #d97706' : '1px solid #e2e2e2',
                        background: formData.paymentStatus === 'Pending' ? '#fffbeb' : '#fafafa',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: formData.paymentStatus === 'Pending' ? '#b45309' : '#0a0a0a' }}>
                          ⏳ Pending
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 12 }}>
                          Awaiting Payment
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0' }}>
                        Payment is awaiting clearance and listed under Pending / Overdue.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e2e2',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  background: '#fafafa',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowOnboardModal(false);
                    setFormErrors({});
                    setSubmitError(null);
                  }}
                  style={{
                    padding: '9px 18px',
                    background: '#ffffff',
                    color: '#0a0a0a',
                    border: '1px solid #e2e2e2',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={(e) => handleOnboardSubmit(e)}
                  style={{
                    padding: '9px 18px',
                    background: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.75 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <Plus style={{ width: 14, height: 14 }} />
                      <span>Create Client Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingBrand && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 680,
              maxHeight: 'min(90vh, 800px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e2e2',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                flexShrink: 0,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.01em' }}>
                  Edit Client Profile
                </h2>
                <p style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                  Update details, billing terms, account status, and payment status for {editingBrand.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666666',
                  padding: 6,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Form */}
            <form
              noValidate
              onSubmit={handleEditSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* Scrollable Form Body */}
              <div
                ref={editFormScrollRef}
                style={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {/* Submit Error Banner */}
                {editSubmitError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span>{editSubmitError}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, name: e.target.value });
                        if (editFormErrors.name) setEditFormErrors({ ...editFormErrors, name: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: editFormErrors.name ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: editFormErrors.name ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {editFormErrors.name && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {editFormErrors.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Contact Person (Owner) *
                    </label>
                    <input
                      type="text"
                      value={editFormData.ownerName}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, ownerName: e.target.value });
                        if (editFormErrors.ownerName) setEditFormErrors({ ...editFormErrors, ownerName: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: editFormErrors.ownerName ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: editFormErrors.ownerName ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {editFormErrors.ownerName && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {editFormErrors.ownerName}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={editFormData.mobile}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, mobile: e.target.value });
                        if (editFormErrors.mobile) setEditFormErrors({ ...editFormErrors, mobile: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: editFormErrors.mobile ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: editFormErrors.mobile ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {editFormErrors.mobile && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {editFormErrors.mobile}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, email: e.target.value });
                        if (editFormErrors.email) setEditFormErrors({ ...editFormErrors, email: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: editFormErrors.email ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: editFormErrors.email ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {editFormErrors.email && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {editFormErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                    Billing Address *
                  </label>
                  <input
                    type="text"
                    value={editFormData.billingAddress}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, billingAddress: e.target.value });
                      if (editFormErrors.billingAddress) setEditFormErrors({ ...editFormErrors, billingAddress: '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: editFormErrors.billingAddress ? '1px solid #dc2626' : '1px solid #e2e2e2',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#0a0a0a',
                      background: editFormErrors.billingAddress ? '#fef2f2' : '#fafafa',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {editFormErrors.billingAddress && (
                    <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                      {editFormErrors.billingAddress}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      State *
                    </label>
                    <select
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Maharashtra">Maharashtra (CGST+SGST)</option>
                      <option value="Karnataka">Karnataka (IGST)</option>
                      <option value="Delhi">Delhi (IGST)</option>
                      <option value="Haryana">Haryana (IGST)</option>
                      <option value="Gujarat">Gujarat (IGST)</option>
                      <option value="West Bengal">West Bengal (IGST)</option>
                      <option value="Tamil Nadu">Tamil Nadu (IGST)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={editFormData.pincode}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, pincode: e.target.value });
                        if (editFormErrors.pincode) setEditFormErrors({ ...editFormErrors, pincode: '' });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: editFormErrors.pincode ? '1px solid #dc2626' : '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: editFormErrors.pincode ? '#fef2f2' : '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {editFormErrors.pincode && (
                      <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 500 }}>
                        {editFormErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      GSTIN
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={editFormData.gstNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      PAN
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editFormData.pan}
                      onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Monthly Agreed Retainer (INR) *
                    </label>
                    <input
                      type="number"
                      value={editFormData.monthlyFee || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, monthlyFee: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="font-amount"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Billing Due Day of Month *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={editFormData.billingCycleDay || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, billingCycleDay: e.target.value === '' ? 1 : Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Account Status and Payment Status */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Client Account Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as BrandStatus })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #e2e2e2',
                        borderRadius: 10,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#fafafa',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Churned">Churned</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                      Payment Status *
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, paymentStatus: 'Paid' })}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: editFormData.paymentStatus === 'Paid' ? '2px solid #0f9d58' : '1px solid #e2e2e2',
                          background: editFormData.paymentStatus === 'Paid' ? '#f0fdf4' : '#fafafa',
                          color: editFormData.paymentStatus === 'Paid' ? '#15803d' : '#0a0a0a',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>✓ Paid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, paymentStatus: 'Pending' })}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: editFormData.paymentStatus === 'Pending' ? '2px solid #d97706' : '1px solid #e2e2e2',
                          background: editFormData.paymentStatus === 'Pending' ? '#fffbeb' : '#fafafa',
                          color: editFormData.paymentStatus === 'Pending' ? '#b45309' : '#0a0a0a',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>⏳ Pending</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                    Service & Project Scope
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.serviceDetails}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceDetails: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e2e2',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#0a0a0a',
                      background: '#fafafa',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', fontSize: 12, marginBottom: 6 }}>
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional notes about client, expectations, terms..."
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e2e2e2',
                      borderRadius: 10,
                      fontSize: 13,
                      color: '#0a0a0a',
                      background: '#fafafa',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e2e2',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  background: '#fafafa',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '9px 18px',
                    background: '#ffffff',
                    color: '#0a0a0a',
                    border: '1px solid #e2e2e2',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  onClick={(e) => handleEditSubmit(e)}
                  style={{
                    padding: '9px 18px',
                    background: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isEditSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isEditSubmitting ? 0.75 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isEditSubmitting ? (
                    <>
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal (SRD Section 3.3) */}
      {showAssignModal && selectedBrandForAssign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              maxHeight: 'min(90vh, 640px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e2e2',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e2e2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                background: '#ffffff',
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>
                  Assign Team: {selectedBrandForAssign.name}
                </h3>
                <p style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>
                  Selected members will gain view-only access to this client.
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>


              {/* Scrollable list */}
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
                {allUsers
                  .filter((u) => u.role === 'team' || u.role === 'hr')
                  .map((user) => {
                    const isAssigned = selectedBrandForAssign.assignedMemberIds.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: '#f9f9f9',
                          border: isAssigned ? '1px solid #0a0a0a' : '1px solid #e2e2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e2e2' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: '#0a0a0a',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {(user.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{user.name}</div>
                            <div style={{ fontSize: 11, color: '#777777' }}>{user.designation}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e) => {
                            const current = selectedBrandForAssign.assignedMemberIds;
                            const updated = e.target.checked
                              ? [...current, user.id]
                              : current.filter((id) => id !== user.id);
                            setSelectedBrandForAssign({
                              ...selectedBrandForAssign,
                              assignedMemberIds: updated
                            });
                          }}
                          style={{ accentColor: '#0a0a0a', width: 16, height: 16 }}
                        />
                      </label>
                    );
                  })}
              </div>

              {/* Sticky Footer */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fafafa', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={{ padding: '8px 16px', background: '#ffffff', color: '#0a0a0a', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    assignMembersToBrand(
                      selectedBrandForAssign.id,
                      selectedBrandForAssign.assignedMemberIds
                    );
                    setShowAssignModal(false);
                  }}
                  style={{ padding: '8px 16px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Save Assignments
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
