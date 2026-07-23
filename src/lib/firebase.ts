/**
 * @file firebase.ts
 * @description Single entry point for initializing the Firebase Web SDK.
 * Configures Firebase Authentication and Firestore Database with offline persistence.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
const firebaseAuth = getAuth(firebaseApp);

// Initialize Cloud Firestore Database with persistent multi-tab cache
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(firebaseApp, {
    cache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  } as any);
} catch {
  // If Firestore has already been initialized (e.g. during Next.js Hot Reloads), retrieve the active instance
  firestoreDb = getFirestore(firebaseApp);
}

export { firebaseApp, firebaseAuth, firestoreDb };
