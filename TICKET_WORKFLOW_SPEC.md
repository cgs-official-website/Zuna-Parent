# Zuna Multi-Product Support Ticket Workflow Specification

## Overview
This document specifies the support ticket integration architecture between the **Zuna Central Admin Panel** (the master landing page & administrative portal) and the four SaaS products under the Zuna brand:
1. **Attendance (HRMS)**
2. **Clinic Management System**
3. **School Management System**
4. **College Management System**

---

## Centralized Ticket Workflow

1. **Ticket Submission**:
   - Any subscriber or administrator using an individual product app (e.g., Attendance HRMS, Clinic System, School System, College System) raises a support ticket via their local support page or helpdesk menu.
   - The ticket is stored in Firestore within the shared `tickets` or `support_tickets` collection.

2. **Central Monitoring in Zuna Admin**:
   - The Zuna Central Admin Panel (`/admin/dashboard/tickets`) queries all support tickets in real-time.
   - Tickets are automatically tagged with a color-coded badge identifying the originating product:
     - **Attendance (HRMS)**: Cyan / Blue (`#00F5D4`)
     - **Clinic Management System**: Emerald Green (`#10b981`)
     - **School Management System**: Indigo Purple (`#818cf8`)
     - **College Management System**: Amber Gold (`#fbbf24`)
   - Administrators can search, filter by product, filter by priority (`Urgent`, `High`, `Medium`, `Low`), and filter by status (`Open`, `In Progress`, `Resolved`, `Closed`).

3. **Replying to Tickets**:
   - Zuna Central Admins view the full ticket thread in the side drawer.
   - Replying from Zuna pushes an update to the ticket's `messages` array in Firestore, updating the document in real time so the client sees the resolution.

---

## Ticket Document Schema (Firestore Payload)

When any sub-product submits a support ticket, it formats the JSON payload as follows:

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
  "createdAt": "2026-07-23T18:20:00.000Z",
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

### Supported `productName` Values
- `"Attendance (HRMS)"` or `"HRMS"`
- `"Clinic Management System"` or `"Clinic"`
- `"School Management System"` or `"School"`
- `"College Management System"` or `"College"`
- `"General Support"`

### Status Enum
- `"open"`
- `"in-progress"`
- `"resolved"`
- `"closed"`

### Priority Enum
- `"urgent"` / `"Urgent"`
- `"high"` / `"High"`
- `"medium"` / `"Medium"`
- `"low"` / `"Low"`

---

## Example Integration Code (For External Deployed Products)

Deployed products can use standard Firebase SDK `addDoc` to submit tickets directly into Zuna's Central Admin Monitor:

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Shared or target Firebase instance

export const raiseZunaTicket = async ({ productName, clientName, clientEmail, subject, description, priority }) => {
  const newTicket = {
    productName,
    clientName,
    clientEmail,
    subject,
    description,
    priority: priority || 'medium',
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
