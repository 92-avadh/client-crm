import React, { useState } from 'react';
import {
  X,
  FileText,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Plus,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  UploadCloud,
  FileCheck2,
  FileWarning
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Brand, User, Invoice, Task, BrandDocument } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export type ProfileTab = 'overview' | 'team' | 'financials' | 'vault' | 'tasks' | 'timeline';

interface Props {
  brand: Brand | null;
  role: string;
  allUsers: User[];
  invoices: Invoice[];
  tasks: Task[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onClose: () => void;
  onChat: (brandId: string) => void;
}

const cardStyle: React.CSSProperties = {
  padding: 14, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)',
};
const capStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)',
};

/** Client profile drawer with Retainer Scope, Contract Vault, Gross Margin, and Magic Link Portal. */
export const ClientProfileDrawer: React.FC<Props> = ({
  brand, role, allUsers, invoices, tasks, activeTab, onTabChange, onClose, onChat,
}) => {
  const { currencySymbol: globalCurrencySymbol = '₹', expenses = [], showToast, updateBrand } = useApp();
  if (!brand) return null;

  const currSym = brand.currencySymbol || globalCurrencySymbol;
  const formatAmt = (n: number) => `${currSym}${Number(n || 0).toLocaleString()}`;

  // Log Hours State
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState('');
  const [loggingHours, setLoggingHours] = useState(false);

  // Add Document / Contract State
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<'MSA' | 'SOW' | 'NDA' | 'KYC & Tax' | 'Contract' | 'Other'>('MSA');
  const [newDocRenewal, setNewDocRenewal] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const assignedUsers = allUsers.filter((u) => (brand.assignedMemberIds || []).includes(u.id));
  const brandInvoices = invoices.filter((i) => i.brandId === brand.id);
  const brandTasks = tasks.filter((t) => t.brandId === brand.id);

  // Client Deliverable / Contractor Expenses & Gross Margin Calculation
  const clientExpenses = expenses.filter((e) => e.brandId === brand.id);
  const totalClientExpenses = clientExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthlyRetainer = Number(brand.monthlyFee || 0);
  const grossProfit = monthlyRetainer - totalClientExpenses;
  const grossMarginPct = monthlyRetainer > 0 ? Math.round((grossProfit / monthlyRetainer) * 100) : 0;

  // Retainer Scope & Hours Tracker
  const retainerHours = Number(brand.retainerHours || 40);
  const usedHours = Number(brand.usedHours || 0);
  const hoursPct = retainerHours > 0 ? Math.round((usedHours / retainerHours) * 100) : 0;
  const hoursRemaining = Math.max(0, retainerHours - usedHours);
  const isOverScope = usedHours >= retainerHours;
  const isNearScope = hoursPct >= 80 && !isOverScope;

  // Copy Magic Link to Clipboard
  const handleCopyMagicLink = () => {
    if (!brand.magicToken) return;
    const url = `${window.location.origin}/portal/${brand.magicToken}`;
    navigator.clipboard.writeText(url);
    showToast('Passwordless Client Portal magic link copied to clipboard!', 'success');
  };

  const handleLogHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hoursToAdd);
    if (!h || h <= 0) return;
    setLoggingHours(true);
    try {
      await api.brands.logHours(brand.id, h);
      await updateBrand(brand.id, { usedHours: usedHours + h });
      showToast(`Successfully logged ${h} hours against retainer scope!`, 'success');
      setShowLogHoursModal(false);
      setHoursToAdd('');
    } catch (err: any) {
      showToast(err.message || 'Failed to log hours.', 'error');
    } finally {
      setLoggingHours(false);
    }
  };

  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    setUploadingDoc(true);
    try {
      const doc = await api.brands.addDocument(brand.id, {
        name: newDocName.trim(),
        category: newDocCategory,
        renewalDate: newDocRenewal || null,
        type: 'PDF',
        size: '1.2 MB',
        status: 'Signed',
      });
      const updatedDocs = [...(brand.documents || []), doc];
      await updateBrand(brand.id, { documents: updatedDocs });
      showToast(`Contract added to client vault under ${newDocCategory}!`, 'success');
      setShowAddDocModal(false);
      setNewDocName('');
      setNewDocRenewal('');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload document.', 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview & Retainer' },
    { id: 'vault' as const, label: `Contract & KYC Vault (${(brand.documents || []).length})` },
    ...(role !== 'team' ? [{ id: 'financials' as const, label: 'Billing & Profitability' }] : []),
    { id: 'tasks' as const, label: `Deliverables (${brandTasks.length})` },
    { id: 'team' as const, label: `Team (${assignedUsers.length})` },
    { id: 'timeline' as const, label: 'Timeline' },
  ];

  // Helper for contract renewal countdown
  const getRenewalBadge = (renewalDate?: string) => {
    if (!renewalDate) return null;
    const now = new Date();
    const ren = new Date(renewalDate);
    const diffDays = Math.ceil((ren.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>Expired {Math.abs(diffDays)}d ago</span>;
    }
    if (diffDays <= 30) {
      return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>Renews in {diffDays} days</span>;
    }
    return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'var(--bg-card)', color: 'var(--text-muted)' }}>Renews {renewalDate}</span>;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 900,
        }}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(760px, 100vw)',
          background: 'var(--bg-card)',
          zIndex: 901,
          boxShadow: '-12px 0 40px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, background: 'var(--bg-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{brand.name}</h2>
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {brand.currency || 'INR'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {brand.ownerName} · {[brand.city, brand.state].filter(Boolean).join(', ') || brand.state || ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {brand.magicToken && (
              <button
                onClick={handleCopyMagicLink}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="Copy Passwordless Client Portal Magic Link"
              >
                <Copy style={{ width: 13, height: 13 }} />
                <span>Copy Portal Link</span>
              </button>
            )}
            <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Retainer Scope & Anti-Scope Creep Tracker Banner */}
        <div style={{ padding: '14px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock style={{ width: 14, height: 14, color: isOverScope ? '#ef4444' : '#38bdf8' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Monthly Retainer Scope Quota</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: isOverScope ? '#ef4444' : (isNearScope ? '#f59e0b' : 'var(--text-secondary)') }}>
                {usedHours} / {retainerHours} hrs ({hoursPct}%)
              </span>
              <button
                onClick={() => setShowLogHoursModal(true)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'var(--solid-btn-bg)',
                  color: 'var(--solid-btn-text)',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus style={{ width: 12, height: 12 }} /> Log Hours
              </button>
            </div>
          </div>

          <div style={{ height: 6, borderRadius: 6, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, hoursPct)}%`,
                background: isOverScope ? '#ef4444' : (isNearScope ? '#f59e0b' : 'var(--success-text)'),
                borderRadius: 6,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {isOverScope && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--danger-bg)', color: 'var(--danger-text)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>
                <strong>Anti-Scope Creep Alert:</strong> Retainer limit exceeded ({usedHours}/{retainerHours} hrs). Bill extra deliverable hours as overage or prompt client for retainer expansion.
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--bg-subtle)', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '12px 16px', fontSize: 12, fontWeight: 600, border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--border-focus)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={cardStyle}>
                  <span style={capStyle}>Phone &amp; Email</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{brand.mobile}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{brand.email}</div>
                </div>
                <div style={cardStyle}>
                  <span style={capStyle}>Billing Address</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{brand.billingAddress}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    {[brand.city, brand.state].filter(Boolean).join(', ')}{brand.pincode ? ` - ${brand.pincode}` : ''}
                  </div>
                </div>
              </div>

              {role !== 'team' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={cardStyle}>
                    <span style={capStyle}>Monthly Retainer Fee</span>
                    <div className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontSize: 15 }}>
                      {formatAmt(brand.monthlyFee)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      Cycle Day: {brand.billingCycleDay || 1}st of month
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <span style={capStyle}>Contract Currency</span>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontSize: 15 }}>
                      {brand.currency || 'INR'} ({currSym})
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      Per-client billing currency
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <span style={capStyle}>Latest NPS Feedback</span>
                    <div style={{ fontWeight: 800, color: brand.npsScore && brand.npsScore >= 8 ? 'var(--success-text)' : 'var(--text-primary)', marginTop: 4, fontSize: 15 }}>
                      {brand.npsScore ? `${brand.npsScore} / 10` : 'Not rated yet'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      Client Portal Satisfaction
                    </div>
                  </div>
                </div>
              )}

              {/* Passwordless Magic Portal Card */}
              {brand.magicToken && (
                <div style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck style={{ width: 14, height: 14, color: 'var(--success-text)' }} />
                      <span>Passwordless Magic-Link Client Portal</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Clients can view deliverables, download invoices, and submit 1-click feedback without a login.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={handleCopyMagicLink}
                      style={{ ...cardStyle, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => window.open(`/portal/${brand.magicToken}`, '_blank')}
                      style={{ ...cardStyle, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none' }}
                    >
                      Open Portal
                    </button>
                  </div>
                </div>
              )}

              <div style={cardStyle}>
                <span style={capStyle}>Contracted Deliverable Scope</span>
                <p style={{ color: 'var(--text-primary)', marginTop: 6, lineHeight: 1.5 }}>{brand.serviceDetails}</p>
              </div>
            </div>
          )}

          {/* CONTRACT & KYC VAULT TAB */}
          {activeTab === 'vault' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Client Contract &amp; KYC Vault
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Master Service Agreements (MSA), Statements of Work (SOW), NDAs, and Tax Registrations.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDocModal(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'var(--solid-btn-bg)',
                    color: 'var(--solid-btn-text)',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UploadCloud style={{ width: 14, height: 14 }} /> Upload Contract / KYC
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(brand.documents || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 32, background: 'var(--bg-subtle)', borderRadius: 10, textAlign: 'center' }}>
                    <FileText style={{ width: 36, height: 36, margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No contracts or KYC uploaded yet.</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11 }}>Add an MSA, SOW, or NDA to activate automated renewal countdown notifications.</p>
                  </div>
                ) : (
                  brand.documents.map((doc: BrandDocument) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{doc.name}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
                              {doc.category || 'Contract'}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                              {doc.status || 'Signed'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                            Uploaded {doc.uploadDate} {doc.size ? `· ${doc.size}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {getRenewalBadge(doc.renewalDate)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* BILLING & PROFITABILITY TAB */}
          {activeTab === 'financials' && role !== 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Gross Margin Card */}
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp style={{ width: 16, height: 16, color: 'var(--success-text)' }} />
                      <span>Client Gross Margin &amp; Retainer Profitability</span>
                    </h3>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Monthly retainer minus client contractor &amp; deliverable production expenses.
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 800,
                      background: grossMarginPct >= 70 ? 'var(--success-bg)' : (grossMarginPct >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'var(--danger-bg)'),
                      color: grossMarginPct >= 70 ? 'var(--success-text)' : (grossMarginPct >= 50 ? '#f59e0b' : 'var(--danger-text)'),
                    }}
                  >
                    {grossMarginPct >= 70 ? 'Healthy Margin' : (grossMarginPct >= 50 ? 'Caution' : 'Margin Leak')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <div style={capStyle}>Monthly Retainer</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>
                      {formatAmt(monthlyRetainer)}
                    </div>
                  </div>
                  <div>
                    <div style={capStyle}>Deliverable Costs</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--danger-text)', marginTop: 2 }}>
                      {formatAmt(totalClientExpenses)}
                    </div>
                  </div>
                  <div>
                    <div style={capStyle}>Gross Margin</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: grossProfit >= 0 ? 'var(--success-text)' : 'var(--danger-text)', marginTop: 2 }}>
                      {formatAmt(grossProfit)} ({grossMarginPct}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="table-scroll" style={{ overflowX: 'auto' }}>
                {brandInvoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    No invoices raised for this client yet.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr><th>Invoice #</th><th>Issue</th><th>Due</th><th style={{ textAlign: 'right' }}>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {brandInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.issueDate}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.dueDate}</td>
                          <td className="font-amount" style={{ textAlign: 'right', fontWeight: 800 }}>{formatAmt(inv.totalAmount)}</td>
                          <td style={{ fontSize: 12 }}>{inv.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* DELIVERABLES & TASKS TAB */}
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brandTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No deliverables recorded for this client yet.
                </div>
              ) : (
                brandTasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle style={{ width: 15, height: 15, color: t.status === 'Completed' ? 'var(--success-text)' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.status}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assignedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No team members assigned to this client yet.
                </div>
              ) : (
                assignedUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.designation || u.role}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Client onboarded', value: brand.onboardingDate },
                { label: 'Last activity', value: brand.lastActivityDate },
                { label: 'Last payment', value: brand.lastPaymentDate || 'No payment recorded' },
                { label: 'Contract starts', value: brand.contractStartDate || 'N/A' },
                { label: 'Contract renews', value: brand.contractEndDate || 'Ongoing monthly retainer' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Users style={{ width: 14, height: 14 }} />
            {assignedUsers.length} team member{assignedUsers.length !== 1 ? 's' : ''} assigned
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => onChat(brand.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <MessageSquare style={{ width: 14, height: 14 }} />
              Open Chat
            </button>
          </div>
        </div>
      </motion.div>

      {/* Log Retainer Hours Modal */}
      {showLogHoursModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>Log Retainer Hours</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Record billable deliverable time for {brand.name} against their monthly scope quota of {retainerHours} hrs.
            </p>
            <form onSubmit={handleLogHoursSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>Hours to Log</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  required
                  placeholder="e.g. 3.5"
                  value={hoursToAdd}
                  onChange={(e) => setHoursToAdd(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowLogHoursModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={loggingHours} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', cursor: 'pointer', fontWeight: 700 }}>
                  {loggingHours ? 'Saving...' : 'Add to Retainer Scope'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Contract / Document Modal */}
      {showAddDocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>Add Contract or KYC</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Upload agreement or legal tax registration to vault with automated renewal tracking.
            </p>
            <form onSubmit={handleAddDocumentSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Services Agreement 2026"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="MSA">Master Service Agreement (MSA)</option>
                    <option value="SOW">Statement of Work (SOW)</option>
                    <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                    <option value="KYC & Tax">KYC &amp; Tax Registration (GST / W-9)</option>
                    <option value="Contract">General Contract</option>
                    <option value="Other">Other Deliverable</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>Contract Renewal Date (Optional)</label>
                  <input
                    type="date"
                    value={newDocRenewal}
                    onChange={(e) => setNewDocRenewal(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAddDocModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={uploadingDoc} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', cursor: 'pointer', fontWeight: 700 }}>
                  {uploadingDoc ? 'Saving...' : 'Add to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientProfileDrawer;
