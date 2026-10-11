import React, { useRef, useEffect } from 'react';
import { X, Camera, Eye, EyeOff } from 'lucide-react';
import type { User } from '../../types';
import { useConfirm } from '../../hooks/useConfirm';
import { isDirty } from '../../hooks/isDirty';

export interface EditMemberForm {
  name: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  password: string;
  avatar: string;
}

interface Props {
  open: boolean;
  member: User | null;
  form: EditMemberForm;
  onFormChange: (patch: Partial<EditMemberForm>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onPickFile: (file: File) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10,
  fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' };

/** Edit-member modal, including optional password reset. */
export const EditMemberModal: React.FC<Props> = ({
  open, member, form, onFormChange, onClose, onSubmit,
  submitting, showPassword, onTogglePassword, onPickFile,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, element: confirmDialog } = useConfirm();
  const baseline = useRef<EditMemberForm | null>(null);

  useEffect(() => {
    if (open) baseline.current = form;
    else baseline.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const requestClose = async () => {
    if (submitting) return;
    if (baseline.current && isDirty(form as any, baseline.current as any)) {
      const ok = await confirm({
        title: 'Discard unsaved changes?',
        description: 'Your edits to this team member will be lost.',
        confirmText: 'Discard Changes',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!open || !member) return null;

  return (
    <>
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Edit Team Member</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Update profile details, role, or reset the login password.
            </p>
          </div>
          <button onClick={requestClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {form.avatar ? (
                <img src={form.avatar} alt="Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-focus)' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-raised)', border: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Camera style={{ width: 24, height: 24 }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Change photo
                </button>
                {form.avatar && (
                  <button type="button" onClick={() => onFormChange({ avatar: '' })}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-text)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    Remove photo
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ''; }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={form.name} onChange={(e) => onFormChange({ name: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => onFormChange({ email: e.target.value })} style={inputStyle} />
            </div>

            <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => onFormChange({ phone: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Designation</label>
                <input type="text" value={form.designation} onChange={(e) => onFormChange({ designation: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={(e) => onFormChange({ role: e.target.value })} style={inputStyle}>
                <option value="team">Team Member</option>
                <option value="hr">HR Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Password reset */}
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Reset Password</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Leave blank to keep the current password unchanged.
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  placeholder="New password (min 8 characters)"
                  onChange={(e) => onFormChange({ password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: 40, fontFamily: 'monospace' }}
                />
                <button type="button" onClick={onTogglePassword}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 26px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: 'var(--bg-card)' }}>
            <button type="button" onClick={requestClose}
              style={{ padding: '10px 18px', background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ padding: '10px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {confirmDialog}
    </>
  );
};

export default EditMemberModal;
