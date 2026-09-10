import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const productsCollection = collection(db, 'products');
const STORAGE_KEY = 'zuna_products';

const defaultProducts = [];

// Helper to update localStorage
const updateLocalStorage = (products) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
};

// Helper to get from localStorage
const getLocalStorageProducts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter out old legacy dummy items if present
      const cleaned = parsed.filter(p => !['prod-hrms', 'prod-restaurant', 'prod-college', 'prod-school', 'prod-billing', 'prod-crm'].includes(p.id));
      return cleaned;
    }
  } catch (e) {
    console.error('Failed to read from localStorage', e);
  }
  return defaultProducts;
};

export const productsService = {
  getProducts: async () => {
    try {
      const snapshot = await getDocs(productsCollection);
      if (snapshot.empty) {
        return getLocalStorageProducts();
      }
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        const productUrl = data.productUrl || data.url || '';
        return {
          id: doc.id,
          ...data,
          productUrl,
          url: productUrl
        };
      });
      updateLocalStorage(products);
      return products;
    } catch (err) {
      console.warn('Firestore products fetch failed, using localStorage fallback:', err);
      return getLocalStorageProducts();
    }
  },

  addProduct: async (productData) => {
    try {
      const docRef = await addDoc(productsCollection, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const newProduct = { id: docRef.id, ...productData };
      const current = getLocalStorageProducts();
      updateLocalStorage([...current, newProduct]);
      return newProduct;
    } catch (err) {
      console.warn('Firestore addProduct failed, saving locally:', err);
      const newProduct = { id: `local-${Date.now()}`, ...productData };
      const current = getLocalStorageProducts();
      updateLocalStorage([...current, newProduct]);
      return newProduct;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore updateProduct failed:', err);
    }
    const current = getLocalStorageProducts();
    const updated = current.map(p => p.id === id ? { ...p, ...productData } : p);
    updateLocalStorage(updated);
  },

  deleteProduct: async (id) => {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
    } catch (err) {
      console.warn('Firestore deleteProduct failed:', err);
    }
    const current = getLocalStorageProducts();
    const filtered = current.filter(p => p.id !== id);
    updateLocalStorage(filtered);
  }
};
