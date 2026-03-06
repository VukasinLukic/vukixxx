/**
 * Firebase service exports
 *
 * This module handles real-time sync of prompts from the Chrome Extension.
 * The extension saves prompts to Firebase Firestore, and the desktop app
 * listens for new prompts and automatically saves them locally.
 */

export { initializeFirebase, getFirebaseApp, getFirestoreDb } from './firebaseConfig';
export { promptSyncService } from './promptSyncService';
export type { FirebasePrompt } from './promptSyncService';
