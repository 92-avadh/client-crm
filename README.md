# Retentio

**Premium Subscription-Based Client & Brand Management Platform**

A full-stack web application for business owners, freelancers, Chartered Accountants (CAs), agencies, and consultants who manage multiple clients. Retentio centralises client onboarding, team assignment, payment and expense tracking, retention reminders, one-click invoicing, and in-app chat — all in one place.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started with Docker](#getting-started-with-docker)
- [Running Without Docker](#running-without-docker)
- [User Roles](#user-roles)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [API Overview](#api-overview)
- [Frontend Modules](#frontend-modules)
- [Development Notes](#development-notes)

---

## Project Overview

Retentio is designed for service providers who need one platform to manage all brands/clients, their payments, and their team. It provides:

- Clear financial visibility: money received, pending, expenses, and net profit
- Automated retention reminders to reduce client churn
- One-click GST-ready invoice generation
- Dedicated in-app chat per brand/client

---

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite 8** — build tool and dev server
- **Tailwind CSS v4** — utility-first styling
- **Lucide React** — icon library
- **Context API** — global state management

### Backend
- **Node.js** with **Express 4** — REST API server
- **PostgreSQL 16** — primary database
- **JWT** — stateless authentication
- **bcryptjs** — password hashing
- **CORS** — cross-origin resource sharing

### Infrastructure
- **Docker** + **Docker Compose** — containerised deployment
- **pgdata** named volume — persistent PostgreSQL data

---

## Project Structure

```
retentio/
├── docker-compose.yml          ← Orchestrates all 3 services
├── docs/                       ← All documentation
│   ├── ENDPOINTS.md            ← Complete API reference (64 endpoints)
│   ├── ROLES.md                ← Role descriptions & permissions matrix
│   ├── FEATURES.md             ← Feature-by-feature reference guide
│   └── TEST_CREDENTIALS.md     ← Test user guide & login credentials
├── frontend/                   ← React + Vite application
│   ├── Dockerfile
│   ├── src/
│   │   ├── components/         ← All UI modules
│   │   │   ├── auth/           ← Login screen
│   │   │   ├── dashboard/      ← Main dashboard
│   │   │   ├── clients/        ← Brand/client management
│   │   │   ├── projects/       ← Projects & tasks
│   │   │   ├── invoices/       ← Invoice generator
│   │   │   ├── finance/        ← Payments & expenses
│   │   │   ├── retention/      ← Retention engine
│   │   │   ├── chat/           ← Chat system
│   │   │   ├── inbox/          ← Unified inbox
│   │   │   ├── calendar/       ← Meetings & calendar
│   │   │   ├── leads/          ← Leads pipeline (CRM)
│   │   │   ├── team/           ← Team management
│   │   │   └── settings/       ← All settings tabs
│   │   ├── context/
│   │   │   └── AppContext.tsx  ← Global state + API integration
│   │   ├── services/
│   │   │   └── api.ts          ← Backend API client
│   │   ├── hooks/
│   │   │   └── useApiData.ts   ← Data fetching hook
│   │   ├── types/
│   │   │   └── index.ts        ← TypeScript interfaces
│   │   └── data/
│   │       └── mockData.ts     ← Fallback mock data
│   └── .env                    ← VITE_API_URL config
└── backend/                    ← Node.js / Express API
    ├── Dockerfile
    ├── server.js               ← Entry point
    ├── src/
    │   ├── db/
    │   │   ├── index.js        ← PostgreSQL connection pool
    │   │   ├── schema.sql      ← 26 table definitions
    │   │   └── seed.js         ← Sample data + test users
    │   ├── middleware/
    │   │   └── auth.js         ← JWT verification middleware
    │   └── routes/             ← 16 route files
    │       ├── auth.js
    │       ├── brands.js
    │       ├── users.js
    │       ├── projects.js
    │       ├── tasks.js
    │       ├── invoices.js
    │       ├── payments.js
    │       ├── expenses.js
    │       ├── meetings.js
    │       ├── leads.js
    │       ├── notifications.js
    │       ├── chat.js
    │       ├── settings.js
    │       ├── holidays.js
    │       └── auditLogs.js
    └── .env                    ← Backend environment config
```

---

## Getting Started with Docker

Docker is the recommended way to run everything. It starts all 3 services (PostgreSQL, Backend, Frontend) in the correct order automatically.

### Prerequisites

**Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and log back in after this step
```

**Windows:**
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Restart your PC
- Make sure Docker Desktop is running (whale icon in taskbar)
- Open PowerShell or Command Prompt and proceed with the same commands below

---

### First Time Setup (run once)

**Step 1 — Build and start all services**

```bash
git clone <repository-url>
cd retentio
docker-compose up --build
```

Wait until you see all 3 of these lines in the terminal — that means everything is ready:
```
retentio-db        | database system is ready to accept connections
retentio-backend   | ✅ PostgreSQL connected
retentio-backend   | 🚀 Retentio backend running on port 4000
```

**Step 2 — Seed the database (open a new terminal)**

```bash
docker exec retentio-backend node src/db/seed.js
```

This inserts all sample brands, invoices, team members, and test users. Run this once only.

**Step 3 — Open the application**

| Service | URL |
|---|---|
| Frontend (App) | http://localhost:5173 |
| Backend API | http://localhost:4000/api |
| Health Check | http://localhost:4000/api/health |

---

### Day-to-Day Usage (after first time)

```bash
# Start — no --build needed
docker-compose up

# Stop — data is preserved
docker-compose down

# Stop and delete all data (start fresh)
docker-compose down -v
```

> **You never need `--build` again unless you add a new npm package or change schema.sql**

---

### Live Code Reload — No Restart Needed

Both frontend and backend support live reload while Docker is running:

| Change | Behaviour | Action needed |
|---|---|---|
| Edit any `.tsx` / `.ts` / `.css` file | ✅ Browser updates instantly (Vite HMR) | Nothing |
| Edit any backend `.js` route file | ✅ Server restarts in ~1 second (nodemon) | Nothing |
| Add a new `npm` package | ❌ | `docker-compose up --build` |
| Change `schema.sql` | ❌ | `docker-compose down -v` then `up --build` + seed |

Just keep `docker-compose up` running in one terminal and edit your code freely — everything updates automatically.

---

### Stopping

```bash
docker-compose down          # Stop containers (data preserved)
docker-compose down -v       # Stop + delete all data (clean slate)
```

---

## Running Without Docker

### Backend

```bash
cd backend
npm install
# Create a .env file with your PostgreSQL connection string (see backend/.env)
node src/db/seed.js    # Run schema + seed data
node server.js         # Start on port 4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:5173
```

> The frontend falls back to built-in mock data automatically if the backend is unreachable.

---

## User Roles

Retentio supports internal agency roles with distinct permissions:

| Role | Description | Key Access |
|---|---|---|
| **Admin / Owner** | Pays the subscription, owns the agency | Full access to everything |
| **HR / Manager** | Trusted staff appointed by Admin | Onboarding, assignments, invoices — no expenses/profit |
| **Team Member** | CA, freelancer, or employee | Assigned brands (read-only), own tasks, chat |

For full permissions details see [docs/ROLES.md](docs/ROLES.md).  
For test login credentials see [docs/TEST_CREDENTIALS.md](docs/TEST_CREDENTIALS.md).

---

## Key Features

### Client & Brand Management
Onboard clients with a structured form capturing all required information — contact details, billing address, GST/PAN, service description, monthly fee, and billing cycle. Each brand gets a full profile page showing assigned team members, payment history, invoices, and chat.

### Invoice Generator
One-click invoice generation with brand details pre-filled. Supports GST (CGST/SGST for intra-state, IGST for inter-state) or non-GST invoices. Auto-generates sequential invoice numbers. Invoices can be sent as a Pay Now link, shared via WhatsApp, downloaded as PDF, or printed.

### Payment Tracking
Brand-wise and total payment tracking with pending/overdue highlights. Admin can record offline payments (cash, bank transfer, cheque). Each payment automatically updates the linked invoice status, the brand's last payment date, creates a notification, and logs an audit entry — all in a single database transaction.

### Expense Management
Admin-only module to track business expenses by category (Salary, Tools & Software, Ads, Travel, Office, Freelancer Payouts). Net profit is calculated automatically as total received minus total expenses.

### Retention Engine
Automatically flags brands that have had no activity or payment beyond a configurable threshold (default 15 days). Admin and assigned team members receive alerts. Actions available: log a follow-up, snooze for 7 days, or mark as churned.

### Projects & Tasks
Manage projects under each brand with status tracking. Tasks can be assigned to team members with due dates and priorities. Overdue tasks trigger notifications to the assignee and Admin.

### Leads Pipeline (CRM)
Kanban + list view for managing potential clients through stages: New → Contacted → Proposal → Won → Lost. Won leads can be converted to active brands with a single click, carrying over all contact and service details.

### Chat System
Dedicated in-app chat per brand (brand channel) and direct 1:1 messages between team members. Chat history is stored per brand and linked to the brand profile.

### Settings
Comprehensive settings covering user profile, notification preferences, company/agency details, Tax & GST configuration, banking details, Razorpay integration, invoice design (logo, colours, templates), holiday calendar, software subscription, and security/audit logs.

---

## Documentation

All documentation is in the `docs/` folder:

| File | Contents |
|---|---|
| [ENDPOINTS.md](docs/ENDPOINTS.md) | Complete API reference — all 64 endpoints with request/response examples |
| [ROLES.md](docs/ROLES.md) | Role descriptions, permissions matrix, sidebar navigation per role, data isolation rules |
| [FEATURES.md](docs/FEATURES.md) | Feature-by-feature guide — what it does, how it works, who can access it, business rules |
| [TEST_CREDENTIALS.md](docs/TEST_CREDENTIALS.md) | Test user guide with per-role testing checklist and curl examples |

---

## API Overview

The backend exposes a RESTful JSON API at `http://localhost:4000/api`.

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

| Module | Endpoints | Description |
|---|---|---|
| Auth | 4 | Login, signup, logout, forgot password |
| Users | 5 | Team member management |
| Brands | 9 | Client onboarding and management |
| Projects | 3 | Project tracking per brand |
| Tasks | 4 | Task management and status updates |
| Invoices | 5 | Invoice generation and management |
| Recurring | 4 | Recurring invoice schedules |
| Payments | 4 | Payment recording and Razorpay integration |
| Expenses | 2 | Business expense tracking (Admin only) |
| Meetings | 4 | Meeting scheduling and calendar |
| Leads | 4 | CRM pipeline and lead conversion |
| Notifications | 3 | In-app notification management |
| Chat | 4 | Conversations and messages |
| Settings | 2 | Platform configuration |
| Holidays | 3 | Holiday calendar management |
| Audit Logs | 1 | Activity audit trail (Admin only) |
| **Total** | **64** | |

See [docs/ENDPOINTS.md](docs/ENDPOINTS.md) for full request/response documentation.

---

## Frontend Modules

| Module | Route Key | Roles | Description |
|---|---|---|---|
| Login Screen | (entry) | All | JWT login with 4 demo role buttons |
| Dashboard | `dashboard` | Admin, HR, Team | Summary cards and financial overview |
| Clients | `clients` | Admin, HR, Team | Brand/client management |
| Projects | `projects` | Admin, HR, Team | Projects per brand |
| Tasks | `tasks` | Admin, HR, Team | Task board |
| Invoices | `invoices` | Admin, HR | Invoice generator and history |
| Finance | `finance` | Admin, HR | Payments, expenses, net profit |
| Retention | `retention` | Admin, HR, Team | Inactivity alerts and follow-ups |
| Chat | `chat` | All | In-app messaging |
| Inbox | `inbox` | All | Unified notifications + chat |
| Meetings | `meetings` | All | Calendar and meeting scheduler |
| Leads | `leads` | Admin, HR | CRM pipeline |
| Team | `team` | Admin, HR | Team member management |
| Settings | `settings` | All | Preferences and configuration |

---

## Development Notes

### Live Reload
- **Frontend** uses Vite HMR (Hot Module Replacement) — any `.tsx`, `.ts`, or `.css` change reflects in the browser instantly with no restart.
- **Backend** uses nodemon — any `.js` file change automatically restarts the Express server in ~1 second.
- Both are enabled via Docker volume mounts so your local files are synced into the containers in real time.

### Frontend — Mock Data Fallback
The frontend uses `AppContext` with optimistic local state updates. If the backend is unavailable, it falls back to `mockData.ts` automatically. All mutations (create brand, record payment, etc.) update the local state instantly and fire the API call in the background.

### Backend — Transaction Safety
The payment recording endpoint (`POST /api/payments`) uses a PostgreSQL transaction to atomically update the invoice status, brand activity dates, create a notification, and write an audit log. If any step fails, the entire operation rolls back.

### Database
- Schema: 26 tables defined in `backend/src/db/schema.sql`
- All tables use `IF NOT EXISTS` — schema can be re-applied safely
- Seed data uses `ON CONFLICT DO NOTHING` — seed can be re-run safely
- Data persists in the `pgdata` Docker named volume across container restarts

### Environment Variables

**Backend (`backend/.env`)**
```
PORT=4000
DATABASE_URL=postgresql://retentio:retentio123@db:5432/retentio_db
JWT_SECRET=retentio_jwt_secret_2026
NODE_ENV=development
```

**Frontend (`frontend/.env`)**
```
VITE_API_URL=http://localhost:4000/api
```

### TypeScript
The frontend has zero TypeScript errors (`tsc --noEmit` passes cleanly). All components, the context, services, and hooks are fully typed.

### What Requires a Real Backend to Work
The following features show UI in the frontend but need a live backend server to fully function: real JWT authentication, live payment processing (Razorpay), real-time chat (WebSockets), email notifications, push notifications, actual file uploads, and scheduled background jobs (recurring invoices, auto-reminders).
