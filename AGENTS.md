# AI Engineering & Architecture Master Standard (A to Z)

This document is the authoritative engineering manual and operational contract for AI coding agents operating within this repository and across all projects. It defines mandatory design patterns, security defenses, architectural principles, and the A-to-Z encyclopedia of techniques.

---

## 0. 🚨 Mandatory Pre-Project & Pre-Task Kickoff Gate

**MANDATORY AGENT DIRECTIVE:** Before writing application code, scaffolding features, or implementing tasks on any new or uninitialized project, the agent **MUST** inspect the repository and verify the following pre-flight checklist. If any step is pending, the agent **MUST proactively remind the user** to complete it before writing code.

### The 5-Step Pre-Flight Checklist:
1. **[ ] Project Standards**: Does `AGENTS.md` exist in the project root with the target tech stack defined?
2. **[ ] GSD Core Planning**: Has the project run `/gsd-new-project`? (Check for `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and `.planning/ROADMAP.md`).
3. **[ ] Knowledge Graph**: Has `graphify update .` been executed so `graphify-out/graph.json` exists for contextual navigation?
4. **[ ] Code Review Auth**: Is the CodeRabbit CLI authenticated (`coderabbit auth status` / `cr review`)?
5. **[ ] Task Scoping**: If running an autonomous loop, is `PRD.md` structured with discrete `## Task N:` headings alongside an active `progress.txt`?

### Proactive Reminder Policy:
- If a user asks to build, modify, or kick off a project without these foundations in place, **DO NOT jump into blind code generation**.
- Proactively halt and remind the user:
  > *"⚠️ **Pre-Flight Kickoff Check:** Foundational project specs are currently pending:*
  > - *[List any missing items: GSD specs, Graphify index, CodeRabbit auth, PRD structure]*
  > *Let's run `/gsd-new-project` or complete the setup first to prevent context rot and ensure architectural alignment."*

---

## 1. Integrated Agent Frameworks & Workflows

### ⚡ GSD Core (Git. Ship. Done. — Spec-Driven Phasing)
- **Phase Loop**: Execute non-trivial work in disciplined phases: `Discuss` → `Plan` → `Execute (Waves)` → `Verify` → `Ship`.
- **Zero Context Rot**: Offload deep planning, codebase mapping, and architectural spike research to fresh-context subagents. Keep the primary session lean.
- **Phase Artifacts**:
  - `ROADMAP.md`: High-level milestone tracking and phase dependencies.
  - `PLAN.md`: Actionable, wave-structured tasks with explicit verification steps.
  - `VERIFICATION.md`: User acceptance and automated test criteria before shipping.
- **Verification Gates**: Never mark a phase complete until verified against automated checks and functional acceptance tests.

### 🦹 Ponytail (Lazy Senior Dev Mode — Maximum Efficiency)
- **Climb the 7-Rung Ladder Before Writing Code**:
  1. *YAGNI*: Does this actually need to be built? Question unnecessary requirements.
  2. *Reuse*: Does a helper, hook, or pattern already exist in the codebase?
  3. *Standard Library*: Does native JavaScript / TypeScript / Node.js stdlib already support this?
  4. *Platform*: Does the browser Web API or Next.js platform feature cover it?
  5. *Existing Deps*: Does an installed package in `package.json` already solve it?
  6. *One-Liner*: Can this be written cleanly in 1 to 3 lines?
  7. *Minimal Diff*: Only then write new custom code. Shortest working diff wins.
- **Root Cause Over Symptoms**: Fix bugs at the shared utility or callsite origin. Never scatter patch guards across individual callers.
- **Boring Over Clever**: Deletion over addition. Fewer files and minimal abstractions over premature architecture.

### 🕸️ Graphify (Knowledge-Graph Architecture Navigation)
- Before grepping or scanning files, inspect `graphify-out/` to understand node relationships, dependency paths, and god nodes.
- Query relationships via `graphify query` or `graphify path` before altering shared abstractions.
- Keep the graph synchronized after substantial modifications: run `graphify update .`.

### 🔁 Ralph Loop (Long-Running Autonomous Workflows)
- **Externalized Memory Pattern**:
  - `PRD.md`: Read-only requirements specification divided into discrete, self-contained `## Task N:` boundaries.
  - `progress.txt`: Append-only progress log tracking completed tasks, git commits, and iteration learnings.
- **Loop Cycle Protocol**:
  1. Read `progress.txt` to find the first unfinished task in `PRD.md`.
  2. Implement and test that single atomic task.
  3. Commit atomically to Git (`feat: complete Task N - <description>`).
  4. Append results and learnings to `progress.txt`.
  5. Repeat across fresh context cycles until all tasks pass.

### 🐰 CodeRabbit (Automated Code Review & Quality Gates)
- Pre-commit and pre-merge reviews using `cr review` or `coderabbit review --agent`.
- Zero tolerance for critical/warning issues: resolve security vulnerabilities, edge cases, and performance regressions immediately.
- Use `coderabbit-code-review` and `coderabbit-autofix` skills for AI-powered PR triage.

---

## 2. A to Z Engineering & Architecture Encyclopedia

### **A** — Accessibility (A11y) & AbortController
- **A11y**: Enforce WCAG 2.1 AA compliance. Use semantic HTML elements (`<main>`, `<nav>`, `<button>`). Ensure full keyboard navigability, logical `Tab` order, visible focus rings, ARIA roles (`aria-expanded`, `aria-label`, `aria-live`), and minimum 44×44px touch targets.
- **AbortController**: Stale requests must be cancelled when a new query or filter is triggered to prevent race conditions and unnecessary server load.

### **B** — Bundle Optimization & Boundary Validation
- **Bundle Optimization**: Code-split heavy components (dialogs, drawers, admin panels, rich charts) using `next/dynamic` or `React.lazy`. Avoid importing monolithic libraries when single utility imports suffice.
- **Boundary Validation**: Every untrusted input entering the application (API routes, server actions, webhooks, URL params, local storage) MUST be validated against strict schemas (e.g., Zod).

### **C** — Caching Strategies & CSRF Protection
- **Multi-Tier Caching**:
  - *Client*: SWR / React Query for deduplication, stale-while-revalidate, and offline persistence.
  - *Server / Edge*: Next.js fetch caching (`revalidateTag`, `revalidatePath`, `unstable_cache`), HTTP `Cache-Control` headers.
  - *Database*: In-memory (Redis / node-cache) for expensive aggregation or static catalog queries.
- **CSRF**: Enforce SameSite cookie policies (`SameSite=Lax` or `Strict`), custom request headers (`X-Requested-With`), and anti-CSRF tokens for state-changing mutations.

### **D** — Debouncing & Defensive Programming
- **Debouncing & Throttling**: Debounce text inputs, search fields, and autocomplete queries (250–350ms). Throttle scroll, resize, and mouse move handlers.
- **Defensive Programming**: Validate inputs early (fail-fast), handle `null`/`undefined` gracefully using optional chaining (`?.`) and nullish coalescing (`??`), and guarantee immutable state updates.

### **E** — Error Boundaries & Empathetic Feedback
- **Hierarchical Error Boundaries**: Wrap critical components and route layouts in Next.js `error.tsx` and React Error Boundaries to prevent full-page crashes.
- **Empathetic Feedback**: Never expose raw database errors, SQL syntax, or internal stack traces to end-users. Show clean, actionable messages with retry mechanisms and fallback navigation.

### **F** — FOUC Prevention & Form Resilience
- **FOUC (Flash of Unstyled Content)**: Prevent layout flashes and hydration mismatches. Use server-rendered critical CSS and avoid un-themed client-side renders.
- **Form Resilience**: Disable submit buttons during mutations, show pending spinners, preserve form draft state on failure, and validate inline on blur.

### **G** — Graceful Degradation & Garbage Collection
- **Graceful Degradation**: Core functionality must remain usable under degraded conditions (slow networks, disabled JavaScript, API latency).
- **Garbage Collection / Memory Leaks**: Always clean up event listeners, timers (`clearInterval`, `clearTimeout`), animation frames, and WebSocket subscriptions in `useEffect` cleanup return functions.

### **H** — Hydration Hygiene & HTTP Security Headers
- **Hydration Hygiene**: Prevent hydration mismatches by ensuring identical server/client render trees. Avoid rendering non-deterministic data (e.g., `new Date()`, random IDs) during initial SSR without matching client state.
- **Security Headers**: Enforce strict security headers:
  - `Content-Security-Policy` (CSP)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`

### **I** — Idempotency & Injection Defense
- **Idempotency**: Ensure financial, order, and mutative APIs are idempotent using idempotency keys (UUIDv4) to prevent duplicate processing from network retries.
- **Injection Defense**: Parameterize every database query. Never interpolate strings into SQL, shell commands, or HTML templates.

### **J** — JWT Security & JSON Handling
- **JWT & Sessions**: Store authentication tokens in `HttpOnly`, `Secure`, `SameSite` cookies. Never store sensitive tokens in `localStorage`. Use short-lived access tokens and refresh token rotation.
- **Safe JSON**: Wrap `JSON.parse` in try/catch or schema parsers to guard against malformed JSON payloads.

### **K** — Keyboard Navigation & Key Management
- **Keyboard Navigation**: Modal dialogs must trap focus, close on `Escape`, and return focus to the trigger element on close. Menus must support arrow key traversal.
- **Key Hygiene**: Use unique, stable keys in React lists. Never use array index (`index`) as a key when items can be filtered, sorted, or mutated.

### **L** — Lazy Loading & Layout Shift (CLS)
- **Lazy Loading**: Defer non-critical resources, below-the-fold images, and off-screen components.
- **Cumulative Layout Shift (CLS)**: Always provide explicit `width`, `height`, or `aspect-ratio` on images and containers. Use skeleton placeholders that mirror final element dimensions.

### **M** — Micro-Interactions & Memoization
- **Micro-Interactions**: Incorporate subtle, delightful feedback on interaction (200–300ms ease-out transitions, button hover states, active presses, badge pulses).
- **Memoization**: Use `useMemo` and `useCallback` judiciously when profiling demonstrates real re-render bottlenecks or when passing stable callbacks to memoized children (`React.memo`).

### **N** — Network Resilience & Null Safety
- **Network Resilience**: Implement exponential backoff with jitter on network retries for transient HTTP errors (500, 502, 503, 504).
- **Null Safety**: Enforce strict TypeScript null checking (`strictNullChecks: true`). Treat empty responses and external data defensively.

### **O** — Optimistic UI & Observability
- **Optimistic UI**: Update UI immediately upon user action (e.g., toggling a wishlist item, adding to cart, marking order shipped) and roll back gracefully with a toast alert if the mutation fails.
- **Observability**: Implement structured logging, client-side error telemetry (Sentry/Audit logs), and audit trails for privileged admin operations.

### **P** — Progressive Enhancement & Performance Budget
- **Progressive Enhancement**: Build foundational semantic HTML first, then layer dynamic client-side enhancements.
- **Performance Budgets**: Maintain Core Web Vitals targets:
  - Largest Contentful Paint (LCP) < 2.5s
  - Interaction to Next Paint (INP) < 200ms
  - Cumulative Layout Shift (CLS) < 0.1

### **Q** — Query Optimization & Queue Management
- **Query Optimization**: Avoid N+1 database queries. Use Prisma `include`/`select` with indexed relations, batching (`DataLoader`), and compound indexes for common filter combinations.
- **Queue Management**: Offload heavy background work (email sending, image processing, webhook delivery) to background jobs or queue workers rather than blocking API responses.

### **R** — Rate Limiting & Responsive Design
- **Rate Limiting**: Protect public and sensitive endpoints (auth, login, checkout, search) using IP and user-based token bucket or sliding window rate limiting.
- **Responsive Design**: Mobile-first fluid layouts using responsive utility classes or CSS variables. Ensure zero horizontal scroll overflows across all viewport widths (320px to 4K).

### **S** — SSRF & SQLi Elimination
- **SSRF (Server-Side Request Forgery)**:
  - Whitelist allowed destination hosts, ports, and protocols (`https:` only).
  - Block internal, private, and cloud metadata IPs (`127.0.0.1`, `localhost`, `169.254.169.254`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **SQLi (SQL Injection)**:
  - Exclusively use parameterized query builders (`prisma.table.findMany(...)`).
  - Never use template literals in `$queryRaw` without `Prisma.sql` tagging.

### **T** — Type Safety & Throttling
- **End-to-End Type Safety**: Share types between database schemas, server actions, and frontend components. Avoid `any`; use `unknown` with type guards or schema validation.
- **Throttling**: Limit execution rate of resource-intensive client handlers (resize, scroll, pointer movement).

### **U** — UI/UX Pro Max (Design Systems & Aesthetics)
- **Visual Distinction**:
  - Curated typography (modern sans-serif like Inter/Jakarta Sans paired with elegant display serifs for luxury/editorial products).
  - Cohesive color tokens with intentional contrast ratios (WCAG AA minimum 4.5:1 for normal text).
  - Subtle depth via layered shadows, border highlights, and dark-mode glassmorphism accents.
- **Component Anatomy**: Every interactive component must support 5 visual states: Default, Hover, Active/Focus, Loading/Pending, and Disabled.

### **V** — Validation at Trust Boundaries & Versioning
- **Trust Boundaries**: Parse and sanitize all incoming payloads before passing data to business logic or database layers.
- **API & Data Versioning**: Design database schema migrations non-destructively (add columns before removing deprecated ones).

### **W** — Webhook Security & Web Standards
- **Webhook Security**: Verify cryptographic signatures (e.g., HMAC SHA-256) on incoming webhooks using constant-time comparison (`crypto.timingSafeEqual`).
- **Web Standards**: Favor native web standards (`fetch`, `URL`, `FormData`, `Headers`, `Request`, `Response`) over proprietary external libraries.

### **X** — XSS (Cross-Site Scripting) Defense
- Never render unsanitized dynamic markup via `dangerouslySetInnerHTML`.
- Use trusted sanitization libraries (e.g., DOMPurify) if rich text rendering is strictly required.
- Escape all dynamic user variables rendered in template views.

### **Y** — YAGNI (You Aren't Gonna Need It)
- Do not add features, configuration options, abstractions, or dependencies until they are actively required by the current task.
- Delete unused code, dead imports, and obsolete comments immediately.

### **Z** — Zero-Trust Architecture & Zod Schemas
- Assume all client requests, headers, query parameters, and external webhooks are potentially compromised.
- Parse and strip unexpected keys with strict Zod schemas (`z.object({ ... }).strict()`) to prevent parameter pollution and mass-assignment attacks.

---

## 3. End-to-End Delivery Protocol & Quality Gate

Before declaring any feature, fix, or milestone complete:
1. [ ] **Architecture**: Verified against Ponytail (YAGNI, reused patterns, minimal diff, root cause addressed).
2. [ ] **Security**: Free of SQLi, XSS, SSRF, IDOR; boundaries validated with strict schemas; secrets protected.
3. [ ] **UX & Performance**: Includes debouncing, caching, responsive checks, skeleton loaders, and human-friendly error handling.
4. [ ] **Accessibility**: Tested keyboard navigation, visible focus rings, ARIA roles, and minimum 44px touch targets.
5. [ ] **Code Verification**:
   - `npm run lint` passes with 0 errors.
   - `npm run build` succeeds without type or build errors.
   - `cr review` (CodeRabbit) checks pass without warnings or critical issues.
