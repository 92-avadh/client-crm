import React from 'react';
import type { Invoice, AppSettings, Brand } from '../../types';
import { numberToWordsINR } from '../../utils/numberToWords';

export type SwipeTemplateId = 'modern' | 'classic' | 'navy' | 'executive';

interface TemplateProps {
  invoice: Invoice;
  settings: AppSettings;
  brand?: Brand;
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inrPlain = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Authentic Circular Stamp matching Swipe's signature badge
 */
export const AuthorizedSignatoryStamp: React.FC<{ companyName?: string }> = ({ companyName }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
    <svg width="78" height="78" viewBox="0 0 100 100" style={{ transform: 'rotate(-5deg)', opacity: 0.9 }}>
      {/* Outer Circles */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="3,2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#2563eb" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,1" />

      {/* Curved Text Paths */}
      <defs>
        <path id="topCurve" d="M 18,50 A 32,32 0 0,1 82,50" />
        <path id="bottomCurve" d="M 82,50 A 32,32 0 0,1 18,50" />
      </defs>

      <text fill="#2563eb" fontSize="8" fontWeight="800" letterSpacing="1.2">
        <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
          ★ SIGNATURE ★
        </textPath>
      </text>

      <text fill="#2563eb" fontSize="6.5" fontWeight="700" letterSpacing="0.8">
        <textPath href="#bottomCurve" startOffset="50%" textAnchor="middle">
          {(companyName || 'VERIFIED').slice(0, 16).toUpperCase()}
        </textPath>
      </text>

      {/* Center Signature Script Representation */}
      <path
        d="M 30,52 Q 40,40 48,54 T 66,46 Q 74,56 70,52"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="48" cy="42" r="1.5" fill="#1d4ed8" />
      <line x1="28" y1="57" x2="72" y2="57" stroke="#2563eb" strokeWidth="1" />
    </svg>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginTop: 4 }}>Authorized Signatory</div>
  </div>
);

/**
 * Dynamic Scannable UPI QR Code generator
 */
export const DynamicUpiQrCode: React.FC<{
  upiId?: string;
  companyName?: string;
  amount?: number;
  invoiceNumber?: string;
}> = ({ upiId, companyName, amount, invoiceNumber }) => {
  const upi = upiId || 'retentio@upi';
  const name = encodeURIComponent(companyName || 'Retentio');
  const inv = encodeURIComponent(invoiceNumber || 'INV');
  const amt = amount || 0;
  const upiUri = `upi://pay?pa=${upi}&pn=${name}&am=${amt}&tn=${inv}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${encodeURIComponent(upiUri)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Pay using UPI:</div>
      <div style={{ padding: 4, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, display: 'inline-block' }}>
        <img
          src={qrUrl}
          alt="UPI QR Code"
          width="92"
          height="92"
          style={{ display: 'block' }}
          onError={(e) => {
            // Fallback placeholder if offline
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 1: SWIPE MODERN (DMart / Amazon Style)                  */
/* ------------------------------------------------------------------ */
export const SwipeModernTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const isPaid = invoice.status === 'Paid';
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state ? `${settings.companyState || '27'}-${brand.state.toUpperCase()}` : `${settings.companyState || '27-MAHARASHTRA'}`;

  return (
    <div className="swipe-template-root swipe-modern" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 24, fontSize: 11.5, lineHeight: 1.45 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: '#1e3a8a', textTransform: 'uppercase' }}>
            TAX INVOICE
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            {settings.companyName || 'Retentio Agency'}
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>GSTIN:</span> {settings.companyGst || '27AAACT2727Q1ZW'}
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', maxWidth: 360, marginTop: 2 }}>
            {settings.companyAddress || 'High-Tech Infotech Park, Ambegaon, Pune, Maharashtra 411046'}
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>
            <span style={{ fontWeight: 600 }}>Mobile:</span> {settings.companyPhone || '9999999999'} &nbsp;
            {settings.companyEmail && <span>• <span style={{ fontWeight: 600 }}>Email:</span> {settings.companyEmail}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ORIGINAL FOR RECIPIENT
          </div>
          <div style={{ marginTop: 8 }}>
            <img
              src="/retentio-logo-horizontal.png"
              alt={settings.companyName}
              style={{ maxHeight: 42, maxWidth: 170, objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#cbd5e1', margin: '10px 0 14px' }} />

      {/* Invoice Details & Addresses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.4fr', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
            Invoice #: <span style={{ fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Customer Details:</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>{invoice.brandName || brand?.name || 'Client'}</div>
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 1 }}>Ph: {brand?.mobile || '9999999999'}</div>
            {brand?.email && <div style={{ fontSize: 10.5, color: '#475569' }}>{brand.email}</div>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#475569' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Invoice Date:</span> {invoice.issueDate}
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Billing address:</div>
            <div style={{ fontSize: 10.5, color: '#334155', marginTop: 1, lineHeight: 1.4 }}>
              {brand?.billingAddress || 'Phase 3, Hinjewadi Rajiv Gandhi Infotech Park'}
              {brand?.city ? `, ${brand.city}` : ''}
              {brand?.state ? `, ${brand.state}` : ''}
              {brand?.pincode ? ` - ${brand.pincode}` : ''}
            </div>
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
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Shipping address:</div>
            <div style={{ fontSize: 10.5, color: '#334155', marginTop: 1, lineHeight: 1.4 }}>
              {brand?.billingAddress || 'Phase 3, Hinjewadi Rajiv Gandhi Infotech Park'}
              {brand?.city ? `, ${brand.city}` : ''}
              {brand?.state ? `, ${brand.state}` : ''}
              {brand?.pincode ? ` - ${brand.pincode}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
        Place of Supply: <span style={{ textTransform: 'uppercase' }}>{placeOfSupply}</span>
      </div>

      {/* Main Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a', background: '#f8fafc', fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
            <th style={{ padding: '7px 6px', textAlign: 'left', width: 32 }}>#</th>
            <th style={{ padding: '7px 8px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 80 }}>HSN/SAC</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 90 }}>Rate/ Item</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 50 }}>Qty</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 90 }}>Taxable Value</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 85 }}>Tax Amount</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 95 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => {
            const itemTax = invoice.hasGst ? ((it.amount * 0.18) / 1.18) : 0;
            const itemTaxable = it.amount - itemTax;
            return (
              <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                <td style={{ padding: '8px 6px', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '8px 8px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 11.5 }}>{it.description}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>HSN: {it.hsnSac || '998311'}</div>
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>
                  {it.hsnSac || '998311'}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600 }}>
                  {Number(it.unitPrice || it.amount).toFixed(2)}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                  {it.quantity || 1}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                  {Number(itemTaxable || it.amount).toFixed(2)}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', color: '#475569' }}>
                  {invoice.hasGst ? `${Number(itemTax).toFixed(2)} (${invoice.gstType === 'IGST' ? '18%' : '18%'})` : '0.00'}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                  {Number(it.amount).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Box */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, color: '#475569', fontWeight: 600 }}>
          Total Items / Qty : {invoice.items.length} / {totalQty}.000
        </div>

        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Taxable Amount</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{inr(invoice.subtotal)}</span>
          </div>

          {invoice.hasGst && invoice.gstType === 'IGST' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>IGST 18.0%</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{inr(invoice.igstAmount)}</span>
            </div>
          )}

          {invoice.hasGst && invoice.gstType !== 'IGST' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST 9.0%</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{inr(invoice.cgstAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>SGST 9.0%</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{inr(invoice.sgstAmount)}</span>
              </div>
            </>
          )}

          <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
            <span>Total</span>
            <span>{inrPlain(invoice.totalAmount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
            <span>Amount Payable:</span>
            <span>{inr(isPaid ? 0 : invoice.totalAmount)}</span>
          </div>

          {isPaid && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
              <span>Amount Paid:</span>
              <span>{inr(invoice.totalAmount)}</span>
            </div>
          )}

          {isPaid && (
            <div style={{ textAlign: 'right', fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
              ₹{invoice.totalAmount} Paid via UPI on {invoice.issueDate}
            </div>
          )}
        </div>
      </div>

      {/* Amount in words banner */}
      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10.5, color: '#334155', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
      </div>

      {/* 3-Column Footer: UPI QR | Bank Details | Signatory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 16, alignItems: 'flex-start', borderTop: '1px solid #cbd5e1', paddingTop: 14, marginBottom: 14 }}>
        <div>
          <DynamicUpiQrCode
            upiId={settings.upiId}
            companyName={settings.companyName}
            amount={isPaid ? 0 : invoice.totalAmount}
            invoiceNumber={invoice.invoiceNumber}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Bank Details:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '3px 8px', fontSize: 10.5, color: '#334155' }}>
            <span style={{ color: '#64748b' }}>Bank:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{settings.bankAccountName || 'YES BANK'}</span>
            <span style={{ color: '#64748b' }}>Account #:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankAccountNumber || '667899992222445'}</span>
            <span style={{ color: '#64748b' }}>IFSC:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankIfsc || 'YESBBIN4567'}</span>
            <span style={{ color: '#64748b' }}>Branch:</span>
            <span>{settings.bankBranch || 'Kodihalli'}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10.5, color: '#475569', marginBottom: 4 }}>
            For {settings.companyName || 'Retentio'}
          </div>
          <AuthorizedSignatoryStamp companyName={settings.companyName} />
        </div>
      </div>

      {/* Notes & Terms */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Notes:</div>
        <div>Thank you for the Business</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Terms and Conditions:</div>
        <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
          <li>Goods/Services once confirmed cannot be cancelled or refunded.</li>
          <li>We are not the manufacturers; company will stand for warranty as per service terms.</li>
          <li>Interest @18% p.a. will be charged for uncleared bills beyond 15 days.</li>
          <li>Subject to local Jurisdiction.</li>
        </ol>
      </div>

      {/* Document Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 6, fontSize: 9.5, color: '#94a3b8' }}>
        <span>Page 1/1</span>
        <span>This is a digitally signed document.</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 2: SWIPE CLASSIC FRAMED GST (Tata Motors Style)        */
/* ------------------------------------------------------------------ */
export const SwipeClassicFramedTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const isPaid = invoice.status === 'Paid';
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state ? `${settings.companyState || '36'}-${brand.state.toUpperCase()}` : `${settings.companyState || '36-TELANGANA'}`;

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
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '1px solid #0f172a' }}>
          {/* Company Details */}
          <div style={{ padding: '12px 14px', borderRight: '1px solid #0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/retentio-logo-horizontal.png"
                alt={settings.companyName}
                style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                  {settings.companyName || 'TATA MOTORS LIMITED'}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0f172a' }}>
                  GSTIN {settings.companyGst || '27AAACT2727Q1ZW'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
              {settings.companyAddress || 'Nigadi Bhosari Road, PIMPRI, Pune, MAHARASHTRA, 411018'}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
              Mobile: {settings.companyPhone || '9999999999'} &nbsp;
              Email: {settings.companyEmail || 'Swipe@getswipe.in'}
            </div>
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
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{placeOfSupply}</div>
              </div>
              <div style={{ padding: '6px 10px' }}>
                <span style={{ color: '#64748b' }}>Due Date:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{invoice.dueDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '1.5px solid #0f172a', fontSize: 10.5 }}>
          <div style={{ padding: '8px 14px', borderRight: '1px solid #0f172a' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Customer Details:</span>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a', marginTop: 1 }}>{invoice.brandName || brand?.name || 'Client'}</div>
            <div style={{ fontWeight: 600, color: '#475569', marginTop: 2 }}>Billing address:</div>
            <div style={{ color: '#475569', lineHeight: 1.35 }}>
              {brand?.billingAddress || 'Survey 115/1, ISB Rd, Financial District, Gachibowli, Nanakramguda, Hyderabad, 500032'}
            </div>
            <div style={{ color: '#475569', marginTop: 2 }}>Ph: {brand?.mobile || '9999999999'}</div>
          </div>
          <div style={{ padding: '8px 10px' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Shipping address:</span>
            <div style={{ color: '#475569', marginTop: 2, lineHeight: 1.35 }}>
              {brand?.billingAddress || 'Survey 115/1, ISB Rd, Financial District, Gachibowli, Nanakramguda, Hyderabad, 500032'}
            </div>
          </div>
        </div>

        {/* Line Items Table with Box Dividers */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #0f172a', fontWeight: 800, color: '#0f172a' }}>
              <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', width: 28, textAlign: 'center' }}>#</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', width: 85 }}>HSN/SAC</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right', width: 85 }}>Rate/ Item</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', width: 45 }}>Qty</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right', width: 85 }}>Taxable Value</th>
              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right', width: 90 }}>Tax Amount</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: 95 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, idx) => {
              const itemTax = invoice.hasGst ? ((it.amount * 0.18) / 1.18) : 0;
              const itemTaxable = it.amount - itemTax;
              return (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '8px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{it.description}</div>
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>
                    {it.hsnSac || '87038070'}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {Number(it.unitPrice || it.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                    {it.quantity || 1}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {Number(itemTaxable || it.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {invoice.hasGst ? `${Number(itemTax).toFixed(2)} (18%)` : '0.00'}
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800 }}>
                    {Number(it.amount).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Subtotal & Tax Calculation Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', borderBottom: '1.5px solid #0f172a', fontSize: 10.5 }}>
          <div style={{ padding: '8px 12px', borderRight: '1px solid #0f172a', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>Total Items / Qty : {invoice.items.length} / {totalQty}.000</span>
          </div>
          <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Taxable Amount</span>
              <span style={{ fontWeight: 800 }}>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.hasGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>{invoice.gstType === 'IGST' ? 'IGST 18.0%' : 'CGST + SGST (18%)'}</span>
                <span style={{ fontWeight: 700 }}>₹{(invoice.igstAmount || (invoice.cgstAmount + invoice.sgstAmount)).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: 3, fontWeight: 900, fontSize: 13 }}>
              <span>Total</span>
              <span>₹{invoice.totalAmount.toFixed(2)}</span>
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
                <th style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>Integrated Tax Amount</th>
                <th style={{ padding: '4px 6px', textAlign: 'right' }}>Total Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => {
                const tax = invoice.hasGst ? ((it.amount * 0.18) / 1.18) : 0;
                const val = it.amount - tax;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{it.hsnSac || '87038070'}</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>{val.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>{invoice.hasGst ? '18%' : '0%'}</td>
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
              ✓ Amount Paid: ₹{invoice.totalAmount.toFixed(2)}
            </div>
          )}
        </div>

        {/* Footer 3-Grid: Bank Details | Pay using UPI | Signatory */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', borderBottom: '1px solid #0f172a', fontSize: 10.5 }}>
          <div style={{ padding: '10px 12px', borderRight: '1px solid #0f172a' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Bank Details:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', gap: '2px 6px', color: '#334155' }}>
              <span style={{ color: '#64748b' }}>Bank:</span>
              <span style={{ fontWeight: 700 }}>{settings.bankAccountName || 'YES BANK'}</span>
              <span style={{ color: '#64748b' }}>Account #:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankAccountNumber || '667899992222445'}</span>
              <span style={{ color: '#64748b' }}>IFSC:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankIfsc || 'YESBBIN4567'}</span>
              <span style={{ color: '#64748b' }}>Branch:</span>
              <span>{settings.bankBranch || 'Kodihalli'}</span>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRight: '1px solid #0f172a', display: 'flex', justifyContent: 'center' }}>
            <DynamicUpiQrCode
              upiId={settings.upiId}
              companyName={settings.companyName}
              amount={isPaid ? 0 : invoice.totalAmount}
              invoiceNumber={invoice.invoiceNumber}
            />
          </div>

          <div style={{ padding: '10px 12px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>For {settings.companyName || 'TATA MOTORS LIMITED'}</div>
            <AuthorizedSignatoryStamp companyName={settings.companyName} />
          </div>
        </div>

        {/* Notes & Terms Box */}
        <div style={{ padding: '8px 12px', fontSize: 9.5, color: '#475569', lineHeight: 1.45, background: '#f8fafc' }}>
          <div><span style={{ fontWeight: 700, color: '#0f172a' }}>Notes:</span> Thank you for the Business</div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 3 }}>Terms and Conditions:</div>
          <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
            <li>Goods once sold cannot be taken back or exchanged.</li>
            <li>We are not the manufacturers; company will stand for warranty as per their terms and conditions.</li>
            <li>Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</li>
            <li>Subject to local Jurisdiction.</li>
          </ol>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 9, color: '#64748b' }}>
        <span>Page 1/1</span>
        <span>This is a digitally signed document.</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 3: SWIPE VIBRANT NAVY (Samsung Style)                   */
/* ------------------------------------------------------------------ */
export const SwipeVibrantNavyTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const isPaid = invoice.status === 'Paid';
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state ? `${settings.companyState || '09'}-${brand.state.toUpperCase()}` : `${settings.companyState || '09-UTTARPRADESH'}`;

  return (
    <div className="swipe-template-root swipe-navy" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 24, fontSize: 11.5 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#002c6c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: 16 }}>
              {(settings.companyName || 'S').slice(0, 1)}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#002c6c' }}>{settings.companyName || 'Samsung'}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>GSTIN {settings.companyGst || '27AAAACT2727Q1ZW'}</div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', maxWidth: 360, lineHeight: 1.4 }}>
            {settings.companyAddress || 'DLF Centre, Sansad Marg 6th Floor, Delhi, 110001'}
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>Mobile {settings.companyPhone || '9999999999'}</div>
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
          <div style={{ fontSize: 10.5, color: '#475569' }}>Ph: {brand?.mobile || '9999999999'}</div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2 }}>{brand?.billingAddress || 'Babuganj, Hasanganj, Lucknow, UTTARPRADESH, 226007'}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#002c6c', marginTop: 3 }}>
            Place of Supply: {placeOfSupply}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ship to:</div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 4 }}>
            {brand?.billingAddress || 'Babuganj, Hasanganj, Lucknow, UTTARPRADESH, 226007'}
          </div>
        </div>
      </div>

      {/* Items Table with Navy Solid Header Bar */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ background: '#002c6c', color: '#ffffff', fontSize: 10.5, fontWeight: 700 }}>
            <th style={{ padding: '8px 8px', textAlign: 'left', width: 32 }}>#</th>
            <th style={{ padding: '8px 8px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '8px 8px', textAlign: 'center', width: 85 }}>HSN/SAC</th>
            <th style={{ padding: '8px 8px', textAlign: 'right', width: 95 }}>Rate/ Item</th>
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
                {it.hsnSac || '8517'}
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

      {/* Summary with Round Off */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, color: '#64748b' }}>
          Total Items / Qty : {invoice.items.length} / {totalQty}.000
        </div>

        <div style={{ width: 260, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Taxable Amount</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{inr(invoice.subtotal)}</span>
          </div>
          {invoice.hasGst && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>IGST 18.0%</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{inr(invoice.igstAmount || (invoice.cgstAmount + invoice.sgstAmount))}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 10.5 }}>
            <span>Round Off</span>
            <span>0.00</span>
          </div>
          <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#002c6c' }}>
            <span>Total</span>
            <span>{inrPlain(invoice.totalAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            <span>Amount Payable:</span>
            <span>{inr(isPaid ? 0 : invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10.5, color: '#334155', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
      </div>

      {/* 3-Col Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 16, borderTop: '1px solid #cbd5e1', paddingTop: 14, marginBottom: 14 }}>
        <div>
          <DynamicUpiQrCode
            upiId={settings.upiId}
            companyName={settings.companyName}
            amount={isPaid ? 0 : invoice.totalAmount}
            invoiceNumber={invoice.invoiceNumber}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#002c6c', marginBottom: 4 }}>Bank Details:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '3px 8px', fontSize: 10.5, color: '#334155' }}>
            <span style={{ color: '#64748b' }}>Bank:</span>
            <span style={{ fontWeight: 700 }}>{settings.bankAccountName || 'YES BANK'}</span>
            <span style={{ color: '#64748b' }}>Account #:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankAccountNumber || '667899992222445'}</span>
            <span style={{ color: '#64748b' }}>IFSC:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankIfsc || 'YESBBIN4567'}</span>
            <span style={{ color: '#64748b' }}>Branch:</span>
            <span>{settings.bankBranch || 'Kodihalli'}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>For {settings.companyName || 'Samsung'}</div>
          <AuthorizedSignatoryStamp companyName={settings.companyName} />
        </div>
      </div>

      {/* Notes & Terms */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Notes:</div>
        <div>Thank you for the Business</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Terms and Conditions:</div>
        <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
          <li>Goods once sold cannot be taken back or exchanged.</li>
          <li>We are not the manufacturers; company will stand for warranty as per their terms and conditions.</li>
          <li>Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</li>
          <li>Subject to local Jurisdiction.</li>
        </ol>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 6, fontSize: 9.5, color: '#94a3b8' }}>
        <span>Page 1/1</span>
        <span>This is a digitally signed document | ORIGINAL FOR RECIPIENT</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  TEMPLATE 4: SWIPE EXECUTIVE CARD (Marico Style)                 */
/* ------------------------------------------------------------------ */
export const SwipeExecutiveCardTemplate: React.FC<TemplateProps> = ({ invoice, settings, brand }) => {
  const isPaid = invoice.status === 'Paid';
  const amountInWords = numberToWordsINR(invoice.totalAmount);
  const totalQty = invoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const placeOfSupply = brand?.state ? brand.state.toUpperCase() : 'TELANGANA';

  return (
    <div className="swipe-template-root swipe-executive" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#ffffff', padding: 24, fontSize: 11.5 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <img
            src="/retentio-logo-horizontal.png"
            alt={settings.companyName}
            style={{ maxHeight: 38, maxWidth: 140, objectFit: 'contain', marginBottom: 6 }}
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{settings.companyName || 'Marico Limited'}</div>
          <div style={{ fontSize: 10.5, color: '#475569', maxWidth: 360, marginTop: 2, lineHeight: 1.4 }}>
            {settings.companyAddress || '7th Floor, Grande Palladium, 175, CST Road, Kalina, Santacruz East, Mumbai, 400098'}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
            GSTIN : {settings.companyGst || '27AAACM3452J1ZK'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', color: '#0f172a' }}>TAX INVOICE</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>ORIGINAL FOR RECIPIENT</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '3px 12px', marginTop: 10, fontSize: 10.5, textAlign: 'left' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Phone:</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{settings.companyPhone || '+91 22 6648 0480'}</span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Email:</span>
            <span style={{ color: '#0f172a' }}>{settings.companyEmail || 'consumer@marico.com'}</span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Website:</span>
            <span style={{ color: '#0f172a' }}>www.retentio.co</span>
          </div>
        </div>
      </div>

      {/* Tinted Metadata Card (Bill To | Ship To | Details) */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bill to</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{invoice.brandName || brand?.name || 'Client'}</div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>
            {brand?.billingAddress || 'Flat No. 302, Sai Residency, Madhapur Main Road, Hyderabad, 500081'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ship to</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{invoice.brandName || brand?.name || 'Client'}</div>
          <div style={{ fontSize: 10.5, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>
            {brand?.billingAddress || 'Flat No. 302, Sai Residency, Madhapur Main Road, Hyderabad, 500081'}
          </div>
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
            <span style={{ color: '#64748b' }}>Place of Supply</span>
            <span style={{ fontWeight: 700 }}>{placeOfSupply}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ borderTop: '1.5px solid #cbd5e1', borderBottom: '1.5px solid #cbd5e1', fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>
            <th style={{ padding: '7px 8px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '7px 8px', textAlign: 'left' }}>Description</th>
            <th style={{ padding: '7px 8px', textAlign: 'center', width: 45 }}>Qty</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 90 }}>Rate</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 85 }}>Tax</th>
            <th style={{ padding: '7px 8px', textAlign: 'right', width: 95 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, idx) => (
            <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
              <td style={{ padding: '9px 8px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{it.description}</div>
                <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 1 }}>HSN: {it.hsnSac || '898712'}</div>
              </td>
              <td style={{ padding: '9px 8px', color: '#475569' }}>
                {it.description || 'Premium Service Retainer'}
              </td>
              <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                {it.quantity || 1}
              </td>
              <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                {Number(it.unitPrice || it.amount).toFixed(2)}
              </td>
              <td style={{ padding: '9px 8px', textAlign: 'right', color: '#475569' }}>
                {invoice.hasGst ? `${((it.amount * 0.18) / 1.18).toFixed(2)} (18%)` : '0.00'}
              </td>
              <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                {Number(it.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary with CGST / SGST */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, color: '#64748b' }}>
          Total Items / Qty : {invoice.items.length} / {totalQty}.000
        </div>

        <div style={{ width: 260, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {invoice.hasGst && invoice.gstType !== 'IGST' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>CGST (9%)</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{inr(invoice.cgstAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>SGST (9%)</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{inr(invoice.sgstAmount)}</span>
              </div>
            </>
          ) : invoice.hasGst ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>IGST (18%)</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{inr(invoice.igstAmount)}</span>
            </div>
          ) : null}

          <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
            <span>Total</span>
            <span>{inrPlain(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 10.5, color: '#334155', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total amount (in words):</span> {amountInWords}
      </div>

      {/* 3-Col Footer with Receiver Signature */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 16, borderTop: '1px solid #cbd5e1', paddingTop: 14, marginBottom: 14 }}>
        <div>
          <DynamicUpiQrCode
            upiId={settings.upiId}
            companyName={settings.companyName}
            amount={isPaid ? 0 : invoice.totalAmount}
            invoiceNumber={invoice.invoiceNumber}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Bank Details:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '3px 8px', fontSize: 10.5, color: '#334155' }}>
            <span style={{ color: '#64748b' }}>Bank:</span>
            <span style={{ fontWeight: 700 }}>{settings.bankAccountName || 'HDFC Bank'}</span>
            <span style={{ color: '#64748b' }}>Account #:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankAccountNumber || '50200034567891'}</span>
            <span style={{ color: '#64748b' }}>IFSC Code:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.bankIfsc || 'HDFC0000240'}</span>
            <span style={{ color: '#64748b' }}>Branch:</span>
            <span>{settings.bankBranch || 'Kalina, Santacruz East, Mumbai'}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>For {settings.companyName || 'Marico Limited'}</div>
          <AuthorizedSignatoryStamp companyName={settings.companyName} />
        </div>
      </div>

      {/* Notes & Terms & Receiver Signature */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>Notes</div>
        <div>Thank you for the Business!</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Terms &amp; Condition</div>
        <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
          <li>Goods once sold cannot be taken back or exchanged.</li>
          <li>Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</li>
          <li>Subject to local Jurisdiction.</li>
        </ol>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a', fontWeight: 600 }}>
          <span>Receiver's Signature:</span>
          <span style={{ borderBottom: '1px solid #0f172a', width: 150, display: 'inline-block' }}></span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', marginTop: 14, paddingTop: 6, fontSize: 9.5, color: '#94a3b8' }}>
        <span>Page 1/1</span>
        <span>This is a digitally signed document</span>
      </div>
    </div>
  );
};
