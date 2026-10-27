# Retentio CRM — Project State

## Current Position
- **Active Phase**: Phase 1 — Hardened Secrets & Backdoor Elimination (P0)
- **Status**: Starting Wave 1 execution
- **Last Verification**: Baseline audit verified against working tree

## Key Decisions
- Zero tolerance for fallback JWT secrets in all environments (`process.exit(1)` if missing or < 32 characters).
- Total removal of unauthenticated `/clean-data` backdoor.
- Enforce agency boundary on every resource read-by-ID and mutation.
