export interface ValidationResult {
  valid: boolean;
  errors: Record<string, boolean>;
  message: string;
}

export function validateClientForm(data: Record<string, any>): ValidationResult {
  const errors: Record<string, boolean> = {};
  if (!data.name) errors.name = true;
  if (!data.email) errors.email = true;
  if (!data.mobile) errors.mobile = true;

  const valid = Object.keys(errors).length === 0;
  return { valid, errors, message: valid ? '' : 'Please fill in all required fields.' };
}

export function getFieldError(errors: Record<string, boolean>, field: string): boolean {
  return !errors[field];
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Input Validation & Sanitization Helpers
 * ───────────────────────────────────────────────────────────────────────────── */

/** Strips all characters except digits, +, spaces, hyphens, and parentheses */
export function sanitizePhone(input: string): string {
  if (!input) return '';
  return input.replace(/[^0-9+\s\-()]/g, '');
}

/** Validates international phone format and minimum/maximum digit length */
export function isValidPhone(
  phone: string,
  minDigits = 7,
  maxDigits = 15
): { valid: boolean; error?: string } {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Phone number is required.' };
  }
  // Count only numerical digits
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount < minDigits) {
    return {
      valid: false,
      error: `Phone number is too short (needs at least ${minDigits} digits).`,
    };
  }
  if (digitCount > maxDigits) {
    return {
      valid: false,
      error: `Phone number is too long (maximum ${maxDigits} digits).`,
    };
  }
  // Must match phone characters
  if (!/^[+]?[\d\s\-()]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Phone number contains invalid characters.',
    };
  }
  return { valid: true };
}

/** Strict email format regex check */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/** Validates Indian GSTIN format (15 characters) */
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return true; // Optional by default
  const clean = gstin.trim().toUpperCase();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);
}

/** Validates Indian PAN format (10 characters) */
export function isValidPAN(pan: string): boolean {
  if (!pan) return true; // Optional by default
  const clean = pan.trim().toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);
}

/** Validates monetary amount is non-negative and finite */
export function isValidAmount(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0;
}
