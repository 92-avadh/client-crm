import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { getNaturalErrorMessage } from '../../services/errors';
import type { User } from '../../types';
import { Users, UserPlus, UserCheck, Shield, Briefcase, UserX, Loader2 } from 'lucide-react';
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
  } = useApp() as any;
  const isAdmin = currentUser.role === 'admin';
  const canManageTeam = isAdmin || currentUser.role === 'hr' || (currentUser.permissions && currentUser.permissions.includes('team'));

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

  const pickPhoto = async (file: File, apply: (dataUrl: string) => Promise<void> | void) => {
    const result = await processImageFile(file);
    if (!result.ok) {
      showToast(result.error || 'Could not process that image', 'error');
      return;
    }
    await apply(result.dataUrl!);
  };

  const handleUpdateAvatar = async (file: File) => {
    if (!selectedMember || updatingAvatar) return;
    try {
      setUpdatingAvatar(true);
      await pickPhoto(file, async (dataUrl) => {
        await updateTeamMember(selectedMember.id, { avatar: dataUrl });
        setSelectedMember((prev) => (prev ? { ...prev, avatar: dataUrl } : null));
        showToast('Profile photo updated successfully', 'success');
      });
    } catch (err: any) {
      showToast(getNaturalErrorMessage(err), 'error');
    } finally {
      setUpdatingAvatar(false);
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
    setForm({ ...emptyForm(), password: generatePassword() });
    setCreatedCreds(null);
    setShowAddModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showToast('Please fill all required fields', 'error');
      return;
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
        permissions: editForm.permissions ?? getDefaultPermissionsForRole(editForm.role),
      };
      if (editForm.password.trim().length > 0) payload.password = editForm.password.trim();

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
        {canManageTeam && (
          <button onClick={openAddModal} className="w-fit self-start sm:self-auto" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
            <UserPlus style={{ width: 16, height: 16 }} /> Add Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Members"  value={totalMembers}    icon={<Users style={{ width: 20, height: 20 }} />} />
        <StatCard label="Active Members" value={activeMembers}   icon={<UserCheck style={{ width: 20, height: 20 }} />} accent="var(--success-text)" />
        <StatCard label="Admins & HR"    value={adminHrCount}    icon={<Shield style={{ width: 20, height: 20 }} />} accent="var(--info-text)" />
        <StatCard label="Team Members"   value={teamMemberCount} icon={<Briefcase style={{ width: 20, height: 20 }} />} accent="var(--warn-text)" />
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
        onFormChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => { setShowEditModal(false); setEditingMember(null); }}
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
        showPassword={showEditPwd}
        onTogglePassword={() => setShowEditPwd((v) => !v)}
        onPickFile={(file) => pickPhoto(file, (url) => setEditForm((prev) => ({ ...prev, avatar: url })))}
      />

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
    </div>
  );
};

export default TeamManager;
