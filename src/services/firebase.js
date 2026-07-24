import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAzEP2LTXsGvCsFyxITkgoon_2AL4yGKyo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zuna-landing-page-22564.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zuna-landing-page-22564",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zuna-landing-page-22564.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "806137313772",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:806137313772:web:57cf450537cb9c4fff68c9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-97FPVP7NNS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
