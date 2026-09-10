import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const usersCollection = collection(db, 'users');
const STORAGE_KEY = 'zuna_users';

const defaultUsers = [
  { id: 'user-1', name: 'Mohamed Asfaque', email: 'carrezzaglobalsolutions@gmail.com', role: 'Support Engineer', status: 'Active' },
  { id: 'user-2', name: 'Sarah Jenkins', email: 'carrezzaglobalsolutions@gmail.com', role: 'Support Lead', status: 'Active' },
  { id: 'user-3', name: 'Alex Rivera', email: 'carrezzaglobalsolutions@gmail.com', role: 'Product Manager', status: 'Active' }
];

const getLocalUsers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed reading local users', e);
  }
  return defaultUsers;
};

const saveLocalUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed saving local users', e);
  }
};

export const usersService = {
  getUsers: async () => {
    try {
      const snapshot = await getDocs(usersCollection);
      if (snapshot.empty) {
        return getLocalUsers();
      }
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      saveLocalUsers(users);
      return users;
    } catch (err) {
      console.warn('Firestore fetch failed for users, using local fallback:', err);
      return getLocalUsers();
    }
  },

  addUser: async (userData) => {
    const newUserObj = {
      ...userData,
      status: userData.status || 'Active',
      role: userData.role || 'Member',
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(usersCollection, {
        ...newUserObj,
        createdAt: serverTimestamp()
      });
      const created = { id: docRef.id, ...newUserObj };
      const current = getLocalUsers();
      saveLocalUsers([created, ...current]);
      return created;
    } catch (err) {
      console.warn('Firestore addUser failed, saving locally:', err);
      const created = { id: `user-${Date.now()}`, ...newUserObj };
      const current = getLocalUsers();
      saveLocalUsers([created, ...current]);
      return created;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore updateUser failed:', err);
    }
    const current = getLocalUsers();
    const updated = current.map(u => u.id === id ? { ...u, ...userData } : u);
    saveLocalUsers(updated);
  },

  deleteUser: async (id) => {
    try {
      const userRef = doc(db, 'users', id);
      await deleteDoc(userRef);
    } catch (err) {
      console.warn('Firestore deleteUser failed:', err);
    }
    const current = getLocalUsers();
    const filtered = current.filter(u => u.id !== id);
    saveLocalUsers(filtered);
  }
};
