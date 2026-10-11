/**
 * Shallow "has this form changed?" check used to guard against losing edits.
 *
 * Compares only the keys present in `initial`, so extra runtime fields on the
 * working copy (ids, timestamps) don't count as user edits. Numbers and
 * numeric strings are treated as equal so an untouched number input, which
 * hands back a string, doesn't read as dirty.
 */
export function isDirty(
  current: Record<string, any>,
  initial: Record<string, any>
): boolean {
  if (!current || !initial) return false;

  for (const key of Object.keys(initial)) {
    const a = current[key];
    const b = initial[key];

    if (a === b) continue;

    // '' and undefined both mean "empty" for form fields.
    const aEmpty = a === '' || a === undefined || a === null;
    const bEmpty = b === '' || b === undefined || b === null;
    if (aEmpty && bEmpty) continue;

    // Number <-> numeric string equivalence.
    if (typeof a === 'number' || typeof b === 'number') {
      if (Number(a) === Number(b)) continue;
    }

    // Arrays: shallow compare by value.
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length === b.length && a.every((v, i) => v === b[i])) continue;
    }

    return true;
  }

  return false;
}
