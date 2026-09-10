# Zuna Central Admin & Multi-Product Support Ticket Hub

> **Empowering Enterprise Ecosystems** — A centralized administrative portal, product showcase, and real-time support ticket management system built for **Carrezza Global Solutions** and its suite of vertical SaaS applications.

---

## 📌 Executive Summary

**Zuna** serves as both the flagship public landing page and the central administrative command center for the **Carrezza Global Solutions** ecosystem. It bridges the gap between multiple standalone SaaS applications—such as **Attendance (HRMS)**, **Clinic Management System**, **School Management System**, and **College Management System**—by consolidating support tickets, demo inquiries, product catalogs, subscription billing, and support agents into a unified, real-time control desk.

---

## 🚀 Key Features

### 1. 🌐 Public-Facing Portal
- **Hero & Value Proposition**: High-conversion landing page presenting Zuna's modern software suite.
- **Dynamic Product Showcase**: Interactive catalog featuring live links, feature breakdowns, and pricing for each SaaS vertical.
- **Client Demo Booking**: Direct booking form allowing prospective clients to request personalized demos.
- **Public Ticket Submission**: Embedded modal enabling subscribers and users from any product to raise technical support tickets with custom priority levels.
- **Brand Story**: Highlighting Carrezza Global Solutions' vision, mission, and engineering standards.

### 2. 🎫 Centralized Multi-Product Ticket Monitor (`/admin/dashboard/tickets`)
- **Real-Time Cross-App Sync**: Consolidates tickets from both primary (`tickets`) and legacy (`support_tickets`) Firestore collections in real time via `onSnapshot` listeners.
- **Cross-Tab Synchronization**: Uses the HTML5 `BroadcastChannel` API (`zuna_tickets_channel`) for instant live updates across browser tabs without manual reloads.
- **Color-Coded Product Badges**:
  - 🔵 **Attendance (HRMS)**: Cyan / Blue (`#00F5D4`)
  - 🟢 **Clinic Management System**: Emerald Green (`#10B981`)
  - 🟣 **School Management System**: Indigo Purple (`#818CF8`)
  - 🟡 **College Management System**: Amber Gold (`#FBBF24`)
  - ⚪ **General Support**: Slate Gray
- **Multi-Filter & Search**: Instant filtering by product line, status (`Open`, `In Progress`, `Resolved`, `Closed`), priority (`Urgent`, `High`, `Medium`, `Low`), or free-text query.
- **Slide-Over Interactive Drawer**: Full conversation thread between client and support team with message timestamps and reply dispatch.
- **Automated Resend Email Alerts**: Sends transactional HTML email notifications with priority badges and direct ticket details to assigned engineers via the **Resend API**.
- **Data Exporting**: 1-click export of filtered or full ticket tables to **Excel / CSV** and styled **Printable PDF Reports**.

### 3. 📊 Executive Dashboard & Analytics (`/admin/dashboard/overview` & `/analytics`)
- **Real-Time KPI Cards**: Total active customers, monthly recurring revenue (MRR), open ticket count, and operational system uptime.
- **Interactive Revenue & Usage Charts**: Dynamic breakdown per SaaS product line with toggleable metrics.
- **System Health Monitor**: Live latency, uptime, and operational status for microservices, database clusters, and API gateways.
- **Live Activity Stream**: Real-time ticker of recent demo requests, resolved tickets, and customer onboarding events.

### 4. 📦 Product Manager (`/admin/dashboard/products`)
- Full CRUD operations (Create, Read, Update, Delete) for managing SaaS products displayed on the landing page.
- Fields for product title, category, badge, description, feature tags, subscription tier, external demo URL, and icon assignment.

### 5. 📅 Demo Requests Pipeline (`/admin/dashboard/demo-requests`)
- Tracks customer inquiries captured via the public landing page.
- Pipeline management across statuses: `New`, `Contacted`, `Scheduled`, `Completed`.
- Real-time notification trigger alerting administrators whenever a prospective client submits a request.

### 6. 👥 Team & Access Control (`/admin/dashboard/team`)
- Support staff directory with role definitions (`Support Lead`, `Support Engineer`, `Product Manager`).
- Direct integration into ticket assignment workflows and automated email dispatch.

### 7. 💳 Billing & Subscriptions (`/admin/dashboard/billing`)
- Client invoicing management, subscription renewals, invoice generation, and revenue reporting.

### 8. 🔔 Notification System (`NotificationContext.jsx` & `NotificationDropdown.jsx`)
- Global React context providing persistent real-time notifications with audio cues and unread badge counters.
- Deep-links directly from the notification dropdown to the relevant ticket or demo request.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) | `^19.2.7` | UI component architecture |
| **Build Tool** | [Vite](https://vitejs.dev/) | `^8.1.1` | Next-generation dev server and bundler |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `^6.22.3` | Client-side SPA routing and protected routes |
| **Backend & Database** | [Google Firebase Firestore](https://firebase.google.com/) | `^12.16.0` | Cloud database with real-time listener subscriptions |
| **Authentication** | [Firebase Auth](https://firebase.google.com/products/auth) | `^12.16.0` | Secure email/password authentication & admin role verification |
| **Icons** | [Lucide React](https://lucide.dev/) | `^0.475.0` | Consistent, lightweight vector icons |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | `^12.42.2` | Smooth page transitions, modals, and slide-overs |
| **Email Service** | [Resend](https://resend.com/) | REST API | Automated transactional email notifications for ticket assignments |
| **Styling** | Vanilla Modern CSS | Custom | Custom design system, CSS variables, glassmorphism, responsive layouts |
| **Deployment** | [Vercel](https://vercel.com/) | Standard | Cloud hosting configured via `vercel.json` |

---

## 📂 Project Structure

```text
c:\Zuna Ticket\
├── .env                         # Local environment configuration (Firebase, Resend)
├── .env.example                 # Template for environment variables
├── firestore.rules              # Firebase Cloud Firestore security rules
├── package.json                 # Project dependencies and npm scripts
├── vite.config.js               # Vite bundler configuration
├── vercel.json                  # Vercel deployment rewrite rules for SPA
├── create_admin.js              # Administrative user creation script (Firebase Admin SDK)
├── TICKET_WORKFLOW_SPEC.md      # External product integration schema specification
├── public/                      # Static brand assets and favicons
└── src/
    ├── App.jsx                  # Main routing configuration
    ├── index.css                # Global design system, tokens, and component styling
    ├── main.jsx                 # React root DOM initialization
    │
    ├── components/
    │   ├── admin/               # Administrative dashboard views
    │   │   ├── Analytics.jsx            # Deep analytics & metrics reports
    │   │   ├── BillingManager.jsx       # Subscriptions and invoices management
    │   │   ├── DashboardLayout.jsx      # Header, sidebar, ticking clock & theme provider
    │   │   ├── DashboardOverview.jsx    # KPI metrics, revenue charts & activity feed
    │   │   ├── DemoRequestsTable.jsx    # Demo lead pipeline management
    │   │   ├── HelpSupport.jsx          # Admin user manual and knowledge base
    │   │   ├── LoginForm.jsx            # Authenticated admin login screen
    │   │   ├── NotificationDropdown.jsx # Real-time notification drawer
    │   │   ├── ProductForm.jsx          # Product creation/edit modal
    │   │   ├── ProductsTable.jsx        # SaaS product catalog management
    │   │   ├── Settings.jsx             # Timezone, branding, profile & security settings
    │   │   ├── TeamManager.jsx          # Support team and staff roster
    │   │   └── TicketsTable.jsx         # Real-time multi-product ticket workbench
    │   │
    │   ├── common/              # Reusable generic UI components
    │   │   ├── RefreshControl.jsx       # Manual sync button with animation
    │   │   └── Skeleton.jsx             # Skeleton loading placeholders
    │   │
    │   └── public/              # Client-facing landing components
    │       ├── LandingPage.jsx          # Public brand portal & sections
    │       ├── ProductCard.jsx          # Individual product showcase card
    │       └── TicketRaiseForm.jsx      # Modal form for submitting tickets
    │
    ├── context/
    │   └── NotificationContext.jsx      # React Context for notifications & unread counts
    │
    ├── routes/
    │   └── AdminRoute.jsx               # Protected route guard verifying admin credentials
    │
    └── services/
        ├── billingService.js            # Invoicing data provider (Firestore + LocalStorage)
        ├── demoService.js               # Demo request dispatch & persistence
        ├── emailService.js              # Resend email template generator and API integration
        ├── exportService.js             # CSV spreadsheet and styled PDF report generator
        ├── firebase.js                  # Firebase initialization (Auth & Firestore)
        ├── notificationsService.js      # Alert notifications data provider
        ├── productsService.js           # SaaS catalog data provider
        ├── ticketsService.js            # Ticket normalization, live listeners, CRUD
        └── usersService.js              # Staff and team directory service
```

---

## 🔌 Multi-Product Integration Architecture

External SaaS applications (HRMS, Clinic, School, College) connect directly to the Zuna Ticket Central Monitor by writing to Firestore.

### 📝 Firestore Ticket Schema

```json
{
  "productName": "Clinic Management System",
  "productId": "clinic-v1",
  "clientName": "St. Jude Memorial Hospital",
  "clientEmail": "admin@stjudehospital.com",
  "subject": "EMR Billing Sync Timeout",
  "description": "Encountering intermittent timeouts during evening patient billing sync.",
  "priority": "high",
  "status": "open",
  "createdAt": "2026-09-09T17:00:00.000Z",
  "messages": [
    {
      "sender": "Client",
      "author": "Dr. Sarah Jenkins",
      "text": "Encountering intermittent timeouts during evening patient billing sync.",
      "timestamp": "Just now"
    }
  ]
}
```

### 📡 Standardized Integration Snippet

Any external application can submit tickets directly using the Firebase Client SDK:

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const raiseZunaTicket = async ({ 
  productName, 
  clientName, 
  clientEmail, 
  subject, 
  description, 
  priority = 'medium' 
}) => {
  const newTicket = {
    productName,
    clientName,
    clientEmail,
    subject,
    description,
    priority,
    status: 'open',
    createdAt: serverTimestamp(),
    messages: [
      {
        sender: 'Client',
        author: clientName,
        text: description,
        timestamp: new Date().toISOString()
      }
    ]
  };

  const docRef = await addDoc(collection(db, 'tickets'), newTicket);
  return docRef.id;
};
```

---

## 🔒 Security & Firestore Rules

The database security is configured in [firestore.rules](file:///c:/Zuna%20Ticket/firestore.rules). Read and write operations for `tickets`, `support_tickets`, `products`, and `admins` collections are secured according to administrative privileges and client submission rules.

### Admin Initialization

To bootstrap a new administrative account, use the provided helper script:

```bash
# 1. Place your serviceAccountKey.json in the project root
# 2. Run the admin creation script
node create_admin.js
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```ini
# Firebase Web App Credentials
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Resend Email Integration (for automated staff notifications)
VITE_RESEND_API_KEY=re_your_resend_api_key
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   - **Public Landing Page**: `http://localhost:5173/`
   - **Admin Login**: `http://localhost:5173/admin`
   - **Admin Dashboard**: `http://localhost:5173/admin/dashboard`

### Production Build

To build the project for production deployment:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run start
```

---

## 📄 License & Attribution

Developed by **Carrezza Global Solutions**. All rights reserved.
