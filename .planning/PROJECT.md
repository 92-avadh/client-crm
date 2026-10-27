# Retentio Client CRM — Security Hardening & Multi-Tenant Architecture

## Project Vision & Context
Retentio is an agency client management and billing CRM built with a React/TypeScript frontend (Vite, Tailwind/Vanilla CSS tokens) and a Node.js/Express/PostgreSQL backend.

This milestone focuses on complete architectural and security remediation across 23 identified vulnerabilities, eliminating hardcoded credentials/backdoors, enforcing strict multi-tenant boundaries (IDOR elimination), securing financial transactions (Razorpay integration), mitigating SSRF/XSS attack vectors, and ensuring error honesty in the client application.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS design tokens (`var(--bg-card)`, `var(--text-primary)`, etc.), Lucide React icons
- **Backend**: Node.js, Express, PostgreSQL (`pg` pool with transactions), JWT authentication, Bcrypt
- **Integrations**: Razorpay (HMAC-SHA256 signature verification), Nodemailer, Discord/Slack webhooks

## Primary Architectural Invariants
1. **Zero Hardcoded Secrets**: Fail fast unconditionally across all environments if `JWT_SECRET` is missing or < 32 characters.
2. **Strict Multi-Tenant Isolation**: Every database mutation and read-by-ID must assert agency scoping (`agency_id`). No cross-tenant reads or writes.
3. **Defense-in-Depth for Financials**: Razorpay order reconciliation, server-side amount calculation, and invoice state lock. Never trust client-submitted amounts.
4. **Zero-Trust Network Boundaries**: Strict SSRF guard (`safeFetch`) blocking loopback/private/metadata IPs, HTTPS only.
5. **Error Honesty**: Never fabricate records on API errors; bubble errors up to user feedback.
