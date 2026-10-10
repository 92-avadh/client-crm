import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { User } from '../../types';
import {
  Users, UserPlus, X, Shield, Briefcase, Mail, Phone,
  ChevronRight, UserCheck, Building2, Copy, Eye, EyeOff,
  CheckCircle2, UserX, Loader2, Camera, Upload, Trash2,
  Sparkles, Edit3, Lock, Save,
} from 'lucide-react';

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#0a0a0a', '#1a73e8', '#0f9d58', '#e37400', '#d93025',
  '#7b1fa2', '#00838f', '#558b2f',
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
];

const Avatar: React.FC<{ user: User; size?: number }> = ({ user, size = 38 }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user.avatar]);

  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1.5px solid #e2e2e2',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          background: '#f5f5f5',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarColor(user.name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, flexShrink: 0,
    }}>
      {(user.name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: '#0a0a0a', color: '#ffffff', label: 'Admin' },
  hr:    { bg: '#e8f0fe', color: '#1a73e8', label: 'HR Manager' },
  team:  { bg: '#e6f4ea', color: '#0f9d58', label: 'Team Member' },
  brand: { bg: '#fce8e6', color: '#d93025', label: 'Brand' },
};
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const s = ROLE_STYLES[role] ?? { bg: '#f5f5f5', color: '#666', label: role };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, letterSpacing: '0.02em',
    }}>{s.label}</span>
  );
};

export const TeamManager: React.FC = () => {
  const { currentUser, allUsers, brands, showToast, reloadAll } = useApp() as any;
  const isAdmin = currentUser.role === 'admin';

  const [showAddModal, setShowAddModal]     = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editingMember, setEditingMember]   = useState<User | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showEditPwd, setShowEditPwd]       = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [submitting, setSubmitting]         = useState(false);
  const [deactivating, setDeactivating]     = useState<string | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [createdCreds, setCreatedCreds]     = useState<{ name: string; email: string; password: string } | null>(null);
  const [showCreatedPwd, setShowCreatedPwd] = useState(false);
  const [copied, setCopied]                 = useState<string | null>(null);
  const [isDragging, setIsDragging]         = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editModalFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', designation: '',
    role: 'team' as 'hr' | 'team',
    password: '',
    avatar: '',
  });

  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', designation: '',
    role: 'team' as 'admin' | 'hr' | 'team',
    password: '',
    avatar: '',
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const openAddModal = () => {
    setForm({
      name: '', email: '', phone: '', designation: '',
      role: 'team', password: generatePassword(), avatar: ''
    });
    setCreatedCreds(null);
    setShowCreatedPwd(false);
    setShowAddModal(true);
  };

  const processImageFile = (file: File, callback: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo size must be less than 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          callback(dataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        setForm(prev => ({ ...prev, avatar: dataUrl }));
        showToast('Photo uploaded successfully', 'success');
      });
    }
    e.target.value = '';
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        setForm(prev => ({ ...prev, avatar: dataUrl }));
        showToast('Photo uploaded successfully', 'success');
      });
    }
  };

  const handleUpdateExistingAvatar = async (file: File) => {
    if (!selectedMember) return;
    processImageFile(file, async (dataUrl) => {
      try {
        setUpdatingAvatar(true);
        await api.users.update(selectedMember.id, { avatar: dataUrl });
        await reloadAll();
        setSelectedMember(prev => prev ? { ...prev, avatar: dataUrl } : null);
        showToast('Profile photo updated successfully', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to update photo', 'error');
      } finally {
        setUpdatingAvatar(false);
      }
    });
  };

  const handleRemoveExistingAvatar = async () => {
    if (!selectedMember) return;
    try {
      setUpdatingAvatar(true);
      await api.users.update(selectedMember.id, { avatar: '' });
      await reloadAll();
      setSelectedMember(prev => prev ? { ...prev, avatar: '' } : null);
      showToast('Profile photo removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove photo', 'error');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const teamUsers = (allUsers as User[]).filter(u => u.role !== 'brand');
  const totalMembers    = teamUsers.length;
  const activeMembers   = teamUsers.filter((u: any) => u.isActive !== false).length;
  const adminHrCount    = teamUsers.filter(u => u.role === 'admin' || u.role === 'hr').length;
  const teamMemberCount = teamUsers.filter(u => u.role === 'team').length;

  const getBrandCount     = (userId: string) => brands.filter((b: any) => b.assignedMemberIds?.includes(userId)).length;
  const getAssignedBrands = (userId: string) => brands.filter((b: any) => b.assignedMemberIds?.includes(userId));

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.designation || !form.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await api.users.create({
        name: form.name, email: form.email, phone: form.phone,
        designation: form.designation, role: form.role, password: form.password,
        avatar: form.avatar || undefined,
      });
      await reloadAll();
      setCreatedCreds({ name: form.name, email: form.email, password: form.password });
      showToast(`${form.name} added successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingMember(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      designation: user.designation || '',
      role: (user.role as any) || 'team',
      password: '',
      avatar: user.avatar || '',
    });
    setShowEditPwd(false);
    setShowEditModal(true);
  };

  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.designation.trim()) {
      showToast('Name, Email and Designation are required', 'error');
      return;
    }
    try {
      setEditSubmitting(true);
      const payload: any = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        designation: editForm.designation.trim(),
        role: editForm.role,
        avatar: editForm.avatar || '',
      };
      if (editForm.password && editForm.password.trim().length > 0) {
        payload.password = editForm.password.trim();
      }

      await api.users.update(editingMember.id, payload);
      await reloadAll();

      if (selectedMember?.id === editingMember.id) {
        setSelectedMember(prev => prev ? {
          ...prev,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          designation: payload.designation,
          role: payload.role,
          avatar: payload.avatar,
        } : null);
      }

      showToast(
        payload.password
          ? `${editForm.name}'s details, email and password updated successfully!`
          : `${editForm.name}'s details and email updated successfully!`,
        'success'
      );
      setShowEditModal(false);
      setEditingMember(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update team member', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!window.confirm(`Deactivate ${user.name}? They will no longer be able to log in.`)) return;
    try {
      setDeactivating(user.id);
      await api.users.deactivate(user.id);
      await reloadAll();
      showToast(`${user.name} has been deactivated`, 'success');
      if (selectedMember?.id === user.id) setSelectedMember(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate', 'error');
    } finally {
      setDeactivating(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; accent?: string }> =
    ({ label, value, icon, accent = '#0a0a0a' }) => (
      <div style={{
        background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14,
        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 160,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#909090', marginTop: 2 }}>{label}</div>
        </div>
      </div>
    );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>Team</h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4, marginBottom: 0 }}>Manage your team members, roles and brand assignments</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
            <UserPlus style={{ width: 16, height: 16 }} /> Add Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Members"  value={totalMembers}    icon={<Users      style={{ width: 20, height: 20 }} />} />
        <StatCard label="Active Members" value={activeMembers}   icon={<UserCheck  style={{ width: 20, height: 20 }} />} accent="#0f9d58" />
        <StatCard label="Admins & HR"    value={adminHrCount}    icon={<Shield     style={{ width: 20, height: 20 }} />} accent="#1a73e8" />
        <StatCard label="Team Members"   value={teamMemberCount} icon={<Briefcase  style={{ width: 20, height: 20 }} />} accent="#e37400" />
      </div>

      {/* Team Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.3fr 1.1fr 0.9fr 0.8fr 1.5fr 0.9fr', gap: 12, padding: '12px 24px', background: '#f5f5f5', borderBottom: '1px solid #e2e2e2', fontSize: 11, fontWeight: 700, color: '#909090', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          <span>Member</span><span>Role</span><span>Brands</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span><span></span>
        </div>

        {teamUsers.map((user: any, idx: number) => {
          const isActive = user.isActive !== false;
          return (
            <div key={user.id}
              style={{ display: 'grid', gridTemplateColumns: '2.3fr 1.1fr 0.9fr 0.8fr 1.5fr 0.9fr', gap: 12, padding: '16px 24px', borderBottom: idx < teamUsers.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center', opacity: isActive ? 1 : 0.5 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar user={user} size={42} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#909090' }}>{user.designation || '—'}</div>
                  <div style={{ fontSize: 11, color: '#b0b0b0', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Mail style={{ width: 10, height: 10 }} /> {user.email}
                  </div>
                </div>
              </div>

              <div><RoleBadge role={user.role} /></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 style={{ width: 14, height: 14, color: '#909090' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{getBrandCount(user.id)}</span>
                <span style={{ fontSize: 12, color: '#909090' }}>brand{getBrandCount(user.id) !== 1 ? 's' : ''}</span>
              </div>

              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isActive ? '#e6f4ea' : '#f5f5f5', color: isActive ? '#0f9d58' : '#909090' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#0f9d58' : '#ccc', display: 'inline-block' }} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <button onClick={() => setSelectedMember(user)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#f5f5f5', color: '#0a0a0a', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                    View <ChevronRight style={{ width: 13, height: 13 }} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => openEditModal(user)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#ffffff', color: '#0a0a0a', border: '1px solid #d4d4d4', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                      <Edit3 style={{ width: 13, height: 13 }} /> Edit
                    </button>
                  )}
                </div>
              </div>

              <div>
                {isAdmin && user.id !== currentUser.id && isActive ? (
                  <button onClick={() => handleDeactivate(user)} disabled={deactivating === user.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#fff', color: '#d93025', border: '1px solid #fce8e6', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: deactivating === user.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const }}>
                    {deactivating === user.id ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <UserX style={{ width: 12, height: 12 }} />}
                    Deactivate
                  </button>
                ) : <span />}
              </div>
            </div>
          );
        })}

        {teamUsers.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#909090', fontSize: 14 }}>
            No team members yet. Click "Add Member" to get started.
          </div>
        )}
      </div>

      {/* ════ Add Member Modal ════ */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !createdCreds) setShowAddModal(false); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', margin: 0 }}>
                  {createdCreds ? '✅ Member Added!' : 'Add Team Member'}
                </h2>
                <p style={{ fontSize: 12, color: '#909090', margin: '4px 0 0' }}>
                  {createdCreds ? 'Share these login credentials with the new member' : 'Create profile & login credentials for a new team member'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {createdCreds ? (
              /* ── Show credentials after creation ── */
              <div style={{ padding: 26, overflowY: 'auto' }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 14 }}>
                    Credentials for <span style={{ color: '#0a0a0a' }}>{createdCreds.name}</span>
                  </div>
                  {[{ label: 'Email', value: createdCreds.email, key: 'email' }, { label: 'Password', value: createdCreds.password, key: 'pwd' }].map(({ label, value, key }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #dcfce7' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#909090', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', fontFamily: 'monospace' }}>{value}</div>
                      </div>
                      <button onClick={() => copyToClipboard(value, key)} style={{ background: copied === key ? '#dcfce7' : '#f5f5f5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: copied === key ? '#15803d' : '#555' }}>
                        {copied === key ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        {copied === key ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 20 }}>
                  ⚠️ Save these credentials now — the password won't be shown again.
                </div>
                <button onClick={() => setShowAddModal(false)} style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              /* ── Add form ── */
              <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>

                  {/* ── Photo Upload Option ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>
                      Profile Photo <span style={{ fontWeight: 400, color: '#888' }}>(Optional)</span>
                    </label>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDropFile}
                      style={{
                        border: isDragging ? '2px dashed #0a0a0a' : '1.5px dashed #d6d6d6',
                        background: isDragging ? '#f5f5f5' : '#fafafa',
                        borderRadius: 14,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Avatar preview */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {form.avatar ? (
                          <img
                            src={form.avatar}
                            alt="Preview"
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #0a0a0a',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              background: '#f0f0f0',
                              border: '1.5px dashed #ccc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#888',
                            }}
                          >
                            <Camera style={{ width: 24, height: 24 }} />
                          </div>
                        )}
                        {form.avatar && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              background: '#0f9d58',
                              color: '#fff',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #fff',
                            }}
                          >
                            <CheckCircle2 style={{ width: 12, height: 12 }} />
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {form.avatar ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Photo ready</div>
                            <div style={{ fontSize: 11, color: '#666' }}>Will be displayed in team and client views</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                  padding: '5px 12px',
                                  background: '#0a0a0a',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Change Photo
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, avatar: '' }))}
                                style={{
                                  padding: '5px 10px',
                                  background: '#fff',
                                  color: '#d93025',
                                  border: '1px solid #fce8e6',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Trash2 style={{ width: 11, height: 11 }} /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>Upload Member Photo</div>
                            <div style={{ fontSize: 11, color: '#888' }}>Drag & drop image, or browse (JPG, PNG, WebP up to 5MB)</div>
                            <div style={{ marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 14px',
                                  background: '#0a0a0a',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Upload style={{ width: 13, height: 13 }} /> Browse Photo
                              </button>
                            </div>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleFileSelected}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    {/* Quick Preset Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles style={{ width: 11, height: 11, color: '#e37400' }} /> Or pick a sample:
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <img
                            key={idx}
                            src={preset}
                            alt={`Preset ${idx + 1}`}
                            onClick={() => setForm(p => ({ ...p, avatar: preset }))}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: form.avatar === preset ? '2px solid #0a0a0a' : '1px solid #d4d4d4',
                              opacity: form.avatar === preset ? 1 : 0.7,
                              transform: form.avatar === preset ? 'scale(1.15)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Select sample photo ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Text inputs */}
                  {[
                    { label: 'Full Name *',      name: 'name',        type: 'text',  placeholder: 'e.g. Priya Sharma' },
                    { label: 'Email Address *',  name: 'email',       type: 'email', placeholder: 'priya@agency.com' },
                    { label: 'Phone',            name: 'phone',       type: 'text',  placeholder: '+91 98765 43210' },
                    { label: 'Designation *',    name: 'designation', type: 'text',  placeholder: 'e.g. Senior CA' },
                  ].map(field => (
                    <div key={field.name}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>{field.label}</label>
                      <input
                        name={field.name}
                        type={field.type}
                        value={(form as any)[field.name]}
                        onChange={handleFormChange}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }}
                      />
                    </div>
                  ))}

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Role *</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleFormChange}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa', cursor: 'pointer' }}
                    >
                      <option value="hr">HR Manager — manages clients, invoices, team</option>
                      <option value="team">Team Member — works on assigned brands/tasks</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>
                      Login Password * <span style={{ fontWeight: 400, color: '#aaa' }}>(auto-generated)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        name="password"
                        type={showCreatedPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleFormChange}
                        style={{ width: '100%', padding: '10px 90px 10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }}
                      />
                      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button type="button" onClick={() => setShowCreatedPwd(!showCreatedPwd)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center' }}>
                          {showCreatedPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button type="button" onClick={() => setForm(p => ({ ...p, password: generatePassword() }))} style={{ background: '#f5f5f5', border: '1px solid #e2e2e2', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#555', cursor: 'pointer', padding: '2px 8px' }}>
                          New
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div style={{ display: 'flex', gap: 10, padding: '16px 26px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px 0', background: '#f5f5f5', color: '#0a0a0a', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px 0', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    {submitting ? 'Adding…' : 'Add Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Member Modal ── */}
      {showEditModal && editingMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => !editSubmitting && setShowEditModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 480,
              maxHeight: 'min(92vh, 850px)',
              boxShadow: '0 25px 65px rgba(0,0,0,0.22)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e5e5',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: '#0a0a0a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit3 style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>Edit Team Member</h3>
                  <p style={{ fontSize: 12, color: '#737373', margin: '2px 0 0' }}>
                    Update email address, password, and member profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={editSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#737373',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleEditMemberSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
                
                {/* Photo Upload / Edit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px', background: '#fafafa', borderRadius: 12, border: '1px solid #ebebeb' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {editForm.avatar ? (
                      <img
                        src={editForm.avatar}
                        alt="Preview"
                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0a0a0a' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          background: getAvatarColor(editForm.name),
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          fontWeight: 700,
                        }}
                      >
                        {(editForm.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>Member Photo</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => editModalFileInputRef.current?.click()}
                        style={{
                          padding: '5px 12px',
                          background: '#0a0a0a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Change Photo
                      </button>
                      {editForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setEditForm(p => ({ ...p, avatar: '' }))}
                          style={{
                            padding: '5px 10px',
                            background: '#fff',
                            color: '#d93025',
                            border: '1px solid #fce8e6',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={editModalFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageFile(file, (dataUrl) => {
                          setEditForm(p => ({ ...p, avatar: dataUrl }));
                          showToast('Photo selected', 'success');
                        });
                      }
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, color: '#0a0a0a', background: '#fafafa', outline: 'none' }}
                  />
                </div>

                {/* Email Address — specifically requested */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>
                      Email Address *
                    </label>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 style={{ width: 11, height: 11 }} /> Used for login
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="name@agency.com"
                      style={{ width: '100%', padding: '10px 14px 10px 34px', border: '1.5px solid #0a0a0a', borderRadius: 10, fontSize: 13, color: '#0a0a0a', background: '#ffffff', outline: 'none', fontWeight: 600 }}
                    />
                  </div>
                </div>

                {/* Phone & Designation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, color: '#0a0a0a', background: '#fafafa', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Designation *</label>
                    <input
                      type="text"
                      required
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      placeholder="e.g. Senior Strategist"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, color: '#0a0a0a', background: '#fafafa', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 13, color: '#0a0a0a', background: '#fafafa', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="hr">HR Manager — manages clients, billing, and team</option>
                    <option value="team">Team Member — works on assigned brands & tasks</option>
                    {editingMember.role === 'admin' && <option value="admin">Administrator (Full Access)</option>}
                  </select>
                </div>

                {/* Password Update section — specifically requested */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: '#f9f9f9',
                    border: '1.5px solid #e5e5e5',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock style={{ width: 14, height: 14, color: '#0a0a0a' }} />
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', cursor: 'pointer' }}>
                        Update Login Password
                      </label>
                    </div>
                    <span style={{ fontSize: 11, color: '#737373' }}>Optional</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#737373', margin: 0 }}>
                    Enter a new password to update their login credentials, or leave blank to keep their existing password.
                  </p>

                  <div style={{ position: 'relative', marginTop: 4 }}>
                    <input
                      type={showEditPwd ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Enter new password (min. 6 chars)"
                      style={{
                        width: '100%',
                        padding: '10px 120px 10px 14px',
                        border: '1px solid #d4d4d4',
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#0a0a0a',
                        background: '#ffffff',
                        outline: 'none',
                        fontFamily: editForm.password ? 'monospace' : 'inherit',
                      }}
                    />
                    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowEditPwd(!showEditPwd)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', alignItems: 'center' }}
                        title={showEditPwd ? 'Hide password' : 'Show password'}
                      >
                        {showEditPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm(p => ({ ...p, password: generatePassword() }))}
                        style={{
                          background: '#f0f0f0',
                          border: '1px solid #d4d4d4',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#0a0a0a',
                          cursor: 'pointer',
                          padding: '3px 8px',
                        }}
                        title="Generate random password"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '16px 24px',
                  borderTop: '1px solid #f0f0f0',
                  background: '#fafafa',
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                  style={{
                    padding: '9px 18px',
                    background: '#ffffff',
                    color: '#0a0a0a',
                    border: '1px solid #d4d4d4',
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
                  disabled={editSubmitting}
                  style={{
                    padding: '9px 24px',
                    background: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: editSubmitting ? 'not-allowed' : 'pointer',
                    opacity: editSubmitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {editSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Member Profile Drawer ── */}
      {selectedMember && (
        <>
          <div onClick={() => setSelectedMember(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 900 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#fff', zIndex: 901, boxShadow: '-12px 0 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflowY: 'auto' as const }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar user={selectedMember} size={54} />
                  {isAdmin && (
                    <label
                      title="Upload or change member photo"
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        background: '#0a0a0a',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      }}
                    >
                      {updatingAvatar ? (
                        <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                      ) : (
                        <Camera style={{ width: 11, height: 11 }} />
                      )}
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={updatingAvatar}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpdateExistingAvatar(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0a0a0a', margin: 0 }}>{selectedMember.name}</h2>
                  <p style={{ fontSize: 12, color: '#909090', margin: '3px 0 6px' }}>{selectedMember.designation || 'No designation'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RoleBadge role={selectedMember.role} />
                    {isAdmin && selectedMember.avatar && (
                      <button
                        onClick={handleRemoveExistingAvatar}
                        disabled={updatingAvatar}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#d93025',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: 0,
                        }}
                      >
                        <Trash2 style={{ width: 11, height: 11 }} /> Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ background: '#f0f0f0', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {isAdmin && (
              <div style={{ padding: '12px 28px', borderBottom: '1px solid #f0f0f0', background: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => openEditModal(selectedMember)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    background: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 style={{ width: 13, height: 13 }} /> Edit Team Member
                </button>
              </div>
            )}

            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0f0f0' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#909090', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>Contact</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <Mail style={{ width: 14, height: 14, color: '#909090' }} />, label: 'Email', value: selectedMember.email },
                  ...(selectedMember.phone ? [{ icon: <Phone style={{ width: 14, height: 14, color: '#909090' }} />, label: 'Phone', value: selectedMember.phone }] : []),
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#909090' }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px 28px', flex: 1 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#909090', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>
                Assigned Brands ({getAssignedBrands(selectedMember.id).length})
              </h3>
              {getAssignedBrands(selectedMember.id).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#b0b0b0', fontSize: 13 }}>No brands assigned yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {getAssignedBrands(selectedMember.id).map((brand: any) => (
                    <div key={brand.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f5f5f5', borderRadius: 10, border: '1px solid #ebebeb' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: getAvatarColor(brand.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{brand.name}</div>
                        <div style={{ fontSize: 11, color: '#909090' }}>{brand.assignedMemberIds?.length ?? 0} member{(brand.assignedMemberIds?.length ?? 0) !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamManager;
