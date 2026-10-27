# Retentio CRM — Security & Architectural Roadmap

## Milestones & Phasing Overview

### Phase 1: Hardened Secrets & Backdoor Elimination (P0)
- **Goal**: Eliminate immediate token forgery and unauthenticated database wipe vectors.
- **Tasks**:
  - Remove `DEFAULT_SECRET` in `middleware/auth.js` and `services/auth.service.js`. Fail fast on missing/short secret.
  - Delete `/api/auth/clean-data` route and `resetDatabase` controller.
  - Eliminate `DEV_LOG_OTP` console leakage.
- **Verification**: Ensure server starts only with valid `JWT_SECRET`; `/api/auth/clean-data` returns 404; logs contain no OTPs.

### Phase 2: Tenant Isolation & Multi-Tenant IDOR Elimination (P0/P1)
- **Goal**: Guarantee zero cross-tenant read/write leakage across all entities.
- **Tasks**:
  - Implement `assertAgencyAccess` utility.
  - Scope Payments, Brands, Invoices, Recurring Invoices, Leads, Meetings, Projects, Holidays.
  - Scope Notifications and User PII/Deactivation.
  - Scope Portal Intake and Agency Settings.
- **Verification**: Cross-tenant requests with non-matching `agency_id` reject with 403 Forbidden.

### Phase 3: Payment Verification & Financial Integrity (P1)
- **Goal**: Prevent fraudulent payment records and untrusted amount tampering.
- **Tasks**:
  - Server-side amount validation against invoice balance in `razorpayVerify`.
  - Order persistence and reconciliation.
  - Prevent post-hoc amount modification in `updatePayment`.
- **Verification**: Signature verification rejects manipulated amounts; invoices update correctly.

### Phase 4: SSRF, Injection & Client-Side XSS Defenses (P1)
- **Goal**: Eliminate server-side request forgery, XSS execution, and network boundary risks.
- **Tasks**:
  - Implement `safeFetch` DNS/IP filtering for webhooks.
  - Sanitize `m.linkOrLocation` in `MeetingsCalendar.tsx`.
  - Tighten CORS, Express body limits, and TLS validation.
- **Verification**: Webhook test rejecting `169.254.169.254` and `localhost`; `javascript:` links sanitized.

### Phase 5: Error Honesty, Rate Limiting & Admin Auditing (P2)
- **Goal**: Ensure reliable client error feedback, brute-force OTP protection, and audited wipe actions.
- **Tasks**:
  - Remove fake fallback entity creation in `AppContext.tsx`.
  - Attach rate limits to password reset; hash OTPs at rest.
  - Secure and audit admin reset endpoint.
- **Verification**: Client displays error notification instead of phantom entity; OTP brute force blocked.
