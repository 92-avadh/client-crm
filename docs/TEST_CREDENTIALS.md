# Retentio — Test Users & Login Credentials

This document is the canonical reference for all test accounts used during development, QA, and demo walkthroughs. All five users below are pre-seeded when you run the seed script.

---

## Quick Login (Demo Buttons)

The login screen shows **4 demo buttons** for instant access — no typing required:

| Button Label | Maps to |
|---|---|
| Login as Admin | alex@retentio.co |
| Login as HR | sarah.j@retentio.co |
| Login as Team | rahul.v@retentio.co |
| Login as Brand | vikram@apexmedia.in |

> Note: Priya Sharma (second team member) does not have a dedicated demo button. Log in manually using her credentials when testing her brand assignments.

---

## Test Users Table

| Role | Name | Email | Password | What to test |
|---|---|---|---|---|
| Admin / Owner | Alex Rivera | alex@retentio.co | Admin@1234 | Full platform access, finance, audit logs, subscription |
| HR / Manager | Sarah Jenkins | sarah.j@retentio.co | Admin@1234 | Brand onboarding, team assignments, invoices — no expenses |
| Team Member | Rahul Verma | rahul.v@retentio.co | Admin@1234 | Apex Media + Zephyr Cloud Labs only, tasks, chat |
| Team | Priya Sharma | priya.s@retentio.co | Admin@1234 | NovaPulse + Solis brands, retention alerts, tasks |

---

## Per-Role Testing Guide

### Admin — alex@retentio.co

Full access to every module. Use this account to test platform-wide operations.

1. **Create a new brand**: Go to Clients → Add Brand. Fill in GST, billing cycle, and assign a team member.
2. **Generate an invoice**: Go to Invoices → New Invoice. Select a brand, add line items, and apply GST. Verify the invoice PDF preview.
3. **Record a payment**: Open an unpaid invoice and click Record Payment. Confirm the invoice status flips to Paid and a payment entry appears in Finance.
4. **Add an expense**: Go to Finance → Expenses → Add Expense. Try both a recurring and a one-off entry.
5. **Check audit logs**: Go to Settings → Audit Log. Verify that the invoice creation and payment actions above appear with timestamps and IP addresses.
6. **View subscription settings**: Go to Settings → Subscription. Verify the plan details and renewal date are visible (hidden for all other roles).

---

### HR / Manager — sarah.j@retentio.co

Can manage brands and team, create invoices, but cannot see expenses or subscription details.

1. **Onboard a brand**: Go to Clients → Add Brand. Complete the onboarding form and confirm the new brand appears in the list.
2. **Assign a team member**: Open an existing brand → Team tab → Assign. Confirm the assignment shows up in the team member's view.
3. **Create an invoice**: Go to Invoices → New Invoice. Confirm you can create and send an invoice.
4. **Verify expenses are hidden**: Navigate to Finance. Confirm the Expenses tab or section is not visible or accessible.
5. **Verify subscription is hidden**: Go to Settings. Confirm the Subscription section is absent.
6. **Check notifications**: View the inbox and confirm you receive invoice and assignment notifications but not admin-only retention alerts.

---

### Team Member — rahul.v@retentio.co

Assigned to: **Apex Media Pvt Ltd** and **Zephyr Cloud Labs**. Read-only access to those brands.

1. **Verify brand scope**: Go to Clients. Confirm you see only Apex Media and Zephyr Cloud Labs — no other brands.
2. **Access a blocked brand**: Try navigating directly to NovaPulse or Solis. Confirm access is denied or the brand does not appear.
3. **Try to access finance**: Navigate to Finance or Invoices. Confirm these modules are either hidden or show no data.
4. **View and update a task**: Go to Tasks. Confirm you can see your assigned tasks and change status (e.g., To Do → In Progress → Done).
5. **Send a chat message**: Go to Chat → Apex Media Client Channel. Send a message and confirm it appears in the conversation.
6. **Check your project progress**: Go to Projects → Apex Media. Verify you can see project scope and progress but cannot edit billing amounts.

---

### Team Member (2nd) — priya.s@retentio.co

Assigned to: **NovaPulse D2C Healthcare** and **Solis Renewable Solar**. Good for testing retention alert flows.

1. **Verify brand scope**: Go to Clients. Confirm only NovaPulse and Solis are visible.
2. **Inspect retention alerts**: Go to Dashboard or Retention. Confirm high-risk and inactive alerts appear for Solis (35+ days inactive) and NovaPulse (22+ days inactive).
3. **Review an overdue task**: Go to Tasks. Find the urgent tasks flagged for Solis and NovaPulse — these test the overdue warning states.
4. **Update a task status**: Change the Diwali campaign task from To Do to In Progress.
5. **Access a chat channel**: Go to Chat and confirm no Apex Media or Zephyr channel is visible.
6. **Check notifications**: Confirm you receive team-targeted retention alerts but not admin-only finance notifications.

---

## Quick API Testing with curl

Replace `BASE_URL` with your backend URL (default: `http://localhost:5000`).

### Step 1: Login and get token

```bash
# Admin login
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@retentio.co","password":"Admin@1234"}' | jq .

# HR login
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.j@retentio.co","password":"Admin@1234"}' | jq .

# Team login (Rahul)
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul.v@retentio.co","password":"Admin@1234"}' | jq .

# Team login (Priya)
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.s@retentio.co","password":"Admin@1234"}' | jq .

# Brand login
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vikram@apexmedia.in","password":"Admin@1234"}' | jq .
```

Save the returned token:

```bash
TOKEN="<paste token here>"
```

### Step 2: Sample authenticated requests

```bash
# Get all brands (Admin/HR sees all; Team sees assigned only)
curl -s $BASE_URL/api/brands \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get invoices
curl -s $BASE_URL/api/invoices \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get tasks for current user
curl -s $BASE_URL/api/tasks \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get expenses (Admin only — HR/Team should get 403)
curl -s $BASE_URL/api/expenses \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get audit logs (Admin only)
curl -s $BASE_URL/api/audit-logs \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Important Notes

- **All five users share the same password**: `Admin@1234`
- **Demo data is pre-seeded**: Brands, invoices, tasks, expenses, meetings, and chat messages are all ready on a fresh seed run.
- **To reset data**: Re-run the seed script. It uses `ON CONFLICT DO NOTHING` so duplicate inserts are safe, but to fully reset, truncate the tables first or use a dedicated reset script.
- **Frontend mock mode**: If the backend is unreachable, the frontend falls back to mock data in `frontend/src/data/mockData.ts`. The user IDs in that file match the seed IDs exactly.
- **Brand name differences**: The frontend mockData uses slightly different brand names (e.g., "Apex Media Pvt Ltd" vs. "Apex Media Solutions" in seed.js). This is cosmetic only — the brand IDs (`brand_apex`, `brand_zephyr`, etc.) are consistent everywhere.
