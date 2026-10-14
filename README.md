# Zuna — Enterprise SaaS Command Center & Multi-Product Support Hub

> **Empowering Enterprise Ecosystems** — Centralized administrative portal, public product showcase, and real-time support ticket command center built for **Carrezza Global Solutions Pvt Ltd** and its suite of vertical SaaS applications.

---

## 📌 Overview

**Zuna** serves as both the flagship public landing page and central administrative command center for the **Carrezza Global Solutions** ecosystem. It unifies multiple standalone SaaS applications—such as **Attendance HRMS**, **Clinic Management System**, **School Management System**, and **College Management System**—by consolidating support tickets, demo bookings, product showcases, subscription billing, and support agents into a unified, real-time control desk.

---

## 🏗️ System Architecture

```text
Zuna-Parent/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── public/                 # Static assets, branding logos & favicons
│   ├── src/
│   │   ├── components/         # Admin views (Tickets, Analytics, Demos, Billing) & Public Landing
│   │   ├── context/            # SocketContext, ThemeContext, AuthContext, NotificationContext
│   │   ├── services/           # REST APIs, Firebase legacy fallback, Export services
│   │   ├── styles/             # Modular CSS, landing page theme, variables
│   │   ├── App.jsx             # SPA Router & Route Guards
│   │   ├── index.css           # Global tokens & modern CSS design system
│   │   └── main.jsx            # React root mount
│   ├── docs/                   # Client documentation & integration specs
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API & Realtime Service (Node.js + Express)
│   ├── cron/                   # Scheduled recurring tasks (billing renewal checks)
│   ├── lib/                    # Prisma DB singleton, Redis client, Socket.io, Logger, Resend Email
│   ├── middleware/             # JWT auth, role validation, API Key ingestion rate-limiting
│   ├── modules/                # Feature-driven API modules
│   │   ├── analytics/          # Fast Redis-cached KPI metrics & charts
│   │   ├── auth/               # Secure JWT login/refresh & token blacklisting
│   │   ├── billing/            # Subscriptions & invoices (stored in integer paise)
│   │   ├── demos/              # Demo booking pipeline & lead capture
│   │   ├── ingestion/          # External SaaS ticket ingestion webhook endpoint
│   │   ├── products/           # Product catalog CRUD & API key rotation
│   │   ├── team/               # Staff directory & role-based access
│   │   └── tickets/            # Multi-product ticket queue & conversation threads
│   ├── prisma/                 # Database schema & migrations (PostgreSQL)
│   ├── scripts/                # Database seeders & admin bootstrap scripts
│   ├── app.js                  # Express app setup, CORS & routes mounting
│   ├── server.js               # HTTP & WebSocket runtime entry point
│   └── package.json
│
└── README.md                   # Project Master Documentation
```

---

## 🚀 Key Features

### 1. 🌐 Public-Facing Showcase (`/`)
- **Brand Identity**: Features **Carrezza Global Solutions Pvt Ltd** branding and mission.
- **Dynamic Product Showcase**: Interactive catalog featuring live product demos, feature highlights, and direct ticketing.
- **Demo Request Booking**: Lead capture modal allowing prospective clients to request custom walkthroughs.
- **Public Support Ticket Form**: Embedded modal enabling customers from any SaaS product to raise technical tickets.

### 2. 🎫 Multi-Product Ticket Queue (`/admin/dashboard/tickets`)
- **Real-Time Cross-App Streaming**: Live ticket events streamed via Socket.io with Redis Pub/Sub adapter.
- **Priority & Status Routing**: Filter tickets by priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) and status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
- **Interactive Message Thread**: Two-way customer and support engineer messaging with timestamp tracking.
- **Automated Email Dispatch**: Sends transactional assignment emails via **Resend API**.
- **Data Exporting**: Instant export to CSV (`exceljs`) and PDF reports (`pdfkit`).

### 3. 📊 Executive Dashboard & Analytics (`/admin/dashboard/overview`)
- **Real-Time KPIs**: Open tickets, active clients, demo conversion rates, and revenue metrics.
- **Redis Caching**: High-speed 60s cache on aggregation queries to prevent database bottlenecks.
- **System Health Monitor**: Live latency, database cluster status, and API health ping.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | Fast HMR dev server and bundled SPA |
| **Styling** | Vanilla CSS3 + Modern Tokens | Responsive glassmorphism, tailored typography, no Tailwind bloat |
| **Backend Runtime** | Node.js 20 LTS + Express.js | Modular REST API service |
| **Database** | PostgreSQL 16 (via Prisma ORM) | Relational database schema with strict foreign key constraints |
| **In-Memory Cache & Pub/Sub** | Redis (`ioredis`) | Fast KPI caching, rate limiting, and Socket.io cluster adapter |
| **Realtime WebSockets** | Socket.IO | Bi-directional events for instant ticket sync and admin alerts |
| **Transactional Email** | Resend API | Automated notifications for engineer assignments & ticket updates |

---

## ⚙️ Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Redis**: v6.0 or higher (optional for dev, or local Redis server)

### 1. Backend Server Setup
```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY

# Run database migrations
npx prisma migrate dev

# (Optional) Seed super admin
node scripts/createAdmin.js

# Start server development mode
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Client Setup
```bash
# Navigate to client folder
cd ../client

# Install dependencies
npm install

# Configure environment variables
# Verify VITE_API_URL=http://localhost:5000/api in .env

# Start client development server
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔌 External Product Ticket Ingestion API

External sub-products (HRMS, Clinic System, School System, College System) submit tickets to the central hub using a secure API key:

- **Endpoint**: `POST /api/ingestion/tickets`
- **Headers**:
  ```http
  Content-Type: application/json
  x-api-key: YOUR_PRODUCT_API_KEY
  ```
- **Payload Schema**:
  ```json
  {
    "productId": "prod_hrms_01",
    "productName": "Attendance HRMS",
    "subject": "Fingerprint Sync Latency in Ward A",
    "description": "Device sync timeout occurring intermittently.",
    "priority": "HIGH",
    "customerName": "Dr. Sarah Jenkins",
    "customerEmail": "sarah.jenkins@hospital.org",
    "customerPhone": "+91 98765 43210"
  }
  ```

---

## 📄 Documentation Directory

For in-depth architectural and integration specifications, refer to:
- 📘 [Client Documentation](file:///c:/Users/ELCOT/Desktop/zuna%20parents/Zuna-Parent/client/docs/README.md)
- 📋 [Ticket Workflow Specification](file:///c:/Users/ELCOT/Desktop/zuna%20parents/Zuna-Parent/client/docs/TICKET_WORKFLOW_SPEC.md)
- 📊 [Project Workflows & Pending Roadmap](file:///c:/Users/ELCOT/Desktop/zuna%20parents/Zuna-Parent/client/docs/PROJECT_WORKFLOW_AND_PENDING.md)
- 🖥️ [Server Backend Specification](file:///c:/Users/ELCOT/Desktop/zuna%20parents/Zuna-Parent/server/README.md)

---

## 🏢 Organization & Attribution

Developed and maintained by **Carrezza Global Solutions Pvt Ltd**.  
All rights reserved © 2026.
