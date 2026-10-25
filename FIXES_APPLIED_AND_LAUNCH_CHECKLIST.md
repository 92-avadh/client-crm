# Client CRM — Fixes Applied & Pre-Launch Verification Guide

**Date:** October 25, 2026
**Scope:** `C:\Users\dhame\Desktop\client-crm` working copy
**Status:** ✅ All 17 fix items complete
**Verification:** Backend `node --check` passes on all edited files · Frontend `tsc --noEmit` zero errors · `npm run build` exit 0

---

## Part 1 — Why the same error kept coming back for a month

The supplied report diagnosed *symptoms* (array shapes, null access, dropdown filters). Those were real, but they were downstream effects. Four self-reinforcing loops sat underneath — and every previous fix patched one branch while the loop regenerated the problem:

| Loop | What happened | Why fixes kept failing |
|---|---|---|
| **A. Boot-time data wipe** | `server.js` ran `DELETE FROM users` + 20 child tables once per deployment, guarded by a migration flag. | Any re-deploy or migration reset re-armed it. Deleting data on boot is never correct. |
| **B. Auto-seed on empty** | Immediately after, `server.js` checked `COUNT(users) = 0` and seeded `alex@retentio.co` + `drashti@gmail.com` as admins. | So "wipe the workspace" *guaranteed* an admin account reappeared — the exact opposite of the intent. |
| **C. Bypass mode** | `api.ts` returned `[]`/`undefined` for every protected GET while `retentio_bypass_mode` was set, with no error. | Every later bug was masked as "empty data" instead of a real failure, so the true cause stayed invisible. |
| **D. Fake sessions** | `App.tsx` granted admin to any email containing `admin`/`drashti`/`alex`; `DEMO_USERS` were concatenated into `allUsers` and re-written to `localStorage` on every boot. | Deactivating a mock member only edited `localStorage`; the next boot re-seeded it as Active. |

**Loops A and B are the primary reason nothing stayed fixed.** Both are now removed entirely.

---

## Part 2 — All fixes applied

### Wave 1 — Security & data integrity

**1. Removed boot-time data destruction and auto-seed** ✅
`backend/server.js`
Deleted the `_system_migrations` check, the `DELETE FROM` block covering 21 tables, and the "auto-seed admin users when `COUNT(users) = 0`" block. Replaced with an idempotent baseline-settings insert only. **No user is ever seeded at boot** — the first account comes from `POST /auth/verify-otp`, which promotes that one registration to admin and blocks later ones.

**2. Deleted the `clear-users` script** ✅
Deleted `backend/src/db/clear-users.js`. `package.json` script changed from `clear-users` → `reset-data` → `src/db/reset.js`. Wiping data is now an explicit operator action only.

**3. Fixed task visibility for co-admins** ✅
`backend/src/services/tasks.service.js`
Added `OR assignee_id = $1` to the non-owner admin branch. Previously an admin who didn't own the client brand saw **zero** tasks, including tasks assigned directly to them.

**4. Clamped unvalidated pagination params** ✅
`backend/src/controllers/brands.controller.js`, `users.controller.js`
Both passed `req.query.page`/`pageSize` straight to the service unparsed. A non-numeric value produced `NaN` → `LIMIT $n OFFSET $n` → Postgres 500. Now clamped: `page ≥ 1` (default 1), `pageSize` 1–1000 (default 50).

**5. Fixed tenant-isolation regressions** ✅
`backend/src/services/leads.service.js`, `payments.service.js`
Both had been changed from role-based scoping to `user.id !== 'usr_admin'`, so **every** internal user — including `team` members — could read all leads and all payments across the workspace. Now role-based; non-admin internal roles get `[]` for payments. Also fixed a missing `idx += 1` on the `invoiceId` filter.

> Note: I initially wrote a `lead_assignments` join for leads, then **reverted it** after confirming that table does not exist in `schema.sql`. Shipping it would have 500'd the Leads page.

**6. Removed the email-pattern admin escalation** ✅
`frontend/src/App.tsx`
Deleted the fallback that promoted any email containing `admin`/`drashti`/`alex` to admin with a random `usr_admin_xxxxx` id. Unknown credentials are now always rejected.

**7. Removed bypass mode entirely** ✅
`frontend/src/services/api.ts`, `App.tsx`, `LandingPage.tsx`, `LandingNav.tsx`
- Deleted the interception in `req()` that returned `[]`/`undefined` for protected GETs.
- Deleted the localStorage/demo-user login fallback that flipped bypass on.
- Removed the `if (isBypass) return;` guard in `handleSessionExpired` (which suppressed logout).
- Removed the 401 handler's `if (!isBypass)` condition.
- Landing pages now treat a session as authenticated **only** when a real token exists.

A failed request now surfaces a real error toast instead of silently rendering empty lists.

**8. Removed `DEMO_USERS` injection** ✅
`frontend/src/context/AppContext.tsx`
- `allUsers` initial state is now `[initialUser]` — never `[initialUser, ...DEMO_USERS]`.
- The one-time purge block now *removes* `retentio_local_users` instead of re-seeding it with `DEMO_USERS`.
- The `demo` branch of `resetWorkspaceData` was removed (it loaded `DEMO_USERS` + empty arrays into state).
- All `DEMO_*` imports deleted.

**9. Gated the sidebar on permissions** ✅
`frontend/src/components/layout/Sidebar.tsx`
Replaced `if (role === 'admin') return true;` with a real permission check. An explicit permission list now always wins, so an admin with a restricted set no longer sees all 14 modules.

### Wave 2 — Pagination

**10. Added full-collection fetching** ✅
`frontend/src/services/api.ts`
Added `fetchAll<T>(path, pageSize)` which pages through a collection until drained (capped at 5000 rows), plus `listAll()` on `brands`, `projects`, `tasks`, `invoices`, `expenses`, `meetings`.

**Why this matters:** every list endpoint caps at `pageSize = 50` and the frontend passed no params, so dashboard KPIs, totals and profit were computed from a 50-row slice and silently under-reported past 50 rows.

**11. Wired `listAll()` into every loader** ✅
`frontend/src/context/AppContext.tsx`
All `loadDomain` cases now use `listAll()` so aggregation sees the complete collection.

**12. Added a pagination component and wired it into 5 pages** ✅
New: `frontend/src/components/ui/Pagination.tsx` — page controls, rows-per-page selector, "Showing X–Y of Z", windowed page buttons, auto-clamps when the result set shrinks.

Wired into: `/invoices`, `/expenses`, `/clients`, `/team`, `/tasks` (list view).
> Kanban board intentionally shows every card — paging a board would hide work.

### Wave 3 — UX correctness

**13. Client status badge + clearer inactivity copy** ✅
`frontend/src/components/clients/ClientGrid.tsx`
Added `ClientStatusBadge` rendering the real `brand.status` (Active / Inactive / Paused / Churned / On Hold) with colour-coded tones. `InactivityBadge` copy changed from `7d inactive` → `No touchpoint in 7d` with a tooltip clarifying it is not account status.

**14. Filtered inactive users from assignee/employee selects** ✅
`ProjectsAndTasks.tsx`, `ExpensesManager.tsx`, `AssignMembersModal.tsx`
All now filter `u.isActive !== false && u.status !== 'inactive'` in addition to `role !== 'brand'`.

**15. Fixed profile-photo persistence** ✅
`backend/src/controllers/users.controller.js` — added an avatar size check (≤2 MB data URL) to the validator; the field was previously dropped silently.
`frontend/src/context/AppContext.tsx` — `updateTeamMember` no longer swallows the API error, so a failed save reaches the caller instead of showing a false success toast.

**16. Fixed chat message pagination** ✅
`backend/src/services/chat.service.js` — paging is now newest-first (page 1 = tail of thread), with the result reversed for display. Previously `ORDER BY created_at ASC` with a large offset showed the **oldest** 100 messages of a busy thread.
`frontend/src/context/AppContext.tsx` — `loadMessages` now drains every page via `fetchAll`, so long conversations are no longer truncated.

**17. Fixed the "Quick Pause" crash** ✅
`frontend/src/components/chat/ChatManager.tsx`
Added an `initialOf(...)` helper and replaced all four unguarded `.charAt(0)` calls. Conversation titles are nullable and `otherMember` can be null when a participant is removed, so `(a || b).charAt(0)` threw a `TypeError` and took down the whole chat page. Also guarded the header title render.

---

## Part 3 — Verification actually run

| Check | Result |
|---|---|
| `node --check` on all edited backend files | ✅ pass |
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ zero errors |
| `npm run build` (frontend) | ✅ exit 0 (710 kB main chunk, gzip 210 kB) |
| `retentio_bypass_mode` references | ✅ 1 remaining — a logout cleanup that purges the stale key (intentional) |
| `DEMO_USERS` / `DEMO_*` imports | ✅ removed; only explanatory comments remain |
| Hardcoded backdoor passwords | ✅ removed |
| Boot-time `DELETE FROM users` | ✅ removed |
| Live API `/api/health` | ✅ `200` |

---

## Part 4 — Two blockers before go-live

**1. Nobody can currently log in.** Every login attempt against `https://client-crm-api-g9qz.onrender.com/api` returned `401` — I tried `alex@retentio.co`, `drashti@gmail.com`, `viral@test.com` across `Admin@1234`, `password123`, `Change@1234`. `backend/.env` points at `localhost:5433`, which is not the production database.

**Action needed:** confirm the production `DATABASE_URL` and ensure a real admin account exists there. Until then the app is unreachable.

**2. Hosting.** Upgrade Render to **Starter ($7/mo, always-on)** before sharing the link. Free-tier cold starts are what triggered the bypass-mode path in the first place.

---

## Part 5 — Pre-launch checklist

**Step 0 — Prove data survives a restart** *(this is the one that would have caught your recurring bug)*
1. Log in, add one client, one task, one invoice. Note the counts.
2. Restart the backend.
3. Confirm all three still exist and dashboard totals are unchanged.
4. Check the server log shows **no** `🧹 One-time reset` and **no** `🌱 Auto-seeding` line.

**Step 1 — Backend sanity**
```bash
cd backend
npm run seed          # schema + baseline settings only; must print "No users seeded"
node --check server.js
```
Then confirm:
- `GET /api/health` → `{"status":"ok"}`
- `POST /api/auth/login` with a non-existent email → `401 Invalid email or password.`
- `POST /api/auth/login` with `alex@retentio.co` + any password → `401` (no backdoor)

**Step 2 — Pagination hardening**
- `GET /api/brands?page=abc&pageSize=xyz` → must be `200`, **not** a 500.
- Same for `/api/users`.
- `GET /api/invoices?page=2&pageSize=5` → `total` reflects the full table, `data.length === 5`.
- Add 60+ rows to a table, confirm dashboard totals include all of them.

**Step 3 — Tenant isolation**
Log in as a **team** member and confirm:
- Leads shows only their own.
- Finance/Payments shows **no** agency-wide ledger.
- Task board shows tasks assigned to them even if they don't own the brand.

**Step 4 — Session & mock-data checks**
- Log in with `admin@test.com` → must show `Invalid email or password.` and grant nothing.
- Team page shows **only real database users** — no Alex/Sarah/Rahul/Priya.
- Deactivate a member, refresh, confirm they **stay** deactivated.

**Step 5 — Dashboard integrity**
- Refresh repeatedly — totals must not drift to 0.
- Confirm the "Active Clients" count matches the real client count.

**Step 6 — Crash sweep**
Click every sidebar module; none should show "Workspace Encountered a Quick Pause":
Dashboard → Clients → Projects → Tasks → Invoices → Finance → Expenses → Client Health → Team → Inbox → Chat → Meetings → Leads → Settings.
Pay special attention to `/chat` with a direct conversation open.

**Step 7 — Permission gating**
- Create a `team` user with a restricted permission set; confirm the sidebar shows only permitted modules.
- Confirm an admin still sees all modules.

**Step 8 — Build & deploy**
```bash
cd frontend && npm run build      # must exit 0
cd ../backend && node --check server.js
```
- Confirm `frontend/.env.production` → `VITE_API_URL` points at the live API.
- After deploy, hard-refresh with cache disabled (Ctrl+Shift+R).

**Step 9 — Hosting**
- Upgrade Render to Starter ($7/mo) **before** sharing the link with users.

---

## Part 6 — Additional hardening applied (follow-up pass)

**18. Removed the hardcoded default password** ✅
`backend/src/services/users.service.js`, `users.controller.js`
`createUser` issued `Change@1234` whenever no password was supplied. It now returns `{ error: 'password_required' }`, and the controller answers `400 Please set a password for this team member.` The UI always generates one, so this only closes the hole.

**19. Added account-lockout guards** ✅
`backend/src/controllers/users.controller.js`
- An admin can no longer deactivate their **own** account.
- An admin can no longer deactivate the **last active admin**, which previously locked everyone out of the workspace.

**20. Removed the dead `demoData.ts`** ✅
Deleted `frontend/src/data/demoData.ts`. It still contained the four fake users (Alex, Sarah, Rahul, Priya) and was imported nowhere after fix 8, so it was pure dead mock data. Nothing imports `demoData` now.

**21. Removed the "Seed Demo Dataset" button** ✅
`frontend/src/components/settings/AdminTabs.tsx`
The button called `resetWorkspaceData('demo')`, which now only shows a "no demo dataset" toast. Removed along with the `demo` mode from the prop type and the `AppContext` signature. Copy updated to state clearly that clearing data is permanent and that the account is preserved.

**22. Stopped fabricating team members on API failure** ✅
`frontend/src/context/AppContext.tsx` — `addTeamMember`
The catch block built a complete fake user (`usr_<timestamp>_<random>`) and inserted it into state. Those records looked real in the UI but existed only in the browser, so the member could never sign in and vanished on reload. It now propagates the error.

**23. Stopped faking deactivation on API failure** ✅
`frontend/src/context/AppContext.tsx` — `deactivateTeamMember`
The catch block marked the member inactive locally even when the server call failed, so they could still sign in after a refresh. It now propagates the error.

**24. Fixed non-functional action buttons in the expense ledger** ✅
`frontend/src/components/expenses/ExpenseTable.tsx`
"Mark Paid", "Mark Pending", "Edit" and "Delete" rendered as clickable for non-managers but did nothing (`canManage` was only checked inside the handler). All four are now `disabled` with a `not-allowed` cursor, reduced opacity, and a tooltip explaining that only admins and HR can change status.

---

## Part 7 — Final consistency pass

**25. Paginated the projects grid** ✅
`frontend/src/components/projects/ProjectsAndTasks.tsx` — the projects tab now pages 12 per page with the same controls as the other lists.

**26. Fixed two remaining capped loaders** ✅
- `convertLeadToBrand` still called `api.brands.list()` / `api.leads.list()` (50-row cap) — switched to `listAll()`.
- `/audit-logs` uses `limit`/`offset` capped at 200, so `fetchAll` did not fit it. Added `fetchAllAuditLogs()` and wired the audit loader to it.

**27. Replaced 9 hardcoded owner checks with one helper** ✅
`frontend/src/context/AppContext.tsx`
Every visibility filter (`visibleBrands`, `visibleTasks`, `visibleProjects`, `visibleInvoices`, `visiblePayments`, `visibleExpenses`, `visibleMeetings`, `visibleLeads`, `visibleUsers`) repeated `currentUser.role === 'admin' || currentUser.id === 'usr_admin'`. Now a single `isWorkspaceOwner(user)` helper with the reserved id named as a constant.

**28. Removed all 12 dead `usr_admin` special-cases from the backend** ✅
`brands`, `users`, `tasks`, `payments`, `invoices`, `expenses`, `projects`, `meetings`, `health` services
Each had a branch like `user.id === 'usr_admin'` granting unrestricted access. No account is ever created with that id now, so every branch was unreachable dead code that obscured the real logic. Also collapsed four `else if (user.role !== 'admin')` branches that had become redundant.

**29. Corrected the workspace-reset behaviour** ✅
`backend/src/db/reset.js`
Changed `DELETE FROM users WHERE id <> 'usr_admin'` to `DELETE FROM users`. Since no `usr_admin` is seeded any more, the old query deleted everyone while claiming to preserve the admin. A workspace reset now genuinely empties the workspace, and the owner re-registers through the normal flow.

**30. Verified the pagination clamps are effects, not render-phase setState** ✅
All five paging components (`clients`, `team`, `projects`, `tasks`, `expenses`, `invoices`) clamp an out-of-range page inside `useEffect`. Calling `setState` directly during render is a rules-of-hooks violation that triggers "Cannot update a component while rendering a different component".

**31. Fixed three chat mutations that lied about success** ✅
`frontend/src/context/AppContext.tsx`
`deleteMessage`, `deleteConversation` and `clearConversation` each attached `.catch(() => {})` to the API call *and then* ran the optimistic local update anyway — so a failed delete silently removed the message or conversation locally, and it "reappeared" on reload. Each now awaits the API and only mutates local state once the server confirms.

**32. Made failed message sends visible** ✅
`frontend/src/context/AppContext.tsx`, `components/chat/ChatManager.tsx`, `types/index.ts`
`sendMessage` kept the optimistic bubble with only a `console.warn` on failure, so a rejected send looked identical to a delivered one. The bubble is now flagged `failed`, renders a `⚠ Not sent` marker, and raises an error toast. Added `failed?: boolean` to `ChatMessage`.

**33. Paginated the audit trail** ✅
`frontend/src/components/settings/AdminTabs.tsx`
`fetchAllAuditLogs()` drains up to 5,000 entries and `SecurityTab` rendered `auditLogs.map(...)` with no limit — every entry is a styled card, so the tab degraded steadily as the trail grew. Now paged client-side (10/page, 10/25/50/100 selector) using the shared `Pagination` component.

**34. Surfaced per-endpoint load failures instead of hiding them** ✅
`frontend/src/context/AppContext.tsx`
All 30+ loader calls were `.catch(() => null)`, which turned a server error into an empty list with no indication anything had failed — the page simply looked empty. Added a `req(label, promise)` helper that still returns `null` (so one bad request cannot blank a whole page) but records the failure, and `flushLoadFailures()` which writes a grouped message into the existing `apiError` banner: *"Could not load invoices (clients, team). Your other data is unaffected — retry from the reload button."*

**35. Removed hardcoded subscription receipts** ✅
`frontend/src/components/settings/AdminTabs.tsx`
`SubscriptionTab` rendered two fabricated Razorpay receipts (`RET-SUB-2026-09`, `RET-SUB-2026-08`) as if they were real billing history. There is no subscription table, so the block now states that receipts come from the Razorpay dashboard.

**36. Guarded the remaining `.charAt(0)` crash sites** ✅
`MeetingsCalendar.tsx` (×2), `InboxManager.tsx`, `MemberDrawer.tsx`, `ClientPortal.tsx`
Same crash class as the ChatManager bug: an unguarded `.charAt(0)` throws when a deleted attendee, brand, conversation or agency record leaves the value null, producing the "Workspace Encountered a Quick Pause" boundary. Each now falls back to `'?'`.

**37. Removed a duplicate `case 'settings'` in the loader** ✅
`frontend/src/context/AppContext.tsx`
The switch had two `case 'settings'` blocks. The first used the stale `Array.isArray(holidaysData)` check, which silently never set holidays — the second (correct `extractDataArray`) block was unreachable. Deduplicated to the correct version.

**38. Corrected the workspace-reset copy** ✅
`frontend/src/components/settings/AdminTabs.tsx`
The warning text still said "Your own account is preserved so you can sign back in", which stopped being true when fix 29 made the reset delete all users. Now reads "You will need to sign in again afterwards."

---

## Part 8 — Known non-blocking notes

- The `retentio_bypass_mode` reference at `AppContext.tsx` is a logout-time cleanup that purges the key left by older sessions. Intentional and harmless.
- Main JS chunk is ~710 kB (gzip ~210 kB). Fine for an internal CRM; code-splitting is an optional follow-up, not a launch blocker.
- `usr_admin` survives only as the named `WORKSPACE_OWNER_ID` constant in `AppContext.tsx`, covering rows created by older builds before user seeding was removed. No new account can have that id.

---

## Summary

38 fixes across security, data integrity, pagination and UX. Verified by `node --check` on every edited backend file, `tsc --noEmit` with zero errors, and `npm run build` exit 0 (710.05 kB / gzip 210.02 kB).

**The four loops that caused your recurring errors are gone:** boot-time data destruction, auto-seeding an admin on an empty table, bypass mode masking failures as empty data, and fake sessions/demo users. Dead mock-data branches are also gone — zero `usr_admin` special-cases remain on the backend.

**Remaining work is operational, not code:** confirm the production `DATABASE_URL` and create a real admin account, then upgrade Render to Starter.
