/**
 * Maps technical/backend errors to user-friendly, actionable messages.
 *
 * Never surface raw database, HTTP, or network internals to the user — they
 * leak implementation detail (table names, constraint names, stack shapes) and
 * mean nothing to a non-technical person. Log the real error to the console.
 */

const RULES: Array<[RegExp, string]> = [
  // ── Network / connectivity ───────────────────────────────
  [/failed to fetch|networkerror|network request failed|load failed/i,
   'Unable to connect to the server. Please check your internet connection or try again shortly.'],
  [/timeout|timed out|etimedout|aborted/i,
   'The request took too long to complete. Please try again.'],
  [/cors|blocked by cors/i,
   'Connection issue with server. Please try again in a few moments.'],

  // ── Auth & Registration ──────────────────────────────────
  [/already registered|email.*already exists|user.*already exists/i,
   'This email is already registered. Please sign in instead.'],
  [/invalid email or password|invalid credentials/i,
   'Invalid email or password. check your credentials'],
  [/unauthorized|not authenticated|jwt|token expired|invalid token/i,
   'Your session has expired. Please sign in again.'],
  [/forbidden|not allowed|permission|access denied|unauthorized: admin/i,
   "You don't have permission to do that."],
  [/too many attempts|too many requests|rate limit/i,
   'Too many attempts. Please wait a few minutes and try again.'],

  // ── Data conflicts ───────────────────────────────────────
  [/already exists|duplicate|unique constraint|23505/i,
   'That record already exists. Please use a different value.'],
  [/not found|does not exist|no rows|404/i,
   'We could not find what you were looking for. It may have been removed.'],
  [/foreign key|violates foreign key|23503/i,
   'This item is linked to other records and cannot be changed right now.'],
  [/invalid input|validation|required|must be|23502/i,
   'Please check the details you entered and try again.'],

  // ── Server / database ────────────────────────────────────
  [/server error|internal server error|500|unhandled/i,
   'Something went wrong on our end. Please try again in a moment.'],
  [/econnrefused|enotfound|ehostunreach|database|relation .* does not exist/i,
   'The service is temporarily unavailable. Please try again shortly.'],
  [/failed to send otp|failed to resend otp/i,
   "We couldn't send the verification code. Please try again."],
  [/otp|verification code/i,
   'That verification code is not valid. Please check and try again.'],
];

const GENERIC = 'Something went wrong. Please try again or contact support.';

/**
 * Convert any thrown value into a safe, human-readable message.
 * Always logs the original to the console for debugging.
 */
export function getNaturalErrorMessage(error: unknown): string {
  const raw =
    typeof error === 'string' ? error
    : error instanceof Error ? error.message
    : (error as any)?.error ?? (error as any)?.message ?? '';

  if (typeof error !== 'string') {
    // Keep the real error visible to developers only.
    console.error('[API error]', error);
  }

  const text = String(raw || '').trim();
  if (!text) return GENERIC;

  // An explicit, already-friendly backend message passes through.
  const isTechnical =
    /[{}]|<\/?[a-z]|\.js:\d|at \w+ \(|select |insert |update |delete |pg_|sqlstate|column |constraint |violates /i.test(text);

  for (const [pattern, friendly] of RULES) {
    if (pattern.test(text)) return friendly;
  }

  return isTechnical ? GENERIC : text;
}
