import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const notificationsCollection = collection(db, 'notifications');
const STORAGE_KEY = 'zuna_notifications';

const listeners = new Set();

const notifyListeners = (updatedList) => {
  listeners.forEach(cb => {
    try {
      cb(updatedList);
    } catch (e) {
      console.error('Error in notification listener callback:', e);
    }
  });
};

const getLocalNotifications = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean out legacy dummy notifications if present
      const cleaned = parsed.filter(n => ![1, 2, 3].includes(n.id) && n.title !== 'New Client Onboarded' && n.title !== 'Urgent Support Ticket' && n.title !== 'System Backup Success');
      return cleaned;
    }
  } catch (e) {
    console.error('Failed reading local notifications', e);
  }
  return [];
};

const saveLocalNotifications = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed saving local notifications', e);
  }
};

export const notificationsService = {
  getNotifications: async () => {
    try {
      const q = query(notificationsCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return getLocalNotifications();
      }
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const cleaned = list.filter(n => ![1, 2, 3].includes(n.id) && n.title !== 'New Client Onboarded' && n.title !== 'Urgent Support Ticket' && n.title !== 'System Backup Success');
      saveLocalNotifications(cleaned);
      return cleaned;
    } catch (err) {
      console.warn('Firestore fetch failed for notifications, using local fallback:', err);
      return getLocalNotifications();
    }
  },

  addNotification: async (notifData) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: notifData.title || 'New Notification',
      text: notifData.text || '',
      time: notifData.time || 'Just now',
      icon: notifData.icon || 'Bell',
      unread: true,
      path: notifData.path || '/admin/dashboard/tickets',
      createdAt: new Date().toISOString()
    };

    const current = getLocalNotifications();
    const updated = [newNotif, ...current];
    saveLocalNotifications(updated);
    notifyListeners(updated);

    try {
      const docRef = await addDoc(notificationsCollection, {
        ...newNotif,
        createdAt: serverTimestamp()
      });
      newNotif.id = docRef.id;
    } catch (err) {
      console.warn('Firestore addNotification failed, saved locally:', err);
    }
    return newNotif;
  },

  markAsRead: async (id) => {
    const notifications = getLocalNotifications();
    const updated = notifications.map(n => String(n.id) === String(id) ? { ...n, unread: false } : n);
    saveLocalNotifications(updated);
    notifyListeners(updated);

    try {
      const notifRef = doc(db, 'notifications', String(id));
      await updateDoc(notifRef, { unread: false });
    } catch (err) {
      console.warn('Firestore update failed for markAsRead fallback:', err);
    }
    return updated;
  },

  markAllAsRead: async () => {
    const notifications = getLocalNotifications();
    const updated = notifications.map(n => ({ ...n, unread: false }));
    saveLocalNotifications(updated);
    notifyListeners(updated);

    try {
      const unreadItems = notifications.filter(n => n.unread);
      await Promise.all(
        unreadItems.map(n => {
          const notifRef = doc(db, 'notifications', String(n.id));
          return updateDoc(notifRef, { unread: false });
        })
      );
    } catch (err) {
      console.warn('Firestore update failed for markAllAsRead fallback:', err);
    }
    return updated;
  },

  subscribeNotifications: (callback) => {
    listeners.add(callback);
    let unsubscribeFirestore = null;

    try {
      const q = query(notificationsCollection, orderBy('createdAt', 'desc'));
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          const cleaned = list.filter(n => ![1, 2, 3].includes(n.id) && n.title !== 'New Client Onboarded' && n.title !== 'Urgent Support Ticket' && n.title !== 'System Backup Success');
          saveLocalNotifications(cleaned);
          callback(cleaned);
        }
      }, (err) => {
        console.warn('Firestore subscription failed for notifications:', err);
      });
    } catch (e) {
      console.warn('Failed setting up notifications listener:', e);
    }

    return () => {
      listeners.delete(callback);
      if (typeof unsubscribeFirestore === 'function') {
        unsubscribeFirestore();
      }
    };
  }
};

