import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { AVATAR_PRESETS } from './teamUi';
import { useConfirm } from '../../hooks/useConfirm';
import { isDirty } from '../../hooks/isDirty';
import { AnimatedSelect } from '../ui/AnimatedSelect';

export interface AddMemberForm {
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
  form: AddMemberForm;
  onFormChange: (patch: Partial<AddMemberForm>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  createdCreds: { name: string; email: string; password: string } | null;
  onPickFile: (file: File) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10,
  fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' };

/** Add-member modal, including the post-create credentials panel. */
export const AddMemberModal: React.FC<Props> = ({
  open, form, onFormChange, onClose, onSubmit, submitting, createdCreds, onPickFile,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { confirm, element: confirmDialog } = useConfirm();
  const baseline = useRef<AddMemberForm | null>(null);

  useEffect(() => {
    if (open) baseline.current = form;
    else baseline.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Once credentials are shown, closing is the intended action — no guard.
  const requestClose = async () => {
    if (submitting || createdCreds) { onClose(); return; }
    if (baseline.current && isDirty(form as any, baseline.current as any)) {
      const ok = await confirm({
        title: 'Discard this new member?',
        description: 'The profile details you entered have not been saved yet.',
        confirmText: 'Discard',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  if (!open) return null;

  const copy = (value: string, key: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <>
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {createdCreds ? '✅ Member Added!' : 'Add Team Member'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {createdCreds ? 'Share these login credentials with the new member' : 'Create profile & login credentials for a new team member'}
            </p>
          </div>
          <button onClick={requestClose} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {createdCreds ? (
          <div style={{ padding: 26, overflowY: 'auto' }}>
            <div style={{ background: 'var(--success-bg)', border: '1.5px solid var(--success-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success-text)', marginBottom: 14 }}>
                Credentials for <span style={{ color: 'var(--text-primary)' }}>{createdCreds.name}</span>
              </div>
              {[
                { label: 'Email', value: createdCreds.email, key: 'email' },
                { label: 'Password', value: createdCreds.password, key: 'pwd' },
              ].map(({ label, value, key }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, background: 'var(--bg-card)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{value}</div>
                  </div>
                  <button onClick={() => copy(value, key)}
                    style={{ background: copied === key ? 'var(--success-bg)' : 'var(--bg-raised)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: copied === key ? 'var(--success-text)' : 'var(--text-primary)' }}>
                    {copied === key ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copied === key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--warn-text)', background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '8px 12px', marginBottom: 20 }}>
              ⚠️ Save these credentials now — the password won't be shown again.
            </div>
            <button onClick={requestClose} style={{ width: '100%', padding: 12, background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              {/* Photo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>
                  Profile Photo <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onPickFile(f); }}
                  style={{ border: isDragging ? '2px dashed var(--border-focus)' : '1.5px dashed var(--border-strong)', background: isDragging ? 'var(--bg-raised)' : 'var(--bg-subtle)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s ease' }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {form.avatar ? (
                      <img src={form.avatar} alt="Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-focus)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'block' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-raised)', border: '1.5px dashed var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Camera style={{ width: 24, height: 24 }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Choose file
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag & drop or click · JPG/PNG/WebP · max 5MB</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ''; }} />
                </div>

                {/* Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Quick picks:</span>
                  {AVATAR_PRESETS.map((url, i) => (
                    <img key={i} src={url} alt={`Preset ${i + 1}`}
                      onClick={() => onFormChange({ avatar: url })}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: form.avatar === url ? '2px solid var(--border-focus)' : '1px solid var(--border)' }} />
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" value={form.name} required onChange={(e) => onFormChange({ name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" value={form.email} required onChange={(e) => onFormChange({ email: e.target.value })} style={inputStyle} />
              </div>
              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => onFormChange({ phone: e.target.value })} style={inputStyle} />
                </div>
                <AnimatedSelect
                  label="Role"
                  required
                  value={form.role}
                  onChange={(v) => onFormChange({ role: v })}
                  options={[
                    { value: 'team', label: 'Team Member' },
                    { value: 'hr', label: 'HR Manager' },
                  ]}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Designation</label>
                <input type="text" value={form.designation} placeholder="e.g. Senior Account Manager"
                  onChange={(e) => onFormChange({ designation: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Temporary Password *</label>
                <input type="text" value={form.password} required onChange={(e) => onFormChange({ password: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'monospace' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles style={{ width: 11, height: 11 }} /> Auto-generated — share it with the member after saving.
                </span>
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
                {submitting ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    {confirmDialog}
    </>
  );
};

export default AddMemberModal;
