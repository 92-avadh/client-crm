import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, X } from 'lucide-react';

interface ImageCropperModalProps {
  open: boolean;
  imageSrc: string | null;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  outputSize?: number;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  open,
  imageSrc,
  onCropComplete,
  onCancel,
  title = 'Crop Profile Photo',
  outputSize = 400,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
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
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

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
    // Center of canvas
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Compute base draw size preserving aspect ratio
    const imgAspect = image.width / image.height;
    let baseW = width;
    let baseH = height;

    if (imgAspect > 1) {
      // Landscape: fit height to box so circle is covered
      baseH = height;
      baseW = height * imgAspect;
    } else {
      // Portrait: fit width to box
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

    // Map offset from preview canvas (280x280) to outputSize
    const previewSize = 280;
    const factor = outputSize / previewSize;

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

  if (!open || !imageSrc) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Drag to reposition, zoom or rotate to frame your photo
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'var(--bg-raised)',
              border: 'none',
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Viewport */}
        <div
          style={{
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
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
              width: 280,
              height: 280,
              borderRadius: 14,
              overflow: 'hidden',
              background: '#090d16',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            {/* Realtime Canvas */}
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              style={{ display: 'block', width: 280, height: 280 }}
            />

            {/* Circular Vignette Mask */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.58)',
                borderRadius: '50%',
                margin: 14,
                border: '2px solid rgba(255, 255, 255, 0.85)',
              }}
            />

            {/* Subtle grid lines inside crop circle */}
            <div
              style={{
                position: 'absolute',
                inset: 14,
                borderRadius: '50%',
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                border: '1px dashed rgba(255,255,255,0.25)',
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
          </div>

          {/* Controls: Zoom & Rotate & Reset */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(1, +(s - 0.1).toFixed(2)))}
                disabled={scale <= 1}
                title="Zoom out"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: scale <= 1 ? 'not-allowed' : 'pointer',
                  opacity: scale <= 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                <ZoomOut size={14} />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--brand-green, #059639)', cursor: 'pointer' }}
              />

              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)))}
                disabled={scale >= 3}
                title="Zoom in"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: scale >= 3 ? 'not-allowed' : 'pointer',
                  opacity: scale >= 3 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RotateCw size={13} /> Rotate 90°
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setRotation(0);
                    setOffset({ x: 0, y: 0 });
                  }}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} /> Reset
                </button>
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'var(--bg-subtle)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-raised)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--solid-btn-bg)',
              color: 'var(--solid-btn-text)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            <Check size={14} /> Apply &amp; Save Photo
          </button>
        </div>
      </div>
    </div>
  );
};

