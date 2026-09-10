# Zuna Central Admin — Backend (Node.js + PostgreSQL + Redis)

Backend API service for **Zuna Central Admin** (SaaS Central Support Hub). Replaces the legacy client-side Firebase (Firestore/Auth) backend with a robust REST + WebSocket architecture.

---

## 🛠 Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4
- **Database ORM**: Prisma 5 with PostgreSQL 16
- **Cache / Pub-Sub / Rate Limit**: Redis (`ioredis`)
- **Realtime**: Socket.io (`/admin` namespace) with `@socket.io/redis-adapter`
- **Authentication**: JWT (15m access token + 7d httpOnly refresh cookie), bcrypt
- **Transactional Email**: Resend API (`resend` SDK)
- **Reporting**: Streaming CSV (`exceljs`) + PDF table generation (`pdfkit`)
- **Scheduled Jobs**: `node-cron`
- **Logging**: `pino` + `pino-pretty`

---

## 📁 Project Architecture

```
server/
├── cron/                      # Background scheduled jobs (billing renewals)
│   └── billingCron.js
├── lib/                       # Core service singletons & wrappers
│   ├── email.js               # Resend email notification templates
│   ├── logger.js              # Pino logger
│   ├── prisma.js              # Prisma Client singleton
│   ├── redis.js               # Redis client with sliding-window rate limiter
│   └── socket.js              # Socket.io server with Redis adapter & event emitters
├── middleware/                # Route security & auth middlewares
│   ├── apiKeyAuth.js          # Ingestion API key auth with Redis rate limiting
│   ├── requireAuth.js         # JWT access token verification
│   └── requireRole.js         # Role-based route guard
├── modules/                   # Feature modules
│   ├── analytics/             # KPI summary (60s Redis cache) & time series charts
│   ├── auth/                  # Admin JWT login, refresh, logout (with Redis blacklist)
│   ├── billing/               # Subscriptions & Invoices (stored in integer paise)
│   ├── demos/                 # Public lead capture & appointment scheduling
│   ├── ingestion/             # External SaaS ticket ingestion & public web form
│   ├── products/              # SaaS products catalog & API key generation/rotation
│   ├── team/                  # Staff directory & Super Admin provisioning
│   └── tickets/               # Core ticket hub, message threads, streaming export
├── prisma/
│   ├── migrations/            # SQL migration history
│   └── schema.prisma          # PostgreSQL relational schema
├── scripts/
│   └── createAdmin.js         # Interactive CLI to bootstrap Super Admin
├── app.js                     # Express app setup, CORS, and route mounting
├── nixpacks.toml              # Nixpacks build definition
├── package.json
├── railway.json               # Railway deployment configuration
├── README.md
└── server.js                  # HTTP + WebSocket entry point
```

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your local or cloud PostgreSQL and Redis connection strings are configured.

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Bootstrap Super Admin
```bash
npm run seed:admin
```
Follow the interactive prompt to set the email and password for the first admin.

### 5. Start Server
```bash
npm run dev
```
The server will start at `http://localhost:5000` with the health check available at `http://localhost:5000/health`.

---

## ☁️ Railway Production Deployment

### 1. Create Railway Project
1. Go to [Railway](https://railway.app) and create a **New Project**.
2. Deploy from your GitHub repository, selecting the `/server` directory as the root.

### 2. Add Database & Redis Plugins
In your Railway project canvas:
1. Click **New** ➔ **Database** ➔ **PostgreSQL**.
2. Click **New** ➔ **Database** ➔ **Redis**.

Railway will automatically provision both services and inject:
- `DATABASE_URL`
- `REDIS_URL`

### 3. Configure Environment Variables
In your API service settings on Railway, add:
- `PORT`: `5000` (or leave default for Railway dynamic assignment)
- `NODE_ENV`: `production`
- `JWT_ACCESS_SECRET`: `<secure-random-32-char-string>`
- `JWT_REFRESH_SECRET`: `<secure-random-32-char-string>`
- `FRONTEND_ORIGIN`: `<your-vercel-frontend-domain>,http://localhost:5173`
- `RESEND_API_KEY`: `<your-resend-api-key>`
- `EMAIL_FROM`: `Zuna Support <notifications@yourverifieddomain.com>`

### 4. Automatic Build & Migration
Railway will automatically detect `railway.json` and `nixpacks.toml`:
1. Runs `npm run build` (`prisma generate && prisma migrate deploy`).
2. Runs `npm run start` (`node server.js`).
3. Monitors `GET /health` for container health checks.

### 5. Bootstrap Production Super Admin
Once the service is deployed, open the Railway service terminal and run:
```bash
node scripts/createAdmin.js
```
Follow the prompts to configure your Super Admin login credentials.
