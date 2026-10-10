# Retentio API — Endpoint Reference

## Overview

### Base URL

```
http://localhost:4000/api
```

### Authentication

All protected routes require a JSON Web Token passed as a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued on login and signup. They expire after **7 days**. Auth routes (`/api/auth/*`) are public — all other routes require this header.

### Response Format

All successful responses return JSON. Collections return arrays; single-resource endpoints return objects.

```json
{ "id": "...", "fieldName": "value", ... }
```

### Error Format

All error responses follow this structure:

```json
{ "error": "Human-readable error message" }
```

### Roles

| Role    | Description                                          |
|---------|------------------------------------------------------|
| `admin` | Full access to all modules and settings              |
| `hr`    | Can manage brands, projects, tasks, meetings, leads  |
| `team`  | Sees only brands they are assigned to                |

---

## AUTH MODULE

### POST /api/auth/login

**Description:** Authenticates a user and returns a signed JWT along with the user profile.
**Auth required:** No
**Role access:** All roles

**Request:**
```json
{
  "email": "alex.rivera@retentio.app",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_a1b2c3d4e5f6a7b8",
    "name": "Alex Rivera",
    "email": "alex.rivera@retentio.app",
    "phone": "+91-9876543210",
    "role": "admin",
    "avatar": "https://cdn.retentio.app/avatars/alex.png",
    "designation": "Founder & CEO",
    "brandId": null
  }
}
```

**Notes:** Only active users (`is_active = true`) can log in. Returns `401` for invalid credentials or inactive accounts.

---

### POST /api/auth/signup

**Description:** Creates a new admin account and returns a JWT for immediate login.
**Auth required:** No
**Role access:** Public (creates `admin` role by default)

**Request:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@myagency.in",
  "password": "StrongPass@456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_b3c4d5e6f7a8b9c0",
    "name": "Priya Sharma",
    "email": "priya@myagency.in",
    "role": "admin"
  }
}
```

**Notes:** Returns `409` if the email is already registered. Newly created users always get the `admin` role. Use `POST /api/users` (authenticated) to create team members with other roles.

---

### POST /api/auth/logout

**Description:** Client-side logout acknowledgment — invalidates the session on the client.
**Auth required:** No
**Role access:** All roles

**Request:**
```json
{}
```

**Response:**
```json
{ "success": true }
```

**Notes:** JWT tokens are stateless; this endpoint performs no server-side token invalidation. Clients should discard the token on receipt of this response.

---

### POST /api/auth/forgot-password

**Description:** Initiates the password reset flow by sending a reset link to the provided email.
**Auth required:** No
**Role access:** All roles

**Request:**
```json
{
  "email": "alex.rivera@retentio.app"
}
```

**Response:**
```json
{ "message": "Reset link sent" }
```

**Notes:** Always returns a success message regardless of whether the email exists, to prevent user enumeration. Email delivery integration is implementation-dependent.

---

## USERS MODULE

### GET /api/users

**Description:** Returns a list of all active users in the workspace.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter | Type   | Description            |
|-----------|--------|------------------------|
| (none)    | —      | Returns all active users |

**Response:**
```json
[
  {
    "id": "usr_a1b2c3d4e5f6a7b8",
    "name": "Alex Rivera",
    "email": "alex.rivera@retentio.app",
    "phone": "+91-9876543210",
    "role": "admin",
    "avatar": "https://cdn.retentio.app/avatars/alex.png",
    "designation": "Founder & CEO",
    "brandId": null,
    "isActive": true,
    "assignedBrandIds": ["brand_1a2b3c", "brand_4d5e6f"]
  }
]
```

**Notes:** `assignedBrandIds` lists the brands this team member is directly assigned to.

---

### GET /api/users/:id

**Description:** Returns the full profile for a single user by their ID.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
{
  "id": "usr_a1b2c3d4e5f6a7b8",
  "name": "Alex Rivera",
  "email": "alex.rivera@retentio.app",
  "phone": "+91-9876543210",
  "role": "admin",
  "avatar": "https://cdn.retentio.app/avatars/alex.png",
  "designation": "Founder & CEO",
  "brandId": null,
  "isActive": true,
  "assignedBrandIds": ["brand_1a2b3c", "brand_4d5e6f"]
}
```

**Notes:** Returns `404` if the user does not exist.

---

### POST /api/users

**Description:** Creates a new user account (team member or HR).
**Auth required:** Yes
**Role access:** `admin` only

**Request:**
```json
{
  "name": "Riya Patel",
  "email": "riya.patel@myagency.in",
  "phone": "+91-9988776655",
  "password": "Change@1234",
  "role": "team",
  "designation": "Account Manager",
  "avatar": "https://cdn.retentio.app/avatars/riya.png",
  "brandId": null
}
```

**Response:**
```json
{
  "id": "usr_c5d6e7f8a9b0c1d2",
  "name": "Riya Patel",
  "email": "riya.patel@myagency.in",
  "phone": "+91-9988776655",
  "role": "team",
  "avatar": "https://cdn.retentio.app/avatars/riya.png",
  "designation": "Account Manager",
  "brandId": null,
  "isActive": true,
  "assignedBrandIds": []
}
```

**Notes:** `password` defaults to `Change@1234` if omitted. Returns `403` for non-admin callers.

---

### PATCH /api/users/:id

**Description:** Partially updates a user's profile fields.
**Auth required:** Yes
**Role access:** All roles (users can update their own profile; admin can update any)

**Request:**
```json
{
  "name": "Riya Patel-Mehta",
  "phone": "+91-9988001122",
  "designation": "Senior Account Manager",
  "avatar": "https://cdn.retentio.app/avatars/riya2.png"
}
```

**Response:**
```json
{
  "id": "usr_c5d6e7f8a9b0c1d2",
  "name": "Riya Patel-Mehta",
  "email": "riya.patel@myagency.in",
  "phone": "+91-9988001122",
  "role": "team",
  "avatar": "https://cdn.retentio.app/avatars/riya2.png",
  "designation": "Senior Account Manager",
  "brandId": null,
  "isActive": true,
  "assignedBrandIds": ["brand_1a2b3c"]
}
```

**Notes:** All fields are optional — only supplied fields are updated. Returns `404` if the user does not exist.

---

### PATCH /api/users/:id/deactivate

**Description:** Soft-deactivates a user account so they can no longer log in.
**Auth required:** Yes
**Role access:** `admin` only

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "usr_c5d6e7f8a9b0c1d2",
    "name": "Riya Patel-Mehta",
    "email": "riya.patel@myagency.in",
    "role": "team",
    "isActive": false,
    "assignedBrandIds": []
  }
}
```

**Notes:** Sets `is_active = false`. The record is preserved in the database. Deactivated users are excluded from `GET /api/users`. Returns `403` for non-admin callers.

---

## BRANDS MODULE

### GET /api/brands

**Description:** Returns the list of brands visible to the authenticated user.
**Auth required:** Yes
**Role access:** All roles (scoped by role — see Notes)

**Query Parameters:**

| Parameter | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| `status`  | string | Filter by status: `Active`, `Churned`, etc.  |
| `search`  | string | Search by brand name or owner name           |

**Response:**
```json
[
  {
    "id": "brand_1a2b3c",
    "name": "Apex Media Pvt Ltd",
    "ownerName": "Vikram Nair",
    "mobile": "+91-9876001234",
    "email": "vikram@apexmedia.in",
    "billingAddress": "42, Maker Chambers, Nariman Point",
    "state": "Maharashtra",
    "pincode": "400021",
    "gstNumber": "27AABCU9603R1ZX",
    "pan": "AABCU9603R",
    "serviceDetails": "GST Filing, ROC Compliance, Payroll",
    "monthlyFee": 12000.00,
    "billingCycleDay": 5,
    "onboardingDate": "2025-03-01",
    "notes": "Preferred contact via WhatsApp.",
    "status": "Active",
    "lastActivityDate": "2026-09-28",
    "lastPaymentDate": "2026-09-05",
    "createdAt": "2025-03-01T10:00:00.000Z",
    "assignedMemberIds": ["usr_a1b2c3d4e5f6a7b8"],
    "documents": []
  }
]
```

**Notes:** `admin` and `hr` see all brands. `team` users see only brands they are assigned to via `brand_assignments`. `brand` role users see only their own brand.

---

### GET /api/brands/:id

**Description:** Returns full details for a single brand including assigned members and documents.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
{
  "id": "brand_1a2b3c",
  "name": "Apex Media Pvt Ltd",
  "ownerName": "Vikram Nair",
  "mobile": "+91-9876001234",
  "email": "vikram@apexmedia.in",
  "billingAddress": "42, Maker Chambers, Nariman Point",
  "state": "Maharashtra",
  "pincode": "400021",
  "gstNumber": "27AABCU9603R1ZX",
  "pan": "AABCU9603R",
  "serviceDetails": "GST Filing, ROC Compliance, Payroll",
  "monthlyFee": 12000.00,
  "billingCycleDay": 5,
  "onboardingDate": "2025-03-01",
  "notes": "Preferred contact via WhatsApp.",
  "status": "Active",
  "lastActivityDate": "2026-09-28",
  "lastPaymentDate": "2026-09-05",
  "createdAt": "2025-03-01T10:00:00.000Z",
  "assignedMemberIds": ["usr_a1b2c3d4e5f6a7b8"],
  "documents": [
    {
      "id": "doc_7a8b9c",
      "brandId": "brand_1a2b3c",
      "name": "GST_Certificate_ApexMedia.pdf",
      "size": 204800,
      "uploadDate": "2026-01-15",
      "type": "application/pdf"
    }
  ]
}
```

**Notes:** Returns `404` if no brand with the given ID exists.

---

### POST /api/brands

**Description:** Creates a new brand (client) record in the platform.
**Auth required:** Yes
**Role access:** `admin`, `hr`

**Request:**
```json
{
  "name": "Zenith Retail Solutions",
  "ownerName": "Sneha Kulkarni",
  "mobile": "+91-9900112233",
  "email": "sneha@zenithretail.com",
  "billingAddress": "Plot 7, MIDC Industrial Area, Pune",
  "state": "Maharashtra",
  "pincode": "411019",
  "gstNumber": "27ZZZZZ9999Z1Z5",
  "pan": "ZZZZZ9999Z",
  "serviceDetails": "ITR Filing, GST Returns, Bookkeeping",
  "monthlyFee": 8500,
  "billingCycleDay": 10,
  "onboardingDate": "2026-10-01",
  "notes": "New client — referred by Apex Media.",
  "status": "Active",
  "memberIds": ["usr_a1b2c3d4e5f6a7b8"]
}
```

**Response:**
```json
{
  "id": "brand_9z8y7x",
  "name": "Zenith Retail Solutions",
  "ownerName": "Sneha Kulkarni",
  "mobile": "+91-9900112233",
  "email": "sneha@zenithretail.com",
  "billingAddress": "Plot 7, MIDC Industrial Area, Pune",
  "state": "Maharashtra",
  "pincode": "411019",
  "gstNumber": "27ZZZZZ9999Z1Z5",
  "pan": "ZZZZZ9999Z",
  "serviceDetails": "ITR Filing, GST Returns, Bookkeeping",
  "monthlyFee": 8500.00,
  "billingCycleDay": 10,
  "onboardingDate": "2026-10-01",
  "notes": "New client — referred by Apex Media.",
  "status": "Active",
  "lastActivityDate": null,
  "lastPaymentDate": null,
  "createdAt": "2026-10-05T08:30:00.000Z",
  "assignedMemberIds": ["usr_a1b2c3d4e5f6a7b8"],
  "documents": []
}
```

**Notes:** `name` is required. `status` defaults to `Active`. `billingCycleDay` defaults to `1`. `memberIds` is optional — brand assignment rows are created immediately if provided.

---

### PATCH /api/brands/:id

**Description:** Partially updates a brand's profile and operational details.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "monthlyFee": 9500,
  "notes": "Fee revised from Oct 2026.",
  "status": "Active"
}
```

**Response:** Full brand object (same shape as `GET /api/brands/:id`).

**Notes:** All fields are optional — unset fields are left unchanged via `COALESCE`. Returns `404` if brand not found. Use `PATCH /api/brands/:id/assign-members` to update member assignments separately.

---

### PATCH /api/brands/:id/assign-members

**Description:** Replaces the full list of team members assigned to a brand.
**Auth required:** Yes
**Role access:** `admin`, `hr`

**Request:**
```json
{
  "memberIds": ["usr_a1b2c3d4e5f6a7b8", "usr_c5d6e7f8a9b0c1d2"]
}
```

**Response:** Full brand object (same shape as `GET /api/brands/:id`).

**Notes:** This is a **full replace** — all existing assignments for the brand are deleted before the new list is inserted. Pass an empty array `[]` to remove all assignments.

---

### PATCH /api/brands/:id/log-activity

**Description:** Stamps today's date as the brand's `lastActivityDate` to reset the retention clock.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{}
```

**Response:** Full brand object with updated `lastActivityDate`.

**Notes:** Used by team members to record that a meaningful interaction occurred (call, meeting, deliverable). The retention health indicator on the dashboard is derived from `lastActivityDate` vs the configured threshold.

---

### PATCH /api/brands/:id/churn

**Description:** Marks a brand's status as `Churned`, indicating the client relationship has ended.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{}
```

**Response:** Full brand object with `status: "Churned"`.

**Notes:** This is a one-way status change through this endpoint. To reactivate a churned brand, use `PATCH /api/brands/:id` with `{ "status": "Active" }`.

---

### PATCH /api/brands/:id/snooze-retention

**Description:** Advances the brand's `lastActivityDate` forward by 7 days to snooze retention alerts.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{}
```

**Response:** Full brand object with `lastActivityDate` incremented by 7 days.

**Notes:** Useful when a known gap in client activity is expected (e.g., client on leave, festival period). Does not change the brand's status.

---

### POST /api/brands/:id/documents

**Description:** Attaches a document metadata record to a brand (after client-side upload).
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "name": "Incorporation_Certificate.pdf",
  "size": 512000,
  "type": "application/pdf"
}
```

**Response:**
```json
{
  "id": "doc_2b3c4d",
  "brandId": "brand_1a2b3c",
  "name": "Incorporation_Certificate.pdf",
  "size": 512000,
  "uploadDate": "2026-10-05",
  "type": "application/pdf"
}
```

**Notes:** This endpoint stores metadata only — actual file upload must be handled separately (e.g., S3 pre-signed URL). `size` is in bytes.

---

## PROJECTS MODULE

### GET /api/projects

**Description:** Returns all projects, optionally filtered by brand.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter | Type   | Description              |
|-----------|--------|--------------------------|
| `brandId` | string | Filter projects by brand |

**Response:**
```json
[
  {
    "id": "proj_3c4d5e",
    "brandId": "brand_1a2b3c",
    "name": "Annual GST Audit FY 2025-26",
    "scope": "Full GST audit including GSTR-9C reconciliation and filing.",
    "startDate": "2026-04-01",
    "endDate": "2026-06-30",
    "status": "In Progress",
    "billingAmount": 45000.00,
    "progress": 65,
    "createdAt": "2026-03-20T09:00:00.000Z",
    "assignedMemberIds": ["usr_a1b2c3d4e5f6a7b8", "usr_c5d6e7f8a9b0c1d2"]
  }
]
```

**Notes:** `progress` is an integer 0–100 representing percentage completion.

---

### POST /api/projects

**Description:** Creates a new project linked to a brand.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "brandId": "brand_1a2b3c",
  "name": "Annual GST Audit FY 2025-26",
  "scope": "Full GST audit including GSTR-9C reconciliation and filing.",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "status": "Not started",
  "billingAmount": 45000,
  "progress": 0,
  "memberIds": ["usr_a1b2c3d4e5f6a7b8"]
}
```

**Response:** Full project object (same shape as GET response).

**Notes:** `brandId` and `name` are required. `status` defaults to `"Not started"`. Valid statuses: `Not started`, `In Progress`, `Completed`, `On Hold`.

---

### PATCH /api/projects/:id

**Description:** Updates a project's details, status, progress, or assigned members.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "status": "Completed",
  "progress": 100,
  "memberIds": ["usr_a1b2c3d4e5f6a7b8"]
}
```

**Response:** Full project object.

**Notes:** If `memberIds` is provided, the existing assignment list is fully replaced. Omit `memberIds` entirely to leave assignments unchanged.

---

## TASKS MODULE

### GET /api/tasks

**Description:** Returns tasks filtered by optional query parameters.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter    | Type   | Description                     |
|--------------|--------|---------------------------------|
| `brandId`    | string | Filter by brand                 |
| `projectId`  | string | Filter by project               |
| `assigneeId` | string | Filter by assigned team member  |
| `status`     | string | Filter by task status           |

**Response:**
```json
[
  {
    "id": "task_5e6f7a",
    "projectId": "proj_3c4d5e",
    "brandId": "brand_1a2b3c",
    "title": "Prepare GSTR-9C draft for review",
    "description": "Compile reconciliation statement and flag discrepancies.",
    "assigneeId": "usr_a1b2c3d4e5f6a7b8",
    "dueDate": "2026-05-15",
    "priority": "High",
    "status": "In Progress",
    "createdAt": "2026-04-10T11:00:00.000Z"
  }
]
```

---

### POST /api/tasks

**Description:** Creates a new task, optionally linked to a project.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "projectId": "proj_3c4d5e",
  "brandId": "brand_1a2b3c",
  "title": "Prepare GSTR-9C draft for review",
  "description": "Compile reconciliation statement and flag discrepancies.",
  "assigneeId": "usr_a1b2c3d4e5f6a7b8",
  "dueDate": "2026-05-15",
  "priority": "High",
  "status": "To Do"
}
```

**Response:** Full task object.

**Notes:** `title` and `brandId` are required. `priority` defaults to `"Medium"`. `status` defaults to `"To Do"`. Valid priorities: `Low`, `Medium`, `High`. Valid statuses: `To Do`, `In Progress`, `Done`, `Blocked`.

---

### PATCH /api/tasks/:id/status

**Description:** Updates only the status field of a task (quick status update from Kanban board).
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "status": "Done"
}
```

**Response:** Full task object with updated status.

**Notes:** Prefer this endpoint over `PATCH /api/tasks/:id` for status-only updates. Returns `404` if task not found.

---

### PATCH /api/tasks/:id

**Description:** Partially updates any fields of a task.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "title": "Prepare & submit GSTR-9C",
  "dueDate": "2026-05-20",
  "priority": "High",
  "assigneeId": "usr_c5d6e7f8a9b0c1d2"
}
```

**Response:** Full task object.

**Notes:** All fields are optional. Returns `404` if task not found.

---

## INVOICES MODULE

### GET /api/invoices

**Description:** Returns invoices with optional filters.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter | Type   | Description                                              |
|-----------|--------|----------------------------------------------------------|
| `brandId` | string | Filter by brand                                          |
| `status`  | string | Filter by status: `Sent`, `Paid`, `Overdue`, `Partially Paid`, `Draft` |
| `search`  | string | Search by invoice number or brand name                   |

**Response:**
```json
[
  {
    "id": "inv_7b8c9d",
    "invoiceNumber": "INV-2026-0042",
    "brandId": "brand_1a2b3c",
    "brandName": "Apex Media Pvt Ltd",
    "issueDate": "2026-09-01",
    "dueDate": "2026-09-15",
    "subtotal": 10000.00,
    "hasGst": true,
    "gstType": "CGST_SGST",
    "cgstAmount": 900.00,
    "sgstAmount": 900.00,
    "igstAmount": 0.00,
    "totalAmount": 11800.00,
    "paidAmount": 11800.00,
    "status": "Paid",
    "notes": "Monthly retainer — September 2026",
    "paymentDate": "2026-09-05",
    "paymentMode": "NEFT",
    "razorpayPaymentId": null,
    "isRecurring": true,
    "createdAt": "2026-09-01T07:00:00.000Z",
    "items": [
      {
        "id": "ii_0a1b2c",
        "invoiceId": "inv_7b8c9d",
        "description": "Monthly Retainer — GST Filing & Compliance",
        "hsnSac": "998212",
        "quantity": 1,
        "unitPrice": 10000.00,
        "amount": 10000.00
      }
    ]
  }
]
```

---

### GET /api/invoices/:id

**Description:** Returns a single invoice with its full line items.
**Auth required:** Yes
**Role access:** All roles

**Response:** Single invoice object (same shape as above).

**Notes:** Returns `404` if no invoice with the given ID exists.

---

### POST /api/invoices

**Description:** Creates a new invoice and optionally registers it as a recurring invoice.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "brandId": "brand_1a2b3c",
  "brandName": "Apex Media Pvt Ltd",
  "issueDate": "2026-10-01",
  "dueDate": "2026-10-15",
  "subtotal": 10000,
  "hasGst": true,
  "gstType": "CGST_SGST",
  "cgstAmount": 900,
  "sgstAmount": 900,
  "igstAmount": 0,
  "totalAmount": 11800,
  "notes": "Monthly retainer — October 2026",
  "paymentMode": null,
  "isRecurring": true,
  "items": [
    {
      "description": "Monthly Retainer — GST Filing & Compliance",
      "hsnSac": "998212",
      "quantity": 1,
      "unitPrice": 10000,
      "amount": 10000
    }
  ]
}
```

**Response:** Full invoice object with generated `invoiceNumber` and `id`.

**Notes:** Invoice numbers are auto-generated using the prefix from Settings (e.g., `INV-2026-0043`). Initial status is always `"Sent"`. `paidAmount` starts at `0`. If `isRecurring: true`, a `recurring_invoices` record is also created automatically.

---

### PATCH /api/invoices/:id/status

**Description:** Updates only the status of an invoice.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "status": "Overdue"
}
```

**Response:** Full invoice object with updated status.

**Notes:** Valid statuses: `Draft`, `Sent`, `Paid`, `Partially Paid`, `Overdue`, `Cancelled`. For payment-driven status changes (marking Paid), use `POST /api/payments` instead, as it handles the full transactional flow.

---

### GET /api/invoices/:id/pdf

**Description:** Returns the invoice data payload intended for client-side PDF rendering.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
{
  "message": "PDF generation requires WeasyPrint/Puppeteer - serve invoice data for client-side PDF",
  "invoice": {
    "id": "inv_7b8c9d",
    "invoiceNumber": "INV-2026-0042",
    "brandName": "Apex Media Pvt Ltd",
    "totalAmount": 11800.00,
    "items": [ "..." ]
  }
}
```

**Notes:** Server-side PDF generation is not yet implemented. The frontend is expected to use the returned invoice object to render and download a PDF via a client-side library (e.g., `react-pdf` or `jsPDF`).

---

## RECURRING INVOICES MODULE

> Recurring invoice records are created automatically when a new invoice is posted with `isRecurring: true`. The four endpoints below manage these schedules directly.

### GET /api/recurring-invoices

**Description:** Returns all recurring invoice schedules.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter | Type   | Description          |
|-----------|--------|----------------------|
| `brandId` | string | Filter by brand      |
| `status`  | string | `Active` or `Paused` |

**Response:**
```json
[
  {
    "id": "rec_1a2b3c",
    "invoiceId": "inv_7b8c9d",
    "brandId": "brand_1a2b3c",
    "frequency": "Monthly",
    "nextDueDate": "2026-11-01",
    "status": "Active",
    "createdAt": "2026-09-01T07:00:00.000Z"
  }
]
```

---

### POST /api/recurring-invoices

**Description:** Manually creates a recurring invoice schedule linked to an existing invoice.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "invoiceId": "inv_7b8c9d",
  "brandId": "brand_1a2b3c",
  "frequency": "Monthly",
  "nextDueDate": "2026-11-01",
  "status": "Active"
}
```

**Response:**
```json
{
  "id": "rec_4d5e6f",
  "invoiceId": "inv_7b8c9d",
  "brandId": "brand_1a2b3c",
  "frequency": "Monthly",
  "nextDueDate": "2026-11-01",
  "status": "Active",
  "createdAt": "2026-10-05T08:00:00.000Z"
}
```

**Notes:** Valid frequencies: `Monthly`, `Quarterly`, `Yearly`. Prefer using `isRecurring: true` when creating an invoice via `POST /api/invoices` to create both records atomically.

---

### PATCH /api/recurring-invoices/:id

**Description:** Updates a recurring invoice schedule (e.g., change frequency or pause it).
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "frequency": "Quarterly",
  "nextDueDate": "2027-01-01",
  "status": "Paused"
}
```

**Response:** Updated recurring invoice object.

**Notes:** All fields are optional. Set `status: "Paused"` to temporarily stop auto-generation without deleting the schedule.

---

### DELETE /api/recurring-invoices/:id

**Description:** Permanently deletes a recurring invoice schedule.
**Auth required:** Yes
**Role access:** `admin`, `hr`

**Response:**
```json
{ "success": true }
```

**Notes:** Deleting a schedule does not affect invoices already generated from it. Returns `404` if the record does not exist.

---

## PAYMENTS MODULE

### GET /api/payments

**Description:** Returns payment records with optional filters.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter   | Type   | Description           |
|-------------|--------|-----------------------|
| `brandId`   | string | Filter by brand       |
| `invoiceId` | string | Filter by invoice     |

**Response:**
```json
[
  {
    "id": "pay_8c9d0e",
    "invoiceId": "inv_7b8c9d",
    "brandId": "brand_1a2b3c",
    "brandName": "Apex Media Pvt Ltd",
    "amount": 11800.00,
    "paymentDate": "2026-09-05",
    "mode": "NEFT",
    "referenceNo": "NEFT2026090500123",
    "status": "Success",
    "proofUrl": null,
    "createdAt": "2026-09-05T14:22:00.000Z"
  }
]
```

---

### POST /api/payments

**Description:** Records a manual payment against an invoice, triggering a full transactional update across multiple tables.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "invoiceId": "inv_7b8c9d",
  "brandId": "brand_1a2b3c",
  "brandName": "Apex Media Pvt Ltd",
  "amount": 11800,
  "mode": "NEFT",
  "referenceNo": "NEFT2026100500456",
  "proofUrl": "https://cdn.retentio.app/proofs/pay_8c9d0e.jpg"
}
```

**Response:**
```json
{
  "payment": {
    "id": "pay_9d0e1f",
    "invoiceId": "inv_7b8c9d",
    "brandId": "brand_1a2b3c",
    "brandName": "Apex Media Pvt Ltd",
    "amount": 11800.00,
    "paymentDate": "2026-10-05",
    "mode": "NEFT",
    "referenceNo": "NEFT2026100500456",
    "status": "Success",
    "proofUrl": "https://cdn.retentio.app/proofs/pay_9d0e1f.jpg",
    "createdAt": "2026-10-05T10:00:00.000Z"
  },
  "invoice": { "id": "inv_7b8c9d", "status": "Paid", "paidAmount": 11800.00, "..." : "..." },
  "brand": { "id": "brand_1a2b3c", "lastPaymentDate": "2026-10-05", "..." : "..." }
}
```

**Notes — Transactional side effects (runs inside a single DB transaction):**
1. Creates a payment record with `status: "Success"`.
2. Increments `invoices.paid_amount` by the payment amount. Sets invoice status to `"Paid"` if `paid_amount >= total_amount`, otherwise `"Partially Paid"`.
3. Updates `brands.last_payment_date` and `brands.last_activity_date` to today.
4. Creates a notification of type `"payment"` visible to `admin` and `hr` roles.
5. Creates an audit log entry with action `PAYMENT_RECORDED`.

If any step fails, the entire transaction is rolled back. `invoiceId`, `brandId`, and `amount` are required.

---

### POST /api/payments/razorpay-initiate

**Description:** Creates a Razorpay order for an invoice and returns the order details needed to open the Razorpay payment widget.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "invoiceId": "inv_7b8c9d"
}
```

**Response:**
```json
{
  "razorpayOrderId": "order_a1b2c3d4e5f6g7h8i9j0",
  "amount": 1180000,
  "currency": "INR",
  "keyId": "rzp_live_AbCdEfGhIjKlMn"
}
```

**Notes:** `amount` is in paise (multiply display amount by 100). `keyId` is fetched from the agency's settings. The `razorpayOrderId` must be passed to the Razorpay JS SDK to open the payment modal.

---

### POST /api/payments/razorpay-verify

**Description:** Verifies a completed Razorpay payment and records it against the invoice.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "invoiceId": "inv_7b8c9d",
  "brandId": "brand_1a2b3c",
  "brandName": "Apex Media Pvt Ltd",
  "amount": 11800,
  "mode": "Razorpay",
  "razorpayPaymentId": "pay_RzpAbCdEfGhIj"
}
```

**Response:** Same shape as `POST /api/payments` response.

**Notes:** Stores the Razorpay payment ID on the invoice record (`razorpay_payment_id`), then calls the same transactional `recordPayment` flow as `POST /api/payments`. All five side effects listed above also apply here.

---

## EXPENSES MODULE

### GET /api/expenses

**Description:** Returns all expense records logged for the agency.
**Auth required:** Yes
**Role access:** `admin` only

**Query Parameters:**

| Parameter  | Type   | Description                   |
|------------|--------|-------------------------------|
| `brandId`  | string | Filter expenses tied to a brand |
| `category` | string | Filter by expense category    |

**Response:**
```json
[
  {
    "id": "exp_1a2b3c",
    "category": "Software Subscriptions",
    "amount": 4999.00,
    "date": "2026-10-01",
    "paymentMode": "Credit Card",
    "note": "Annual Tally Prime renewal",
    "receiptUrl": "https://cdn.retentio.app/receipts/exp_1a2b3c.pdf",
    "brandId": null,
    "isRecurring": true,
    "createdAt": "2026-10-01T09:00:00.000Z"
  }
]
```

**Notes:** Returns `403` for non-admin callers.

---

### POST /api/expenses

**Description:** Logs a new expense and creates an audit trail entry.
**Auth required:** Yes
**Role access:** `admin` only

**Request:**
```json
{
  "category": "Software Subscriptions",
  "amount": 4999,
  "date": "2026-10-01",
  "paymentMode": "Credit Card",
  "note": "Annual Tally Prime renewal",
  "receiptUrl": "https://cdn.retentio.app/receipts/exp_1a2b3c.pdf",
  "brandId": null,
  "isRecurring": true
}
```

**Response:** Full expense object.

**Notes:** `category` and `amount` are required. Creates an audit log entry with action `EXPENSE_ADDED` upon success. `brandId` is optional — set it to associate the expense with a specific client.

---

## MEETINGS MODULE

### GET /api/meetings

**Description:** Returns meetings ordered by date and time ascending.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter | Type   | Description             |
|-----------|--------|-------------------------|
| `brandId` | string | Filter meetings by brand|
| `leadId`  | string | Filter meetings by lead |

**Response:**
```json
[
  {
    "id": "meet_2b3c4d",
    "title": "Q4 Review — Apex Media",
    "brandId": "brand_1a2b3c",
    "leadId": null,
    "date": "2026-10-10",
    "time": "11:00",
    "durationMinutes": 60,
    "linkOrLocation": "https://meet.google.com/abc-defg-hij",
    "notes": "Discuss Q4 deliverables and fee revision.",
    "reminderSent": false,
    "createdAt": "2026-10-05T08:00:00.000Z",
    "attendeeIds": ["usr_a1b2c3d4e5f6a7b8", "usr_c5d6e7f8a9b0c1d2"]
  }
]
```

---

### POST /api/meetings

**Description:** Schedules a new meeting linked to a brand or lead.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "title": "Q4 Review — Apex Media",
  "brandId": "brand_1a2b3c",
  "leadId": null,
  "date": "2026-10-10",
  "time": "11:00",
  "durationMinutes": 60,
  "linkOrLocation": "https://meet.google.com/abc-defg-hij",
  "notes": "Discuss Q4 deliverables and fee revision.",
  "attendeeIds": ["usr_a1b2c3d4e5f6a7b8", "usr_c5d6e7f8a9b0c1d2"]
}
```

**Response:** Full meeting object.

**Notes:** `title` is required. Either `brandId` or `leadId` should be provided to associate the meeting. `durationMinutes` defaults to `60`.

---

### PATCH /api/meetings/:id

**Description:** Updates meeting details or reschedules it.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "date": "2026-10-12",
  "time": "14:00",
  "notes": "Rescheduled — client request.",
  "attendeeIds": ["usr_a1b2c3d4e5f6a7b8"]
}
```

**Response:** Full meeting object.

**Notes:** All fields are optional. If `attendeeIds` is provided, the attendee list is fully replaced. Omit `attendeeIds` to leave attendees unchanged.

---

### DELETE /api/meetings/:id

**Description:** Cancels and permanently deletes a meeting.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
{ "success": true }
```

**Notes:** Returns `404` if the meeting does not exist.

---

## LEADS MODULE

### GET /api/leads

**Description:** Returns all leads, optionally filtered by pipeline stage.
**Auth required:** Yes
**Role access:** All roles

**Query Parameters:**

| Parameter | Type   | Description                                               |
|-----------|--------|-----------------------------------------------------------|
| `stage`   | string | Filter by stage: `New`, `Contacted`, `Proposal`, `Negotiation`, `Won`, `Lost` |

**Response:**
```json
[
  {
    "id": "lead_3c4d5e",
    "name": "BlueSky Ventures",
    "company": "BlueSky Ventures Pvt Ltd",
    "contact": "Rahul Desai",
    "email": "rahul@bluesky.vc",
    "phone": "+91-9811223344",
    "source": "Referral",
    "stage": "Proposal",
    "value": 15000.00,
    "followUpDate": "2026-10-12",
    "notes": "Interested in full compliance bundle.",
    "createdAt": "2026-09-20T14:00:00.000Z"
  }
]
```

---

### POST /api/leads

**Description:** Creates a new lead in the CRM pipeline.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "name": "BlueSky Ventures",
  "company": "BlueSky Ventures Pvt Ltd",
  "contact": "Rahul Desai",
  "email": "rahul@bluesky.vc",
  "phone": "+91-9811223344",
  "source": "Referral",
  "stage": "New",
  "value": 15000,
  "followUpDate": "2026-10-12",
  "notes": "Interested in full compliance bundle."
}
```

**Response:** Full lead object.

**Notes:** `name` is required. `stage` defaults to `"New"`. `value` represents the estimated monthly deal value.

---

### PATCH /api/leads/:id/stage

**Description:** Advances or moves a lead to a different pipeline stage.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "stage": "Negotiation"
}
```

**Response:** Full lead object with updated stage.

**Notes:** Valid stages: `New`, `Contacted`, `Proposal`, `Negotiation`, `Won`, `Lost`. To convert a won lead into a brand, use `POST /api/leads/:id/convert` instead.

---

### POST /api/leads/:id/convert

**Description:** Converts a won lead into an active brand, creating a new brand record from the lead's data.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{}
```

**Response:**
```json
{
  "brand": {
    "id": "brand_9z8y7x",
    "name": "BlueSky Ventures Pvt Ltd",
    "ownerName": "Rahul Desai",
    "email": "rahul@bluesky.vc",
    "status": "Active",
    "monthlyFee": 0.00
  },
  "lead": {
    "id": "lead_3c4d5e",
    "stage": "Won",
    "name": "BlueSky Ventures"
  }
}
```

**Notes:** Creates a new brand from `lead.company` (or `lead.name`), `lead.contact`, `lead.email`, and `lead.phone`. Sets `monthlyFee` to `0` — update via `PATCH /api/brands/:id` after conversion. Automatically marks the lead `stage` as `"Won"`. Returns `404` if the lead does not exist.

---

## NOTIFICATIONS MODULE

### GET /api/notifications

**Description:** Returns notifications relevant to the authenticated user based on their role and user ID.
**Auth required:** Yes
**Role access:** All roles (filtered to current user)

**Query Parameters:**

| Parameter    | Type    | Description                        |
|--------------|---------|------------------------------------|
| `unreadOnly` | boolean | Pass `true` to return only unread  |

**Response:**
```json
[
  {
    "id": "notif_4d5e6f",
    "type": "payment",
    "title": "Payment Received: ₹11,800",
    "message": "Payment of ₹11,800 received from Apex Media Pvt Ltd.",
    "timestamp": "2026-10-05T10:00:00.000Z",
    "isRead": false,
    "linkModule": "invoices",
    "brandId": "brand_1a2b3c",
    "recipientRoles": ["admin", "hr"],
    "targetUserId": null,
    "createdAt": "2026-10-05T10:00:00.000Z"
  }
]
```

**Notes:** A notification is shown to a user if: their `role` is in `recipientRoles`, OR `recipientRoles` is null, OR their `id` matches `targetUserId`. Results are ordered newest first.

---

### PATCH /api/notifications/read-all

**Description:** Marks all of the current user's notifications as read.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{}
```

**Response:**
```json
{ "success": true }
```

**Notes:** Only marks notifications that are visible to the current user (same role/user-id scoping as `GET /api/notifications`).

---

### PATCH /api/notifications/:id/read

**Description:** Marks a single notification as read.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{}
```

**Response:**
```json
{
  "id": "notif_4d5e6f",
  "type": "payment",
  "title": "Payment Received: ₹11,800",
  "isRead": true,
  "timestamp": "2026-10-05T10:00:00.000Z"
}
```

**Notes:** Returns `404` if the notification does not exist.

---

## CHAT MODULE

### GET /api/chat/conversations

**Description:** Returns all conversations the current user is a participant in, ordered by most recent message.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
[
  {
    "id": "conv_5e6f7a",
    "type": "team",
    "title": "Apex Media — Internal",
    "brandId": "brand_1a2b3c",
    "lastMessage": "I'll send the GSTR draft by EOD.",
    "lastMessageTime": "2026-10-05T09:45:00.000Z",
    "unreadCount": 2,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "participantIds": ["usr_a1b2c3d4e5f6a7b8", "usr_c5d6e7f8a9b0c1d2"]
  }
]
```

**Notes:** `type` can be `"team"` (internal direct) or `"brand"` (brand channel). Only conversations the authenticated user belongs to are returned.

---

### POST /api/chat/conversations

**Description:** Creates a new conversation and adds the specified participants.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "type": "brand",
  "title": "Apex Media — Client Channel",
  "brandId": "brand_1a2b3c",
  "participantIds": ["usr_a1b2c3d4e5f6a7b8", "usr_c5d6e7f8a9b0c1d2"]
}
```

**Response:** Full conversation object.

**Notes:** The authenticated user is automatically added as a participant even if not in `participantIds`. Valid types: `"team"`, `"brand"`.

---

### GET /api/chat/conversations/:id/messages

**Description:** Returns all messages in a conversation in chronological order.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
[
  {
    "id": "msg_6f7a8b",
    "conversationId": "conv_5e6f7a",
    "senderId": "usr_a1b2c3d4e5f6a7b8",
    "senderName": "Alex Rivera",
    "senderRole": "admin",
    "text": "I'll send the GSTR draft by EOD.",
    "timestamp": "2026-10-05T09:45:00.000Z",
    "createdAt": "2026-10-05T09:45:00.000Z",
    "readBy": ["usr_a1b2c3d4e5f6a7b8"],
    "attachments": []
  }
]
```

---

### POST /api/chat/conversations/:id/messages

**Description:** Sends a new message in a conversation and updates the conversation's last message preview.
**Auth required:** Yes
**Role access:** All roles

**Request:**
```json
{
  "text": "GSTR-9C draft is attached. Please review.",
  "attachments": [
    {
      "name": "GSTR9C_Draft_ApexMedia.pdf",
      "size": 204800,
      "url": "https://cdn.retentio.app/chat/att_7a8b9c.pdf",
      "type": "application/pdf"
    }
  ]
}
```

**Response:**
```json
{
  "id": "msg_7a8b9c",
  "conversationId": "conv_5e6f7a",
  "senderId": "usr_a1b2c3d4e5f6a7b8",
  "senderName": "Alex Rivera",
  "senderRole": "admin",
  "text": "GSTR-9C draft is attached. Please review.",
  "timestamp": "2026-10-05T10:05:00.000Z",
  "createdAt": "2026-10-05T10:05:00.000Z",
  "readBy": ["usr_a1b2c3d4e5f6a7b8"],
  "attachments": [
    {
      "id": "att_7a8b9c",
      "name": "GSTR9C_Draft_ApexMedia.pdf",
      "size": 204800,
      "url": "https://cdn.retentio.app/chat/att_7a8b9c.pdf",
      "type": "application/pdf"
    }
  ]
}
```

**Notes:** The sender is automatically added to `readBy`. `conversations.last_message` and `last_message_time` are updated atomically. `attachments` is optional.

---

## SETTINGS MODULE

### GET /api/settings

**Description:** Returns the agency's global platform configuration.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
{
  "id": "main",
  "companyName": "Rivera & Associates",
  "companyEmail": "hello@riveraassociates.in",
  "companyPhone": "+91-9876543210",
  "companyAddress": "501, Infinity Towers, BKC, Mumbai 400051",
  "companyGst": "27AABCR1234R1ZX",
  "companyPan": "AABCR1234R",
  "companyState": "Maharashtra",
  "defaultGstRate": 18.0,
  "defaultHsnSac": "998212",
  "invoicePrefix": "INV-2026-",
  "bankAccountName": "Rivera & Associates LLP",
  "bankAccountNumber": "001234567890",
  "bankIfsc": "HDFC0001234",
  "bankBranch": "Bandra Kurla Complex",
  "upiId": "rivera@hdfcbank",
  "razorpayKeyId": "rzp_live_AbCdEfGhIjKlMn",
  "razorpayConnected": true,
  "subscriptionPlan": {
    "name": "Professional",
    "price": 2999.00,
    "billingCycle": "Monthly",
    "renewalDate": "2026-11-01",
    "status": "Active"
  },
  "retentionThresholdDays": 30,
  "whatsappEnabled": true,
  "invoiceDesign": {
    "primaryColor": "#6C63FF",
    "logoUrl": "https://cdn.retentio.app/logos/rivera.png"
  },
  "updatedAt": "2026-09-15T12:00:00.000Z"
}
```

---

### PATCH /api/settings

**Description:** Updates agency settings using an upsert (creates the settings record if it does not exist).
**Auth required:** Yes
**Role access:** `admin` only (enforced by convention — no role check in current implementation)

**Request:**
```json
{
  "companyName": "Rivera & Associates LLP",
  "retentionThresholdDays": 45,
  "whatsappEnabled": true,
  "invoicePrefix": "INV-2026-",
  "subscriptionPlan": {
    "name": "Professional",
    "price": 2999,
    "billingCycle": "Monthly",
    "renewalDate": "2026-11-01",
    "status": "Active"
  }
}
```

**Response:** Full settings object (same shape as GET).

**Notes:** Uses `INSERT ... ON CONFLICT DO UPDATE` (upsert). All fields are optional — unset fields are preserved. `invoiceDesign` should be passed as a JSON object; it is stored serialized.

---

## HOLIDAYS MODULE

### GET /api/holidays

**Description:** Returns all agency holidays sorted by date.
**Auth required:** Yes
**Role access:** All roles

**Response:**
```json
[
  {
    "id": "hol_1a2b3c",
    "title": "Diwali",
    "date": "2026-10-20",
    "type": "National"
  },
  {
    "id": "hol_4d5e6f",
    "title": "Agency Foundation Day",
    "date": "2026-11-01",
    "type": "Agency Custom"
  }
]
```

**Notes:** `type` is either `"National"` or `"Agency Custom"`.

---

### POST /api/holidays

**Description:** Adds a new holiday to the agency calendar.
**Auth required:** Yes
**Role access:** `admin` only

**Request:**
```json
{
  "title": "Agency Foundation Day",
  "date": "2026-11-01",
  "type": "Agency Custom"
}
```

**Response:**
```json
{
  "id": "hol_4d5e6f",
  "title": "Agency Foundation Day",
  "date": "2026-11-01",
  "type": "Agency Custom"
}
```

**Notes:** `title` and `date` are required. `type` defaults to `"Agency Custom"`. Returns `403` for non-admin callers.

---

### DELETE /api/holidays/:id

**Description:** Removes a holiday from the agency calendar.
**Auth required:** Yes
**Role access:** `admin` only

**Response:**
```json
{ "success": true }
```

**Notes:** Returns `404` if the holiday does not exist. Returns `403` for non-admin callers.

---

## AUDIT LOGS MODULE

### GET /api/audit-logs

**Description:** Returns a paginated list of platform audit log entries in reverse chronological order.
**Auth required:** Yes
**Role access:** `admin` only

**Query Parameters:**

| Parameter | Type    | Description                          |
|-----------|---------|--------------------------------------|
| `limit`   | integer | Records per page (default: `50`)     |
| `offset`  | integer | Records to skip for pagination (default: `0`) |

**Response:**
```json
{
  "data": [
    {
      "id": "audit_7b8c9d",
      "timestamp": "2026-10-05T10:00:00.000Z",
      "actorName": "Alex Rivera",
      "actorRole": "admin",
      "action": "PAYMENT_RECORDED",
      "details": "Recorded payment of ₹11800 for invoice inv_7b8c9d from Apex Media Pvt Ltd.",
      "ipAddress": "unknown",
      "createdAt": "2026-10-05T10:00:00.000Z"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

**Notes:** Returns `403` for non-admin callers. Known audit actions include: `PAYMENT_RECORDED`, `EXPENSE_ADDED`. Additional actions may be added as the platform grows.

---

## HEALTH CHECK

### GET /api/health

**Description:** Returns the current server status and UTC timestamp — used for uptime monitoring and deployment checks.
**Auth required:** No
**Role access:** Public

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-05T10:00:00.000Z"
}
```

**Notes:** No authentication required. If this endpoint does not respond, the backend process is not running.

---

## Error Responses

All error responses return a JSON object with an `error` field:

```json
{ "error": "Human-readable error message" }
```

### Standard HTTP Status Codes

| Status Code | Meaning              | When It Occurs                                                                         |
|-------------|----------------------|----------------------------------------------------------------------------------------|
| `400`       | Bad Request          | Required fields are missing or the request body is malformed                           |
| `401`       | Unauthorized         | No `Authorization` header provided, token is invalid, or credentials are incorrect     |
| `403`       | Forbidden            | Authenticated user does not have the required role to perform the action               |
| `404`       | Not Found            | The requested resource (brand, invoice, user, etc.) does not exist                     |
| `409`       | Conflict             | A unique constraint was violated (e.g., email already registered on signup)            |
| `500`       | Internal Server Error| An unexpected server-side error occurred; check backend logs for details               |

### Common Error Examples

```json
{ "error": "Email and password required" }
{ "error": "Email already registered" }
{ "error": "Invalid credentials" }
{ "error": "Forbidden" }
{ "error": "Brand not found" }
{ "error": "Invoice not found" }
{ "error": "invoiceId, brandId, amount required" }
{ "error": "Server error" }
```
