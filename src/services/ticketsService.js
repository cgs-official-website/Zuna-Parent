import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { notificationsService } from './notificationsService';

const ticketsCollection = collection(db, 'tickets');
const supportTicketsCollection = collection(db, 'support_tickets');
const STORAGE_KEY = 'zuna_tickets';

const defaultTickets = [];

const normalizeProductName = (ticket) => {
  if (ticket.productName) {
    const p = ticket.productName;
    if (p.toLowerCase().includes('attendance') || p.toLowerCase().includes('hrms')) return 'Attendance (HRMS)';
    if (p.toLowerCase().includes('clinic') || p.toLowerCase().includes('hospital')) return 'Clinic Management System';
    if (p.toLowerCase().includes('school')) return 'School Management System';
    if (p.toLowerCase().includes('college')) return 'College Management System';
    return p;
  }
  if (ticket.product_name) return ticket.product_name;
  if (ticket.hospitalName) return 'Clinic Management System';
  if (ticket.school) return 'School Management System';
  if (ticket.department || ticket.employeeId) return 'Attendance (HRMS)';
  return 'General Support';
};

const getLocalTickets = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter out old legacy dummy items if present
      const cleaned = parsed.filter(t => !['TK-842', 'TK-843', 'TK-844', 'TK-845', 'TK-846', 'TK-847'].includes(t.id));
      return cleaned;
    }
  } catch (e) {
    console.error('Failed reading local tickets', e);
  }
  return defaultTickets;
};

const saveLocalTickets = (tickets) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed saving local tickets', e);
  }
};

export const ticketsService = {
  getTickets: async () => {
    let mainList = [];
    let supportList = [];

    // Fetch from main tickets collection (direct getDocs to avoid index errors)
    try {
      const snapshot = await getDocs(ticketsCollection);
      if (!snapshot.empty) {
        mainList = snapshot.docs
          .map(doc => {
            const data = doc.data();
            const ticketId = data.id || doc.id;
            return {
              firestoreDocId: doc.id,
              id: ticketId,
              sourceCollection: 'tickets',
              ...data,
              id: ticketId,
              productName: normalizeProductName({ id: ticketId, ...data }),
              clientName: data.clientName || data.raisedBy?.name || data.customer_name || data.hospitalName || data.school || 'Client',
              clientEmail: data.clientEmail || data.raisedBy?.email || data.customer_email || ''
            };
          })
          .filter(t => t.status !== 'deleted');
      }
    } catch (err) {
      console.warn('Firestore fetch main tickets failed:', err);
    }

    // Fetch from secondary support_tickets collection
    try {
      const snapshotSupport = await getDocs(supportTicketsCollection);
      if (!snapshotSupport.empty) {
        supportList = snapshotSupport.docs.map(doc => {
          const data = doc.data();
          const ticketId = data.id || doc.id;
          return {
            firestoreDocId: doc.id,
            id: ticketId,
            sourceCollection: 'support_tickets',
            ...data,
            id: ticketId,
            productName: normalizeProductName({ id: ticketId, ...data }),
            clientName: data.clientName || data.hospitalName || data.school || data.raisedBy?.name || data.name || 'Client',
            clientEmail: data.clientEmail || data.raisedBy?.email || data.email || '',
            subject: data.subject || 'Support Ticket',
            description: data.description || data.issue || '',
            priority: data.priority || 'medium',
            status: data.status || 'open',
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
            messages: data.messages || []
          };
        });
      }
    } catch (err) {
      console.warn('Firestore fetch support_tickets failed:', err);
    }

    const localList = getLocalTickets();

    // Deduplicate and merge tickets from all sources (local + firestore collections)
    const ticketMap = new Map();
    [...localList, ...mainList, ...supportList].forEach(t => {
      if (t && t.id) {
        ticketMap.set(t.id, { ...ticketMap.get(t.id), ...t });
      }
    });

    const combinedList = Array.from(ticketMap.values());
    combinedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    saveLocalTickets(combinedList);
    return combinedList;
  },

  subscribeTickets: (callback) => {
    let mainList = [];
    let supportList = [];

    const mergeAndEmit = () => {
      const localList = getLocalTickets();
      const ticketMap = new Map();
      [...localList, ...mainList, ...supportList].forEach(t => {
        if (t && t.id) {
          ticketMap.set(t.id, { ...ticketMap.get(t.id), ...t });
        }
      });
      const combinedList = Array.from(ticketMap.values());
      combinedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      saveLocalTickets(combinedList);
      callback(combinedList);
    };

    // Initial emit with local data immediately
    const initialLocal = getLocalTickets();
    if (initialLocal.length > 0) {
      callback(initialLocal);
    }

    const unsub1 = onSnapshot(ticketsCollection, (snapshot) => {
      mainList = snapshot.docs.map(doc => {
        const data = doc.data();
        const ticketId = data.id || doc.id;
        return {
          firestoreDocId: doc.id,
          id: ticketId,
          sourceCollection: 'tickets',
          ...data,
          id: ticketId,
          productName: normalizeProductName({ id: ticketId, ...data }),
          clientName: data.clientName || data.raisedBy?.name || data.customer_name || data.hospitalName || data.school || 'Client',
          clientEmail: data.clientEmail || data.raisedBy?.email || data.customer_email || ''
        };
      }).filter(t => t.status !== 'deleted');
      mergeAndEmit();
    }, (err) => console.warn('tickets listener fallback:', err));

    const unsub2 = onSnapshot(supportTicketsCollection, (snapshot) => {
      supportList = snapshot.docs.map(doc => {
        const data = doc.data();
        const ticketId = data.id || doc.id;
        return {
          firestoreDocId: doc.id,
          id: ticketId,
          sourceCollection: 'support_tickets',
          ...data,
          id: ticketId,
          productName: normalizeProductName({ id: ticketId, ...data }),
          clientName: data.clientName || data.hospitalName || data.school || data.raisedBy?.name || data.name || 'Client',
          clientEmail: data.clientEmail || data.raisedBy?.email || data.email || '',
          subject: data.subject || 'Support Ticket',
          description: data.description || data.issue || '',
          priority: data.priority || 'medium',
          status: data.status || 'open',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
          messages: data.messages || []
        };
      });
      mergeAndEmit();
    }, (err) => console.warn('support_tickets listener fallback:', err));

    return () => {
      unsub1();
      unsub2();
    };
  },

  addTicket: async (ticketData) => {
    const newTicket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: ticketData.raisedBy?.name || ticketData.name || ticketData.clientName || 'Anonymous Client',
      clientEmail: ticketData.raisedBy?.email || ticketData.email || ticketData.clientEmail || '',
      subject: ticketData.subject || 'Support Ticket',
      description: ticketData.description || '',
      productName: normalizeProductName(ticketData),
      productId: ticketData.productId || '',
      status: 'open',
      priority: ticketData.priority || 'medium',
      sourceCollection: 'tickets',
      createdAt: new Date().toISOString(),
      messages: [
        {
          sender: 'Client',
          author: ticketData.raisedBy?.name || ticketData.name || ticketData.clientName || 'Client',
          text: ticketData.description || ticketData.subject || 'Ticket submitted.',
          timestamp: 'Just now'
        }
      ]
    };

    const current = getLocalTickets();
    saveLocalTickets([newTicket, ...current]);

    try {
      const docRef = await addDoc(ticketsCollection, {
        ...newTicket,
        createdAt: serverTimestamp()
      });
      newTicket.firestoreDocId = docRef.id;
    } catch (err) {
      console.warn('Firestore addTicket to tickets failed, saved locally:', err);
    }

    try {
      await addDoc(supportTicketsCollection, {
        ...newTicket,
        createdAt: serverTimestamp()
      });
    } catch (err2) {}

    // Automatically trigger notification for admin dashboard bell
    try {
      await notificationsService.addNotification({
        title: `New Ticket (${newTicket.productName})`,
        text: `${newTicket.clientName} raised: ${newTicket.subject}`,
        time: 'Just now',
        icon: 'AlertTriangle',
        unread: true,
        path: '/admin/dashboard/tickets'
      });
    } catch (notifErr) {
      console.warn('Failed triggering notification on ticket creation:', notifErr);
    }

    return newTicket;
  },

  addTicketReply: async (ticketId, replyObj) => {
    const tickets = getLocalTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    let targetCollection = 'tickets';
    let targetDocId = ticketId;

    if (idx !== -1) {
      if (!tickets[idx].messages) tickets[idx].messages = [];
      tickets[idx].messages.push(replyObj);
      if (tickets[idx].sourceCollection) {
        targetCollection = tickets[idx].sourceCollection;
      }
      if (tickets[idx].firestoreDocId) {
        targetDocId = tickets[idx].firestoreDocId;
      }
      saveLocalTickets(tickets);
    }

    try {
      const colName = targetCollection === 'support_tickets' ? 'support_tickets' : 'tickets';
      const ticketRef = doc(db, colName, targetDocId);
      await updateDoc(ticketRef, {
        messages: tickets[idx]?.messages || [],
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore update ticket message fallback:', err);
    }
    return tickets[idx];
  },
  
  updateTicket: async (id, fieldsToUpdate) => {
    const tickets = getLocalTickets();
    const idx = tickets.findIndex(t => t.id === id);
    let targetCollection = 'tickets';
    let targetDocId = id;

    if (idx !== -1) {
      Object.assign(tickets[idx], fieldsToUpdate);
      if (tickets[idx].sourceCollection) {
        targetCollection = tickets[idx].sourceCollection;
      }
      if (tickets[idx].firestoreDocId) {
        targetDocId = tickets[idx].firestoreDocId;
      }
      saveLocalTickets(tickets);
    }
    try {
      const colName = targetCollection === 'support_tickets' ? 'support_tickets' : 'tickets';
      const ticketRef = doc(db, colName, targetDocId);
      await updateDoc(ticketRef, {
        ...fieldsToUpdate,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore update ticket fallback:', err);
    }
  },

  updateTicketStatus: async (id, status) => {
    return ticketsService.updateTicket(id, { status });
  },

  updateTicketPriority: async (id, priority) => {
    return ticketsService.updateTicket(id, { priority });
  },

  updateTicketAgent: async (id, assignedAgent) => {
    return ticketsService.updateTicket(id, { assignedAgent });
  },

  deleteTicket: async (id) => {
    let success = false;
    const tickets = getLocalTickets();
    const target = tickets.find(t => t.id === id);
    const colName = target?.sourceCollection === 'support_tickets' ? 'support_tickets' : 'tickets';
    const targetDocId = target?.firestoreDocId || id;
    
    // If it's a locally generated dummy ticket that was never saved to Firestore and has no docId
    if (id.startsWith('TK-') && !target?.firestoreDocId) {
      success = true;
    } else {
      try {
        const ticketRef = doc(db, colName, targetDocId);
        await deleteDoc(ticketRef);
        success = true;
      } catch (err) {
        console.warn('Firestore hard delete failed, trying soft delete:', err);
        try {
          const ticketRef = doc(db, colName, targetDocId);
          await updateDoc(ticketRef, { status: 'deleted', updatedAt: serverTimestamp() });
          success = true;
        } catch (softErr) {
          console.error('Firestore soft delete also failed:', softErr);
          throw softErr;
        }
      }
    }

    if (success) {
      const filtered = tickets.filter(t => t.id !== id);
      saveLocalTickets(filtered);
    }
  }
};

