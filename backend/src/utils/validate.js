/**
 * Lightweight request validation helpers.
 *
 * Every mutating endpoint must validate its input before it reaches the
 * database. These helpers return a collected list of human-readable problems
 * so the controller can answer with 400 and a single clear message.
 */

class ValidationError extends Error {
  constructor(problems) {
    super(problems.join(' '));
    this.name = 'ValidationError';
    this.status = 400;
    this.problems = problems;
  }
}

/** Collects field-level problems for one payload. */
function makeValidator(body = {}) {
  const problems = [];
  const value = (field) => body?.[field];

  const api = {
    /** Field must be present and a non-empty string. */
    requiredString(field, { max = 1000, label } = {}) {
      const v = value(field);
      const name = label || field;
      if (v === undefined || v === null || String(v).trim() === '') {
        problems.push(`${name} is required.`);
      } else if (typeof v !== 'string') {
        problems.push(`${name} must be text.`);
      } else if (v.trim().length > max) {
        problems.push(`${name} must be ${max} characters or fewer.`);
      }
      return api;
    },

    /** Optional string; validated only when provided. */
    optionalString(field, { max = 2000, label } = {}) {
      const v = value(field);
      if (v === undefined || v === null || v === '') return api;
      const name = label || field;
      if (typeof v !== 'string') problems.push(`${name} must be text.`);
      else if (v.length > max) problems.push(`${name} must be ${max} characters or fewer.`);
      return api;
    },

    /** Field must be a finite number within range. */
    number(field, { min = -Infinity, max = Infinity, required = false, label } = {}) {
      const v = value(field);
      const name = label || field;
      if (v === undefined || v === null || v === '') {
        if (required) problems.push(`${name} is required.`);
        return api;
      }
      const n = Number(v);
      if (!Number.isFinite(n)) problems.push(`${name} must be a number.`);
      else if (n < min || n > max) problems.push(`${name} must be between ${min} and ${max}.`);
      return api;
    },

    /** Field must be one of an allowlist. */
    oneOf(field, allowed, { required = false, label } = {}) {
      const v = value(field);
      const name = label || field;
      if (v === undefined || v === null || v === '') {
        if (required) problems.push(`${name} is required.`);
        return api;
      }
      if (!allowed.includes(v)) {
        problems.push(`${name} must be one of: ${allowed.join(', ')}.`);
      }
      return api;
    },

    /** Field must look like an email address. */
    email(field, { required = false, label } = {}) {
      const v = value(field);
      const name = label || field;
      if (v === undefined || v === null || v === '') {
        if (required) problems.push(`${name} is required.`);
        return api;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
        problems.push(`${name} must be a valid email address.`);
      }
      return api;
    },

    /** Field must be an array (optionally of strings). */
    array(field, { ofStrings = false, max = 500, label } = {}) {
      const v = value(field);
      if (v === undefined || v === null) return api;
      const name = label || field;
      if (!Array.isArray(v)) problems.push(`${name} must be a list.`);
      else if (v.length > max) problems.push(`${name} cannot contain more than ${max} items.`);
      else if (ofStrings && v.some((x) => typeof x !== 'string')) {
        problems.push(`${name} must contain only text values.`);
      }
      return api;
    },

    /** Escape hatch for custom rules. */
    check(condition, message) {
      if (!condition) problems.push(message);
      return api;
    },

    /** Throw a ValidationError if anything failed. */
    validate() {
      if (problems.length) throw new ValidationError(problems);
      return body;
    },
  };

  return api;
}

/** Reject unknown fields so clients cannot inject unexpected columns. */
function pickFields(body = {}, allowed = []) {
  const out = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  }
  return out;
}

module.exports = { makeValidator, ValidationError, pickFields };
