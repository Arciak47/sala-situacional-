import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBGHLn6pQ7HxOoa83r_unMgmoMWUdP_3K8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sala-de-monitoreo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sala-de-monitoreo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sala-de-monitoreo.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "693329094285",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:693329094285:web:3109334a8e3f5ee4d624c4"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let db;
try {
  // Use offline persistence to drastically reduce reads on Next.js hot reloads
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  // If Firestore is already initialized (e.g., during Fast Refresh)
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, db, storage };
