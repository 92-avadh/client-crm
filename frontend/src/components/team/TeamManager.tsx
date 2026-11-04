import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { getNaturalErrorMessage } from '../../services/errors';
import type { User } from '../../types';
import { Users, UserPlus, UserCheck, Shield, Briefcase, UserX,
  Trash2, Loader2 } from 'lucide-react';
import { StatCard } from './teamUi';
import { TeamTable } from './TeamTable';
import { MemberDrawer } from './MemberDrawer';
import { AddMemberModal, type AddMemberForm } from './AddMemberModal';
import { EditMemberModal, type EditMemberForm } from './EditMemberModal';
import { processImageFile, generatePassword } from './imageUtils';
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

import { getDefaultPermissionsForRole, CORPORATE_ROLES } from './permissionsConfig';
import Pagination from '../ui/Pagination';
import { getPlanLimits } from '../../utils/subscriptionPlan';
import { PlanUpgradeModal } from '../common/PlanUpgradeModal';
import { ImageCropperModal } from '../ui/ImageCropperModal';
import { validateImageFile } from '../../utils/fileValidation';
import { isValidEmail, isValidPhone } from '../../utils/validation';

const emptyForm = (): AddMemberForm => ({
  name: '', email: '', phone: '', designation: 'Team Member', role: 'team', password: '', avatar: '',
  permissions: getDefaultPermissionsForRole('team'),
});

const emptyEditForm = (): EditMemberForm => ({
  name: '', email: '', phone: '', designation: '', role: 'team', password: '', avatar: '',
  permissions: getDefaultPermissionsForRole('team'),
});

/**
 * Team module orchestrator.
 *
 * Holds the shared member state and the API calls; the table, drawer and both
 * modals are separate components.
 */
export const TeamManager: React.FC = () => {
  const {
    currentUser,
    allUsers,
    brands,
    showToast,
    loadDomain,
    startDirectChat,
    addTeamMember,
    updateTeamMember,
    deactivateTeamMember,
    deleteTeamMember,
    settings,
  } = useApp() as any;
  const isAdmin = currentUser.role === 'admin';
  const canManageTeam = isAdmin || currentUser.role === 'hr' || (currentUser.permissions && currentUser.permissions.includes('team'));
  const planLimits = useMemo(() => getPlanLimits(settings), [settings]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState('');
  const [upgradeModalDesc, setUpgradeModalDesc] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ name: string; email: string; password: string } | null>(null);
  const [memberToDeactivate, setMemberToDeactivate] = useState<User | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState<AddMemberForm>(emptyForm);
  const [editForm, setEditForm] = useState<EditMemberForm>(emptyEditForm);

  const teamUsers = ((allUsers as User[]) || []).filter(Boolean).filter((u: User) => u.role !== 'brand');
  const totalMembers = teamUsers.length;
  const activeMembers = teamUsers.filter((u: any) => u && u.isActive !== false && u?.status !== 'inactive').length;
  const adminHrCount = teamUsers.filter((u: User) => u && (u.role === 'admin' || u.role === 'hr')).length;
  const teamMemberCount = teamUsers.filter((u: User) => u && u.role !== 'admin' && u.role !== 'hr').length;

  const getBrandCount = (userId: string) =>
    (brands || []).filter(Boolean).filter((b: any) => b.status === 'Active' && b.assignedMemberIds?.includes(userId)).length;
  const getAssignedBrands = (userId: string) =>
    (brands || []).filter(Boolean).filter((b: any) => b.assignedMemberIds?.includes(userId));

  /* ── Pagination (client-side; the full collection is already loaded) ── */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const teamCount = teamUsers.length;
  const teamPageCount = Math.max(1, Math.ceil(teamCount / pageSize));
  useEffect(() => {
    if (page > teamPageCount - 1) setPage(teamPageCount - 1);
  }, [page, teamPageCount]);

  const pagedTeamUsers = useMemo(
    () => teamUsers.slice(page * pageSize, (page + 1) * pageSize),
    [teamUsers, page, pageSize]
  );

  /* ── Photo handling ──────────────────────────────────────────── */

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const cropCallbackRef = React.useRef<((dataUrl: string) => Promise<void> | void) | null>(null);

  const pickPhoto = (file: File, apply: (dataUrl: string) => Promise<void> | void) => {
    const validation = validateImageFile(file, { maxSizeMB: 5 });
    if (!validation.valid) {
      showToast(validation.error || 'Please select a valid image file (max 5MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showToast('Could not read image file. Please try another.', 'error');
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        cropCallbackRef.current = apply;
        setCropImageSrc(src);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropImageSrc(null);
    if (cropCallbackRef.current) {
      const cb = cropCallbackRef.current;
      cropCallbackRef.current = null;
      await cb(croppedDataUrl);
    }
  };

  const handleUpdateAvatar = async (file: File) => {
    if (!selectedMember || updatingAvatar) return;
    try {
      pickPhoto(file, async (dataUrl) => {
        try {
          setUpdatingAvatar(true);
          await updateTeamMember(selectedMember.id, { avatar: dataUrl });
          setSelectedMember((prev) => (prev ? { ...prev, avatar: dataUrl } : null));
          showToast('Profile photo updated successfully', 'success');
        } catch (err: any) {
          showToast(getNaturalErrorMessage(err), 'error');
        } finally {
          setUpdatingAvatar(false);
        }
      });
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!selectedMember || updatingAvatar) return;
    try {
      setUpdatingAvatar(true);
      await updateTeamMember(selectedMember.id, { avatar: '' });
      setSelectedMember((prev) => (prev ? { ...prev, avatar: '' } : null));
      showToast('Profile photo removed', 'success');
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  /* ── Add member ──────────────────────────────────────────────── */

  const openAddModal = () => {
    if (planLimits.maxTeamMembers === 1) {
      setUpgradeModalTitle('Unlock Team Collaboration');
      setUpgradeModalDesc('Your Starter plan includes 1 solo seat. Upgrade to the Growth plan (₹3,999/mo) to invite and collaborate with up to 10 team members.');
      setShowUpgradeModal(true);
      return;
    }
    if (allUsers.length >= planLimits.maxTeamMembers) {
      setUpgradeModalTitle('Team Seats Limit Reached (10/10 Members)');
      setUpgradeModalDesc('Your Growth plan includes 10 team members. Upgrade to the Scale plan (₹7,999/mo) for unlimited team seats with granular RBAC permissions.');
      setShowUpgradeModal(true);
      return;
    }
    setForm({ ...emptyForm(), password: generatePassword() });
    setCreatedCreds(null);
    setShowAddModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planLimits.maxTeamMembers === 1) {
      setShowUpgradeModal(true);
      showToast('Team collaboration requires Growth plan', 'info');
      return;
    }
    if (allUsers.length >= planLimits.maxTeamMembers) {
      setShowUpgradeModal(true);
      showToast('Team limit reached (10 max). Upgrade to Scale for unlimited seats.', 'info');
      return;
    }
    if (!form.name || !form.email || !form.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!isValidEmail(form.email)) {
      showToast('Please enter a valid email address for the member', 'error');
      return;
    }
    if (form.phone && form.phone.trim()) {
      const phoneCheck = isValidPhone(form.phone);
      if (!phoneCheck.valid) {
        showToast(phoneCheck.error || 'Invalid phone number format', 'error');
        return;
      }
    }
    try {
      setSubmitting(true);
      const roleLabel = CORPORATE_ROLES.find((r) => r.value === form.role)?.label || 'Team Member';
      const finalDesignation = form.designation || roleLabel;
      await addTeamMember({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone ? form.phone.trim() : '',
        designation: finalDesignation,
        role: form.role,
        password: form.password,
        avatar: form.avatar || undefined,
        permissions: form.permissions ?? getDefaultPermissionsForRole(form.role),
      });
      setPage(0);
      setCreatedCreds({ name: form.name, email: form.email, password: form.password });
      showToast(`${form.name} added successfully`, 'success');
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Edit member ─────────────────────────────────────────────── */

  const openEditModal = (user: User) => {
    // Security check: non-admins cannot edit admin/founder accounts or other members
    if (user.role === 'admin' && !isAdmin) {
      showToast('Access denied: You do not have permission to edit an administrator or founder account.', 'error');
      return;
    }
    if (user.id !== currentUser.id && !isAdmin) {
      showToast('Access denied: Only administrators can edit team members.', 'error');
      return;
    }

    setEditingMember(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      designation: user.designation || '',
      role: (user.role as any) || 'team',
      password: '',
      avatar: user.avatar || '',
      permissions: user.permissions && user.permissions.length > 0
        ? user.permissions
        : getDefaultPermissionsForRole(user.role || 'team'),
    });
    setShowEditPwd(false);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (editingMember.role === 'admin' && !isAdmin) {
      showToast('Access denied: Only administrators can edit an administrator account.', 'error');
      return;
    }
    if (editingMember.id !== currentUser.id && !isAdmin) {
      showToast('Access denied: Only administrators can edit other team members.', 'error');
      return;
    }
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.designation.trim()) {
      showToast('Name, Email and Designation are required', 'error');
      return;
    }
    if (!isValidEmail(editForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (editForm.phone && editForm.phone.trim()) {
      const phoneCheck = isValidPhone(editForm.phone);
      if (!phoneCheck.valid) {
        showToast(phoneCheck.error || 'Invalid phone number format', 'error');
        return;
      }
    }
    try {
      setEditSubmitting(true);
      const payload: any = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        designation: editForm.designation.trim(),
        avatar: editForm.avatar || '',
      };
      // Privilege escalation defense: non-admins cannot change roles or permissions
      if (isAdmin) {
        payload.role = editForm.role;
        payload.permissions = editForm.permissions ?? getDefaultPermissionsForRole(editForm.role);
      }
      if (editForm.password.trim().length > 0) {
        if (isAdmin || editingMember.id === currentUser.id) {
          payload.password = editForm.password.trim();
        }
      }

      await updateTeamMember(editingMember.id, payload);

      if (selectedMember?.id === editingMember.id) {
        setSelectedMember((prev) => (prev ? { ...prev, ...payload } : null));
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
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  /* ── Deactivate ──────────────────────────────────────────────── */

  const handleDelete = (user: User) => {
    setMemberToDelete(user);
  };

  const confirmDelete = async () => {
    const user = memberToDelete;
    if (!user) return;
    try {
      setDeleting(user.id);
      await deleteTeamMember(user.id);
      if (selectedMember?.id === user.id) setSelectedMember(null);
      setMemberToDelete(null);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeactivate = (user: User) => {
    setMemberToDeactivate(user);
  };

  const confirmDeactivate = async () => {
    const user = memberToDeactivate;
    if (!user) return;
    try {
      setDeactivating(user.id);
      await deactivateTeamMember(user.id);
      showToast(`${user.name} has been deactivated`, 'success');
      if (selectedMember?.id === user.id) setSelectedMember(null);
      setMemberToDeactivate(null);
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>Team</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Manage your team members, roles and brand assignments
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {planLimits.maxTeamMembers !== Infinity && (
            <span
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: (planLimits.maxTeamMembers === 1 || allUsers.length >= planLimits.maxTeamMembers) ? 'var(--warn-bg, #fffbeb)' : 'var(--bg-subtle, #f1f5f9)',
                color: (planLimits.maxTeamMembers === 1 || allUsers.length >= planLimits.maxTeamMembers) ? 'var(--warn-text, #92400e)' : 'var(--text-secondary, #64748b)',
                border: `1px solid ${(planLimits.maxTeamMembers === 1 || allUsers.length >= planLimits.maxTeamMembers) ? 'var(--warn-border, #fde68a)' : 'var(--border, #e2e8f0)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{allUsers.length} / {planLimits.maxTeamMembers === 1 ? '1 Solo Seat (Starter)' : `${planLimits.maxTeamMembers} Seats (Growth)`}</span>
              {(planLimits.maxTeamMembers === 1 || allUsers.length >= planLimits.maxTeamMembers) && (
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeModalTitle(planLimits.maxTeamMembers === 1 ? 'Unlock Team Collaboration' : 'Upgrade to Scale');
                    setUpgradeModalDesc(planLimits.maxTeamMembers === 1 ? 'Upgrade to Growth (₹3,999/mo) to collaborate with up to 10 team members.' : 'Upgrade to Scale (₹7,999/mo) for unlimited team seats.');
                    setShowUpgradeModal(true);
                  }}
                  style={{ background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 12, padding: '2px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                >
                  Upgrade
                </button>
              )}
            </span>
          )}
          {canManageTeam && (
            <button onClick={openAddModal} className="w-fit self-start sm:self-auto" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              <UserPlus style={{ width: 16, height: 16 }} /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Members"  value={totalMembers}    icon={<Users style={{ width: 18, height: 18 }} />} />
        <StatCard label="Active Members" value={activeMembers}   icon={<UserCheck style={{ width: 18, height: 18 }} />} accent="var(--success-text)" />
        <StatCard label="Admins & HR"    value={adminHrCount}    icon={<Shield style={{ width: 18, height: 18 }} />} accent="var(--info-text)" />
        <StatCard label="Team Members"   value={teamMemberCount} icon={<Briefcase style={{ width: 18, height: 18 }} />} accent="var(--warn-text)" />
      </div>

      {/* Table */}
      <TeamTable
        users={pagedTeamUsers}
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
        canManage={canManageTeam}
        deactivatingId={deactivating}
        getBrandCount={getBrandCount}
        onView={setSelectedMember}
        onEdit={openEditModal}
        onDeactivate={handleDeactivate}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={teamCount}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(0);
        }}
      />

      {/* Drawer */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDrawer
            key={selectedMember.id}
            member={selectedMember}
            isAdmin={isAdmin}
            canManage={canManageTeam}
            assignedBrands={getAssignedBrands(selectedMember.id)}
            updatingAvatar={updatingAvatar}
            onClose={() => setSelectedMember(null)}
            onEdit={openEditModal}
            onAvatarChange={handleUpdateAvatar}
            onAvatarRemove={handleRemoveAvatar}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddMemberModal
        open={showAddModal}
        form={form}
        onFormChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMember}
        submitting={submitting}
        createdCreds={createdCreds}
        onPickFile={(file) => pickPhoto(file, (url) => setForm((prev) => ({ ...prev, avatar: url })))}
      />

      <EditMemberModal
        open={showEditModal}
        member={editingMember}
        form={editForm}
        isAdmin={isAdmin}
        onFormChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => { setShowEditModal(false); setEditingMember(null); }}
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
        showPassword={showEditPwd}
        onTogglePassword={() => setShowEditPwd((v) => !v)}
        onPickFile={(file) => pickPhoto(file, (url) => setEditForm((prev) => ({ ...prev, avatar: url })))}
      />


      {/* Delete confirmation dialog */}
      {memberToDelete && (
        <AlertDialog open onOpenChange={(o) => { if (!o && !deleting) setMemberToDelete(null); }}>
          <AlertDialogPopup from="bottom">
            <AlertDialogHeader>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Trash2 style={{ width: 19, height: 19 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <AlertDialogTitle>Permanently delete {memberToDelete.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this member's account, their login access, and assignments.
                    Tasks and expenses associated with them will be unassigned. This action cannot be undone.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={Boolean(deleting)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={Boolean(deleting)}
                style={{
                  background: 'var(--danger-text)',
                  color: 'var(--solid-btn-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: deleting ? 0.7 : 1,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
                Yes, Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}

      {/* Deactivate confirmation — animated alert dialog */}
      {memberToDeactivate && (
        <AlertDialog open onOpenChange={(o) => { if (!o && !deactivating) setMemberToDeactivate(null); }}>
          <AlertDialogPopup from="bottom">
            <AlertDialogHeader>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <UserX style={{ width: 19, height: 19 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <AlertDialogTitle>Deactivate {memberToDeactivate.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    They will no longer be able to log in. Their historical records and
                    assigned clients are kept intact.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={Boolean(deactivating)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeactivate}
                disabled={Boolean(deactivating)}
                style={{
                  background: 'var(--danger-text)',
                  color: 'var(--solid-btn-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: deactivating ? 0.7 : 1,
                  cursor: deactivating ? 'not-allowed' : 'pointer',
                }}
              >
                {deactivating && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
                Yes, Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}

      <PlanUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={upgradeModalTitle}
        description={upgradeModalDesc}
      />

      <ImageCropperModal
        open={Boolean(cropImageSrc)}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={() => {
          setCropImageSrc(null);
          cropCallbackRef.current = null;
        }}
        title="Crop Member Photo"
      />
    </div>
  );
};

export default TeamManager;
