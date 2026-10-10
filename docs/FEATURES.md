# Retentio — Feature Reference

---

## 1. Authentication & Login

**What it does:**
Retentio uses email/password authentication with JWT tokens. The first account registered in a workspace is automatically assigned the `admin` role. All subsequent users are invited and added by an admin.

**How it works:**
1. User visits the login screen and enters their email and password.
2. The frontend sends `POST /api/auth/login` with the credentials.
3. The backend queries the `users` table for a matching active account (`is_active = true`) and compares the submitted password against the stored bcrypt hash.
4. On success, a JWT is issued with a 7-day expiry containing the user's `id`, `name`, `email`, and `role`.
5. The token is stored client-side and attached as a `Bearer` token to every subsequent API request.
6. On every protected route, Express middleware (`auth.js`) verifies the JWT signature before the handler runs.
7. For signup (first-time agency setup), `POST /api/auth/signup` creates the user with `role = 'admin'` automatically.

**Who can access it:** All users (unauthenticated entry point).

**Key fields/data:** `email`, `password` (compared against `password_hash`), `role` (embedded in JWT), `is_active` (must be true to log in).

**Business rules:**
- Inactive users (`is_active = false`) cannot log in.
- JWT expiry is 7 days; after expiry the user is redirected to login.
- The first signup always produces an admin account; there is no admin-invite flow for the owner.
- A default password of `Change@1234` is assigned when an admin creates a new team member without specifying a password.

---

## 2. Subscription & Billing

**What it does:**
Retentio tracks the agency's own SaaS subscription plan (the plan they pay to use Retentio) within the Settings module. This is distinct from client billing. Only the Admin can view or change subscription settings.

**How it works:**
1. Admin navigates to Settings → Subscription tab.
2. The current plan name, price, billing cycle, renewal date, and status are loaded from the `settings` table (`subscription_plan_name`, `subscription_price`, `subscription_billing_cycle`, `subscription_renewal_date`, `subscription_status`).
3. Admin can update plan details via `PATCH /api/settings`.
4. Razorpay integration credentials (`razorpay_key_id`, `razorpay_connected`) are also managed here, enabling online payment collection from clients.

**Who can access it:** Admin only.

**Key fields/data:** `subscription_plan_name`, `subscription_price`, `subscription_billing_cycle`, `subscription_renewal_date`, `subscription_status`, `razorpay_key_id`, `razorpay_connected`.

**Business rules:**
- Only the admin role can read or update subscription settings.
- HR and team members have no visibility into the agency's own subscription cost.
- Razorpay credentials stored here are used globally for all client invoice payment links.

---

## 3. Brand / Client Onboarding

**What it does:**
The Brand Onboarding flow allows an Admin or HR Manager to register a new client (called a "brand") in the system, capturing all contact, billing, and service information needed to manage the engagement.

**How it works:**
1. Admin or HR clicks "Add Brand" and fills in the onboarding form.
2. The form collects brand name, owner name, mobile, email, billing address, state, pincode, GST number, PAN, service details, monthly fee, billing cycle day, onboarding date, and initial status.
3. On submit, `POST /api/brands` creates the record. The endpoint returns 403 if the caller's role is not `admin` or `hr`.
4. Optionally, team members can be assigned during onboarding by providing `memberIds` — the backend inserts rows into `brand_assignments`.
5. The brand appears immediately in the brand list and all relevant modules (invoices, payments, projects, tasks, chat).

**Who can access it:** Admin, HR/Manager.

**Key fields/data:** `name`, `owner_name`, `mobile`, `email`, `billing_address`, `state`, `pincode`, `gst_number`, `pan`, `service_details`, `monthly_fee`, `billing_cycle_day`, `onboarding_date`, `status` (Active/Inactive/Churned).

**Business rules:**
- Brand name is required; all other fields are optional at creation.
- Only `admin` and `hr` can create brands; team members cannot.
- Status defaults to `Active` on creation.
- `last_activity_date` and `last_payment_date` are initialized to the current date and drive the Retention Engine.

---

## 4. Team Assignment System

**What it does:**
Team Assignment controls which team members can see and work on which brands. It is the primary mechanism for data isolation between team members.

**How it works:**
1. Admin or HR opens a brand's detail page and navigates to the Team/Members tab.
2. They select one or more active users (with role `team`) from the team list.
3. On save, `PATCH /api/brands/:id/assign-members` is called with the full list of `memberIds`.
4. The backend deletes all existing rows in `brand_assignments` for that brand and re-inserts the new set (full replace strategy).
5. Going forward, those team members will see this brand in their brand list; removed members will not.

**Who can access it:** Admin, HR/Manager (to assign); Team Member (is subject to assignments).

**Key fields/data:** `brand_assignments` table — `brand_id`, `member_id`; also `user_brand_assignments` for a separate user-centric view.

**Business rules:**
- A team member with zero assignments sees an empty brand list.
- Assignment is brand-scoped, not project-scoped — once assigned to a brand, the team member can see all projects and tasks under that brand.
- Assignment changes take effect immediately on the next API request; no cache invalidation delay.

---

## 5. Payment Tracking Dashboard

**What it does:**
The Payment Tracking Dashboard gives Admins and HR Managers a real-time view of all incoming payments across all brands — who has paid, when, how much, and via which method.

**How it works:**
1. Dashboard loads `GET /api/payments` with optional filters by `brandId` or `invoiceId`.
2. Payments are displayed in a list sorted by most recent first.
3. Admin can record a new offline payment via `POST /api/payments`, supplying `invoiceId`, `brandId`, `amount`, `mode`, and optional `referenceNo` and `proofUrl`.
4. Recording a payment triggers a database transaction: a new row in `payments`, an update to the invoice's `paid_amount` and `status` (auto-transitions to `Paid` when `paid_amount >= total_amount`, else `Partially Paid`), an update to the brand's `last_payment_date` and `last_activity_date`, a notification to admin/hr roles, and an audit log entry.

**Who can access it:** Admin (full), HR/Manager (view and record payments, no expense/profit view).

**Key fields/data:** `amount`, `payment_date`, `mode` (Bank Transfer, UPI, Cash, Cheque, Razorpay, etc.), `reference_no`, `proof_url`, `status` (Success), linked `invoice_id` and `brand_id`.

**Business rules:**
- Payment recording is transactional — all updates (payment, invoice, brand, notification, audit) either all succeed or all roll back.
- There is no delete-payment feature; payments are permanent records.
- When a payment makes `paid_amount >= total_amount`, the invoice status auto-updates to `Paid` and `payment_date` is set to today.

---

## 6. Expense Management

**What it does:**
Expense Management allows the Admin to record, categorize, and track all agency operating costs. Combined with revenue data, expenses feed the Net Profit calculation.

**How it works:**
1. Admin navigates to Finance → Expenses.
2. `GET /api/expenses` returns all expense records, filterable by `brandId` or `category`.
3. Admin adds a new expense via a form: category, amount, date, payment mode, note, receipt URL, optional brand linkage, and whether it recurs.
4. `POST /api/expenses` inserts the record and writes an audit log entry (`EXPENSE_ADDED`).
5. The finance dashboard aggregates total expenses against total revenue to show net profit.

**Who can access it:** Admin only. Any non-admin request to `GET /api/expenses` or `POST /api/expenses` returns HTTP 403.

**Key fields/data:** `category`, `amount`, `date`, `payment_mode`, `note`, `receipt_url`, `brand_id` (optional — links the expense to a specific client), `is_recurring`.

**Business rules:**
- Expenses are strictly admin-only at the API level.
- An expense can optionally be linked to a brand (e.g., a tool purchased for a specific client), but this does not affect brand-level billing.
- Receipt URLs are stored as text (links to uploaded files); file upload infrastructure is handled separately.

---

## 7. Retention Engine (Inactivity Alerts)

**What it does:**
The Retention Engine monitors all active brands for inactivity and surfaces alerts when a brand has not had a recorded activity within the configured threshold. It is designed to prevent client churn by prompting proactive outreach.

**How it works:**
1. The engine compares each brand's `last_activity_date` against today's date.
2. If the gap exceeds the `retention_threshold_days` setting (configurable in Settings, default 30 days), the brand is flagged as at-risk.
3. The Retention Engine page shows a list of flagged brands with days-since-last-contact.
4. For each flagged brand, the agency can take action:
   - **Log Activity:** Calls `PATCH /api/brands/:id/log-activity` to reset `last_activity_date` to today.
   - **Snooze:** Calls `PATCH /api/brands/:id/snooze-retention` which adds 7 days to `last_activity_date`, deferring the alert.
   - **Mark as Churned:** Calls `PATCH /api/brands/:id/churn` to set brand status to `Churned`.

**Who can access it:** Admin, HR/Manager.

**Key fields/data:** `last_activity_date`, `last_payment_date`, `retention_threshold_days` (from settings), brand `status`.

**Business rules:**
- Any payment recorded for a brand automatically resets `last_activity_date` and `last_payment_date` to today.
- The threshold is global across all brands; there is no per-brand threshold.
- Churned brands are removed from the at-risk list and their status is permanently updated.
- Snoozing advances `last_activity_date` by 7 days — it does not set a fixed future date.

---

## 8. Invoice Generator

**What it does:**
The Invoice Generator allows Admins and HR Managers to create professional, itemized invoices for any brand, with optional GST calculation, custom line items, HSN/SAC codes, and a configurable invoice number prefix.

**How it works:**
1. User opens Invoices → New Invoice and selects a brand.
2. They add line items (description, HSN/SAC code, quantity, unit price). Amounts are calculated automatically.
3. They choose whether to apply GST and select the type: CGST+SGST (intra-state) or IGST (inter-state). Tax amounts are computed.
4. On submit, `POST /api/invoices` is called. The backend auto-generates an invoice number using the prefix from Settings and a sequential counter.
5. The invoice is created with status `Sent`.
6. The invoice can be exported to PDF (the PDF endpoint currently returns the data structure for client-side rendering).

**Who can access it:** Admin, HR/Manager (create/manage).

**Key fields/data:** `invoice_number`, `brand_id`, `issue_date`, `due_date`, `subtotal`, `has_gst`, `gst_type` (NONE / CGST_SGST / IGST), `cgst_amount`, `sgst_amount`, `igst_amount`, `total_amount`, `paid_amount`, `status` (Sent / Partially Paid / Paid / Overdue / Draft), `notes`, invoice line items (description, `hsn_sac`, quantity, unit price, amount).

**Business rules:**
- Invoice numbers are auto-generated as `{invoice_prefix}{sequential_number}` where the prefix is set in Settings (e.g., `INV-2026-`).
- `brandId` is required; the invoice must be linked to a brand.
- Status defaults to `Sent` on creation.
- GST calculation: CGST and SGST each receive half the GST rate; IGST receives the full rate.

---

## 9. Recurring Invoices

**What it does:**
Recurring Invoices automates regular billing for brands on retainer, creating a schedule that tracks when the next invoice is due without requiring manual re-creation each cycle.

**How it works:**
1. When creating an invoice, the user toggles `isRecurring = true`.
2. `POST /api/invoices` detects this flag and inserts a row into the `recurring_invoices` table with `frequency = 'Monthly'` and a `next_due_date` based on the invoice's due date.
3. The Recurring Invoices management view shows all active schedules with their next due dates and status.
4. When a recurring invoice becomes due (checked either manually or via a scheduled job), a new invoice is generated for that brand by duplicating the template invoice's line items and amounts.

**Who can access it:** Admin, HR/Manager.

**Key fields/data:** `recurring_invoices` table — `invoice_id` (template invoice), `brand_id`, `frequency` (Monthly), `next_due_date`, `status` (Active / Paused).

**Business rules:**
- Frequency is currently fixed to Monthly.
- The recurring schedule does not auto-generate invoices without a server-side cron job; the schedule entry tracks intent and due dates.
- Pausing a recurring schedule sets its status to `Paused`; it will not be processed while paused.

---

## 10. WhatsApp Click-to-Share

**What it does:**
WhatsApp Click-to-Share provides a one-click button on invoices and payment records that opens WhatsApp web/app pre-filled with the invoice details and a payment link, enabling the agency to notify clients instantly without copy-pasting.

**How it works:**
1. On the invoice detail view, the user clicks the WhatsApp share button.
2. The frontend constructs a `wa.me` deep link with the brand's registered mobile number and a pre-formatted message containing the invoice number, amount, due date, and payment link.
3. Clicking the link opens WhatsApp (web or mobile app) in a new tab with the contact pre-filled and the message ready to send.
4. The feature is gated by the `whatsapp_enabled` flag in Settings (Admin can disable it globally).

**Who can access it:** Admin, HR/Manager.

**Key fields/data:** Brand `mobile` number (used as WhatsApp recipient), invoice `invoice_number`, `total_amount`, `due_date`, Razorpay payment link (if configured), `whatsapp_enabled` setting.

**Business rules:**
- If `whatsapp_enabled` is `false` in Settings, the button is hidden.
- No message is actually sent through the Retentio backend — the wa.me link hands off to WhatsApp; Retentio has no visibility into whether the message was delivered or read.
- The brand's `mobile` field must be populated for the link to function correctly.

---

## 11. Chat / Inbox System

**What it does:**
The Chat module provides a real-time messaging inbox for internal team communication and direct client communication. Conversations are organized by brand or as direct messages between users.

**How it works:**
1. The Inbox page loads all conversations the current user participates in via `GET /api/chat/conversations`.
2. Conversations have a `type` (brand-linked or direct) and a list of participants stored in `conversation_participants`.
3. Selecting a conversation loads its messages via `GET /api/chat/conversations/:id/messages`.
4. Sending a message calls `POST /api/chat/conversations/:id/messages` with the message text and optional attachments.
5. The backend inserts the message into `chat_messages` and stores attachments in `message_attachments`.
6. Read receipts are tracked in `message_read_by` when a user views the conversation.
7. Unread counts are maintained on the `conversations` table and shown in the sidebar badge.

**Who can access it:** Admin (all conversations), HR/Manager (all conversations), Team Member (conversations they are a participant in), Brand/Client (their brand's conversation with the agency).

**Key fields/data:** `conversations` (`type`, `title`, `brand_id`, `last_message`, `unread_count`), `chat_messages` (`sender_id`, `sender_name`, `sender_role`, `text`, `timestamp`), `message_attachments` (`name`, `size`, `url`, `type`), `message_read_by`.

**Business rules:**
- Team members and brand users only see conversations they are participants in; they cannot browse all conversations.
- Attachments are stored as URLs (file upload handled separately); the attachment metadata is stored in `message_attachments`.
- `unread_count` on the conversation is updated when a message is sent and reset to 0 when the user opens the conversation.

---

## 12. Projects Module

**What it does:**
The Projects Module tracks work engagements under each brand beyond the recurring retainer — one-off projects with a defined scope, timeline, billing amount, and progress percentage.

**How it works:**
1. Admin or HR creates a project under a specific brand via the Projects tab.
2. They fill in project name, scope, start date, end date, status, and billing amount.
3. Team members can be assigned to a project via `project_assignments`.
4. Progress is updated as work proceeds (0–100%).
5. Project status transitions: Not started → In Progress → Completed.

**Who can access it:** Admin and HR (full create/edit/delete); Team Member (view projects on their assigned brands); Brand/Client (view their own projects' status and progress — read-only).

**Key fields/data:** `name`, `scope`, `start_date`, `end_date`, `status` (Not started / In Progress / Completed / On Hold), `billing_amount`, `progress` (0–100 integer), `brand_id`, `project_assignments` (member–project links).

**Business rules:**
- Projects are always linked to a brand (`brand_id` is required).
- Billing amount on a project is separate from the brand's monthly retainer fee.
- Team members see projects on their assigned brands but cannot edit project details.

---

## 15. Tasks Module

**What it does:**
The Tasks Module provides a kanban-style task management system where work items can be created, assigned to team members, prioritized, and tracked through to completion.

**How it works:**
1. Admin or HR creates a task, linking it to a brand and optionally to a specific project.
2. The task is assigned to a team member (`assignee_id`), given a due date, priority, and initial status.
3. The assigned team member sees the task in their personal task list.
4. Team members can update the status of their own tasks (To Do → In Progress → Done).
5. Tasks are filterable by brand, project, assignee, status, and priority.

**Who can access it:** Admin and HR (create, assign, manage all tasks); Team Member (view and update own assigned tasks only).

**Key fields/data:** `title`, `description`, `project_id` (optional), `brand_id`, `assignee_id`, `due_date`, `priority` (Low / Medium / High / Urgent), `status` (To Do / In Progress / In Review / Done / Blocked).

**Business rules:**
- A task must be linked to a brand; project linkage is optional.
- Team members can only see tasks assigned directly to them — not all tasks for a brand.
- Priority defaults to Medium.

---

## 16. Meetings & Calendar

**What it does:**
The Meetings module allows the agency to schedule, track, and manage client meetings and internal sessions, with attendee management, location/link tracking, and optional reminders.

**How it works:**
1. Admin or HR creates a meeting by providing a title, linked brand or lead, date, time, duration, location or video link, notes, and attendees.
2. `POST /api/meetings` inserts the meeting and links attendees via `meeting_attendees`.
3. Attendees receive notifications about the meeting.
4. The calendar view shows all upcoming meetings; attendees see only their invited meetings.
5. `reminder_sent` is flagged once a reminder notification is dispatched.

**Who can access it:** Admin and HR (full create/manage); Team Member (view meetings they are invited to as an attendee).

**Key fields/data:** `title`, `brand_id`, `lead_id` (for prospect meetings), `date`, `time`, `duration_minutes`, `link_or_location`, `notes`, `reminder_sent`, `meeting_attendees` (user–meeting links).

**Business rules:**
- A meeting can be linked to either a brand or a lead (prospect), not both.
- Team members who are not listed as attendees cannot see the meeting.
- `reminder_sent` is a one-time flag; once set to true it is not reset.

---

## 17. Leads Pipeline (CRM)

**What it does:**
The Leads Pipeline is a lightweight CRM that tracks prospective clients through a defined sales funnel, from initial contact through to conversion as a brand (paying client) or loss.

**How it works:**
1. Admin or HR creates a lead with contact details, source, estimated deal value, and initial stage.
2. Leads move through stages: New → Contacted → Proposal Sent → Negotiation → Won → Lost.
3. Stage updates are made via `PATCH /api/leads/:id/stage`.
4. When a lead is won, `POST /api/leads/:id/convert` creates a new brand record pre-populated with the lead's company name, contact, email, and phone, and marks the lead stage as `Won`.
5. Follow-up dates can be set and used to surface overdue follow-ups.

**Who can access it:** Admin, HR/Manager.

**Key fields/data:** `name`, `company`, `contact`, `email`, `phone`, `source` (Referral, Website, Social, etc.), `stage`, `value` (estimated deal value), `follow_up_date`, `notes`.

**Business rules:**
- Converting a lead to a brand creates the brand with `status = 'Active'` and `monthly_fee = 0`; the fee must be set separately during onboarding.
- The converted lead's stage is set to `Won` automatically.
- Lost leads remain in the system for reporting and are not deleted.
- Team members do not have access to the leads pipeline.

---

## 18. Team Management Module

**What it does:**
Team Management allows Admins to add, view, and deactivate agency team members, and assign them to appropriate roles. It is the central HR directory for the workspace.

**How it works:**
1. Admin navigates to Team and sees all active users.
2. To add a team member, Admin clicks "Add Member" and fills in name, email, phone, role, designation, and an optional avatar.
3. `POST /api/users` creates the user with a default password (`Change@1234`) that they should change on first login.
4. Admin can edit any team member's details via `PATCH /api/users/:id`.
5. To remove access, Admin deactivates the user via `PATCH /api/users/:id/deactivate` which sets `is_active = false`. The user can no longer log in but their historical data (tasks, messages) is preserved.

**Who can access it:** Admin (full manage); HR/Manager (view team list); Team Member (view own profile only).

**Key fields/data:** `name`, `email`, `phone`, `role` (admin / hr / team), `designation`, `avatar`, `is_active`, `assignedBrandIds` (derived from `brand_assignments`).

**Business rules:**
- Only admins can create users (`POST /api/users`) or deactivate users (`PATCH /api/users/:id/deactivate`).
- Deactivation is soft — `is_active = false` prevents login but preserves data integrity.
- Changing a user's role updates their permissions on next login (JWT is re-issued on next login).

---

## 19. Inbox (Unified Notifications)

**What it does:**
The Notifications Inbox is a centralized feed of system-generated alerts and activity updates relevant to the current user, delivered in real time as actions occur across the platform.

**How it works:**
1. Notifications are written to the `notifications` table by various backend processes (payment recorded, invoice overdue, retention alert, etc.).
2. Each notification has `recipient_roles` (array of roles who should see it) and/or `target_user_id` (for user-specific notifications).
3. `GET /api/notifications` returns only notifications matching the current user's role or user ID.
4. Unread notifications are shown with a badge count in the sidebar.
5. Users can mark individual notifications as read (`PATCH /api/notifications/:id/read`) or mark all as read (`PATCH /api/notifications/read-all`).

**Who can access it:** Admin and HR/Manager receive payment, invoice, and retention notifications. Team Members receive task assignment and meeting notifications targeted to their user ID.

**Key fields/data:** `type` (payment, invoice, retention, task, meeting), `title`, `message`, `timestamp`, `is_read`, `link_module` (which module to navigate to when clicked), `brand_id`, `recipient_roles`, `target_user_id`.

**Business rules:**
- A notification can target either specific roles (`recipient_roles`) or a specific user (`target_user_id`) — both are checked in the query.
- Payment received notifications are sent to `['admin', 'hr']` roles automatically when a payment is recorded.
- `is_read` defaults to `false`; notifications are never auto-deleted.

---

## 20. Settings — Invoice Design

**What it does:**
The Invoice Design settings tab allows the Admin to customize the visual appearance of generated invoices — logo, color scheme, font, and layout options — so that invoices match the agency's brand identity.

**How it works:**
1. Admin opens Settings → Invoice Design.
2. Settings are loaded from the `invoice_design` JSONB column in the `settings` table.
3. Admin updates design preferences (logo URL, primary color, header style, whether to show bank details, etc.).
4. Changes are saved via `PATCH /api/settings` and the updated `invoice_design` JSON is stored.
5. When an invoice is generated or exported as PDF, the frontend applies these design settings to the rendered template.

**Who can access it:** Admin only.

**Key fields/data:** `invoice_design` JSONB — contains logo URL, primary color, secondary color, font preference, layout style, footer text, bank detail display toggle, and signature image URL.

**Business rules:**
- Invoice design settings are global — they apply to all invoices generated in the workspace.
- Changes to the design do not retroactively alter already-sent PDFs; they affect new exports.
- The `invoice_design` field is stored as a flexible JSONB column to accommodate future design options without schema changes.

---

## 21. Settings — Holidays Calendar

**What it does:**
The Holidays Calendar settings allow the Admin to define agency-observed holidays and public holidays, which integrate with the Meetings and Tasks modules to avoid scheduling on non-working days.

**How it works:**
1. Admin opens Settings → Holidays.
2. Existing holidays are fetched via `GET /api/holidays`.
3. Admin can add a holiday by providing a title, date, and type (National Holiday, State Holiday, Agency Custom).
4. `POST /api/holidays` inserts the record.
5. Holidays can be edited or deleted.
6. The calendar view in Meetings displays holiday markers on the relevant dates.

**Who can access it:** Admin only (manage); other roles may view holiday dates as read-only in calendar views.

**Key fields/data:** `title`, `date`, `type` (Agency Custom / National / State).

**Business rules:**
- Holidays are informational; the system does not automatically block meeting creation on holidays, but the calendar renders a visual indicator.
- Holiday types allow filtering between company-specific days off and statutory public holidays.

---

## 22. Export to CSV / PDF

**What it does:**
Export functionality allows Admins and HR Managers to download financial and operational data in CSV or PDF format for accounting, reporting, and record-keeping purposes.

**How it works:**
1. On list views (Invoices, Payments, Expenses, Brands, Tasks), an Export button is available.
2. For CSV exports, the frontend collects the current filtered dataset and generates a CSV file client-side using the table data in view.
3. For PDF exports (invoices), `GET /api/invoices/:id/pdf` returns the full invoice data structure; the frontend renders this into a styled PDF using a client-side PDF library.
4. The generated file is offered as a browser download.

**Who can access it:** Admin (all exports); HR/Manager (invoices, payments, brands — not expenses).

**Key fields/data:** Exported columns depend on the module — invoices export includes invoice number, brand, dates, amounts, GST breakdown, status; payments include brand, date, amount, mode, reference; expenses include category, amount, date, mode, notes.

**Business rules:**
- Expense exports are admin-only, consistent with the expense module access rule.
- CSV exports reflect the currently filtered view, not all records.

---

## 23. Notifications System

**What it does:**
The Notifications System is the event-driven alert infrastructure that automatically generates in-app notifications when key actions occur across the platform, ensuring the right people are informed of critical events without manual communication.

**How it works:**
1. When a triggering event occurs (payment received, invoice overdue, brand inactivity threshold crossed, task assigned, meeting scheduled), the responsible backend route inserts a notification row into the `notifications` table.
2. Notifications include a `type`, human-readable `title` and `message`, a `link_module` for deep-linking, and targeting information (`recipient_roles` or `target_user_id`).
3. The frontend polls or receives notifications and displays them in the bell-icon dropdown and the full Inbox page.
4. Unread count is derived from `is_read = false` records matching the user.

**Who can access it:** All authenticated users receive notifications relevant to their role or user ID.

**Key fields/data:** `type`, `title`, `message`, `timestamp`, `is_read`, `link_module`, `brand_id`, `recipient_roles` (array), `target_user_id`.

**Business rules:**
- Payment notifications go to `admin` and `hr` roles.
- Task and meeting notifications target the specific `target_user_id` (the assignee or invitee).
- Notifications are never auto-deleted; the inbox is a permanent activity log.
- The `link_module` value enables the frontend to route the user to the relevant screen when a notification is clicked.

---

## 24. Audit Log & Activity Timeline

**What it does:**
The Audit Log is an immutable chronological record of significant actions performed in the system — who did what, when, and from which IP address. It is used for accountability, compliance, and debugging.

**How it works:**
1. When a significant action occurs (expense added, payment recorded, team member deactivated, settings changed, etc.), the backend inserts a row into `audit_logs`.
2. The actor's name, role, a standardized action code (e.g., `PAYMENT_RECORDED`, `EXPENSE_ADDED`), a human-readable details string, and the IP address are recorded.
3. Admin navigates to Audit Log to view the full history.
4. `GET /api/audit-logs` supports pagination (`limit` and `offset` query params) and is sorted by most recent first.
5. The endpoint returns 403 for any non-admin user.

**Who can access it:** Admin only.

**Key fields/data:** `timestamp`, `actor_name`, `actor_role`, `action` (action code), `details` (human-readable description), `ip_address`, `created_at`.

**Business rules:**
- Audit log entries are insert-only; there is no update or delete endpoint for audit records.
- IP address is recorded as `'unknown'` in the current implementation; production deployments should pass the real client IP from the request headers.
- Audit logging currently covers payment recording and expense creation; additional action types should be added as the platform matures.
- Only the admin role can read audit logs; HR and team members have no access.

---

## Phase Roadmap

### Phase 1 — MVP (Core Agency Operations)

These features constitute the initial launch-ready product covering the primary daily workflows of an agency:

- Authentication & Login
- Brand / Client Onboarding
- Team Assignment System
- Payment Tracking Dashboard
- Invoice Generator
- Chat / Inbox System
- Projects Module
- Tasks Module
- Team Management Module
- Settings (Company Profile, Bank Details, Invoice Prefix)
- Notifications System (basic — payment received)

### Phase 2 — Growth Features

These features extend the platform with automation, deeper financial insight, and client communication tools:

- Subscription & Billing (agency's own plan management)
- Expense Management
- Retention Engine (Inactivity Alerts)
- Recurring Invoices
- WhatsApp Click-to-Share
- Meetings & Calendar
- Leads Pipeline (CRM)
- Settings — Invoice Design
- Settings — Holidays Calendar
- Export to CSV / PDF
- Audit Log & Activity Timeline

### Phase 3 — Advanced & Integrations

These features are planned for a future phase once the core platform is stable and the agency user base has grown:

- Full Razorpay integration (automated payment reconciliation, webhook-driven status updates)
- Automated recurring invoice generation via scheduled cron jobs
- Email notification delivery (payment receipts, invoice reminders, meeting alerts)
- Advanced retention analytics (churn prediction, revenue forecasting)
- Mobile app (React Native) with push notifications
- Multi-workspace / agency network support
- Role-level permission customization (custom roles beyond the four built-in)
- API webhooks for external integrations (Zapier, Slack, accounting software)
