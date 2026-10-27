# Project Requirements — Security Remediation & Stabilization

## Phase 1: Hardened Secrets & Backdoor Elimination (P0)
- **REQ-SEC-01**: Remove `DEFAULT_SECRET` from `middleware/auth.js` and `services/auth.service.js`. Unconditionally `process.exit(1)` if `JWT_SECRET` is missing or shorter than 32 characters in all environments.
- **REQ-SEC-02**: Completely remove `/api/auth/clean-data` route and `resetDatabase` controller. Purge the hardcoded secret `retentio-reset-2026`.
- **REQ-SEC-03**: Eliminate `DEV_LOG_OTP` from `mailer.js` and `auth.service.js` to prevent leaking OTP credentials in console logs.

## Phase 2: Tenant Isolation & Multi-Tenant IDOR Elimination (P0 / P1)
- **REQ-TEN-01**: Implement centralized `assertAgencyAccess(user, resourceAgencyId, resourceName)` helper in `backend/src/utils/agency.js`.
- **REQ-TEN-02**: Scope all payment endpoints and queries by `agency_id` (`initiateRazorpay`, `recordPayment`, `updatePayment`, `deletePayment`).
- **REQ-TEN-03**: Scope brands actions (`assignMembers`, `churn`), invoices (`updateInvoiceStatus`), recurring invoices, leads, meetings, and projects by agency.
- **REQ-TEN-04**: Scope `notifications.markRead(id)` to caller user ID / agency.
- **REQ-TEN-05**: Restrict `users.getUser` PII disclosure to self/admin, and enforce last-admin check on `deactivateUser`.
- **REQ-TEN-06**: Scope portal intake and settings to specific agency slug and `brand.agency_id` rather than global `WHERE id = 'main'`.
- **REQ-TEN-07**: Sanitize `/api/auth/search-agencies` and `/api/auth/status` to prevent public enumeration of founder emails, IDs, and user counts.

## Phase 3: Payment Verification & Financial Integrity (P1)
- **REQ-FIN-01**: Fetch invoice server-side in `razorpayVerify` to assert `body.amount` matches required balance. Reject client-supplied `brandId` and `brandName`.
- **REQ-FIN-02**: Persist created Razorpay order references for post-payment reconciliation.
- **REQ-FIN-03**: Disallow post-hoc modification of payment amounts in `updatePayment`; restrict status adjustments to admin/hr with audit logs.

## Phase 4: SSRF, Injection & Client-Side XSS Defenses (P1)
- **REQ-NET-01**: Create `safeFetch(url, options)` validating protocol (`https:` only), resolving DNS, and blocking loopback/private/metadata ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`). Apply to `webhook.service.js`.
- **REQ-XSS-01**: Sanitize `linkOrLocation` in `MeetingsCalendar.tsx` to allow only `http:`, `https:`, `mailto:`, and `tel:` schemes, rendering plain text on invalid schemes.
- **REQ-NET-02**: Lower global body parser limit to 1MB.
- **REQ-NET-03**: Tighten CORS allowed origins to exact matches instead of permissive regexes.
- **REQ-NET-04**: Remove `SMTP_ALLOW_SELF_SIGNED` bypass in mailer.

## Phase 5: Error Honesty, Rate Limiting & Admin Auditing (P2)
- **REQ-UX-01**: Remove all 5 local fallback fake record generation paths in `AppContext.tsx` (`id: 'brand_' + Date.now()`). Surface honest error toasts.
- **REQ-AUTH-01**: Add `otpLimiter` to `/reset-password` and `/forgot-password`.
- **REQ-AUTH-02**: Hash OTP codes at rest in `otp_verifications`; increment attempt counts and revoke on maximum failed attempts.
- **REQ-AUD-01**: Require confirmation token and audit logging for `resetData` in `settings.controller.js`.
