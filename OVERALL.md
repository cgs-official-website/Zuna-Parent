# 🌟 Zuna — Central SaaS Administrative Command Center & Multi-Product Support Hub

> **Empowering Enterprise Ecosystems**  
> A centralized administrative portal, public product showcase, and real-time support ticket management command center built for **Carrezza Global Solutions Pvt Ltd** and its ecosystem of enterprise vertical SaaS applications.

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Monorepo Directory Structure](#2-monorepo-directory-structure)
3. [Complete Technology Stack](#3-complete-technology-stack)
4. [Database Architecture & Data Models (Prisma)](#4-database-architecture--data-models-prisma)
5. [Authentication, Security & Role-Based Access Control (RBAC)](#5-authentication-security--role-based-access-control-rbac)
6. [Multi-Product Ticket Hub & External Ingestion API](#6-multi-product-ticket-hub--external-ingestion-api)
7. [Real-Time Infrastructure (Socket.IO + Redis + BroadcastChannel)](#7-real-time-infrastructure-socketio--redis--broadcastchannel)
8. [Public Showcase & Customer Conversion Funnel](#8-public-showcase--customer-conversion-funnel)
9. [Administrative Command Center Modules](#9-administrative-command-center-modules)
10. [Transactional Email Engine (Resend API)](#10-transactional-email-engine-resend-api)
11. [Billing & Subscription Engine](#11-billing--subscription-engine)
12. [Complete REST API Reference](#12-complete-rest-api-reference)
13. [Environment Configuration Reference](#13-environment-configuration-reference)
14. [Local Development & Production Setup Guide](#14-local-development--production-setup-guide)
15. [Attribution & Corporate Identity](#15-attribution--corporate-identity)

---

## 1. Executive Summary

**Zuna** serves as both the flagship public-facing web presence and the unified administrative operations desk for **Carrezza Global Solutions Pvt Ltd**. 

In modern enterprise architectures, organizations often build multiple dedicated vertical SaaS products (e.g., HRMS, Clinic ERP, School Management, College Portals, Turf Booking). Without a central aggregator, support inquiries become fragmented, client tracking requires switching across separate databases, and executive reporting is scattered.

**Zuna resolves this by:**
1. **Unifying Support Inquiries**: Consolidating incoming support tickets from all external SaaS platforms into a single real-time triage queue with priority tags and SLA monitoring.
2. **Centralizing Product Catalogs**: Providing a public showcase where prospective and existing clients explore software modules, request live walkthroughs, and raise support tickets.
3. **Streamlining Onboarding & Billing**: Managing subscriptions, tracking invoicing in integer paise, and automating billing cycles.
4. **Providing Executive Analytics**: Fast Redis-cached KPI rollups displaying monthly recurring revenue (MRR), open ticket counts, customer counts, and system health status.

---

## 2. Monorepo Directory Structure

```text
Zuna-Parent/
│
├── client/                                # Frontend Single Page Application
│   ├── docs/                              # Project documentation & integration specs
│   │   ├── PROJECT_WORKFLOW_AND_PENDING.md
│   │   ├── README.md
│   │   └── TICKET_WORKFLOW_SPEC.md
│   ├── public/                            # Static assets (logo.png, favicons)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                     # Admin Portal Screens
│   │   │   │   ├── Analytics.jsx          # Revenue, volume, and latency charts
│   │   │   │   ├── BillingManager.jsx     # Subscriptions & Invoice tracking
│   │   │   │   ├── DashboardLayout.jsx    # Sticky navigation, sidebar & header
│   │   │   │   ├── DashboardOverview.jsx  # KPI metrics, charts, live feed
│   │   │   │   ├── DemoRequestsTable.jsx  # Customer demo request pipeline
│   │   │   │   ├── HelpSupport.jsx        # Documentation & system status
│   │   │   │   ├── ProductForm.jsx        # SaaS product modal (create/edit)
│   │   │   │   ├── ProductsTable.jsx      # Product catalog management
│   │   │   │   ├── Settings.jsx           # Global system preferences & themes
│   │   │   │   ├── TeamManager.jsx        # Staff directory & role assignment
│   │   │   │   ├── TicketDetailDrawer.jsx # Slide-over conversation drawer
│   │   │   │   └── TicketsTable.jsx       # Real-time multi-product ticket table
│   │   │   ├── common/                    # Shared reusable primitives (Badges, Buttons)
│   │   │   └── public/                    # Public Showcase Components
│   │   │       ├── LandingPage.jsx        # Master flagship landing page
│   │   │       ├── ProductCard.jsx        # Interactive SaaS product card
│   │   │       └── TicketRaiseForm.jsx    # Public ticket submission modal
│   │   ├── context/                       # Global React State Providers
│   │   │   ├── AuthContext.jsx            # Admin session & JWT token handling
│   │   │   ├── NotificationContext.jsx    # Real-time audio cues & badge counter
│   │   │   ├── SocketContext.jsx          # Live WebSocket connection manager
│   │   │   └── ThemeContext.jsx           # Theme provider (Light & Dark modes)
│   │   ├── services/                      # API Layer & Integrations
│   │   │   ├── api.js                     # Central Axios client with auto-refresh JWT
│   │   │   ├── demoService.js             # Demo request API calls
│   │   │   ├── emailService.js            # Resend email notification service
│   │   │   ├── exportService.js           # CSV & styled PDF export generators
│   │   │   ├── firebase.js                # Legacy Firebase fallback connection
│   │   │   └── productsService.js         # Public product catalog queries
│   │   ├── styles/                        # Style Systems
│   │   │   └── landing.css                # Premium responsive styling for public page
│   │   ├── App.jsx                        # React Router DOM layout & ProtectedRoutes
│   │   ├── index.css                      # Core tokens & global design system
│   │   └── main.jsx                       # Client bootstrap & DOM mount
│   ├── .env                               # Client environment config
│   ├── package.json                       # Dependencies & scripts
│   ├── vercel.json                        # Vercel SPA routing rewrite rules
│   └── vite.config.js                     # Vite build & proxy configuration
│
├── server/                                # Backend REST API & Realtime Server
│   ├── cron/                              # Background Automation
│   │   └── billingCron.js                 # Automatic subscription renewal & invoice generator
│   ├── lib/                               # Core Utility Singletons
│   │   ├── email.js                       # HTML transactional email templates (Resend)
│   │   ├── logger.js                      # Pino structured logger
│   │   ├── prisma.js                      # Prisma client singleton
│   │   ├── redis.js                       # Redis connection & sliding-window rate limiters
│   │   └── socket.js                      # Socket.io server with Redis Pub/Sub adapter
│   ├── middleware/                        # Security & Validation Middlewares
│   │   ├── apiKeyAuth.js                  # Ingestion API key verification & rate limits
│   │   ├── requireAuth.js                 # JWT access token validation
│   │   └── requireRole.js                 # Role-based route authorization guards
│   ├── modules/                           # Feature-Driven API Controllers & Routes
│   │   ├── analytics/                     # KPI summary (Redis-cached) & time series
│   │   ├── auth/                          # Admin authentication, refresh, logout
│   │   ├── billing/                       # Subscriptions & Invoice CRUD
│   │   ├── demos/                         # Public lead capture & schedule appointments
│   │   ├── ingestion/                     # External SaaS ticket ingestion webhook
│   │   ├── products/                      # Product catalog CRUD & API key rotation
│   │   ├── team/                          # Staff directory management
│   │   └── tickets/                       # Tickets CRUD, conversation messages, streaming
│   ├── prisma/                            # Database Schema & Migrations
│   │   ├── migrations/                    # SQL migration history
│   │   └── schema.prisma                  # PostgreSQL relational schema
│   ├── scripts/                           # Maintenance Scripts
│   │   └── createAdmin.js                 # CLI script to bootstrap super administrators
│   ├── app.js                             # Express application configuration & middlewares
│   ├── package.json                       # Server dependencies & scripts
│   └── server.js                          # HTTP & WebSocket runtime listener
│
├── OVERALL.md                             # Comprehensive project documentation
└── README.md                              # Root quick-start guide
```

---

## 3. Complete Technology Stack

| Domain | Technology | Version | Purpose & Implementation |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) | `^19.2.7` | Modular UI component hierarchy with Hooks & Context API |
| **Build & Bundler** | [Vite](https://vitejs.dev/) | `^8.1.5` | Instant HMR development server and optimized rollup bundle |
| **Client Routing** | [React Router DOM](https://reactrouter.com/) | `^6.22.3` | Client-side routing with guarded admin paths (`/admin/*`) |
| **Icons** | [React Icons](https://react-icons.github.io/react-icons/) & [Lucide](https://lucide.dev/) | `^5.5.0` | Feather & Lucide SVG icons across all modules |
| **Backend Runtime** | [Node.js](https://nodejs.org/) | `20.x LTS` | High-throughput asynchronous server runtime |
| **Web Server Framework**| [Express.js](https://expressjs.com/) | `^4.19.2` | Clean modular routing, JSON validation, and CORS policies |
| **Database ORM** | [Prisma](https://www.prisma.io/) | `^5.14.0` | Type-safe database queries, auto-generated client, migrations |
| **Relational Database** | [PostgreSQL](https://www.postgresql.org/) | `16.x` | Relational storage with strict foreign keys and index optimization |
| **In-Memory Cache** | [Redis](https://redis.io/) (`ioredis`) | `^5.4.1` | Sliding-window rate limiters, 60s analytics cache, token blacklist |
| **Realtime WebSockets** | [Socket.IO](https://socket.io/) | `^4.7.5` | Instant cross-client event broadcasting with `@socket.io/redis-adapter` |
| **Cross-Tab Sync** | HTML5 `BroadcastChannel` | Native | Instant synchronizer across open browser tabs without network calls |
| **Authentication** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Standard | 15m stateless JWT access tokens + 7d HTTP-only refresh cookies |
| **Email Service** | [Resend](https://resend.com/) | REST API | Transactional notifications for ticket assignment and status changes |
| **Report Generation** | [ExcelJS](https://github.com/exceljs/exceljs) & [PDFKit](https://pdfkit.org/) | Latest | Streaming CSV and high-resolution styled PDF reports |
| **Scheduled Tasks** | [node-cron](https://github.com/node-cron/node-cron) | `^3.0.3` | Daily automated subscription renewals and overdue invoice marking |
| **Logging** | [Pino](https://getpino.io/) + `pino-pretty` | `^9.1.2` | Structured JSON log outputs with high performance |

---

## 4. Database Architecture & Data Models (Prisma)

The backend runs on **PostgreSQL** configured via `server/prisma/schema.prisma`. All monetary amounts are stored in **integer paise** (e.g., ₹100.00 = `10000`) to eliminate floating-point arithmetic errors.

```mermaid
erDiagram
    ADMIN ||--o{ TICKET : "assigned to"
    ADMIN ||--o{ NOTIFICATION : "receives"
    PRODUCT ||--o{ TICKET : "categorizes"
    PRODUCT ||--o{ DEMO_REQUEST : "interested in"
    PRODUCT ||--o{ SUBSCRIPTION : "subscribed to"
    PRODUCT ||--o{ API_KEY : "authenticates"
    TICKET ||--o{ TICKET_MESSAGE : "contains thread"
    SUBSCRIPTION ||--o{ INVOICE : "generates"

    ADMIN {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "SUPER_ADMIN | SUPPORT_LEAD | SUPPORT_ENGINEER | PRODUCT_MANAGER"
        boolean isActive
    }

    PRODUCT {
        string id PK
        string title
        string category
        enum tier "STARTER | PRO | ENTERPRISE"
        string demoUrl
        boolean isPublished
    }

    TICKET {
        string id PK
        string productId FK
        string clientName
        string clientEmail
        string subject
        string description
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        enum status "OPEN | IN_PROGRESS | RESOLVED | CLOSED"
        enum source "PUBLIC_FORM | EXTERNAL_API | ADMIN"
        string assignedAdminId FK
    }

    TICKET_MESSAGE {
        string id PK
        string ticketId FK
        enum sender "CLIENT | ADMIN"
        string authorName
        string text
        datetime createdAt
    }

    SUBSCRIPTION {
        string id PK
        string clientCompanyName
        string productId FK
        int monthlyAmountPaise
        enum status "ACTIVE | PAST_DUE | CANCELED | TRIALING"
        datetime currentPeriodEnd
    }
```

### Enumerations Reference

- **`AdminRole`**:
  - `SUPER_ADMIN`: Complete access to all administrative functions, staff provisioning, and billing.
  - `SUPPORT_LEAD`: Ticket assignment, priority overrides, and team productivity reporting.
  - `SUPPORT_ENGINEER`: Responding to assigned tickets and updating status.
  - `PRODUCT_MANAGER`: Managing product catalog, API keys, and demo requests.
- **`TicketPriority`**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **`TicketStatus`**: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- **`TicketSource`**: `PUBLIC_FORM` (Landing page modal), `EXTERNAL_API` (Webhook ingestion), `ADMIN` (Manual creation)
- **`SubscriptionStatus`**: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`
- **`InvoiceStatus`**: `PENDING`, `PAID`, `OVERDUE`, `VOID`

---

## 5. Authentication, Security & Role-Based Access Control (RBAC)

### Token Mechanics
1. **Access Token**: Stateless JWT containing `{ adminId, email, role }`, with an expiration of **15 minutes**. Sent via the `Authorization: Bearer <token>` header.
2. **Refresh Token**: Cryptographically signed token stored in an **HTTP-only, Secure, SameSite=Strict cookie**, valid for **7 days**.
3. **Token Blacklisting**: When an administrator logs out, their refresh token is stored in Redis with a TTL matching the token's remaining lifespan. Any refresh attempt using a blacklisted token immediately fails.

### Route Protection Middleware
- **`requireAuth.js`**: Validates the Bearer token against `JWT_SECRET`. Rejects invalid or expired signatures with HTTP 401.
- **`requireRole.js(...allowedRoles)`**: Enforces strict privilege checks. For instance:
  - Product creation/editing requires `[SUPER_ADMIN, PRODUCT_MANAGER]`.
  - Staff management requires `[SUPER_ADMIN]`.
  - Ticket responses are allowed for all authorized support staff.

### API Key Ingestion Security
External product webhooks communicate via the `x-api-key` header:
- Keys are hashed with SHA-256 before verification.
- **Sliding-Window Rate Limiting** via Redis limits each API key to **100 requests per minute**, preventing DDoS or spam tickets.

---

## 6. Multi-Product Ticket Hub & External Ingestion API

The ticket hub enables central management of tickets raised from any external vertical product (HRMS, Clinic System, School System, College System).

### Ingestion Webhook Specification

- **Method**: `POST`
- **Path**: `/api/ingestion/tickets`
- **Headers**:
  ```http
  Content-Type: application/json
  x-api-key: <PROD_SECRET_API_KEY>
  ```
- **Request Body**:
  ```json
  {
    "productId": "prod_hrms_001",
    "productName": "Attendance HRMS",
    "subject": "Biometric terminal sync timeout",
    "description": "Device terminal #4 at Reception is not pushing attendance logs to the local server.",
    "priority": "HIGH",
    "customerName": "Ramesh Kumar",
    "customerEmail": "ramesh.k@enterprise.com",
    "customerPhone": "+91 98765 43210"
  }
  ```
- **Success Response (HTTP 201 Created)**:
  ```json
  {
    "success": true,
    "ticketId": "clx89a0b10001...",
    "status": "OPEN",
    "priority": "HIGH",
    "message": "Ticket successfully ingested into Zuna Central Queue"
  }
  ```

### Real-Time Event Dispatch
Upon ingestion:
1. The record is written to PostgreSQL via Prisma.
2. An event `ticket:created` is emitted to the `/admin` Socket.io namespace.
3. Every connected support desk UI instantly prepends the new ticket without reloading.
4. If priority is `HIGH` or `URGENT`, an audio alert chime triggers on the admin dashboard.

---

## 7. Real-Time Infrastructure (Socket.IO + Redis + BroadcastChannel)

```text
[External SaaS App] ───────► POST /api/ingestion/tickets ───────┐
                                                                 │
[Public Web Landing] ──────► POST /api/ingestion/public ────────┤
                                                                 ▼
                                                    [Express Server Worker]
                                                                 │
                                                       (Prisma DB Write)
                                                                 │
                                                                 ▼
                                                      [Redis Pub/Sub Bus]
                                                                 │
                                     ┌───────────────────────────┴───────────────────────────┐
                                     ▼                                                       ▼
                            [Socket.IO Server 1]                                    [Socket.IO Server 2]
                                     │                                                       │
                           (WebSocket connection)                                  (WebSocket connection)
                                     ▼                                                       ▼
                           [Admin Browser Tab A] ◄──(BroadcastChannel)──► [Admin Browser Tab B]
```

1. **Redis Pub/Sub Adapter**: Permits seamless horizontal scaling across multiple Node.js worker processes. Events broadcasted on worker 1 reach browser clients connected to worker 2.
2. **Socket.io `/admin` Namespace**: Secures WebSocket connections with admin JWT authentication during handshake.
3. **HTML5 `BroadcastChannel` (`zuna_tickets_channel`)**: When multiple tabs are open on the same administrator workstation, tab-to-tab synchronization happens instantly in the client browser with zero network latency.

---

## 8. Public Showcase & Customer Conversion Funnel

The public landing page (`/`) is built with modern Vanilla CSS, focusing on speed, visual clarity, and responsiveness.

### Conversion Touchpoints
1. **Hero Section**: Value proposition introducing Zuna's unified management systems with instant CTAs: *"Request a Demo"* and *"Explore Products"*.
2. **Company Header Marquee**: Displays the enterprise products under **Carrezza Global Solutions Pvt Ltd**:
   - School Management System
   - HR Management System
   - College Management System
   - Clinic Management System
   - Turf Booking App
   - Customer Relationship Management (CRM)
3. **Interactive Product Grid**:
   - Product cards dynamically populated from the database.
   - Clean card design with transparent icon wrappers and high-contrast typography.
   - Distinct actions: *"Learn More"* (external link/modal) and *"Support"* (direct ticketing modal).
4. **"Why Choose Zuna" Section**: Interactive breakdown of platform reliability, 24/7 support, and unified subscriptions.
5. **Streamlined Setup Stepper**: Clean 3-step walkthrough (Choose Solution ➔ Get Onboarded ➔ Grow Business) with sleek dark slate hover transitions.
6. **Dynamic CTA Section**: Direct gateway to schedule walkthroughs or submit technical tickets.
7. **Comprehensive Footer**: Complete corporate details for **Carrezza Global Solutions Pvt Ltd**, direct Google Maps location link to the Erode headquarters, email contacts, and social links.

---

## 9. Administrative Command Center Modules

Located under `/admin/dashboard/*`:

### 1. Overview & Analytics (`/admin/dashboard/overview`)
- High-level KPI widgets: Total Revenue, Open Tickets, Active Clients, Pending Demos.
- 60-second Redis caching prevents heavy aggregation queries on high-traffic days.
- Real-time recent activity stream showing live ticket actions.

### 2. Multi-Product Tickets Queue (`/admin/dashboard/tickets`)
- Full-featured data grid supporting multi-column sorting and filtering.
- Status filters: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- Priority filters: `URGENT`, `HIGH`, `MEDIUM`, `LOW`.
- Product vertical dropdown: Filter specifically by HRMS, Clinic, School, or College.
- Slide-over drawer with thread history and rich-text response box.
- Export engine: Download full queue to Excel (`.csv`) or styled printable PDF reports.

### 3. Demo Requests Pipeline (`/admin/dashboard/demo-requests`)
- Tracks inbound prospective clients.
- Status management: `NEW` ➔ `CONTACTED` ➔ `SCHEDULED` ➔ `COMPLETED`.
- One-click email initiation to prospective clients.

### 4. Product Catalog Manager (`/admin/dashboard/products`)
- Complete CRUD controls for products showcased on the public landing page.
- Fields: Title, Category, Tier, Demo URL, Feature Tags, Published status, Display Sort Order.
- Secure API Key generation and rotation for product webhook ingestion.

### 5. Staff Directory (`/admin/dashboard/team`)
- Provisioning and role assignment for support staff and leads.
- Active/Inactive status toggle with immediate token revocation.

### 6. Billing & Subscriptions (`/admin/dashboard/billing`)
- Client subscription overview with monthly amounts (in paise).
- Invoice generation, renewal date tracking, and overdue status monitoring.

---

## 10. Transactional Email Engine (Resend API)

Configured in `server/lib/email.js`:

1. **Ticket Assignment Notifications**: Whenever a ticket is assigned to a support engineer, an email is dispatched containing ticket ID, priority badge, customer issue summary, and a direct link to the ticket drawer.
2. **Customer Ticket Receipt**: Sends an acknowledgment email to the customer with their tracking ticket number.
3. **Demo Booking Confirmation**: Alerts sales team members when a prospective customer books a product walkthrough.

---

## 11. Billing & Subscription Engine

Located in `server/modules/billing/` and `server/cron/billingCron.js`:

- **Integer Currency Representation**: All amounts are handled in **paise** (`100 paise = ₹1.00`).
- **Automated Cron Cycle**: Runs daily at midnight (`0 0 * * *`):
  1. Identifies active subscriptions where `currentPeriodEnd < NOW()`.
  2. Generates the next period's invoice with `status = PENDING`.
  3. Increments `currentPeriodEnd` by 1 billing cycle.
  4. Flags invoices older than 15 days as `OVERDUE`.

---

## 12. Complete REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Admin login via email & password; sets refresh cookie |
| `POST` | `/api/auth/refresh` | Public | Exchanges HTTP-only refresh cookie for a new access token |
| `POST` | `/api/auth/logout` | Authenticated | Blacklists current refresh token in Redis and clears cookies |
| `GET` | `/api/auth/me` | Authenticated | Returns current admin profile and assigned role |

### Tickets (`/api/tickets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Support Staff | Query tickets with pagination, status, priority, and product filters |
| `GET` | `/api/tickets/:id` | Support Staff | Retrieve complete ticket details and full conversation history |
| `POST` | `/api/tickets` | Support Staff | Manually create a new support ticket |
| `PATCH` | `/api/tickets/:id` | Support Staff | Update ticket status, priority, or assign staff member |
| `POST` | `/api/tickets/:id/messages` | Support Staff | Post reply message to customer conversation thread |
| `GET` | `/api/tickets/export/csv` | Support Staff | Streaming export of filtered tickets to CSV format |
| `GET` | `/api/tickets/export/pdf` | Support Staff | Generates printable PDF summary report |

### External Ingestion (`/api/ingestion`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ingestion/tickets` | API Key Required | Ingests ticket from external SaaS apps (`x-api-key`) |
| `POST` | `/api/ingestion/public` | Public | Ingests ticket from the public landing page modal |

### Products (`/api/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Lists all published products for the landing page |
| `POST` | `/api/products` | Super Admin / PM | Creates a new SaaS product entry |
| `PUT` | `/api/products/:id` | Super Admin / PM | Updates product details, pricing tier, or demo URL |
| `DELETE` | `/api/products/:id` | Super Admin | Removes a product from catalog |
| `POST` | `/api/products/:id/api-key` | Super Admin | Generates or rotates product ingestion API key |

### Demo Requests (`/api/demos`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/demos` | Public | Submits a demo booking from landing page |
| `GET` | `/api/demos` | Support Staff | Queries all demo booking inquiries |
| `PATCH` | `/api/demos/:id` | Support Staff | Updates demo status (`CONTACTED`, `SCHEDULED`, `COMPLETED`) |

---

## 13. Environment Configuration Reference

### Client Environment (`client/.env`)
```env
# URL for the Node.js Express backend API
VITE_API_URL=http://localhost:5000/api

# WebSocket Server URL for real-time Socket.io events
VITE_SOCKET_URL=http://localhost:5000

# (Optional) Legacy Firebase configuration for fallback read operations
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Server Environment (`server/.env`)
```env
# Server Port & Mode
PORT=5000
NODE_ENV=development

# Allowed Client Origin for CORS
CLIENT_ORIGIN=http://localhost:5173

# PostgreSQL Connection String (Prisma ORM)
DATABASE_URL="postgresql://postgres:password@localhost:5432/zuna_db?schema=public"

# Redis Cache & Pub/Sub Connection URL
REDIS_URL="redis://localhost:6379"

# JWT Token Secrets
JWT_SECRET="super-secure-jwt-access-secret-key-32-chars-minimum"
JWT_REFRESH_SECRET="super-secure-jwt-refresh-secret-key-32-chars-minimum"

# Resend API Key for Transactional HTML Emails
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="Zuna Support <support@teamcarrezza.com>"
```

---

## 14. Local Development & Production Setup Guide

### System Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20 LTS recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14+` running locally or via Docker
- **Redis**: `v6+` running locally or via Docker

---

### Step 1: Start Database & Redis (Optional Docker Setup)

```bash
# Run PostgreSQL container
docker run -d --name zuna-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=zuna_db -p 5432:5432 postgres:16-alpine

# Run Redis container
docker run -d --name zuna-redis -p 6379:6379 redis:7-alpine
```

---

### Step 2: Configure & Start Backend Server

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create .env configuration
cp .env.example .env
# Open server/.env and verify DATABASE_URL and REDIS_URL

# 4. Run Prisma database migrations
npx prisma migrate dev --name init

# 5. Bootstrap an initial Super Admin account
node scripts/createAdmin.js
# Follow interactive prompts: enter Name, Email, Password

# 6. Start development server with live reload
npm run dev
# Server output: [INFO] Server listening on http://localhost:5000
```

---

### Step 3: Configure & Start Frontend Client

```bash
# 1. Open a new terminal and navigate to client directory
cd client

# 2. Install frontend dependencies
npm install

# 3. Verify client/.env configuration
# Confirm VITE_API_URL=http://localhost:5000/api
# Confirm VITE_SOCKET_URL=http://localhost:5000

# 4. Start Vite development server
npm run dev
# Vite output: Local: http://localhost:5173/
```

---

### Step 4: Verification Checklist

1. **Public Landing Page**: Open `http://localhost:5173/` in your browser. Verify the products catalog, company marquee, and click *"Raise Support Ticket"* to submit a test ticket.
2. **Admin Command Center**: Navigate to `http://localhost:5173/admin/login` and authenticate with your Super Admin credentials.
3. **Real-Time Synchronizer**: Open the ticket queue at `http://localhost:5173/admin/dashboard/tickets` in two browser windows side-by-side. Update ticket status in one window; observe the second window update instantly.

---

### Step 5: Production Deployment

- **Frontend (Vercel)**:
  - Connect repository on [Vercel](https://vercel.com/).
  - Set Root Directory to `client`.
  - Add environment variable: `VITE_API_URL=https://api.yourdomain.com/api` and `VITE_SOCKET_URL=https://api.yourdomain.com`.
  - Deployment configuration is handled by `client/vercel.json`.
- **Backend (Railway / Render / VPS)**:
  - Configure PostgreSQL and Redis instances.
  - Set Root Directory to `server`.
  - Build command: `npm install && npx prisma migrate deploy`
  - Start command: `node server.js`
  - Deployment definitions are handled by `server/railway.json` and `server/nixpacks.toml`.

---

## 15. Attribution & Corporate Identity

**Zuna** is designed, developed, and maintained by:

**Carrezza Global Solutions Pvt Ltd**  
*Premier IT Services & Enterprise BPO Solutions Provider*  
📍 Perundurai, Erode, Tamil Nadu, India  
🌐 Website: [www.teamcarrezza.com](https://www.teamcarrezza.com)  
✉️ Contact: [info@teamcarrezza.com](mailto:info@teamcarrezza.com)

© 2026 Carrezza Global Solutions Pvt Ltd. All rights reserved.
