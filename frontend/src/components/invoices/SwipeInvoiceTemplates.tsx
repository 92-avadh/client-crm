import React from 'react';
import type { Invoice, AppSettings, Brand } from '../../types';
import { numberToWordsINR } from '../../utils/numberToWords';
import { resolveInvoiceBank, buildUpiDeepLink } from '../../utils/bankAccounts';
import { QrCodeImage } from '../common/QrCodeImage';

export type SwipeTemplateId = 'modern' | 'classic' | 'navy' | 'executive';

interface TemplateProps {
  invoice: Invoice;
  settings: AppSettings;
  brand?: Brand;
}

const getSymbol = (invoice: Invoice, settings: AppSettings) =>
  invoice.currencySymbol || settings.currencySymbol || '₹';

const fmtMoney = (n: number, sym = '₹') =>
  `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMoneyPlain = (n: number, sym = '₹') =>
  `${sym}${Number(n || 0).toLocaleString('en-IN')}`;

const formatBrandAddress = (brand?: Brand): string => {
  if (!brand) return '';
  const parts = [
    brand.billingAddress,
    brand.city,
    brand.state,
    brand.pincode ? `- ${brand.pincode}` : '',
  ].filter(Boolean);
  return parts.join(', ').replace(', - ', ' - ');
};

const getPayable = (invoice: Invoice): number => {
  if (invoice.status === 'Paid') return 0;
  return Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0));
};

export const InvoiceLogo: React.FC<{ settings: AppSettings; maxHeight?: number; maxWidth?: number }> = ({
  settings,
  maxHeight = 40,
  maxWidth = 150,
}) => {
  const showLogo = settings.invoiceDesign?.showLogo !== false;
  if (!showLogo) return null;

  const agencyLogo = settings.companyLogo || settings.invoiceDesign?.logoUrl;
  if (agencyLogo) {
    return (
      <img
        src={agencyLogo}
        alt={settings.companyName || 'Agency Logo'}
        style={{
          display: 'block',
          width: 'auto',
          height: 'auto',
          maxHeight,
          maxWidth,
          objectFit: 'contain',
          flexShrink: 0,
        }}
        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <img
      src="/retentio-logo-horizontal.png"
      alt={settings.companyName || 'Retentio'}
      style={{
        display: 'block',
        width: 'auto',
        height: 'auto',
        maxHeight: Math.min(22, maxHeight),
        maxWidth: Math.min(95, maxWidth),
        objectFit: 'contain',
        flexShrink: 0,
      }}
      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
    />
  );
};

export const InvoicePoweredBy: React.FC<{ settings: AppSettings }> = ({ settings }) => {
  const agencyLogo = settings.companyLogo || settings.invoiceDesign?.logoUrl;
  if (agencyLogo) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 8.5, color: '#94a3b8' }}>
        <span>Powered by</span>
        <img
          src="/retentio-logo-horizontal.png"
          alt="Retentio"
          style={{ height: 11, width: 'auto', objectFit: 'contain', opacity: 0.65 }}
        />
      </div>
    );
  }
  return null;
};

export function getGstBreakdown(invoice: Invoice, settings: AppSettings) {
  const totalTax = (invoice.igstAmount || 0) + (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0);
  let effectiveRate = typeof settings.defaultGstRate === 'number' && settings.defaultGstRate >= 0
    ? settings.defaultGstRate
    : 18;
  if (invoice.subtotal > 0 && totalTax > 0) {
    effectiveRate = Math.round((totalTax / invoice.subtotal) * 100);
  }
  const gstRateDec = effectiveRate / 100;
  const halfRate = (effectiveRate / 2).toFixed(1).replace(/\.0$/, '');
  return { effectiveRate, gstRateDec, halfRate };
}

export const BankDetailsBlock: React.FC<{
  settings: AppSettings;
  invoice?: Invoice;
  titleColor?: string;
}> = ({ settings, invoice, titleColor = '#0f172a' }) => {
  const bank = resolveInvoiceBank(invoice, settings);
  const hasBankDetails = Boolean(
    bank && (bank.bankName || bank.bankAccountName || bank.bankAccountNumber || bank.bankIfsc || bank.upiId)
  );
  if (!hasBankDetails || !bank) return null;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: titleColor, marginBottom: 4 }}>Bank Details:</div>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '3px 8px', fontSize: 10.5, color: '#334155' }}>
        {bank.bankName && (
          <>
            <span style={{ color: '#64748b' }}>Bank:</span>
            <span style={{ fontWeight: 700, color: titleColor }}>{bank.bankName}</span>
          </>
        )}
        {bank.bankAccountName && (
          <>
            <span style={{ color: '#64748b' }}>A/c Name:</span>
            <span style={{ fontWeight: 700, color: titleColor }}>{bank.bankAccountName}</span>
          </>
        )}
        {bank.bankAccountNumber && (
          <>
            <span style={{ color: '#64748b' }}>Account #:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{bank.bankAccountNumber}</span>
          </>
        )}
        {bank.bankIfsc && (
          <>
            <span style={{ color: '#64748b' }}>IFSC:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{bank.bankIfsc}</span>
          </>
        )}
        {bank.bankBranch && (
          <>
            <span style={{ color: '#64748b' }}>Branch:</span>
            <span style={{ color: '#334155' }}>{bank.bankBranch}</span>
          </>
        )}
        {bank.upiId && (
          <>
            <span style={{ color: '#64748b' }}>UPI ID:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{bank.upiId}</span>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Authorized Signatory block displaying BOTH signature (first) and company stamp
 * overlapping by ~50% so both remain clearly visible.
 */
export const AuthorizedSignatoryStamp: React.FC<{
  companyName?: string;
  signatureUrl?: string;
  stampUrl?: string;
}> = ({ companyName, signatureUrl, stampUrl }) => {
  const safeId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const topId = `topCurve_${safeId}`;
  const bottomId = `bottomCurve_${safeId}`;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 150,
          height: 80,
          marginBottom: 4,
        }}
      >
        {/* 1. Signature placed FIRST */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 104,
            height: 56,
            flexShrink: 0,
          }}
        >
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Authorized Signature"
              style={{ maxHeight: 54, maxWidth: 104, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <svg width="104" height="52" viewBox="0 0 140 60" aria-label="Authorized Signature">
              <path
                d="M 10,42 Q 22,12 32,40 T 52,24 Q 58,44 68,26 Q 76,16 82,36 Q 94,20 112,34 Q 122,38 132,30"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 16,48 Q 62,43 122,46"
                fill="none"
                stroke="#334155"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          )}
        </div>

        {/* 2. Company Stamp overlapping signature by ~50% */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            marginLeft: -42,
            width: 76,
            height: 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-6deg)',
            opacity: 0.84,
            mixBlendMode: 'multiply',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        >
          {stampUrl ? (
            <img
              src={stampUrl}
              alt="Company Stamp"
              style={{ maxHeight: 74, maxWidth: 74, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <svg width="76" height="76" viewBox="0 0 100 100" aria-label="Company Stamp">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="3,2" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#2563eb" strokeWidth="1.4" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,1" />
              <defs>
                <path id={topId} d="M 18,50 A 32,32 0 0,1 82,50" />
                <path id={bottomId} d="M 82,50 A 32,32 0 0,1 18,50" />
              </defs>
              <text fill="#2563eb" fontSize="7.5" fontWeight="800" letterSpacing="1">
                <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">
                  ★ AUTHORIZED SEAL ★
                </textPath>
              </text>
              <text fill="#2563eb" fontSize="6.5" fontWeight="700" letterSpacing="0.8">
                <textPath href={`#${bottomId}`} startOffset="50%" textAnchor="middle">
                  {(companyName || 'VERIFIED').slice(0, 16).toUpperCase()}
                </textPath>
              </text>
              <line x1="26" y1="50" x2="74" y2="50" stroke="#2563eb" strokeWidth="0.9" opacity="0.7" />
              <text x="50" y="53" textAnchor="middle" fill="#1d4ed8" fontSize="7" fontWeight="800">
                STAMP
              </text>
            </svg>
          )}
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginTop: 2, borderTop: '1px solid #cbd5e1', paddingTop: 3, minWidth: 130, textAlign: 'center' }}>
        Authorized Signatory
      </div>
    </div>
  );
};

/**
 * UPI QR Code (prefers uploaded bank QR image; otherwise renders an accurate local
 * PNG QR code for the UPI deep link with proper quiet zone).
 */
export const DynamicUpiQrCode: React.FC<{
  upiId?: string;
  qrCodeUrl?: string;
  companyName?: string;
  amount?: number;
  invoiceNumber?: string;
}> = ({ upiId, qrCodeUrl, companyName, amount, invoiceNumber }) => {
  const cleanUpi = (upiId || '').trim();
  const upiDeepLink = buildUpiDeepLink({ upiId: cleanUpi, companyName, amount, invoiceNumber });

  if (!qrCodeUrl && !upiDeepLink && !cleanUpi) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Pay using UPI:</div>
      <div style={{ padding: 4, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, display: 'inline-block' }}>
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="UPI QR Code"
            width="92"
            height="92"
            style={{ display: 'block', width: 92, height: 92, objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : upiDeepLink ? (
          <QrCodeImage value={upiDeepLink} size={92} alt={`UPI QR for ${cleanUpi}`} />
        ) : null}
      </div>
      {cleanUpi && (
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#475569', fontWeight: 600, wordBreak: 'break-all' }}>
          {cleanUpi}
        </div>
      )}
      {upiDeepLink && Number(amount || 0) > 0 && (
        <a
          href={upiDeepLink}
          className="no-print"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
            padding: '4px 8px',
            borderRadius: 5,
            background: '#059669',
            color: '#ffffff',
            fontSize: 9.5,
            fontWeight: 700,
            textDecoration: 'none',
          }}
          title="Open GPay, PhonePe, Paytm, or BHIM on mobile"
        >
          Pay via GPay / PhonePe
        </a>
      )}
    </div>
  );
};

/**
 * Shared dynamic payment & signatory footer that omits empty Bank/QR blocks cleanly.
 */
const InvoicePaymentFooter: React.FC<{
  invoice: Invoice;
  settings: AppSettings;
  payableAmount: number;
  titleColor?: string;
  bordered?: boolean;
  qrFirst?: boolean;
}> = ({ invoice, settings, payableAmount, titleColor = '#0f172a', bordered = false, qrFirst = true }) => {
  const bank = resolveInvoiceBank(invoice, settings);
  const hasBank = Boolean(
    bank && (bank.bankName || bank.bankAccountName || bank.bankAccountNumber || bank.bankIfsc || bank.upiId)
  );
  const hasQr = Boolean(bank && (bank.qrCodeUrl || (bank.upiId || '').trim()));
  const showSig = settings.invoiceDesign?.showSignature !== false;

  if (!hasBank && !hasQr && !showSig) return null;

  const qrEl = hasQr ? (
    <div key="qr" style={bordered ? { padding: '10px 12px', borderRight: hasBank || showSig ? '1px solid #0f172a' : undefined, display: 'flex', justifyContent: 'center' } : undefined}>
      <DynamicUpiQrCode
        upiId={bank?.upiId}
        qrCodeUrl={bank?.qrCodeUrl}
        companyName={settings.companyName}
        amount={payableAmount}
        invoiceNumber={invoice.invoiceNumber}
      />
    </div>
  ) : null;

  const bankEl = hasBank ? (
    <div key="bank" style={bordered ? { padding: '10px 12px', borderRight: (!qrFirst && hasQr) || showSig ? '1px solid #0f172a' : undefined } : undefined}>
      <BankDetailsBlock settings={settings} invoice={invoice} titleColor={titleColor} />
    </div>
  ) : null;

  const sigEl = showSig ? (
    <div key="sig" style={{ ...(bordered ? { padding: '10px 12px', justifyContent: 'space-between' } : {}), textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: !hasBank && !hasQr ? 'auto' : undefined }}>
      <div style={{ fontSize: 10.5, color: '#475569', marginBottom: 4 }}>
        For {settings.companyName || 'Agency'}
      </div>
      <AuthorizedSignatoryStamp
        companyName={settings.companyName}
        signatureUrl={settings.invoiceDesign?.signatureUrl}
        stampUrl={settings.invoiceDesign?.stampUrl}
      />
    </div>
  ) : null;

  const cols: string[] = [];
  if (qrFirst) {
    if (hasQr) cols.push('1fr');
    if (hasBank) cols.push('1.3fr');
  } else {
    if (hasBank) cols.push('1.2fr');
    if (hasQr) cols.push('1fr');
  }
  if (showSig) cols.push('1fr');

  return (
    <div
      className="inv-footer-grid"
      style={
        bordered
          ? { display: 'grid', gridTemplateColumns: cols.join(' '), borderBottom: '1px solid #0f172a', fontSize: 10.5 }
          : { display: 'grid', gridTemplateColumns: cols.join(' '), gap: 16, alignItems: 'flex-start', borderTop: '1px solid #cbd5e1', paddingTop: 14, marginBottom: 14 }
      }
    >
      {qrFirst ? (
        <>
          {qrEl}
          {bankEl}
        </>
      ) : (
        <>
          {bankEl}
          {qrEl}
        </>
      )}
      {sigEl}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 1: SWIPE MODERN (DMart / Amazon Style)                  */
/* ------------------------------------------------------------------ */
export const SwipeModernTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const isPaid = invoice.status === 'Paid';
  const sym = getSymbol(invoice, settings);
  const payable = getPayable(invoice);
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state || settings.companyState || '';
  const { effectiveRate, gstRateDec, halfRate } = getGstBreakdown(invoice, settings);
  const clientAddr = formatBrandAddress(brand);

  return (
    <div className="swipe-template-root swipe-modern" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 24, fontSize: 11.5, lineHeight: 1.45 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: '#1e3a8a', textTransform: 'uppercase' }}>
            TAX INVOICE
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            {settings.companyName || 'Agency'}
          </div>
          {settings.companyGst && (
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>GSTIN:</span> {settings.companyGst}
            </div>
          )}
          {settings.companyAddress && (
            <div style={{ fontSize: 10.5, color: '#475569', maxWidth: 360, marginTop: 2 }}>
              {settings.companyAddress}
            </div>
          )}
          {(settings.companyPhone || settings.companyEmail) && (
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
              {settings.companyPhone && <span><span style={{ fontWeight: 600 }}>Mobile:</span> {settings.companyPhone} &nbsp;</span>}
              {settings.companyEmail && <span>• <span style={{ fontWeight: 600 }}>Email:</span> {settings.companyEmail}</span>}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, minWidth: 120 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ORIGINAL FOR RECIPIENT
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <InvoiceLogo settings={settings} maxHeight={44} maxWidth={165} />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#cbd5e1', margin: '10px 0 14px' }} />

      {/* Invoice Details & Addresses */}
      <div className="inv-meta-3col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.4fr', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
            Invoice #: <span style={{ fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Client Details:</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>{invoice.brandName || brand?.name || 'Client'}</div>
            {brand?.mobile && <div style={{ fontSize: 10.5, color: '#475569', marginTop: 1 }}>Ph: {brand.mobile}</div>}
            {brand?.email && <div style={{ fontSize: 10.5, color: '#475569' }}>{brand.email}</div>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#475569' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Invoice Date:</span> {invoice.issueDate}
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Billing address:</div>
            {clientAddr && (
              <div style={{ fontSize: 10.5, color: '#334155', marginTop: 1, lineHeight: 1.4 }}>
                {clientAddr}
              </div>
            )}
            {brand?.gstNumber && (
              <div style={{ fontSize: 10.5, color: '#0f172a', marginTop: 2, fontWeight: 600 }}>
                GSTIN: {brand.gstNumber}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#475569' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Due Date:</span> {invoice.dueDate}
          </div>
          {clientAddr && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Shipping address:</div>
              <div style={{ fontSize: 10.5, color: '#334155', marginTop: 1, lineHeight: 1.4 }}>
                {clientAddr}
              </div>
            </div>
          )}
        </div>
      </div>

      {placeOfSupply && (
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
          Place of Supply: <span style={{ textTransform: 'uppercase' }}>{placeOfSupply}</span>
        </div>
      )}

      {/* Main Items Table */}
      <div className="inv-table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a', background: '#f8fafc', fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
            <th style={{ padding: '7px 6px', textAlign: 'left', width: 32 }}>#</th>
            <th style={{ padding: '7px 8px', textAlign: 'left' }}>Service</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 80 }}>HSN/SAC</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 90 }}>Rate / Service</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 50 }}>Qty</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 90 }}>Taxable Value</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 85 }}>Tax Amount</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 95 }}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => {
            const itemTaxable = Number(it.amount || 0);
            const itemTax = invoice.hasGst && gstRateDec > 0 ? Math.round(itemTaxable * gstRateDec) : 0;
            return (
              <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                <td style={{ padding: '8px 6px', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '8px 8px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 11.5 }}>{it.description}</div>
                  {it.hsnSac && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>HSN/SAC: {it.hsnSac}</div>}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>
                  {it.hsnSac || '—'}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600 }}>
                  {Number(it.unitPrice || it.amount).toFixed(2)}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                  {it.quantity || 1}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                  {itemTaxable.toFixed(2)}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', color: '#475569' }}>
                  {invoice.hasGst ? `${itemTax.toFixed(2)} (${effectiveRate}%)` : '0.00'}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                  {(itemTaxable + itemTax).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Summary Box */}
      <div className="inv-summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10.5, color: '#475569', fontWeight: 600 }}>
          Total Items / Qty : {invoice.items.length} / {totalQty}.000
        </div>

        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Taxable Amount</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.subtotal, sym)}</span>
          </div>

          {invoice.hasGst && invoice.gstType === 'IGST' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>IGST {effectiveRate}%</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmtMoney(invoice.igstAmount, sym)}</span>
            </div>
          )}

          {invoice.hasGst && invoice.gstType !== 'IGST' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST {halfRate}%</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmtMoney(invoice.cgstAmount, sym)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>SGST {halfRate}%</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmtMoney(invoice.sgstAmount, sym)}</span>
              </div>
            </>
          )}

          <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
            <span>Total</span>
            <span>{fmtMoneyPlain(invoice.totalAmount, sym)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
            <span>Amount Payable:</span>
            <span>{fmtMoney(payable, sym)}</span>
          </div>

          {(isPaid || Number(invoice.paidAmount || 0) > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
              <span>Amount Paid:</span>
              <span>{fmtMoney(isPaid ? invoice.totalAmount : invoice.paidAmount, sym)}</span>
            </div>
          )}

          {isPaid && (
            <div style={{ textAlign: 'right', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
              {sym}{Number(invoice.totalAmount).toLocaleString('en-IN')} Paid
              {invoice.paymentMode ? ` via ${invoice.paymentMode}` : ''}
              {invoice.paymentDate ? ` on ${invoice.paymentDate}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Amount in words banner */}
      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10.5, color: '#334155', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
      </div>

      {/* Dynamic Footer: UPI QR | Bank Details | Signatory */}
      <InvoicePaymentFooter invoice={invoice} settings={settings} payableAmount={payable} />

      {/* Notes & Terms */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Notes:</div>
        <div>{invoice.notes || 'Thank you for your business.'}</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Terms and Conditions:</div>
        {settings.invoiceDesign?.termsAndConditions ? (
          <div>{settings.invoiceDesign.termsAndConditions}</div>
        ) : (
          <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
            <li>Services once delivered/confirmed cannot be cancelled or refunded.</li>
            <li>Interest @18% p.a. may be charged for overdue invoices beyond 15 days.</li>
            <li>Subject to local jurisdiction.</li>
          </ol>
        )}
      </div>

      {/* Document Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 6, fontSize: 9.5, color: '#94a3b8' }}>
        <span>Page 1/1</span>
        <InvoicePoweredBy settings={settings} />
        <span>This is a digitally signed document.</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 2: SWIPE CLASSIC FRAMED GST                             */
/* ------------------------------------------------------------------ */
export const SwipeClassicFramedTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const isPaid = invoice.status === 'Paid';
  const sym = getSymbol(invoice, settings);
  const payable = getPayable(invoice);
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state || settings.companyState || '';
  const { effectiveRate, gstRateDec, halfRate } = getGstBreakdown(invoice, settings);
  const clientAddr = formatBrandAddress(brand);

  return (
    <div className="swipe-template-root swipe-classic" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 20, fontSize: 11 }}>
      {/* Outer Border Frame */}
      <div style={{ border: '1.5px solid #0f172a', borderRadius: 2 }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #0f172a', padding: '6px 14px', background: '#f8fafc' }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.15em', color: '#1e40af', margin: '0 auto', textIndent: 120 }}>
            TAX INVOICE
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em' }}>
            ORIGINAL FOR RECIPIENT
          </div>
        </div>

        {/* Company & Invoice Grid Header */}
        <div className="inv-meta-2col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '1px solid #0f172a' }}>
          <div style={{ padding: '12px 14px', borderRight: '1px solid #0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <InvoiceLogo settings={settings} maxHeight={34} maxWidth={120} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                  {settings.companyName || 'Agency'}
                </div>
                {settings.companyGst && (
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
                    GSTIN {settings.companyGst}
                  </div>
                )}
              </div>
            </div>
            {settings.companyAddress && (
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                {settings.companyAddress}
              </div>
            )}
            {(settings.companyPhone || settings.companyEmail) && (
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                {settings.companyPhone && <span>Mobile: {settings.companyPhone} &nbsp;</span>}
                {settings.companyEmail && <span>Email: {settings.companyEmail}</span>}
              </div>
            )}
          </div>

          {/* Invoice Meta Grid */}
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', fontSize: 10.5 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #0f172a' }}>
              <div style={{ padding: '6px 10px', borderRight: '1px solid #0f172a' }}>
                <span style={{ color: '#64748b' }}>Invoice #:</span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{invoice.invoiceNumber}</div>
              </div>
              <div style={{ padding: '6px 10px' }}>
                <span style={{ color: '#64748b' }}>Invoice Date:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{invoice.issueDate}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '6px 10px', borderRight: '1px solid #0f172a' }}>
                <span style={{ color: '#64748b' }}>Place of Supply:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{placeOfSupply || '—'}</div>
              </div>
              <div style={{ padding: '6px 10px' }}>
                <span style={{ color: '#64748b' }}>Due Date:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{invoice.dueDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Client & Shipping Row */}
        <div className="inv-meta-2col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '1.5px solid #0f172a', fontSize: 10.5 }}>
          <div style={{ padding: '8px 14px', borderRight: '1px solid #0f172a' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Client Details:</span>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a', marginTop: 1 }}>{invoice.brandName || brand?.name || 'Client'}</div>
            {clientAddr && (
              <>
                <div style={{ fontWeight: 600, color: '#475569', marginTop: 2 }}>Billing address:</div>
                <div style={{ color: '#475569', lineHeight: 1.35 }}>{clientAddr}</div>
              </>
            )}
            {brand?.mobile && <div style={{ color: '#475569', marginTop: 2 }}>Ph: {brand.mobile}</div>}
            {brand?.gstNumber && <div style={{ color: '#0f172a', fontWeight: 600, marginTop: 2 }}>GSTIN: {brand.gstNumber}</div>}
          </div>
          <div style={{ padding: '8px 10px' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Shipping address:</span>
            <div style={{ color: '#475569', marginTop: 2, lineHeight: 1.35 }}>
              {clientAddr || 'Same as billing details'}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="inv-table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #0f172a', fontWeight: 800, color: '#0f172a' }}>
              <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', width: 28, textAlign: 'center' }}>#</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>Service</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', width: 85 }}>HSN/SAC</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right', width: 80 }}>Rate</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', width: 45 }}>Qty</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right', width: 80 }}>Taxable</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right', width: 85 }}>Tax</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: 85 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, idx) => {
              const itemTaxable = Number(it.amount || 0);
              const itemTax = invoice.hasGst && gstRateDec > 0 ? Math.round(itemTaxable * gstRateDec) : 0;
              return (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', fontWeight: 700 }}>{it.description}</td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>
                    {it.hsnSac || '—'}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {Number(it.unitPrice || it.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                    {it.quantity || 1}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {itemTaxable.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {invoice.hasGst ? `${itemTax.toFixed(2)} (${effectiveRate}%)` : '0.00'}
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800 }}>
                    {(itemTaxable + itemTax).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* Subtotal & Tax Calculation Row */}
        <div className="inv-meta-2col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '1.5px solid #0f172a', fontSize: 10.5 }}>
          <div style={{ padding: '8px 12px', borderRight: '1px solid #0f172a', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>Total Items / Qty : {invoice.items.length} / {totalQty}.000</span>
          </div>
          <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Taxable Amount</span>
              <span style={{ fontWeight: 800 }}>{fmtMoney(invoice.subtotal, sym)}</span>
            </div>
            {invoice.hasGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>
                  {invoice.gstType === 'IGST' ? `IGST ${effectiveRate}%` : `CGST ${halfRate}% + SGST ${halfRate}%`}
                </span>
                <span style={{ fontWeight: 700 }}>{fmtMoney(invoice.igstAmount || (invoice.cgstAmount + invoice.sgstAmount), sym)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: 3, fontWeight: 900, fontSize: 13 }}>
              <span>Total</span>
              <span>{fmtMoney(invoice.totalAmount, sym)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
              <span>Amount Payable</span>
              <span>{fmtMoney(payable, sym)}</span>
            </div>
          </div>
        </div>

        {/* Dedicated HSN/SAC Tax Summary Table */}
        <div style={{ borderBottom: '1.5px solid #0f172a', padding: 8, background: '#f8fafc' }}>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5, background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: 800 }}>
                <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>HSN/SAC</th>
                <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>Taxable Value</th>
                <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>Rate</th>
                <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>Tax Amount</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => {
                const val = Number(it.amount || 0);
                const tax = invoice.hasGst && gstRateDec > 0 ? Math.round(val * gstRateDec) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{it.hsnSac || '—'}</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>{val.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>{invoice.hasGst ? `${effectiveRate}%` : '0%'}</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>{tax.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{tax.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 800, background: '#f8fafc' }}>
                <td style={{ padding: '5px 6px', borderRight: '1px solid #cbd5e1' }}>TOTAL</td>
                <td style={{ padding: '5px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>{invoice.subtotal.toFixed(2)}</td>
                <td style={{ padding: '5px 6px', borderRight: '1px solid #cbd5e1' }}></td>
                <td style={{ padding: '5px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                  {(invoice.igstAmount || (invoice.cgstAmount + invoice.sgstAmount)).toFixed(2)}
                </td>
                <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                  {(invoice.igstAmount || (invoice.cgstAmount + invoice.sgstAmount)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {isPaid && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              ✓ Amount Paid: {fmtMoney(invoice.totalAmount, sym)}
            </div>
          )}
        </div>

        {/* Dynamic Footer */}
        <InvoicePaymentFooter invoice={invoice} settings={settings} payableAmount={payable} bordered qrFirst={false} />

        {/* Notes & Terms Box */}
        <div style={{ padding: '8px 12px', fontSize: 9.5, color: '#475569', lineHeight: 1.45, background: '#f8fafc' }}>
          <div><span style={{ fontWeight: 700, color: '#0f172a' }}>Notes:</span> {invoice.notes || 'Thank you for your business.'}</div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 3 }}>Terms and Conditions:</div>
          {settings.invoiceDesign?.termsAndConditions ? (
            <div>{settings.invoiceDesign.termsAndConditions}</div>
          ) : (
            <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
              <li>Services once delivered/confirmed cannot be cancelled or refunded.</li>
              <li>Interest @18% p.a. may be charged for overdue invoices beyond 15 days.</li>
              <li>Subject to local jurisdiction.</li>
            </ol>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 9, color: '#64748b' }}>
        <span>Page 1/1</span>
        <InvoicePoweredBy settings={settings} />
        <span>This is a digitally signed document.</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 3: SWIPE VIBRANT NAVY                                   */
/* ------------------------------------------------------------------ */
export const SwipeVibrantNavyTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const sym = getSymbol(invoice, settings);
  const payable = getPayable(invoice);
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state || settings.companyState || '';
  const { effectiveRate, halfRate } = getGstBreakdown(invoice, settings);
  const clientAddr = formatBrandAddress(brand);

  return (
    <div className="swipe-template-root swipe-navy" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 24, fontSize: 11.5 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <InvoiceLogo settings={settings} maxHeight={36} maxWidth={130} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#002c6c' }}>{settings.companyName || 'Agency'}</div>
              {settings.companyGst && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>GSTIN {settings.companyGst}</div>
              )}
            </div>
          </div>
          {settings.companyAddress && (
            <div style={{ fontSize: 10.5, color: '#475569', maxWidth: 360, lineHeight: 1.4 }}>
              {settings.companyAddress}
            </div>
          )}
          {settings.companyPhone && (
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>Mobile {settings.companyPhone}</div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.12em', color: '#002c6c' }}>TAX INVOICE</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>ORIGINAL FOR RECIPIENT</div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#334155' }}>
            <span style={{ color: '#64748b' }}>Invoice #:</span> <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#334155' }}>
            <span style={{ color: '#64748b' }}>Invoice Date:</span> <span style={{ fontWeight: 700 }}>{invoice.issueDate}</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#334155' }}>
            <span style={{ color: '#64748b' }}>Due Date:</span> <span style={{ fontWeight: 700 }}>{invoice.dueDate}</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#e2e8f0', margin: '10px 0 14px' }} />

      {/* Bill To & Ship To */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bill To:</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{invoice.brandName || brand?.name || 'Client'}</div>
          {brand?.mobile && <div style={{ fontSize: 10.5, color: '#475569' }}>Ph: {brand.mobile}</div>}
          {clientAddr && <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>{clientAddr}</div>}
          {brand?.gstNumber && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>GSTIN: {brand.gstNumber}</div>}
          {placeOfSupply && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#002c6c', marginTop: 3 }}>
              Place of Supply: {placeOfSupply}
            </div>
          )}
        </div>

        {clientAddr && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ship to:</div>
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 4 }}>{clientAddr}</div>
          </div>
        )}
      </div>

      {/* Items Table with Navy Solid Header Bar */}
      <div className="inv-table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ background: '#002c6c', color: '#ffffff', fontSize: 10.5, fontWeight: 700 }}>
            <th style={{ padding: '8px 8px', textAlign: 'left', width: 32 }}>#</th>
            <th style={{ padding: '8px 8px', textAlign: 'left' }}>Service</th>
            <th style={{ padding: '8px 8px', textAlign: 'center', width: 85 }}>HSN/SAC</th>
            <th style={{ padding: '8px 8px', textAlign: 'right', width: 95 }}>Rate / Service</th>
            <th style={{ padding: '8px 8px', textAlign: 'center', width: 50 }}>Qty</th>
            <th style={{ padding: '8px 8px', textAlign: 'right', width: 100 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => (
            <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
              <td style={{ padding: '10px 8px', color: '#64748b' }}>{idx + 1}</td>
              <td style={{ padding: '10px 8px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 12 }}>{it.description}</div>
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#475569' }}>
                {it.hsnSac || '—'}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>
                {Number(it.unitPrice || it.amount).toFixed(2)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                {it.quantity || 1}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                {Number(it.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Summary */}
      <div className="inv-summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10.5, color: '#64748b' }}>
          Total Items / Qty : {invoice.items.length} / {totalQty}.000
        </div>

        <div style={{ width: 260, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Taxable Amount</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.subtotal, sym)}</span>
          </div>
          {invoice.hasGst && invoice.gstType === 'IGST' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>IGST {effectiveRate}%</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.igstAmount, sym)}</span>
            </div>
          )}
          {invoice.hasGst && invoice.gstType !== 'IGST' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST {halfRate}%</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.cgstAmount, sym)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>SGST {halfRate}%</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.sgstAmount, sym)}</span>
              </div>
            </>
          )}
          <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#002c6c' }}>
            <span>Total</span>
            <span>{fmtMoneyPlain(invoice.totalAmount, sym)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            <span>Amount Payable:</span>
            <span>{fmtMoney(payable, sym)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10.5, color: '#334155', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
      </div>

      {/* Dynamic Footer */}
      <InvoicePaymentFooter invoice={invoice} settings={settings} payableAmount={payable} titleColor="#002c6c" />

      {/* Notes & Terms */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Notes:</div>
        <div>{invoice.notes || 'Thank you for your business.'}</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Terms and Conditions:</div>
        {settings.invoiceDesign?.termsAndConditions ? (
          <div>{settings.invoiceDesign.termsAndConditions}</div>
        ) : (
          <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
            <li>Services once delivered/confirmed cannot be cancelled or refunded.</li>
            <li>Interest @18% p.a. may be charged for overdue invoices beyond 15 days.</li>
            <li>Subject to local jurisdiction.</li>
          </ol>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 6, fontSize: 9.5, color: '#94a3b8' }}>
        <span>Page 1/1</span>
        <InvoicePoweredBy settings={settings} />
        <span>This is a digitally signed document | ORIGINAL FOR RECIPIENT</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 4: SWIPE EXECUTIVE CARD                                 */
/* ------------------------------------------------------------------ */
export const SwipeExecutiveCardTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const sym = getSymbol(invoice, settings);
  const payable = getPayable(invoice);
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state || settings.companyState || '';
  const { effectiveRate, gstRateDec, halfRate } = getGstBreakdown(invoice, settings);
  const clientAddr = formatBrandAddress(brand);

  return (
    <div className="swipe-template-root swipe-executive" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 24, fontSize: 11.5 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <InvoiceLogo settings={settings} maxHeight={38} maxWidth={140} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{settings.companyName || 'Agency'}</div>
          {settings.companyAddress && (
            <div style={{ fontSize: 10.5, color: '#475569', maxWidth: 360, marginTop: 2, lineHeight: 1.4 }}>
              {settings.companyAddress}
            </div>
          )}
          {settings.companyGst && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
              GSTIN : {settings.companyGst}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', color: '#0f172a' }}>TAX INVOICE</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>ORIGINAL FOR RECIPIENT</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '3px 12px', marginTop: 10, fontSize: 10.5, textAlign: 'left' }}>
            {settings.companyPhone && (
              <>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Phone:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{settings.companyPhone}</span>
              </>
            )}
            {settings.companyEmail && (
              <>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Email:</span>
                <span style={{ color: '#0f172a' }}>{settings.companyEmail}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tinted Metadata Card */}
      <div className="inv-meta-3col" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bill to</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{invoice.brandName || brand?.name || 'Client'}</div>
          {clientAddr && <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>{clientAddr}</div>}
          {brand?.gstNumber && <div style={{ fontSize: 10.5, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>GSTIN: {brand.gstNumber}</div>}
        </div>

        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ship to</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{invoice.brandName || brand?.name || 'Client'}</div>
          {clientAddr && <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>{clientAddr}</div>}
        </div>

        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 14 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 8px', fontSize: 10.5, marginTop: 4 }}>
            <span style={{ color: '#64748b' }}>Invoice No</span>
            <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
            <span style={{ color: '#64748b' }}>Invoice Date</span>
            <span style={{ fontWeight: 700 }}>{invoice.issueDate}</span>
            <span style={{ color: '#64748b' }}>Due Date</span>
            <span style={{ fontWeight: 700 }}>{invoice.dueDate}</span>
            {placeOfSupply && (
              <>
                <span style={{ color: '#64748b' }}>Place of Supply</span>
                <span style={{ fontWeight: 700 }}>{placeOfSupply}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="inv-table-scroll">
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ borderTop: '1.5px solid #cbd5e1', borderBottom: '1.5px solid #cbd5e1', fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>
            <th style={{ padding: '7px 8px', textAlign: 'left' }}>Service</th>
            <th style={{ padding: '7px 8px', textAlign: 'center', width: 45 }}>Qty</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 90 }}>Rate</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 85 }}>Tax</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 95 }}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => {
            const taxable = Number(it.amount || 0);
            const tax = invoice.hasGst && gstRateDec > 0 ? Math.round(taxable * gstRateDec) : 0;
            return (
              <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                <td style={{ padding: '9px 8px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{it.description}</div>
                  {it.hsnSac && <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 1 }}>HSN/SAC: {it.hsnSac}</div>}
                </td>
                <td style={{ padding: '9px 8px', textAlign: 'center' }}>{it.quantity || 1}</td>
                <td style={{ padding: '9px 8px', textAlign: 'right' }}>{Number(it.unitPrice || it.amount).toFixed(2)}</td>
                <td style={{ padding: '9px 8px', textAlign: 'right', color: '#475569' }}>
                  {invoice.hasGst ? `${tax.toFixed(2)} (${effectiveRate}%)` : '0.00'}
                </td>
                <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                  {(taxable + tax).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Summary */}
      <div className="inv-summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10.5, color: '#64748b' }}>
          Total Items / Qty : {invoice.items.length} / {totalQty}.000
        </div>

        <div style={{ width: 260, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.subtotal, sym)}</span>
          </div>
          {invoice.hasGst && invoice.gstType !== 'IGST' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST ({halfRate}%)</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.cgstAmount, sym)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>SGST ({halfRate}%)</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.sgstAmount, sym)}</span>
              </div>
            </>
          ) : invoice.hasGst ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>IGST ({effectiveRate}%)</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtMoney(invoice.igstAmount, sym)}</span>
            </div>
          ) : null}

          <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
            <span>Total</span>
            <span>{fmtMoneyPlain(invoice.totalAmount, sym)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
            <span>Amount Payable</span>
            <span>{fmtMoney(payable, sym)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10.5, color: '#334155', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
      </div>

      {/* Dynamic Footer */}
      <InvoicePaymentFooter invoice={invoice} settings={settings} payableAmount={payable} />

      {/* Notes & Terms & Receiver Signature */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Notes</div>
        <div>{invoice.notes || 'Thank you for your business.'}</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Terms &amp; Condition</div>
        {settings.invoiceDesign?.termsAndConditions ? (
          <div>{settings.invoiceDesign.termsAndConditions}</div>
        ) : (
          <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
            <li>Services once delivered/confirmed cannot be cancelled or refunded.</li>
            <li>Interest @18% p.a. may be charged for overdue invoices beyond 15 days.</li>
            <li>Subject to local jurisdiction.</li>
          </ol>
        )}

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a', fontWeight: 600 }}>
          <span>Receiver's Signature:</span>
          <span style={{ borderBottom: '1px solid #0f172a', width: 150, display: 'inline-block' }}></span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 6, fontSize: 9.5, color: '#94a3b8' }}>
        <span>Page 1/1</span>
        <InvoicePoweredBy settings={settings} />
        <span>This is a digitally signed document</span>
      </div>
    </div>
  );
};
