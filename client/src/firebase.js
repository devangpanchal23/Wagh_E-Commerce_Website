import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Values come from your Firebase console → Project settings → General → Your apps → SDK config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Enable Firestore offline persistence for instant local cache reads
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
export const storage = getStorage(app);

// Analytics only works in a real browser (not during Vite SSR/build), and
// isSupported() also guards against browsers that block it (e.g. ad blockers,
// Safari private mode) so this never throws and never blocks app startup.
export let analytics = null;
isSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

export {
  ref,
  uploadBytesResumable,
  getDownloadURL,
};

export default app;
