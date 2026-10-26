/**
 * Shared date helpers for backend services.
 * Ensures all DATE columns are normalized to clean 'YYYY-MM-DD' strings,
 * preventing ISO timestamp pollution, timezone drift, and invalid HTML date input values.
 */

function formatDateOnly(d) {
  if (!d) return null;
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (!trimmed) return null;
    return trimmed.split('T')[0];
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return String(d).split('T')[0];
}

module.exports = {
  formatDateOnly,
};
