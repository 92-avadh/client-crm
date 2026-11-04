/**
 * Retentio File & Media Validation Engine
 * 
 * Provides centralized, zero-trust validation for:
 * 1. Profile photos and realistic avatars (JPG, PNG, WebP, GIF - max 5MB)
 * 2. Agency & invoice logos (PNG, JPG, WebP, SVG - max 5MB)
 * 3. Client vault documents & contracts (PDF, DOC, DOCX, XLS, XLSX, Images - max 10MB)
 * 4. Expense receipts & proofs (JPG, PNG, WebP, PDF - max 5MB)
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  formattedSize?: string;
  extension?: string;
}

/** Formats byte size to human-readable string (e.g. 2.4 MB, 450 KB) */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

/** Extracts file extension in lowercase without leading dot */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase().trim() : '';
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. Image & Avatar Validation
 * ───────────────────────────────────────────────────────────────────────────── */

export const AVATAR_ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
export const AVATAR_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
export const AVATAR_MAX_SIZE_MB = 5;
export const AVATAR_FORMAT_HINT = 'JPG, PNG, WebP, GIF · Max 5MB';

export const LOGO_ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
export const LOGO_ALLOWED_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];
export const LOGO_MAX_SIZE_MB = 5;
export const LOGO_FORMAT_HINT = 'PNG, JPG, WebP, SVG · Max 5MB';

export function validateImageFile(
  file: File,
  options?: {
    maxSizeMB?: number;
    allowSvg?: boolean;
    allowGif?: boolean;
  }
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const maxSizeMB = options?.maxSizeMB ?? AVATAR_MAX_SIZE_MB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const allowSvg = options?.allowSvg ?? false;
  const allowGif = options?.allowGif ?? true;

  const ext = getFileExtension(file.name);
  const mime = (file.type || '').toLowerCase();

  const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowGif) {
    allowedExts.push('gif');
    allowedMimes.push('image/gif');
  }

  if (allowSvg) {
    allowedExts.push('svg');
    allowedMimes.push('image/svg+xml');
  }

  const hasValidExt = allowedExts.includes(ext);
  const hasValidMime = allowedMimes.includes(mime) || (mime.startsWith('image/') && hasValidExt);

  if (!hasValidExt && !hasValidMime) {
    const formattedList = allowedExts.map((e) => e.toUpperCase()).join(', ');
    return {
      valid: false,
      error: `Unsupported file format. Please upload an image in ${formattedList} format.`,
      extension: ext,
      formattedSize: formatFileSize(file.size),
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${maxSizeMB}MB.`,
      extension: ext,
      formattedSize: formatFileSize(file.size),
    };
  }

  return {
    valid: true,
    extension: ext,
    formattedSize: formatFileSize(file.size),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. Document & Contract Vault Validation
 * ───────────────────────────────────────────────────────────────────────────── */

export const DOC_ALLOWED_EXTS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'webp',
];

export const DOC_ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export const DOC_MAX_SIZE_MB = 10;
export const DOC_FORMAT_HINT = 'PDF, DOC, DOCX, XLS, XLSX, PNG, JPG · Max 10MB';

export function validateDocumentFile(
  file: File,
  options?: { maxSizeMB?: number }
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const maxSizeMB = options?.maxSizeMB ?? DOC_MAX_SIZE_MB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const ext = getFileExtension(file.name);
  const mime = (file.type || '').toLowerCase();

  const hasValidExt = DOC_ALLOWED_EXTS.includes(ext);
  const hasValidMime = DOC_ALLOWED_MIMES.includes(mime) || hasValidExt;

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a PDF, Word document, Excel spreadsheet, or image.',
      extension: ext,
      formattedSize: formatFileSize(file.size),
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Document is too large (${formatFileSize(file.size)}). Maximum allowed size is ${maxSizeMB}MB.`,
      extension: ext,
      formattedSize: formatFileSize(file.size),
    };
  }

  return {
    valid: true,
    extension: ext,
    formattedSize: formatFileSize(file.size),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. Expense Receipt & Proof Validation
 * ───────────────────────────────────────────────────────────────────────────── */

export const RECEIPT_ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
export const RECEIPT_ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const RECEIPT_MAX_SIZE_MB = 5;
export const RECEIPT_FORMAT_HINT = 'JPG, PNG, WebP, PDF · Max 5MB';

export function validateReceiptFile(
  file: File,
  options?: { maxSizeMB?: number }
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const maxSizeMB = options?.maxSizeMB ?? RECEIPT_MAX_SIZE_MB;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const ext = getFileExtension(file.name);
  const mime = (file.type || '').toLowerCase();

  const hasValidExt = RECEIPT_ALLOWED_EXTS.includes(ext);
  const hasValidMime = RECEIPT_ALLOWED_MIMES.includes(mime) || (mime.startsWith('image/') && hasValidExt);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Unsupported receipt format. Please upload a PDF receipt or an image (JPG, PNG, WebP).',
      extension: ext,
      formattedSize: formatFileSize(file.size),
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Receipt file is too large (${formatFileSize(file.size)}). Maximum size is ${maxSizeMB}MB.`,
      extension: ext,
      formattedSize: formatFileSize(file.size),
    };
  }

  return {
    valid: true,
    extension: ext,
    formattedSize: formatFileSize(file.size),
  };
}

