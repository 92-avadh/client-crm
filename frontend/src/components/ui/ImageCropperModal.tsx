import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, X, Upload } from 'lucide-react';

interface ImageCropperModalProps {
  open: boolean;
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  outputSize?: number;
}

const PREVIEW_SIZE = 300;

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  open,
  imageSrc,
  onCropComplete,
  onCancel,
  title = 'Drag the image to adjust',
  outputSize = 400,
}) => {
  const [activeSrc, setActiveSrc] = useState<string | null>(imageSrc);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize incoming imageSrc
  useEffect(() => {
    setActiveSrc(imageSrc);
  }, [imageSrc]);

  // Load image when activeSrc changes
  useEffect(() => {
    if (!activeSrc) {
      setImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = activeSrc;
  }, [activeSrc]);

  // Handle escape and enter keys
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel, image, scale, rotation, offset]);

  // Redraw preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Center of canvas + pan offset
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Compute base draw size preserving aspect ratio
    const imgAspect = image.width / image.height;
    let baseW = width;
    let baseH = height;

    if (imgAspect > 1) {
      baseH = height;
      baseW = height * imgAspect;
    } else {
      baseW = width;
      baseH = width / imgAspect;
    }

    const drawW = baseW * scale;
    const drawH = baseH * scale;

    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [image, scale, rotation, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Pointer drag controls
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    offsetStart.current = { ...offset };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setScale((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  // Handle re-uploading file directly in the cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image exceeds the 5 MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setActiveSrc(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Crop & Export
  const handleSave = () => {
    if (!image) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = outputSize;
    exportCanvas.height = outputSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Map offset from preview canvas (PREVIEW_SIZE x PREVIEW_SIZE) to outputSize
    const factor = outputSize / PREVIEW_SIZE;

    ctx.translate(outputSize / 2 + offset.x * factor, outputSize / 2 + offset.y * factor);
    ctx.rotate((rotation * Math.PI) / 180);

    const imgAspect = image.width / image.height;
    let baseW = outputSize;
    let baseH = outputSize;

    if (imgAspect > 1) {
      baseH = outputSize;
      baseW = outputSize * imgAspect;
    } else {
      baseW = outputSize;
      baseH = outputSize / imgAspect;
    }

    const drawW = baseW * scale;
    const drawH = baseH * scale;

    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);

    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.90);
    onCropComplete(croppedDataUrl);
  };

  if (!open || !activeSrc) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card, #111b21)',
          borderRadius: 16,
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(94vh, 520px)',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Hidden re-upload input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp,image/gif"
          style={{ display: 'none' }}
        />

        {/* WhatsApp-Style Header Bar */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle, rgba(0, 0, 0, 0.2))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              title="Close (Esc)"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 6,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #94a3b8)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary, #ffffff)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={18} />
            </button>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary, #f1f5f9)',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Choose different photo"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary, #ffffff)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary, #94a3b8)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
        </div>

        {/* Viewport Canvas Stage */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 20px',
            background: '#090d16',
            userSelect: 'none',
          }}
        >
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handlePointerUp}
            style={{
              position: 'relative',
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#04070d',
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          >
            {/* Realtime Canvas */}
            <canvas
              ref={canvasRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              style={{ display: 'block', width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            />

            {/* Circular Vignette Mask */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                borderRadius: '50%',
                margin: 12,
                border: '2px solid rgba(255, 255, 255, 0.85)',
              }}
            />

            {/* Subtle Rule-of-Thirds Grid */}
            <div
              style={{
                position: 'absolute',
                inset: 12,
                borderRadius: '50%',
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                border: '1px dashed rgba(255, 255, 255, 0.22)',
              }}
            >
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.18)', borderBottom: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.18)', borderBottom: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.18)', borderBottom: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.18)', borderBottom: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.18)' }} />
              <div style={{ borderRight: '1px dashed rgba(255,255,255,0.18)' }} />
              <div />
            </div>

            {/* WhatsApp-Style Floating Zoom Pill (Top-Right inside stage) */}
            <div
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setScale((s) => Math.min(3, +(s + 0.15).toFixed(2)));
                }}
                disabled={scale >= 3}
                title="Zoom in"
                style={{
                  width: 32,
                  height: 32,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  color: scale >= 3 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                  cursor: scale >= 3 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setScale((s) => Math.max(1, +(s - 0.15).toFixed(2)));
                }}
                disabled={scale <= 1}
                title="Zoom out"
                style={{
                  width: 32,
                  height: 32,
                  background: 'transparent',
                  border: 'none',
                  color: scale <= 1 ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                  cursor: scale <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp-Style Non-Scrolling Bottom Dock */}
        <div
          style={{
            padding: '10px 18px 14px',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            background: 'var(--bg-subtle, rgba(0, 0, 0, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Left Actions: Rotate & Reset & Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90 degrees"
              style={{
                background: 'var(--bg-raised, rgba(255, 255, 255, 0.06))',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary, #ffffff)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'background 0.15s',
              }}
            >
              <RotateCw size={13} />
              <span>Rotate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScale(1);
                setRotation(0);
                setOffset({ x: 0, y: 0 });
              }}
              title="Reset zoom & position"
              style={{
                background: 'var(--bg-raised, rgba(255, 255, 255, 0.06))',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'background 0.15s',
              }}
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 60, maxWidth: 120 }}>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                title={`Zoom: ${Math.round(scale * 100)}%`}
                style={{
                  width: '100%',
                  accentColor: '#10B981',
                  cursor: 'pointer',
                  height: 4,
                }}
              />
            </div>
          </div>

          {/* Right Action: Prominent Circular Green Checkmark Button */}
          <button
            type="button"
            onClick={handleSave}
            title="Save Photo (Enter)"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: '#10B981',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
              transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s, box-shadow 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.background = '#059669';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#10B981';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.45)';
            }}
          >
            <Check size={24} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </div>
  );
};
