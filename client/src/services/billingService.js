import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const billingCollection = collection(db, 'billing');
const STORAGE_KEY = 'zuna_billing';

const defaultBilling = [];

const getLocalBilling = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed reading local billing', e);
  }
  return defaultBilling;
};

const saveLocalBilling = (billing) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(billing));
  } catch (e) {
    console.error('Failed saving local billing', e);
  }
};

export const billingService = {
  getBillingData: async () => {
    try {
      const snapshot = await getDocs(billingCollection);
      if (snapshot.empty) {
        return getLocalBilling();
      }
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      saveLocalBilling(records);
      return records;
    } catch (err) {
      console.warn('Firestore fetch failed for billing, using local fallback:', err);
      return getLocalBilling();
    }
  },

  addInvoice: async (invoiceData) => {
    const record = {
      ...invoiceData,
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(billingCollection, {
        ...record,
        createdAt: serverTimestamp()
      });
      const created = { id: docRef.id, ...record };
      const current = getLocalBilling();
      saveLocalBilling([created, ...current]);
      return created;
    } catch (err) {
      console.warn('Firestore addInvoice failed, saving locally:', err);
      const created = { id: `inv-${Date.now()}`, ...record };
      const current = getLocalBilling();
      saveLocalBilling([created, ...current]);
      return created;
    }
  },

  updateInvoice: async (id, invoiceData) => {
    try {
      const billRef = doc(db, 'billing', id);
      await updateDoc(billRef, {
        ...invoiceData,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore updateInvoice failed:', err);
    }
    const current = getLocalBilling();
    const updated = current.map(b => b.id === id ? { ...b, ...invoiceData } : b);
    saveLocalBilling(updated);
  }
};
