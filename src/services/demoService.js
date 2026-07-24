import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { notificationsService } from './notificationsService';

const demoCollection = collection(db, 'demo_requests');
const STORAGE_KEY = 'zuna_demo_requests';

const defaultDemos = [];

const getLocalDemos = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter out any legacy dummy/test items if present
      return parsed.filter(d => !['demo-1', 'demo-2', 'demo-3', 'test-demo'].includes(d.id));
    }
  } catch (e) {
    console.error('Failed reading local demo requests', e);
  }
  return defaultDemos;
};

const saveLocalDemos = (demos) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demos));
  } catch (e) {
    console.error('Failed saving local demo requests', e);
  }
};

export const demoService = {
  getDemoRequests: async () => {
    try {
      const q = query(demoCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return getLocalDemos();
      }
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      saveLocalDemos(list);
      return list;
    } catch (err) {
      console.warn('Firestore fetch failed for demo requests, using local fallback:', err);
      return getLocalDemos();
    }
  },

  addDemoRequest: async (demoData) => {
    const newDemo = {
      name: demoData.name || 'Anonymous',
      email: demoData.email || '',
      phone: demoData.phone || '',
      company: demoData.company || 'N/A',
      product: demoData.product || 'General Suite',
      status: 'New',
      createdAt: new Date().toISOString()
    };

    const current = getLocalDemos();
    saveLocalDemos([newDemo, ...current]);

    try {
      const docRef = await addDoc(demoCollection, {
        ...newDemo,
        createdAt: serverTimestamp()
      });
      newDemo.id = docRef.id;
    } catch (err) {
      console.warn('Firestore addDemoRequest failed, saved locally:', err);
    }

    // Automatically trigger notification for admin dashboard bell
    try {
      await notificationsService.addNotification({
        title: 'New Demo Request',
        text: `${newDemo.name} (${newDemo.company}) requested a demo for ${newDemo.product}`,
        time: 'Just now',
        icon: 'Calendar',
        unread: true,
        path: '/admin/dashboard/demo-requests'
      });
    } catch (notifErr) {
      console.warn('Failed triggering notification on demo request:', notifErr);
    }

    return newDemo;
  },

  updateDemoStatus: async (id, status) => {
    const current = getLocalDemos();
    const updated = current.map(d => d.id === id ? { ...d, status } : d);
    saveLocalDemos(updated);

    try {
      const docRef = doc(db, 'demo_requests', id);
      await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn('Firestore updateDemoStatus failed:', err);
    }
  },

  deleteDemoRequest: async (id) => {
    const current = getLocalDemos();
    const filtered = current.filter(d => d.id !== id);
    saveLocalDemos(filtered);

    try {
      const docRef = doc(db, 'demo_requests', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteDemoRequest failed:', err);
    }
  }
};
