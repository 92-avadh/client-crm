# Retentio — Roles & Permissions

## Overview

Retentio uses a role-based access control (RBAC) system with distinct roles: **admin**, **hr**, and **team**. Each role is assigned at account creation or by an admin, stored in the `users` table, and embedded in the JWT token issued at login. Every API route enforces role checks server-side — hiding UI elements alone is never the sole gate.

---

## Role Descriptions

### 1. Admin / Owner

**Who they are:**
The Admin is the agency owner or founding account holder. When a new account is created via the signup flow, the first user is automatically assigned the `admin` role. There is typically one Admin per Retentio workspace.

**What they can do:**
Admins have unrestricted access to the entire platform. They manage the subscription, configure all settings, add and deactivate team members, onboard brands, create invoices, record payments, track expenses, view net profit, manage the retention engine, use the leads pipeline, access the full audit trail, and export any data.

**What only Admins can access:**
- Expenses (view and add) — the expenses API enforces `role === 'admin'` at the route level
- Net profit view (revenue minus expenses calculation)
- Subscription & billing settings (plan name, price, billing cycle, renewal date, Razorpay credentials)
- Audit logs — the audit-logs API enforces `role === 'admin'` at the route level
- All Settings tabs: Company Profile, Invoice Design, Bank Details, Razorpay, Subscription, Retention, WhatsApp, Holidays
- Deactivating team members (`PATCH /api/users/:id/deactivate` is admin-only)
- Adding new team members (`POST /api/users` is admin-only)

**Their dashboard view:**
Full financial dashboard — total revenue, total expenses, net profit, outstanding invoices, payment history, retention alerts, and recent activity feed.

---

### 2. HR / Manager

**Who they are:**
The HR or Manager role is for senior agency staff who oversee client work and team coordination but should not see the agency's private financial position (expenses, net profit, subscription cost).

**What they can do:**
- View all brands and their profiles (including monthly fee and billing details)
- Onboard new brands (`POST /api/brands` permits `admin` and `hr`)
- Edit brand profiles
- Assign team members to brands
- Create and manage invoices
- Record payments and view payment history
- Access the Finance dashboard (revenue, invoices, payments)
- Manage projects and tasks
- Schedule and manage all meetings
- Use the leads pipeline and convert leads to brands
- Chat with all conversations
- View and manage notifications

**What they CANNOT do:**
- View expenses or add expenses (`GET/POST /api/expenses` — admin only)
- View net profit (requires expense data)
- Access subscription & billing settings
- View audit logs (`GET /api/audit-logs` — admin only)
- Add new team members or deactivate existing ones

**Their dashboard view:**
Revenue and invoice summary, brand activity, recent payments, and operational KPIs — but no expense or profit line.

---

### 3. Team Member

**Who they are:**
Team Members are individual contributors working under the agency — freelancers, chartered accountants, designers, developers, or any employee assigned to client work. They are the most restricted internal role and are scoped strictly to the brands they are assigned to.

**What they can do:**
- View only the brands they have been explicitly assigned to (`brand_assignments` table filters the query in `GET /api/brands`)
- View projects and tasks on their assigned brands (read-only for brand data)
- Create, update, and manage their own assigned tasks
- Participate in chat conversations they are part of
- Attend meetings they have been invited to
- View their own profile and update it

**What they absolutely CANNOT see:**
- Brands not assigned to them
- Any payment or invoice data (no financial module access)
- Expense records
- Monthly fee, GST number, PAN, or any financial field on a brand profile (these fields are returned by the API but the frontend omits them; team members should not be calling finance endpoints)
- Net profit or revenue dashboards
- Leads pipeline
- Audit logs
- Settings (beyond their own profile)
- Other team members' personal data beyond name/role

**Their dashboard view:**
A personal productivity dashboard — their assigned brands (names only, no financials), their open tasks, upcoming meetings they are invited to, and unread chat messages.

---

## Permissions Matrix

| Feature | Admin | HR/Manager | Team Member |
|---|---|---|---|
| Dashboard (full financial) | ✅ Full | ❌ No | ❌ No |
| Dashboard (limited operational) | ✅ Full | ✅ Full | ⚠️ Limited |
| View all brands | ✅ Full | ✅ Full | ❌ No |
| View assigned brands only | ✅ Full | ✅ Full | ✅ Full |
| Onboard new brand | ✅ Full | ✅ Full | ❌ No |
| Edit brand profile | ✅ Full | ✅ Full | ❌ No |
| Assign team to brand | ✅ Full | ✅ Full | ❌ No |
| View brand financial data (fee, billing, GST, PAN) | ✅ Full | ✅ Full | ❌ No |
| Projects — full access | ✅ Full | ✅ Full | ❌ No |
| Projects — view assigned | ✅ Full | ✅ Full | 👁️ Read-only |
| Tasks — full access | ✅ Full | ✅ Full | ❌ No |
| Tasks — own tasks only | ✅ Full | ✅ Full | ✅ Full |
| Invoices — create/manage | ✅ Full | ✅ Full | ❌ No |
| Finance dashboard | ✅ Full | ⚠️ Limited | ❌ No |
| Record payment (offline) | ✅ Full | ✅ Full | ❌ No |
| Pay invoice online (Razorpay) | ✅ Full | ✅ Full | ❌ No |
| View expenses | ✅ Full | ❌ No | ❌ No |
| Add expense | ✅ Full | ❌ No | ❌ No |
| Net profit view | ✅ Full | ❌ No | ❌ No |
| Retention engine | ✅ Full | ✅ Full | ❌ No |
| Chat / Inbox | ✅ Full | ✅ Full | ⚠️ Limited |
| Meetings — full (create/manage) | ✅ Full | ✅ Full | ❌ No |
| Meetings — invited only | ✅ Full | ✅ Full | 👁️ Read-only |
| Leads pipeline | ✅ Full | ✅ Full | ❌ No |
| Convert lead to brand | ✅ Full | ✅ Full | ❌ No |
| View team list | ✅ Full | ✅ Full | ❌ No |
| Add team member | ✅ Full | ❌ No | ❌ No |
| Deactivate team member | ✅ Full | ❌ No | ❌ No |
| Settings — all tabs | ✅ Full | ❌ No | ❌ No |
| Settings — own profile only | ✅ Full | ✅ Full | ✅ Full |
| Audit logs | ✅ Full | ❌ No | ❌ No |
| Export CSV/PDF | ✅ Full | ✅ Full | ❌ No |
| Notifications (receive) | ✅ Full | ✅ Full | ⚠️ Limited |

**Legend:** ✅ Full — ⚠️ Limited (scoped/partial) — ❌ No access — 👁️ Read-only

---

## Navigation — What Each Role Sees in the Sidebar

### Admin
- Dashboard
- Brands
- Projects
- Tasks
- Invoices
- Finance (Payments + Expenses + Net Profit)
- Retention Engine
- Leads
- Chat / Inbox
- Meetings
- Team
- Settings (all tabs)
- Audit Log
- Notifications

### HR / Manager
- Dashboard
- Brands
- Projects
- Tasks
- Invoices
- Finance (Payments only — no Expenses, no Net Profit)
- Retention Engine
- Leads
- Chat / Inbox
- Meetings
- Team (view only)
- Notifications

### Team Member
- Dashboard (personal)
- My Brands (assigned only)
- My Tasks
- Chat / Inbox (assigned conversations)
- Meetings (invited only)
- My Profile

---

## Data Isolation Rules

### Team Members and Brand Scope
A team member never sees any brand they have not been explicitly assigned to. The assignment is stored in the `brand_assignments` table (join table of `brand_id` and `member_id`). The `GET /api/brands` endpoint rewrites its SQL query for `role === 'team'` to perform an `INNER JOIN` on `brand_assignments`, filtering to only that user's assigned brands. This is enforced at the database query level, not just the UI.

### Financial Data Hidden from Team Members
Even for brands a team member is assigned to, financial fields (monthly fee, GST number, PAN, billing cycle, invoice amounts, payment history, and expense records) are never surfaced to them. The expenses API returns HTTP 403 for any non-admin role. Invoice and payment endpoints do not have team-level role checks in the current API — the frontend is responsible for not rendering these modules for team members, and it is recommended that explicit role guards be added to those routes in a future hardening pass.

### Server-Side Enforcement
All permission checks that matter are enforced in Express route handlers, not solely by hiding elements in the React frontend. JWT role is decoded from the Authorization header on every request. The frontend hiding a button provides UX convenience only — an unauthorized direct API call will still return 403 where role checks are implemented.
