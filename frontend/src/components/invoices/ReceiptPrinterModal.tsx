import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Scissors, Eye, Volume2, VolumeX, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { Invoice, AppSettings, Brand } from '../../types';
import { formatCurrency } from '../../utils/currency';
import './receiptPrinter.css';

interface ReceiptPrinterModalProps {
  open: boolean;
  invoice: Invoice | null;
  brand?: Brand | null;
  settings: AppSettings;
  onClose: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onWhatsApp?: (invoice: Invoice) => void;
}

export const ReceiptPrinterModal: React.FC<ReceiptPrinterModalProps> = ({
  open,
  invoice,
  brand,
  settings,
  onClose,
  onViewInvoice,
  onWhatsApp,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isTorn, setIsTorn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('retentio_receipt_sound') !== 'false';
  });

  const receiptPaperRef = useRef<HTMLDivElement>(null);
  const cutterBladeRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context safely
  const getAudioContext = (): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play realistic mechanical thermal printer hum strictly synced with 2.5s motion
  const playPrinterSound = (durationMs = 2500) => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = durationMs / 1000;

      // Noise buffer for mechanical motor hum
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(3.5, now);

      const gainNode = ctx.createGain();
      const peakGain = 0.045;
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.08);
      gainNode.gain.setValueAtTime(peakGain, now + duration - 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Play realistic mechanical cutter blade slice sound
  const playTearSound = () => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.35;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1400, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Trigger Print Rollout Animation
  const triggerPrint = () => {
    if (isPrinting) return;
    const paper = receiptPaperRef.current;
    const cutter = cutterBladeRef.current;
    if (!paper) return;

    paper.classList.remove('tearing', 'retracted', 'printed', 'printing-smooth');
    if (cutter) cutter.classList.remove('active');

    // Force DOM reflow
    void paper.offsetWidth;

    setIsPrinting(true);
    setIsTorn(false);

    const animDuration = 2500;
    playPrinterSound(animDuration);

    paper.classList.add('printing-smooth');

    setTimeout(() => {
      paper.classList.remove('printing-smooth');
      paper.classList.add('printed');
      setIsPrinting(false);
      setIsPrinted(true);
    }, animDuration);
  };

  // Trigger Cut and Tear-Away Animation
  const triggerTear = () => {
    if (!isPrinted || isPrinting || isTorn) return;
    const paper = receiptPaperRef.current;
    const cutter = cutterBladeRef.current;
    if (!paper) return;

    playTearSound();
    if (cutter) cutter.classList.add('active');
    paper.classList.add('tearing');

    setTimeout(() => {
      setIsTorn(true);
      paper.classList.remove('tearing', 'printed');
      paper.classList.add('retracted');
      if (cutter) cutter.classList.remove('active');
      setIsPrinted(false);
    }, 550);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('retentio_receipt_sound', String(next));
    if (next) getAudioContext();
  };

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Auto-start printing when modal opens with a valid invoice
  useEffect(() => {
    if (open && invoice) {
      setIsPrinting(false);
      setIsPrinted(false);
      setIsTorn(false);
      const timer = setTimeout(() => {
        triggerPrint();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, invoice?.id]);

  if (!open || !invoice) return null;

  const currency = (invoice as any).currency || brand?.currency || settings.currency || 'INR';
  const agencyName = settings.companyName || 'RETENTIO AGENCY';
  const clientName = invoice.brandName || brand?.name || 'Client';
  const isPaid = invoice.status === 'Paid';
  const logoUrl = settings.companyLogo || settings.invoiceDesign?.logoUrl || '/retentio-icon.png';

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-shell animate-fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Header */}
        <div className="receipt-modal-header">
          <div className="receipt-modal-title">
            <span className="receipt-modal-badge">
              <CheckCircle2 size={12} />
              <span>Invoice Generated</span>
            </span>
            <span>Thermal Receipt Dispenser</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className="sound-toggle-btn"
              onClick={toggleSound}
              title={soundEnabled ? 'Mute sound' : 'Enable mechanical sound'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              className="receipt-modal-close-btn"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printer Main Stage */}
        <div className={`printer-stage ${isPrinting ? 'is-printing' : ''} ${isPrinted ? 'has-printed' : ''}`}>
          
          {/* Metallic 3D Dispenser Unit */}
          <div className="machine-unit">
            
            {/* Top Metallic Hood */}
            <div className="machine-hood-top">
              <div className="hood-highlight" />
            </div>

            {/* Dark Slit Mouth */}
            <div className="machine-slot-slit" />

            {/* Cutter Blade Flash Bar */}
            <div ref={cutterBladeRef} className="cutter-blade-flash" />

            {/* Bottom Metallic Lip Base */}
            <div className="machine-hood-bottom">
              <div className="hood-shadow" />
            </div>

            {/* Paper Viewport */}
            <div className="paper-viewport">
              <div
                ref={receiptPaperRef}
                className="receipt-paper-wrapper retracted"
              >
                <div className="receipt-content">
                  
                  {/* Brand & Title Header */}
                  <div className="receipt-header">
                    <div className="header-brand-info">
                      <div className="brand-company-name">{agencyName}</div>
                      <div className="payment-title">
                        {isPaid ? 'TAX INVOICE RECEIPT (PAID)' : 'TAX INVOICE GENERATED'}
                      </div>
                    </div>
                    <div className="logo-badge">
                      <img src={logoUrl} alt={agencyName} className="brand-logo-img" />
                    </div>
                  </div>

                  {/* Total Amount Section */}
                  <div className="receipt-amount-section">
                    <div className="receipt-amount">
                      {formatCurrency(invoice.totalAmount, currency)}
                    </div>
                    <div className="receipt-meta">
                      {invoice.issueDate} | {invoice.invoiceNumber}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#555', marginTop: 2 }}>
                      CLIENT: {clientName.toUpperCase()}
                    </div>
                  </div>

                  <div className="receipt-divider" />

                  {/* Line Items List */}
                  <div className="receipt-items-list">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, idx) => (
                        <div key={item.id || idx} className="receipt-item-row">
                          <span className="item-name" title={item.description}>
                            {item.quantity || 1}X {item.description || 'Digital Deliverable'}
                          </span>
                          <span className="item-price">
                            {formatCurrency(item.amount || (item.unitPrice * (item.quantity || 1)), currency)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="receipt-item-row">
                        <span className="item-name">Monthly Retainer Deliverable</span>
                        <span className="item-price">{formatCurrency(invoice.subtotal, currency)}</span>
                      </div>
                    )}
                  </div>

                  <div className="receipt-divider" />

                  {/* Totals Section */}
                  <div className="receipt-totals-section">
                    <div className="total-row">
                      <span>Subtotal</span>
                      <span>{formatCurrency(invoice.subtotal, currency)}</span>
                    </div>

                    {invoice.hasGst && invoice.gstType === 'CGST_SGST' ? (
                      <>
                        <div className="total-row">
                          <span>CGST</span>
                          <span>{formatCurrency(invoice.cgstAmount || 0, currency)}</span>
                        </div>
                        <div className="total-row">
                          <span>SGST</span>
                          <span>{formatCurrency(invoice.sgstAmount || 0, currency)}</span>
                        </div>
                      </>
                    ) : invoice.hasGst && invoice.gstType === 'IGST' ? (
                      <div className="total-row">
                        <span>IGST</span>
                        <span>{formatCurrency(invoice.igstAmount || 0, currency)}</span>
                      </div>
                    ) : null}

                    <div className="receipt-grand-total">
                      <span>GRAND TOTAL</span>
                      <span>{formatCurrency(invoice.totalAmount, currency)}</span>
                    </div>
                  </div>

                  {/* Barcode & Footer Greeting */}
                  <div className="receipt-footer">
                    <div className="footer-msg">THANK YOU FOR YOUR PARTNERSHIP!</div>
                    <div className="barcode-graphic">
                      <div className="barcode-lines" />
                      <div className="barcode-num">{invoice.invoiceNumber}</div>
                    </div>
                  </div>

                </div>

                {/* POS Thermal Cutter Serrated Edge */}
                <div className="serrated-edge" />
              </div>
            </div>

          </div>

          {/* Interactive Controls & Status Below Machine */}
          <div className="stage-info">
            <h2 className="status-heading">
              {isTorn
                ? 'Receipt Torn & Ready'
                : isPrinting
                  ? 'Printing Thermal Receipt...'
                  : 'Invoice Successfully Created!'}
            </h2>
            <p className="status-subtext">
              {isTorn
                ? 'Torn cleanly off the dispenser. You can view or re-print anytime.'
                : isPrinting
                  ? 'Mechanical thermal feed rolling out invoice details'
                  : 'Printed directly from Retentio agency accounting engine'}
            </p>

            <div className="centered-action-bar">
              {/* Tear Receipt Button (When Printed) */}
              {!isTorn && isPrinted && (
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={triggerTear}
                  title="Cut and tear receipt off machine"
                >
                  <Scissors size={15} />
                  <span>Tear Receipt</span>
                </button>
              )}

              {/* View Full Invoice Document */}
              {onViewInvoice && (
                <button
                  type="button"
                  className="print-action-btn"
                  onClick={() => {
                    onClose();
                    onViewInvoice(invoice);
                  }}
                  title="View full tax invoice document"
                >
                  <Eye size={15} />
                  <span>View Full Invoice</span>
                </button>
              )}

              {/* Share on WhatsApp */}
              {onWhatsApp && (
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => onWhatsApp(invoice)}
                  title="Share invoice on WhatsApp"
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp</span>
                </button>
              )}

              {/* Re-Print Button */}
              {(!isPrinting || isTorn) && (
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={triggerPrint}
                  disabled={isPrinting}
                  title="Re-run print rollout animation"
                >
                  <Printer size={15} />
                  <span>{isTorn ? 'Print Again' : 'Re-print'}</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReceiptPrinterModal;
