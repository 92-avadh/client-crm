# Retentio CRM — Project State

## Current Position
- **Active Phase**: Security Remediation & Architecture Hardening (All 5 Waves)
- **Status**: Completed & Verified
- **Last Verification**: Frontend build `npm run build` (`tsc -b && vite build`) passed with 0 errors; backend syntax verification (`node -c`) passed across all services.

## Key Decisions
- Zero tolerance for fallback JWT secrets in all environments (`process.exit(1)` if missing or < 32 characters).
- Total removal of unauthenticated `/clean-data` backdoor and `DEV_LOG_OTP` OTP console logging.
- Enforced strict multi-tenant agency boundaries on every resource read-by-ID and mutation (brands, invoices, payments, leads, meetings, projects, holidays, users, portal).
- Server-authoritative financial calculation and invoice balance verification on Razorpay payment reconciliation.
- Strict SSRF defense with private/loopback/cloud-metadata blocking (`safeFetch.js`).
- Meeting URL sanitization preventing `javascript:` XSS.
- Rate limiting on password reset and sensitive endpoints.
- Total eradication of silent mock fallbacks in `AppContext.tsx` — honest error handling throughout.
