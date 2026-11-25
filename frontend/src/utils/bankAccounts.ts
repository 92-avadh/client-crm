import type { AppSettings, BankAccount, Invoice } from '../types';

export const MAX_BANK_ACCOUNTS = 2;

export function normalizeBankAccounts(settings?: Partial<AppSettings> | null): BankAccount[] {
  if (!settings) return [];
  const raw = Array.isArray(settings.bankAccounts) ? settings.bankAccounts : [];
  if (raw.length > 0) {
    const cleaned = raw.slice(0, MAX_BANK_ACCOUNTS).map((b, i) => ({
      id: b.id || `bank_${i + 1}`,
      bankName: b.bankName || '',
      bankAccountName: b.bankAccountName || '',
      bankAccountNumber: b.bankAccountNumber || '',
      bankIfsc: b.bankIfsc || '',
      bankBranch: b.bankBranch || '',
      upiId: b.upiId || '',
      qrCodeUrl: b.qrCodeUrl || '',
      isDefault: Boolean(b.isDefault),
    }));
    if (!cleaned.some((b) => b.isDefault)) cleaned[0].isDefault = true;
    return cleaned;
  }

  if (
    settings.bankName ||
    settings.bankAccountName ||
    settings.bankAccountNumber ||
    settings.bankIfsc ||
    settings.upiId
  ) {
    return [
      {
        id: 'bank_1',
        bankName: settings.bankName || '',
        bankAccountName: settings.bankAccountName || '',
        bankAccountNumber: settings.bankAccountNumber || '',
        bankIfsc: settings.bankIfsc || '',
        bankBranch: settings.bankBranch || '',
        upiId: settings.upiId || '',
        qrCodeUrl: '',
        isDefault: true,
      },
    ];
  }

  return [];
}

export function resolveInvoiceBank(
  invoice?: Partial<Invoice> | null,
  settings?: Partial<AppSettings> | null
): BankAccount | null {
  const snap = invoice?.bankAccountSnapshot;
  if (
    snap &&
    (snap.bankName || snap.bankAccountName || snap.bankAccountNumber || snap.bankIfsc || snap.upiId || snap.qrCodeUrl)
  ) {
    return snap;
  }

  const accounts = normalizeBankAccounts(settings);
  if (invoice?.bankAccountId) {
    const match = accounts.find((a) => a.id === invoice.bankAccountId);
    if (match) return match;
  }

  return accounts.find((a) => a.isDefault) || accounts[0] || null;
}

export function buildUpiDeepLink({
  upiId,
  companyName,
  amount,
  invoiceNumber,
}: {
  upiId?: string;
  companyName?: string;
  amount?: number;
  invoiceNumber?: string;
}): string | null {
  const cleanUpi = (upiId || '').trim();
  if (!cleanUpi) return null;
  const pn = encodeURIComponent((companyName || 'Merchant').trim());
  const tn = encodeURIComponent(invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice Payment');
  const amt = Number(amount || 0);
  const amPart = amt > 0 ? `&am=${amt.toFixed(2)}` : '';
  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${pn}${amPart}&tn=${tn}&cu=INR`;
}
