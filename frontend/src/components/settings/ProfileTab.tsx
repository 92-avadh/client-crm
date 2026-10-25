import React, { useRef, useState, useEffect } from 'react';
import { Save, Camera, Loader2, Trash2, UploadCloud, Send, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AppSettings, User } from '../../types';
import { fieldStyle, saveBtnStyle, tabBodyStyle, TabHeader, ToggleRow } from './settingsUi';
import { processImageFile } from '../team/imageUtils';
import { AVATAR_PRESETS } from '../team/teamUi';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  User Profile tab                                                   */
/* ------------------------------------------------------------------ */
interface ProfileProps {
  currentUser: User;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  onProfileChange: (patch: { name?: string; email?: string; phone?: string }) => void;
  onAvatarChange: (dataUrl: string) => Promise<void>;
  onSave: (e: React.FormEvent) => void;
  saving?: boolean;
}

export const ProfileTab: React.FC<ProfileProps> = ({
  currentUser, profileName, profileEmail, profilePhone, onProfileChange, onAvatarChange, onSave, saving,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);
  const [photoAction, setPhotoAction] = useState<'uploading' | 'removing' | null>(null);

  const [photoError, setPhotoError] = useState('');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isBusy = Boolean(photoAction);

  // Close photo menu on outside click
  useEffect(() => {
    if (!showPhotoMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPhotoMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPhotoMenu]);

  // Pressing Escape dismisses the drag overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDragging(false);
        dragCounterRef.current = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFile = async (file: File) => {
    if (photoAction) return; // Prevent multiple clicks and race conditions
    setPhotoAction('uploading');
    setPhotoError('');
    try {
      const res = await processImageFile(file);
      if (res.ok && res.dataUrl) {
        await onAvatarChange(res.dataUrl);
      } else if (res.error) {
        setPhotoError(res.error);
      }
    } catch {
      setPhotoError('Could not process that image');
    } finally {
      setPhotoAction(null);
    }
  };

  const handleRemovePhoto = async () => {
    if (photoAction) return; // Prevent multiple clicks and race conditions
    setPhotoAction('removing');
    setPhotoError('');
    setShowPhotoMenu(false);
    try {
      await onAvatarChange('');
    } catch {
      setPhotoError('Could not remove photo');
    } finally {
      setPhotoAction(null);
    }
  };

  const handlePresetSelect = async (url: string) => {
    if (photoAction || currentUser.avatar === url) return;
    setPhotoAction('uploading');
    setPhotoError('');
    try {
      await onAvatarChange(url);
    } catch {
      setPhotoError('Could not update photo');
    } finally {
      setPhotoAction(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (isBusy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      style={{
        ...tabBodyStyle,
        position: 'relative',
        minHeight: 460,
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-screen loader overlay */}
      {isBusy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeIn 0.15s ease-out',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: '24px 36px',
              borderRadius: 18,
              background: 'var(--bg-card, #141414)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.14)',
                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22c55e',
              }}
            >
              <Loader2 style={{ width: 28, height: 28 }} className="animate-spin" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
              {photoAction === 'removing' ? 'Removing photo…' : 'Updating profile photo…'}
            </span>
          </div>
        </div>
      )}

      {/* Immersive full-panel drag & drop overlay matching user's reference */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 6,
            borderRadius: 24,
            border: isBusy ? '2.5px dashed #f59e0b' : '2.5px dashed #22c55e',
            background: isBusy ? 'rgba(30, 24, 6, 0.96)' : 'rgba(6, 44, 30, 0.96)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: isBusy ? 'rgba(245, 158, 11, 0.16)' : 'rgba(34, 197, 94, 0.16)',
              border: isBusy ? '2px solid rgba(245, 158, 11, 0.35)' : '2px solid rgba(34, 197, 94, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isBusy ? '#fbbf24' : '#4ade80',
            }}
          >
            {isBusy ? (
              <Loader2 style={{ width: 36, height: 36 }} className="animate-spin" />
            ) : (
              <UploadCloud style={{ width: 36, height: 36 }} />
            )}
          </div>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <h3
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: isBusy ? '#fbbf24' : '#4ade80',
                letterSpacing: '-0.02em',
                margin: 0,
                fontFamily: 'inherit',
              }}
            >
              {isBusy ? 'Photo update in progress…' : 'Drag file here'}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.75)',
                marginTop: 6,
                marginBottom: 0,
                fontWeight: 500,
              }}
            >
              {isBusy
                ? 'Please wait until the update completes before uploading another photo'
                : 'Drop your photo (JPG, PNG or WebP) anywhere to update profile picture'}
            </p>
          </div>
        </div>
      )}

      <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              draggable={false}
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                objectFit: 'cover',
                border: '1.5px solid var(--border-strong)',
                pointerEvents: 'none',
                filter: isBusy ? 'blur(1px) brightness(0.6)' : 'none',
                transition: 'filter 0.2s ease',
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--brand-green, #059639), #047857)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 800,
                border: '1.5px solid var(--border-strong)',
                userSelect: 'none',
                filter: isBusy ? 'blur(1px) brightness(0.6)' : 'none',
                transition: 'filter 0.2s ease',
              }}
            >
              {(currentUser.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Full avatar loading overlay */}
          {isBusy && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 14,
                background: 'rgba(6, 26, 18, 0.82)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                zIndex: 10,
                boxShadow: 'inset 0 0 0 1.5px rgba(34, 197, 94, 0.45)',
                animation: 'fadeIn 0.15s ease-out',
                pointerEvents: 'auto',
                cursor: 'not-allowed',
              }}
            >
              <Loader2 style={{ width: 22, height: 22, color: '#4ade80' }} className="animate-spin" />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#86efac' }}>
                {photoAction === 'removing' ? 'Removing' : 'Saving'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPhotoMenu((s) => !s)}
            disabled={isBusy}
            title={isBusy ? 'Processing photo...' : 'Change profile photo'}
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: isBusy ? 'var(--bg-card)' : 'var(--solid-btn-bg)',
              color: isBusy ? '#22c55e' : 'var(--solid-btn-text)',
              border: '2px solid var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
              pointerEvents: isBusy ? 'none' : 'auto',
              zIndex: 12,
              opacity: isBusy ? 0.7 : 1,
            }}
          >
            {isBusy ? (
              <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
            ) : (
              <Camera style={{ width: 12, height: 12 }} />
            )}
          </button>

          {showPhotoMenu && !isBusy && (
            <div ref={menuRef} style={{
              position: 'absolute',
              bottom: -8,
              left: 0,
              transform: 'translateY(100%)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 20,
              minWidth: 180,
              overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => { fileRef.current?.click(); setShowPhotoMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '10px 14px', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-primary)', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Camera style={{ width: 14, height: 14 }} /> Choose from device
              </button>
              {currentUser.avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '10px 14px', fontSize: 12, fontWeight: 600,
                    color: 'var(--danger-text)', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} /> Remove photo
                </button>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            style={{ display: 'none' }}
            disabled={isBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{currentUser.name}</h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 8px' }}>{currentUser.designation || 'Team Member'}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowPhotoMenu((s) => !s)}
              disabled={isBusy}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '5px 12px',
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy && photoAction !== 'uploading' ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              {photoAction === 'uploading' ? (
                <>
                  <Loader2 style={{ width: 12, height: 12 }} className="animate-spin text-emerald-500" />
                  <span>Saving photo…</span>
                </>
              ) : (
                <>
                  <Camera style={{ width: 12, height: 12 }} />
                  <span>Change Photo</span>
                </>
              )}
            </button>

            {currentUser.avatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isBusy}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--danger-text, #ef4444)',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isBusy && photoAction !== 'removing' ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {photoAction === 'removing' ? (
                  <>
                    <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                    <span>Removing…</span>
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: 12, height: 12 }} />
                    <span>Remove Photo</span>
                  </>
                )}
              </button>
            )}

            {photoError && (
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--danger-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span>⚠</span> {photoError}
              </div>
            )}
          </div>

          {/* Quick pick realistic avatars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Quick picks:</span>
            {AVATAR_PRESETS.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Realistic Avatar ${i + 1}`}
                onClick={() => handlePresetSelect(url)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  border: currentUser.avatar === url ? '2.5px solid var(--border-focus)' : '1.5px solid var(--border)',
                  boxShadow: currentUser.avatar === url ? '0 0 0 2px rgba(56, 189, 248, 0.35)' : 'var(--shadow-xs)',
                  transform: currentUser.avatar === url ? 'scale(1.08)' : 'scale(1)',
                  opacity: isBusy ? 0.45 : 1,
                  pointerEvents: isBusy ? 'none' : 'auto',
                  transition: 'all 0.15s ease',
                }}
                title={isBusy ? 'Saving...' : `Select Realistic Avatar ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

    <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Full Name</label>
          <input type="text" value={profileName} onChange={(e) => onProfileChange({ name: e.target.value })} style={fieldStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Email Address</label>
          <input type="email" value={profileEmail} onChange={(e) => onProfileChange({ email: e.target.value })} style={fieldStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Phone Number</label>
          <input type="tel" value={profilePhone} onChange={(e) => onProfileChange({ phone: e.target.value })} style={fieldStyle} />
        </div>
      </div>

      <div>
        <button type="submit" style={saveBtnStyle} disabled={saving || isBusy}>
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);
};

/* ------------------------------------------------------------------ */
/*  Retention & Notifications tab                                      */
/* ------------------------------------------------------------------ */
interface NotificationsProps {
  isAdmin: boolean;
  formData: AppSettings;
  onThresholdChange: (days: number) => void;
  onWhatsAppToggle: (v: boolean) => void;
  onPatchSettings?: (patch: Partial<AppSettings>) => void;
}

export const NotificationsTab: React.FC<NotificationsProps> = ({
  isAdmin, formData, onThresholdChange, onWhatsAppToggle, onPatchSettings,
}) => {
  const { showToast, updateSettings } = useApp();
  const [slackUrl, setSlackUrl] = useState(formData.slackWebhookUrl || '');
  const [discordUrl, setDiscordUrl] = useState(formData.discordWebhookUrl || '');
  const [testingSlack, setTestingSlack] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [savingWebhooks, setSavingWebhooks] = useState(false);

  useEffect(() => {
    setSlackUrl(formData.slackWebhookUrl || '');
    setDiscordUrl(formData.discordWebhookUrl || '');
  }, [formData.slackWebhookUrl, formData.discordWebhookUrl]);

  const handleTest = async (platform: 'slack' | 'discord') => {
    const url = platform === 'slack' ? slackUrl : discordUrl;
    if (!url.trim()) {
      showToast(`Please enter a valid ${platform === 'slack' ? 'Slack' : 'Discord'} webhook URL first`, 'error');
      return;
    }
    if (platform === 'slack') setTestingSlack(true);
    else setTestingDiscord(true);

    try {
      await api.settings.testWebhook({ service: platform, url: url.trim() });
      showToast(`Test notification sent successfully to ${platform === 'slack' ? 'Slack' : 'Discord'}!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || `Failed to dispatch test notification to ${platform}`, 'error');
    } finally {
      if (platform === 'slack') setTestingSlack(false);
      else setTestingDiscord(false);
    }
  };

  const handleSaveWebhooks = async () => {
    setSavingWebhooks(true);
    try {
      await updateSettings({
        slackWebhookUrl: slackUrl.trim(),
        discordWebhookUrl: discordUrl.trim(),
      });
      if (onPatchSettings) {
        onPatchSettings({
          slackWebhookUrl: slackUrl.trim(),
          discordWebhookUrl: discordUrl.trim(),
        });
      }
      showToast('Notification webhooks saved successfully', 'success');
    } catch {
      showToast('Failed to save webhook settings', 'error');
    } finally {
      setSavingWebhooks(false);
    }
  };

  return (
    <div style={tabBodyStyle}>
      <TabHeader
        title="Retention Alert Rules & Channels"
        subtitle="Configure how and when the system alerts team leads about inactive clients and recurring invoice generation."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isAdmin && (
          <div style={{ padding: '18px 20px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Inactivity Warning Threshold (Days)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Trigger warning when no chat, task, meeting or payment is detected for this many days:
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[7, 15, 30, 45].map((d) => (
                <button key={d} type="button" onClick={() => onThresholdChange(d)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: formData.retentionThresholdDays === d ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                    background: formData.retentionThresholdDays === d ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
                    color: formData.retentionThresholdDays === d ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}>
                  {d} Days
                </button>
              ))}
            </div>
          </div>
        )}

        <ToggleRow
          title="WhatsApp Click-to-Share Links"
          description="Enable 1-click WhatsApp messaging for payment reminders & retention re-engagement."
          checked={formData.whatsappClickToShareEnabled}
          onChange={onWhatsAppToggle}
        />

        <ToggleRow
          title="In-App Push & Toast Notifications"
          description="Notify on client assignments, task due dates, and received Razorpay payments."
          checked
          onChange={() => {}}
        />

        {/* External Webhooks: Slack & Discord */}
        {isAdmin && (
          <div style={{ padding: '20px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare style={{ width: 16, height: 16 }} />
                <span>External Notification Webhooks (Slack & Discord)</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Receive automated alerts for recurring invoices, overdue retainers, and at-risk client warnings directly in your agency channels.
              </div>
            </div>

            {/* Slack Webhook */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Slack Incoming Webhook URL</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackUrl}
                  onChange={(e) => setSlackUrl(e.target.value)}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleTest('slack')}
                  disabled={testingSlack || !slackUrl.trim()}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: !slackUrl.trim() ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: !slackUrl.trim() ? 0.6 : 1,
                  }}
                >
                  {testingSlack ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Send style={{ width: 13, height: 13 }} />}
                  <span>Test Slack</span>
                </button>
              </div>
            </div>

            {/* Discord Webhook */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Discord Incoming Webhook URL</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleTest('discord')}
                  disabled={testingDiscord || !discordUrl.trim()}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: !discordUrl.trim() ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: !discordUrl.trim() ? 0.6 : 1,
                  }}
                >
                  {testingDiscord ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Send style={{ width: 13, height: 13 }} />}
                  <span>Test Discord</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={handleSaveWebhooks}
                disabled={savingWebhooks}
                style={{
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {savingWebhooks ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                <span>Save Webhooks</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
