import { doc, setDoc, collection } from 'firebase/firestore';
import { getFirestoreDb } from './firebaseConfig';
import type { UserProfile, Project, ClaudeLogEntry, NightlyTask, Task } from '@/types';

function db() {
  try {
    return getFirestoreDb();
  } catch {
    return null;
  }
}

export const digitalTwinSyncService = {
  async saveProfile(profile: UserProfile): Promise<void> {
    const firestore = db();
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'digitalTwin', 'profile'), profile);
    } catch (err) {
      console.warn('[DigitalTwinSync] Failed to sync profile:', err);
    }
  },

  async saveProject(project: Project): Promise<void> {
    const firestore = db();
    if (!firestore) return;
    try {
      await setDoc(doc(collection(firestore, 'projects'), project.id), project);
    } catch (err) {
      console.warn('[DigitalTwinSync] Failed to sync project:', err);
    }
  },

  async saveLogEntry(entry: ClaudeLogEntry): Promise<void> {
    const firestore = db();
    if (!firestore) return;
    try {
      await setDoc(doc(collection(firestore, 'claudeLogs'), entry.id), entry);
    } catch (err) {
      console.warn('[DigitalTwinSync] Failed to sync log entry:', err);
    }
  },

  async saveNightlyResult(task: NightlyTask): Promise<void> {
    const firestore = db();
    if (!firestore) return;
    try {
      await setDoc(doc(collection(firestore, 'nightlyResults'), task.id), task);
    } catch (err) {
      console.warn('[DigitalTwinSync] Failed to sync nightly result:', err);
    }
  },

  async saveTask(task: Task): Promise<void> {
    const firestore = db();
    if (!firestore) return;
    try {
      await setDoc(doc(collection(firestore, 'tasks'), task.id), task);
    } catch (err) {
      console.warn('[DigitalTwinSync] Failed to sync task:', err);
    }
  },
};
