# Zuna Central Admin — Project Architecture, Workflows & Roadmap

> **Enterprise Multi-Product Support Ticket Hub & SaaS Command Center**  
> Built for **Carrezza Global Solutions (CGS)** ecosystem applications:  
> *Attendance (HRMS)*, *Clinic Management System*, *School Management System*, *College Management System*.

---

## 1. 🌟 Project Overview

**Zuna Central Admin** is a production-grade, multi-tenant administrative command center and support hub. It decouples customer support, product catalogs, subscription billing, and team operations from individual vertical SaaS applications and centralizes them into a unified, high-performance platform.

### Core Architectural Separation
The repository is strictly structured into decoupled layers:
```text
Zuna-Parent/
├── .gitignore          # Ignores .env, node_modules, dist, builds, logs
├── client/             # Frontend application (React 18 + Vite)
│   ├── docs/           # Specifications, workflow manuals, and architecture guides
│   ├── public/         # Static assets, brand logos, icons
│   └── src/            # Components, routes, contexts, and API services
└── server/             # Backend API & Realtime Server (Node.js + Express)
    ├── cron/           # Scheduled recurring background jobs (Billing scanner)
    ├── lib/            # Shared clients (Prisma, Redis, Socket.io, Nodemailer, Logger)
    ├── middleware/     # Auth (JWT), RBAC roles, API key verification, Rate limiters
    ├── modules/        # Domain modules (Auth, Tickets, Ingestion, Team, Billing, Analytics, Products)
    ├── prisma/         # Schema, migrations, and PostgreSQL seeders
    └── scripts/        # Database maintenance scripts (Admin provisioning, DB seeds)
```

---

## 2. 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18** + **Vite** | Modern, fast, responsive single-page application |
| **Icons & Design** | **Lucide React** + **Tailwind / Vanilla CSS** | Custom responsive UI, glassmorphism, animated toasts |
| **Realtime Client** | **Socket.io Client** | Instant ticket sync, badge counters, and live activity feed |
| **Backend Framework**| **Node.js 20** + **Express 4.21** (ESM) | High-throughput REST API with structured controllers |
| **Database** | **PostgreSQL (Railway)** | ACID relational database with 10 enums and 9 models |
| **ORM & Migrations** | **Prisma 5.22** | Type-safe queries, automated migrations, zero runtime drift |
| **Caching & In-Memory**| **Redis (Railway)** | Token blacklist, analytics cache (60s), rate limiting |
| **Realtime Engine** | **Socket.io 4.8** + **Redis Adapter** | Scalable multi-room WebSocket layer (`/admin`, `tickets`) |
| **Email Service** | **Nodemailer** + **Resend Fallback** | Automated SMTP notifications for ticket assignment & staff onboarding |
| **Export Engines** | **PDFKit** + **ExcelJS** | Streaming CSV (O(1) memory) and formatted PDF reports |
| **Validation** | **Zod 3.24** | Strict runtime request/query schema validation |
| **Logging** | **Pino** + **Pino-HTTP** | High-performance JSON structured logging |
| **Cloud Deployment** | **Railway (Nixpacks)** | Automated builds, container restarts, SSL, and healthchecks |

---

## 3. 🔄 Complete System Workflows

```mermaid
flowchart TD
    subgraph External SaaS Vertical
        App[HRMS / Clinic / School SaaS] -->|POST /api/public/tickets with X-Api-Key| API[Ingestion API / Rate Limiter]
        Customer[Customer Web Form] -->|Public Form Submission| API
    end

    subgraph Zuna Backend (Express + Redis + Prisma)
        API --> RateLimit{Redis Rate Limit <br/> 30 req/min}
        RateLimit -->|Allowed| SaveDB[(PostgreSQL)]
        RateLimit -->|Exceeded| Error429[429 Too Many Requests]
        
        SaveDB --> SocketEmit[Socket.io /admin /tickets Room]
        SaveDB --> CacheInvalidate[Invalidate Analytics Cache]
    end

    subgraph Realtime Admin Portal
        SocketEmit --> LiveUI[TicketsTable & Dashboard Updated Live]
        Admin[Support Admin / Lead] -->|Assigns Ticket to Staff| AssignEndpoint[PATCH /api/tickets/:id]
    end

    subgraph Email Notification Engine
        AssignEndpoint --> Mailer[Nodemailer SMTP Service]
        Mailer -->|HTML Notification Email| StaffInbox[Assigned Staff Member Inbox]
    end
```

### Workflow 1: Customer Ticket Ingestion
1. **API Ingestion (`POST /api/public/tickets`)**:
   - External SaaS apps authenticate using `X-Api-Key`.
   - Keys are hashed with SHA-256 before database lookup.
   - Redis sliding-window counter limits each key to **30 requests per minute**.
2. **Public Web Form Submission**:
   - Captured via the public landing page with honeypot spam protection.
   - Creates a new ticket with status `OPEN` and priority `MEDIUM` (or user-selected priority).
3. **Instant Event Broadcasting**:
   - Ticket details are committed to PostgreSQL.
   - Socket.io broadcasts `ticket:created` to the `/admin` room for instant alert toasts.

### Workflow 2: Ticket Assignment & Staff Notifications (Nodemailer)
1. **Admin Assignment**:
   - An administrator selects a team member from the dropdown in `TicketsTable.jsx`.
   - The backend validates the admin ID, persists the assignment, and updates the ticket snapshot.
2. **Automated Nodemailer Dispatch**:
   - Triggers `emailService.sendTicketAssignmentEmail`.
   - Generates a branded HTML email containing Ticket ID, Priority color badge, Customer details, Product name, Subject, and Description.
   - Dispatches via SMTP (e.g., Gmail, Outlook, Hostinger, AWS SES) directly to the assigned staff member's inbox.
3. **Manual Re-Dispatch (`POST /api/tickets/:id/notify-agent`)**:
   - Admins can re-trigger notifications anytime directly from the ticket table.

### Workflow 3: Customer Communication & Resolution Thread
1. **Threaded Messaging (`POST /api/tickets/:id/messages`)**:
   - Support engineers post replies or internal notes.
   - External client receives automated email notification of the engineer's response.
2. **Status Lifecycle**:
   - Status transitions: `OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED` ➔ `CLOSED`.
   - When marked `RESOLVED`, `resolvedAt` timestamp is recorded for SLA compliance analytics.

### Workflow 4: Security & Authentication (RBAC)
1. **Dual-Token System**:
   - **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`.
   - **Refresh Token**: Long-lived (7 days), stored in an `httpOnly`, `SameSite=Strict` secure cookie.
2. **Role Hierarchy**:
   - `SUPER_ADMIN`: Full access (team member creation, billing, product CRUD, settings).
   - `SUPPORT_LEAD`: Ticket assignment, escalation, ticket updates, exports.
   - `SUPPORT_ENGINEER`: View assigned tickets, respond to threads, change status.
   - `PRODUCT_MANAGER`: Product catalog management, roadmap notes, analytics viewing.
3. **Logout Blacklisting**:
   - On logout, token IDs (`jti`) are blacklisted in Redis with TTL matching token expiration.

### Workflow 5: Background Billing & Automated Invoicing
1. **Daily Cron Scanner (`cron/billingCron.js`)**:
   - Executes every night at midnight (`0 0 * * *`).
   - Scans active subscriptions nearing renewal (`nextBillingDate <= now`).
   - Generates sequential draft invoices (e.g., `INV-2026-00001`) with amount calculated in integer **paise** (₹1.00 = 100 paise) to prevent floating-point precision errors.
   - Flags overdue invoices where `dueDate < now` as `OVERDUE`.

### Workflow 6: Analytics & KPI Caching
1. **Cached Aggregations (`GET /api/analytics/kpis`)**:
   - Calculates total active customers, MRR, open ticket count, SLA resolution time.
   - Cached in Redis key `cache:analytics:kpis` with a **60-second TTL** to protect PostgreSQL from repetitive expensive queries.
2. **Time-Series Breakdowns**:
   - Ticket volume over time (7d, 30d, 90d).
   - Distribution by priority and product category.

---

## 4. ✅ Completed Features (100% Done)

### Backend (`/server`)
- [x] **Prisma Database Layer**: 10 PostgreSQL enums, 9 production relational models (`Admin`, `Product`, `Ticket`, `TicketMessage`, `DemoRequest`, `Subscription`, `Invoice`, `Notification`, `ApiKey`).
- [x] **Live Database Seed**: Seeded Super Admin (`admin@zuna.com`) with Bcrypt hash and 4 core products (HRMS, Clinic MS, School MS, College MS).
- [x] **Auth & RBAC**: JWT access + refresh cookies, Redis blacklist, `requireAuth`, `requireRole`.
- [x] **Realtime WebSocket**: Socket.io on Express with `@socket.io/redis-adapter` supporting multi-instance clustering.
- [x] **Tickets Engine**: CRUD, message threads, streaming CSV (500 rows/batch, O(1) memory), PDFKit PDF export.
- [x] **Ingestion API**: `POST /api/public/tickets` with `X-Api-Key` authentication and Redis sliding-window rate limiting.
- [x] **Nodemailer SMTP Integration**: Automated ticket assignment notifications and staff welcome emails with responsive HTML templates.
- [x] **Products & Demo Requests**: Product catalog CRUD, Redis caching (1h), demo request appointment pipeline.
- [x] **Team Management**: Staff provisioning, password encryption (Bcrypt salt 12), credentials email dispatch.
- [x] **Billing Engine**: Subscriptions, integer paise invoices, daily midnight renewal scanner cron.
- [x] **Analytics Module**: KPI summaries with 60s Redis caching, 7d/30d/90d time-series metrics.
- [x] **Railway Infrastructure Config**: `railway.json`, `nixpacks.toml` setup for Debian OpenSSL 3.0.x (`debian-openssl-3.0.x`), `/health` healthcheck endpoint.
- [x] **Repository Decoupling**: Strictly separated into `client/`, `server/`, and `.gitignore`.

---

## 5. ⏳ Pending Tasks & Next Steps Roadmap

| Priority | Task Area | Details | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **Railway Environment Variables** | Paste `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_USER`, `SMTP_PASS` into Railway Service Variables tab to bring the backend **Online 🟢**. | 🟡 Pending User Action |
| **P1** | **Frontend Auth Migration** | Replace legacy Firebase Auth in `client/src/services/` with REST endpoints (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`). | ⚪ Next Development Step |
| **P1** | **Frontend Tickets Integration** | Wire `TicketsTable.jsx` and `DashboardOverview.jsx` to fetch from `/api/tickets` and listen to Socket.io `/admin` events. | ⚪ Next Development Step |
| **P2** | **Frontend Products & Team Integration** | Connect `ProductsTable.jsx` to `/api/products` and `TeamManager.jsx` to `/api/team`. | ⚪ Next Development Step |
| **P2** | **Frontend Billing & Analytics Integration**| Connect `BillingManager.jsx` to `/api/billing` and `Analytics.jsx` to `/api/analytics/kpis`. | ⚪ Next Development Step |
| **P3** | **Production SMTP Email Setup** | Configure Google App Password (or custom domain SMTP like Hostinger/AWS SES) in Railway Variables for production email deliverability. | ⚪ Configuration Step |
| **P3** | **Frontend Deployment (Vercel)** | Deploy `client/` to Vercel, configure `VITE_API_URL` pointing to the live Railway backend domain. | ⚪ Deployment Step |

---

## 6. 🚀 Quick Start Guide

### Running Backend Locally
```bash
cd server
npm install
npm run build           # Compiles Prisma Client for your OS
npm run start           # Applies any pending migrations and starts Express on port 5000
# Or for development with auto-reload:
npm run dev
```

### Running Frontend Locally
```bash
cd client
npm install
npm run dev             # Starts Vite dev server on http://localhost:5173
```
*Note: Vite proxy is already configured in `client/vite.config.js` to forward all `/api` calls directly to `http://localhost:5000`.*

---

## 7. 📄 Environment Variables Reference

### Backend (`server/.env` and Railway Variables)
```env
PORT=5000
NODE_ENV=production

# Database & Cache
DATABASE_URL="postgresql://postgres:<password>@<host>:<port>/railway"
REDIS_URL="redis://default:<password>@<host>:<port>"

# Security & Tokens
JWT_ACCESS_SECRET="your_32_character_jwt_access_secret_key"
JWT_REFRESH_SECRET="your_32_character_jwt_refresh_secret_key"
ADMIN_PASSWORD_HASH="$2b$12$fJf.ZQcX8iRT9.j2.jTBye4IWLxrKIOlDQsifKPuyDt01XT2Y2K8S"

# CORS
FRONTEND_ORIGIN="http://localhost:5173,https://your-frontend.vercel.app"

# Email (Nodemailer SMTP)
SMTP_SERVICE="gmail"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-google-app-password"
EMAIL_FROM="Zuna Support <your-email@gmail.com>"
```
