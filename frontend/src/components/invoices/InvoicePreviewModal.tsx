import React, { useState } from 'react';
import { X, Printer, Share2, Sparkles, Check, FileSpreadsheet } from 'lucide-react';
import type { Invoice, AppSettings, Brand } from '../../types';
import { btnSecondary, modalOverlay, modalCard } from './invoiceStyles';
import type { SwipeTemplateId } from './SwipeInvoiceTemplates';
import {
  SwipeModernTemplate,
  SwipeClassicFramedTemplate,
  SwipeVibrantNavyTemplate,
  SwipeExecutiveCardTemplate,
} from './SwipeInvoiceTemplates';

interface Props {
  invoice: Invoice | null;
  settings: AppSettings;
  brand?: Brand;
  onClose: () => void;
  onWhatsApp: (inv: Invoice) => void;
}

const TEMPLATE_OPTIONS: Array<{
  id: SwipeTemplateId;
  label: string;
  badge: string;
  desc: string;
}> = [
  { id: 'modern', label: 'Modern Clean', badge: 'DMart / Amazon', desc: 'Minimalist hairline GST layout with instant QR' },
  { id: 'classic', label: 'Classic Framed', badge: 'Tata Motors', desc: 'Outer boxed grid with dedicated HSN/SAC table' },
  { id: 'navy', label: 'Vibrant Navy', badge: 'Samsung', desc: 'Solid deep navy header bar & compact two-column' },
  { id: 'executive', label: 'Executive Card', badge: 'Marico', desc: 'Tinted metadata card & receiver acknowledgment' },
];

/**
 * High-Fidelity Swipe-Inspired Tax Invoice Document Modal
 */
export const InvoicePreviewModal: React.FC<Props> = ({
  invoice,
  settings,
  brand,
  onClose,
  onWhatsApp,
}) => {
  const [activeTemplate, setActiveTemplate] = useState<SwipeTemplateId>(() => {
    const saved = localStorage.getItem('retentio_invoice_template');
    if (saved && ['modern', 'classic', 'navy', 'executive'].includes(saved)) {
      return saved as SwipeTemplateId;
    }
    return 'modern';
  });

  if (!invoice) return null;

  const handleSelectTemplate = (tmplId: SwipeTemplateId) => {
    setActiveTemplate(tmplId);
    try {
      localStorage.setItem('retentio_invoice_template', tmplId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        style={{
          ...modalCard,
          maxWidth: 900,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls Bar (Hidden during Print) */}
        <div
          className="no-print"
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Invoice Number and Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet style={{ width: 16, height: 16, color: 'var(--accent-text)' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                Tax Invoice
              </span>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                color: 'var(--accent-text)',
                fontWeight: 700,
                fontSize: 12,
                background: 'var(--bg-raised)',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
              }}
            >
              {invoice.invoiceNumber}
            </span>
          </div>

          {/* Center: Template Picker Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-raised)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            {TEMPLATE_OPTIONS.map((opt) => {
              const isSelected = activeTemplate === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTemplate(opt.id)}
                  title={`${opt.label} (${opt.badge}) — ${opt.desc}`}
                  style={{
                    border: 'none',
                    background: isSelected ? 'var(--solid-btn-bg, #2563eb)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 11.5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && <Check style={{ width: 12, height: 12 }} />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                ...btnSecondary,
                fontSize: 12,
                background: 'var(--bg-raised)',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Printer style={{ width: 14, height: 14 }} />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onWhatsApp(invoice)}
              style={{
                ...btnSecondary,
                fontSize: 12,
                background: 'var(--bg-raised)',
                color: 'var(--success-text)',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Share2 style={{ width: 14, height: 14 }} />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Preview"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Scrollable Container with White Paper Sheet Preview */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            background: 'var(--bg-canvas, #090d16)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            className="printable-invoice"
            style={{
              width: '100%',
              maxWidth: 800,
              background: '#ffffff',
              borderRadius: 6,
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
          >
            {activeTemplate === 'modern' && (
              <SwipeModernTemplate invoice={invoice} settings={settings} brand={brand} />
            )}
            {activeTemplate === 'classic' && (
              <SwipeClassicFramedTemplate invoice={invoice} settings={settings} brand={brand} />
            )}
            {activeTemplate === 'navy' && (
              <SwipeVibrantNavyTemplate invoice={invoice} settings={settings} brand={brand} />
            )}
            {activeTemplate === 'executive' && (
              <SwipeExecutiveCardTemplate invoice={invoice} settings={settings} brand={brand} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
