import React, { useState } from 'react';
import { Upload, RotateCcw, AlertCircle, PenTool, Stamp, Info } from 'lucide-react';
import { validateImageFile } from '../../utils/fileValidation';

interface SignatoryAssetsFieldsProps {
  signatureUrl?: string;
  stampUrl?: string;
  companyName?: string;
  onChangeSignature: (url: string) => void;
  onChangeStamp: (url: string) => void;
}

/**
 * Reusable Authorized Signature & Company Stamp uploader cards for Settings.
 * Used in both Agency Profile and Invoice Design tabs so assets stay in sync.
 */
export const SignatoryAssetsFields: React.FC<SignatoryAssetsFieldsProps> = ({
  signatureUrl,
  stampUrl,
  companyName,
  onChangeSignature,
  onChangeStamp,
}) => {
  const [sigError, setSigError] = useState('');
  const [stampError, setStampError] = useState('');

  const handleImagePick = (
    file: File | undefined,
    setError: (msg: string) => void,
    onSuccess: (dataUrl: string) => void
  ) => {
    if (!file) return;
    setError('');
    const validation = validateImageFile(file, { maxSizeMB: 3, allowSvg: true });
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError('Could not read image file. Please try another.');
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) onSuccess(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Authorized Signature Uploader */}
      <div
        style={{
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          background: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 96,
              height: 54,
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              overflow: 'hidden',
            }}
          >
            {signatureUrl ? (
              <img
                src={signatureUrl}
                alt="Authorized Signature"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textAlign: 'center', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <PenTool size={12} /> Default Sig
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {signatureUrl ? 'Custom Authorized Signature Active' : 'Authorized Signature (Default Script)'}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Upload a transparent PNG of your handwritten signature. Appears first on invoices with your stamp overlapping it.
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <Info size={11} style={{ color: 'var(--brand-green, #10b981)' }} />
              Transparent PNG recommended (max 3MB)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label
            title="Upload your handwritten signature image"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              background: 'var(--solid-btn-bg, #0f172a)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Upload size={13} />
            <span>{signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                handleImagePick(e.target.files?.[0], setSigError, onChangeSignature);
                e.target.value = '';
              }}
            />
          </label>
          {signatureUrl && (
            <button
              type="button"
              onClick={() => {
                setSigError('');
                onChangeSignature('');
              }}
              title="Revert to default signature style"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--danger-text, #ef4444)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          {sigError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger-text, #ef4444)', fontSize: 11, fontWeight: 600 }}>
              <AlertCircle size={13} />
              <span>{sigError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Company Stamp Uploader */}
      <div
        style={{
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          background: 'var(--bg-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 96,
              height: 54,
              borderRadius: 8,
              background: '#ffffff',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              overflow: 'hidden',
            }}
          >
            {stampUrl ? (
              <img
                src={stampUrl}
                alt="Company Stamp"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textAlign: 'center', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Stamp size={12} /> {(companyName || 'Seal').slice(0, 10)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {stampUrl ? 'Custom Company Stamp Active' : 'Company Stamp / Seal (Default Circular Seal)'}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Upload your company rubber stamp (PNG). Rendered overlapping your signature (~50%) in the Authorized Signatory block.
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <Info size={11} style={{ color: 'var(--brand-green, #10b981)' }} />
              Transparent PNG recommended (max 3MB)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label
            title="Upload your company rubber stamp image"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              background: 'var(--solid-btn-bg, #0f172a)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Upload size={13} />
            <span>{stampUrl ? 'Change Stamp' : 'Upload Stamp'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                handleImagePick(e.target.files?.[0], setStampError, onChangeStamp);
                e.target.value = '';
              }}
            />
          </label>
          {stampUrl && (
            <button
              type="button"
              onClick={() => {
                setStampError('');
                onChangeStamp('');
              }}
              title="Revert to default circular company seal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--danger-text, #ef4444)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          {stampError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger-text, #ef4444)', fontSize: 11, fontWeight: 600 }}>
              <AlertCircle size={13} />
              <span>{stampError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
