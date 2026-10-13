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
  return !!errors[field];
}
