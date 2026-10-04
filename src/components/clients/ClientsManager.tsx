import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Brand } from '../../types';
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
  X
} from 'lucide-react';

export const ClientsManager: React.FC = () => {
  const {
    currentUser,
    brands,
    allUsers,
    addBrand,
    assignMembersToBrand,
    selectedBrandId,
    setSelectedBrandId,
    invoices,
    tasks,
    setActiveTab,
  } = useApp();

  const role = currentUser.role;

  // Search and filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBrandForAssign, setSelectedBrandForAssign] = useState<Brand | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'team' | 'financials' | 'tasks' | 'timeline'>('overview');

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
    notes: ''
  });

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

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName || !formData.mobile || !formData.email) {
      alert('Please fill all required fields');
      return;
    }

    const newBrand = addBrand({
      ...formData,
      monthlyFee: Number(formData.monthlyFee),
      billingCycleDay: Number(formData.billingCycleDay)
    });

    setShowOnboardModal(false);
    setSelectedBrandId(newBrand.id);
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
              className="btn-primary"
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
                className="glass-panel"
                style={{
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
                    {getInactivityBadge(brand.lastActivityDate)}
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
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a' }}>
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
                            <img
                              key={u.id}
                              src={u.avatar}
                              alt={u.name}
                              title={`${u.name} (${u.designation})`}
                              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e2e2' }}
                            />
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

                  {(role === 'admin' || role === 'hr') && (
                    <button
                      onClick={() => {
                        setSelectedBrandForAssign(brand);
                        setShowAssignModal(true);
                      }}
                      style={{
                        padding: '4px 8px',
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
            );
          })
        )}
      </div>

      {/* Brand Detailed Profile Drawer / Modal */}
      {selectedBrand && (
        <div className="modal-overlay" onClick={() => setSelectedBrandId(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 720, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                </div>
                <div style={{ fontSize: 12, color: '#777777', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Contact: {selectedBrand.ownerName}</span>
                  <span>•</span>
                  <span>Joined: {selectedBrand.onboardingDate}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBrandId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666', padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a', marginTop: 4 }}>
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
                        className="btn-primary"
                        style={{ height: 32, fontSize: 11 }}
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
                            <img
                              src={member.avatar}
                              alt={member.name}
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
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
                            className="btn-secondary"
                            style={{ height: 28, fontSize: 11 }}
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
                      className="btn-primary"
                      style={{ height: 32, fontSize: 11 }}
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
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a', fontSize: 13 }}>
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
                      className="btn-secondary"
                      style={{ height: 28, fontSize: 11 }}
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
                        Client master profile created with contracted fee of ₹{selectedBrand.monthlyFee.toLocaleString('en-IN')}.
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
                className="btn-primary"
                style={{ height: 34, fontSize: 12 }}
              >
                <Send style={{ width: 13, height: 13 }} />
                <span>Open Client Chat Channel</span>
              </button>
              <button
                onClick={() => setSelectedBrandId(null)}
                className="btn-secondary"
                style={{ height: 34, fontSize: 12 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Client Modal (SRD Section 3.2 Form) */}
      {showOnboardModal && (
        <div className="modal-overlay" onClick={() => setShowOnboardModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 640, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a' }}>Onboard New Client</h2>
                <p style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                  Complete client onboarding form per Section 3.2
                </p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666', padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto', fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Media Pvt Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Contact Person (Owner) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Seth"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99880 11223"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="accounts@client.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Billing Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street, Building, Floor..."
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field"
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
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 400050"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>GSTIN (15 characters)</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AABCA1234F1Z8"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>PAN</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="AABCA1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Monthly Agreed Retainer (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Billing Due Day of Month *</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={formData.billingCycleDay}
                    onChange={(e) => setFormData({ ...formData, billingCycleDay: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Service & Project Scope *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.serviceDetails}
                  onChange={(e) => setFormData({ ...formData, serviceDetails: e.target.value })}
                  className="input-field"
                ></textarea>
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Client Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal (SRD Section 3.3) */}
      {showAssignModal && selectedBrandForAssign && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 460, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>
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

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allUsers
                .filter((u) => u.role === 'team' || u.role === 'hr')
                .map((user) => {
                  const isAssigned = selectedBrandForAssign.assignedMemberIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: '#f7f7f7',
                        border: '1px solid #e2e2e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>{user.name}</div>
                          <div style={{ fontSize: 10, color: '#777777' }}>{user.designation}</div>
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

              <div style={{ paddingTop: 16, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="btn-secondary"
                  style={{ height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    assignMembersToBrand(
                      selectedBrandForAssign.id,
                      selectedBrandForAssign.assignedMemberIds
                    );
                    setShowAssignModal(false);
                  }}
                  className="btn-primary"
                  style={{ height: 32, fontSize: 12 }}
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
