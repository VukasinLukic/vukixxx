import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

function fixPrivateKey(key: string): string {
  if (!key.includes('\n') || key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  return key;
}

function initFirebase() {
  let serviceAccountJson: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (filePath) {
      serviceAccountJson = readFileSync(filePath, 'utf-8');
    }
  }

  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH must be set.\n' +
      'Kopiraj vrednost iz C:\\Users\\INSOMNIA\\vukixx-extension\\server\\.env'
    );
  }

  const parsed = JSON.parse(serviceAccountJson);
  if (parsed.private_key) {
    parsed.private_key = fixPrivateKey(parsed.private_key);
  }

  const app = initializeApp({ credential: cert(parsed as ServiceAccount) });
  return getFirestore(app);
}

export const db = initFirebase();
