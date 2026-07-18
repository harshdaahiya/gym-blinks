/**
 * @file firebase.ts
 * @description Single entry point for initializing the Firebase Web SDK.
 * Configures Firebase Authentication and Firestore Database with offline persistence.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Initialize Cloud Firestore Database
const firestoreDb = getFirestore(firebaseApp);

// Enable offline persistence in the browser environment
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(firestoreDb).catch((persistenceError) => {
    if (persistenceError.code === "failed-precondition") {
      console.warn("Firestore persistence failed-precondition: Multiple tabs open.");
    } else if (persistenceError.code === "unimplemented") {
      console.warn("Firestore persistence unimplemented: Browser does not support persistence.");
    } else {
      console.error("Firestore persistence error:", persistenceError);
    }
  });
}

export { firebaseApp, firebaseAuth, firestoreDb };
