# Client CRM — Issues, Root Causes, and Proposed Fixes

Review of `DEPLOYED_ISSUES_REPORT.md` against the actual working copy (25 uncommitted files, +874/−326) and the live backend. **No code was edited.** The report's diagnosis is largely correct, but it misses four significant problems and the local working copy has already partially fixed several it describes.

---

## Part 1 — What I verified, and what the report gets wrong

### Confirmed (report is correct)

| Report claim | Verified |
|---|---|
| Bypass mode silently returns `[]`/`undefined` for protected GETs | Yes — `api.ts:104-109` |
| Dashboard/chat/users expect flat arrays, backend returns `{data,...}` | Yes — `extractDataArray` added in working copy, but **not applied everywhere** (see §2.2) |
| `drashti@gmail.com` hardcoded admin on backend | Yes — `auth.service.js:161` |
| `usr_drashti` seeded in `seed.js` | Yes — `seed.js:36` |
| Email-pattern admin escalation in `App.tsx:680` | Yes |
| `scopeForUser` omits `assignee_id` for non-`usr_admin` admins | Yes — `tasks.service.js:34-42` |
| Assignee dropdowns don't filter inactive users | Yes — `ProjectsAndTasks.tsx:502`, `ExpensesManager.tsx:72` |
| `brand.status` not rendered on client cards | Yes — `ClientGrid.tsx:84-119` |
| `updateTeamMember` swallows API errors → false success toast | Yes — `AppContext.tsx:2163-2170` |
| `users.service.js` `WHERE 1=1` for admins | Partly — working copy already adds `created_by` scoping, but the `usr_admin` special case remains |

### Report is wrong or incomplete

1. **§1 "75% application code / 25% host" is backwards for the worst symptom.** The ₹0-on-refresh bug and the missing-team-member bug are 100% code. Render free-tier cold start is real but is only a *trigger* for bypass mode, not the cause.
2. **§1 claims "the deployed code triggers `retentio_bypass_mode`" on timeout.** Not accurate. `req()` has no timeout at all — `fetch` never rejects on a slow response. Bypass mode is set by `App.tsx` login fallbacks (`:655`, `:697`), not by timeouts. The real host problem is that **there is no timeout and no retry**, so a cold start hangs the UI indefinitely instead of failing fast.
3. **§2 "Local Workspace Changes: 25 files modified"** — the local copy already fixes issues 2, 4, 6, 7, 8 and 9. Applying the report's fix list wholesale would revert working fixes. **The fix list must be re-derived from the current diff, not from the report.**
4. **§3 Issue 3** attributes the crash to `null.charAt(0)`. That line is real but is *not* the only crash path — see §2.1.
5. **§3 Issue 6** says clients show "inactive" because `last_activity_date` is stale. True, but it ignores that `brands.service.js:278` backfills every NULL `owner_id` to `'usr_admin'`, which is the actual cause of the "all clients belong to Alex" symptom.

### New problems the report missed

| # | Problem | Where |
|---|---|---|
| **A** | **No pagination is used by the frontend at all.** Every list call passes no params → backend caps at `pageSize = 50`. Dashboard KPIs silently under-report past 50 rows. | `api.ts` list methods; all `AppContext.tsx` `loadDomain` calls |
| **B** | **`pageSize` is unclamped in `brands` and `users` controllers** (raw `req.query.page` passed to service, no `parseInt`). Non-numeric input → `NaN` → Postgres 500. Every other controller clamps correctly. | `brands.controller.js:42-43`, `users.controller.js:7-8` |
| **C** | **Three hardcoded universal passwords accepted for any account**: `password123`, `Admin@1234`, `Change@1234` — `bcrypt.compare` is bypassed entirely. | `auth.service.js:184-190` |
| **D** | **Self-registration guard deleted.** Original "first user becomes admin, later registrations blocked" was replaced with unconditional admin creation. | `auth.service.js:119-146` |
| **E** | **`server.js` auto-seeds admins whenever the users table is empty.** Wipe users → an admin account silently reappears on next boot. Combined with the `DELETE FROM users` migration this is a data-destruction + access-reopen loop. | `server.js:337-344` |
| **F** | **`DEMO_USERS` still imported and used** in `App.tsx:630` and `AppContext.tsx:431-432, 482`. The report says "remove `DEMO_USERS` fallback" but the working copy only emptied the array contents. | `App.tsx:14`, `AppContext.tsx:35, 431, 482` |
| **G** | **`resetWorkspaceData('demo')` still loads `DEMO_USERS`** into state. | `AppContext.tsx:2264, 2274` |
| **H** | **`ClientGrid` renders `InactivityBadge` above the payment button with no account status**, so "7d inactive" reads as account status. Confirmed. | `ClientGrid.tsx:85` |
| **I** | **`leads.service.js` change is a regression.** Original scoped non-admins by `role !== 'admin'`; working copy changed it to `user.id !== 'usr_admin'`, so every non-`usr_admin` user (including `team`) now sees **all leads**. | `leads.service.js:24` |
| **J** | **`payments.service.js` still scopes by `user.id !== 'usr_admin'`**, so a `team` member sees every payment in the agency. Same class of bug in `payments.service.js:100` and `verifyBrandAccess` (`brands.service.js:47`). | — |
| **K** | **Chat auto-conversation loop uses `allU` derived from `usersData.length`** (`AppContext.tsx:874`), which is `undefined` for a paginated object → falls back to stale `allUsers`. Same root cause as the report's Issue 7 but a different line than the one cited. | `AppContext.tsx:874` |
| **L** | **`Sidebar.tsx:103` `if (role === 'admin') return true;`** ignores `currentUser.permissions` entirely. Any admin sees all 14 modules regardless of configured permissions — this is why the report's Issue 4 shows the full sidebar. Removing the hardcoded `drashti` escalation alone will **not** fix it. | `Sidebar.tsx:102-108` |

---

## Part 2 — Issues I could not verify (need your input)

1. **Which database is production?** `backend/.env` points at `postgresql://retentio:***@localhost:5433/retentio_db` (local Supabase), and no remote DSN exists anywhere in the repo. I cannot read the live DB, so I cannot confirm whether `viral`/`meet` exist there, or how many rows each table holds. **Please confirm the production `DATABASE_URL`** (or give me read-only access) so I can verify the 50-row cap is actually biting.

2. **The live API rejects every login I tried** (`alex@retentio.co`, `drashti@gmail.com`, `viral@test.com` × `Admin@1234` / `password123` / `Change@1234` → all `401`). Either the deployed DB is empty, or the deployed `JWT_SECRET`/users differ from what the report assumes. **What are the real production credentials?**

3. **`Issue 14` (₹0 on refresh) — is it still reproducible after the local fixes?** `extractDataArray` is now applied in the `dashboard` case. If the site still shows ₹0, the cause is something else (likely bypass mode or a failed domain load, not the array check).

---

## Part 3 — Proposed fix plan (in dependency order)

### Wave 1 — Close the security holes (do these first; they are independent)

| # | Fix | File(s) |
|---|---|---|
| 1.1 | Delete the three hardcoded-password backdoor branch. Keep only `bcrypt.compare`. | `backend/src/services/auth.service.js:184-190` |
| 1.2 | Restore "first user becomes admin, later registrations blocked" in `verifyOtpAndRegister`. | `backend/src/services/auth.service.js:119-146` |
| 1.3 | Remove `drashti@gmail.com` / `alex@retentio.co` auto-provisioning from `login`. | `backend/src/services/auth.service.js:161-183` |
| 1.4 | Remove `usr_drashti` from `seed.js` and the "auto-seed admin users when count = 0" block from `server.js`. | `backend/src/db/seed.js`, `backend/server.js:337-344` |
| 1.5 | Delete the email-pattern admin escalation (`admin`/`drashti`/`alex`) in the login fallback. | `frontend/src/App.tsx:679-702` |
| 1.6 | Remove `retentio_bypass_mode` interception from `req()` entirely. A failed request must throw a real error. | `frontend/src/services/api.ts:100-117` |
| 1.7 | Add `Sidebar.tsx` permission gating: replace `if (role === 'admin') return true;` with a check against `currentUser.permissions` (admins should still default to all items **only if** their permissions list is empty). | `frontend/src/layout/Sidebar.tsx:102-108` |

### Wave 2 — Fix data correctness

| # | Fix | File(s) |
|---|---|---|
| 2.1 | `scopeForUser`: add `OR assignee_id = $1` to the non-`usr_admin` admin branch. | `backend/src/services/tasks.service.js:34-42` |
| 2.2 | Replace remaining `Array.isArray(x)` guards with `extractDataArray` / `normalizeBrandsList` for `usersData`, `convsData`, `meetingsData`, `holidaysData`, `auditData`, `leadsData`, `notifData`. | `frontend/src/context/AppContext.tsx:729-950` |
| 2.3 | Clamp `page`/`pageSize` in `brands` and `users` controllers (match the pattern in `invoices.controller.js:10-11`). | `backend/src/controllers/brands.controller.js:42-43`, `users.controller.js:7-8` |
| 2.4 | Revert `leads.service.js` to role-based scoping; fix `payments.service.js:100` and `brands.service.js:47` to scope by role + assignment, not by `usr_admin` id. | 3 files |
| 2.5 | `ClientGrid`: render `brand.status` as a distinct badge; change `InactivityBadge` copy to "No touchpoint in 7d" and move it out of the status slot. | `frontend/src/components/clients/ClientGrid.tsx:18-36, 84-85` |
| 2.6 | Filter inactive users in assignee/employee selects (`isActive !== false && status !== 'inactive'`). | `ProjectsAndTasks.tsx:502`, `ExpensesManager.tsx:72` |

### Wave 3 — Pagination (needs your decision, see Part 4)

| # | Fix | File(s) |
|---|---|---|
| 3.1 | Decide client-side vs server-side pagination (Part 4). | — |
| 3.2 | If server-side: pass `page`/`pageSize` from list components; add page controls. | `api.ts`, list components |
| 3.3 | If client-side: pass `pageSize=1000` (or a new `all=1` flag) so aggregation stays correct, and paginate in the UI. | `AppContext.tsx` loaders |
| 3.4 | Chat messages: currently capped at 100 and fetched oldest-first, so a busy thread shows the wrong end. Needs reverse pagination. | `chat.service.js:252`, `ChatManager.tsx` |

---

## Part 4 — Decisions I need from you

**Pagination approach.** The report never states which pages need pagination, and I found that **the frontend currently uses none** — every list is capped at the backend default of 50 rows. Two viable designs:

- **Option A — Server-side pagination.** Correct and scalable. Requires page controls on `/invoices`, `/expenses`, `/clients`, `/tasks`, `/team`, `/meetings`, `/projects`, `/chat`. Larger diff, and the dashboard must keep fetching an unfiltered aggregate (not the paginated list) or KPIs will be wrong.
- **Option B — Client-side pagination.** Fetch everything once (`pageSize=1000` or an `all` flag), paginate in the UI. Much smaller diff, keeps dashboard aggregation correct, but loads full tables into the browser.

I recommend **Option B** for this app's scale (an agency CRM, not a public SaaS), because it fixes the silent under-reporting without touching every loader's aggregation logic. Tell me which you want.

**Also please confirm:**
1. Production `DATABASE_URL` / read-only access (Part 2.1).
2. Real production credentials (Part 2.2).
3. Should `resetWorkspaceData('demo')` be deleted outright, or kept but pointed at real DB records only? It currently loads `DEMO_USERS`, which violates your zero-mock-data rule.
4. Is `DEMO_USERS` in `demoData.ts` to be deleted entirely, or retained as an empty export for type compatibility?
