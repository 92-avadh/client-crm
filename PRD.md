# Retentio CRM — Security & Architectural Remediation PRD

## Task 1: Eliminate Hardcoded JWT Secret & Backdoor Clean-Data Endpoint (Wave 1)
- Remove `DEFAULT_SECRET` in `backend/src/middleware/auth.js` and `backend/src/services/auth.service.js`. Fail fast with `process.exit(1)` if `JWT_SECRET` is missing or < 32 characters in all environments.
- Delete `/api/auth/clean-data` routes in `backend/src/routes/auth.js` and `resetDatabase` in `backend/src/controllers/auth.controller.js`.
- Remove `DEV_LOG_OTP` logging in `backend/src/utils/mailer.js` and `backend/src/services/auth.service.js`.

## Task 2: Multi-Tenant Access Control & IDOR Remediation (Wave 2)
- Create `assertAgencyAccess(user, targetAgencyId, resourceName)` helper in `backend/src/utils/agency.js`.
- Scope `backend/src/services/payments.service.js` methods (`initiateRazorpay`, `recordPayment`, `updatePayment`, `deletePayment`) to agency.
- Scope `brands.controller.js` (`assignMembers`, `churn`), `invoices.controller.js` (`updateInvoiceStatus`), `recurring-invoices.controller.js`, `leads.controller.js`, `meetings.controller.js`, `projects.controller.js`, and `holidays.controller.js` by agency ID.
- Scope `notifications.controller.js` `markRead` to recipient/agency.
- Restrict `users.controller.js` `getUser` to self/admin and enforce last-admin guard on `deactivateUser`.
- Scope `portal.service.js` intake to agency slug and settings to `brand.agency_id`.
- Sanitize `/api/auth/search-agencies` and `/api/auth/status` public responses.

## Task 3: Financial Integrity & Razorpay Verification (Wave 3)
- In `backend/src/controllers/payments.controller.js` (`razorpayVerify`), query invoice server-side, verify agency ownership, calculate remaining balance, and validate against `amount`.
- Reject client-provided `brandId` and `brandName`.
- Persist Razorpay order details upon initiation.
- Remove post-hoc payment amount edits in `payments.service.js`.

## Task 4: SSRF Defense, MeetingsCalendar XSS & Network Hardening (Wave 4)
- Create `safeFetch` in `backend/src/utils/safeFetch.js` enforcing HTTPS, DNS resolution, and blocking private/loopback/metadata IP ranges (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- Update `backend/src/services/webhook.service.js` to use `safeFetch` and avoid reflecting remote bodies or errors.
- Sanitize `m.linkOrLocation` in `frontend/src/components/calendar/MeetingsCalendar.tsx` to prevent `javascript:` execution.
- Lower Express JSON limit to 1MB and tighten CORS origin matching in `server.js`.
- Remove `SMTP_ALLOW_SELF_SIGNED` bypass in `mailer.js`.

## Task 5: AppContext Error Honesty, OTP Brute-Force & Admin Wipe Audit (Wave 5)
- Remove fake fallback entity creation across the 5 paths in `frontend/src/context/AppContext.tsx` (lines ~1403, 1481, 1531, 2044, 2130); surface real errors to toast.
- Add `otpLimiter` to `/api/auth/reset-password` and `/api/auth/forgot-password` in `backend/src/routes/auth.js`.
- Hash OTPs at rest in `otp_verifications`; track attempts and revoke after max retries.
- Add confirmation token and audit logging to `settings.controller.js` `resetData`.
