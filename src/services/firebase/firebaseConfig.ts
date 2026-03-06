import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function initializeFirebase(): { app: FirebaseApp; db: Firestore } {
  if (!app) {
    console.log('🔥 [Firebase] Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ [Firebase] Firebase initialized successfully');
  }
  return { app, db: db! };
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase app not initialized. Call initializeFirebase() first.');
  }
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}
