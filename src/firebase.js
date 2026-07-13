import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBX5SvTRdZ4VZZCAxiVZlRtVSm7w3GqZnc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mh-agenda-campanha-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mh-agenda-campanha-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mh-agenda-campanha-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "330300907281",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:330300907281:web:839b1e80cc3d53c8e7f6b0",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
