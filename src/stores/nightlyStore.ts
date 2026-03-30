import { create } from 'zustand';
import type { Task, ProjectPriority } from '@/types';
import { createStorageAdapter } from '@/services/storage/createAdapter';
import { digitalTwinSyncService } from '@/services/firebase/digitalTwinSyncService';
import { collection, onSnapshot, query, orderBy, type Unsubscribe } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/firebaseConfig';

const storage = createStorageAdapter();

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface TaskQueueState {
  tasks: Map<string, Task>;
  isLoading: boolean;
  firestoreUnsubscribe: Unsubscribe | null;

  loadTasks: () => Promise<void>;
  addTask: (input: Pick<Task, 'projectId' | 'task' | 'priority'>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  subscribeToFirestoreTasks: () => void;
  unsubscribeFromFirestoreTasks: () => void;

  getTasksArray: () => Task[];
  getPendingTasks: () => Task[];
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const useNightlyStore = create<TaskQueueState>((set, get) => ({
  tasks: new Map(),
  isLoading: false,
  firestoreUnsubscribe: null,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await storage.loadAllTasks();
      const map = new Map<string, Task>();
      for (const t of tasks) map.set(t.id, t);
      set({ tasks: map, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTask: async (input) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      ...input,
      status: 'pending',
      result: null,
      createdAt: now,
      completedAt: null,
      createdBy: 'user',
    };
    await storage.saveTask(task);
    digitalTwinSyncService.saveTask(task);
    set(state => {
      const newMap = new Map(state.tasks);
      newMap.set(task.id, task);
      return { tasks: newMap };
    });
    return task;
  },

  deleteTask: async (id) => {
    await storage.deleteTask(id);
    set(state => {
      const newMap = new Map(state.tasks);
      newMap.delete(id);
      return { tasks: newMap };
    });
  },

  subscribeToFirestoreTasks: () => {
    if (get().firestoreUnsubscribe) return;
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data() as Task;
            await storage.saveTask(data);
            set(state => {
              const newMap = new Map(state.tasks);
              newMap.set(data.id, data);
              return { tasks: newMap };
            });
          }
          if (change.type === 'removed') {
            const id = change.doc.id;
            await storage.deleteTask(id);
            set(state => {
              const newMap = new Map(state.tasks);
              newMap.delete(id);
              return { tasks: newMap };
            });
          }
        });
      }, (err) => {
        console.warn('[TaskQueue] Firestore listener error:', err);
      });
      set({ firestoreUnsubscribe: unsub });
    } catch (err) {
      console.warn('[TaskQueue] Firestore subscription failed:', err);
    }
  },

  unsubscribeFromFirestoreTasks: () => {
    const unsub = get().firestoreUnsubscribe;
    if (unsub) {
      unsub();
      set({ firestoreUnsubscribe: null });
    }
  },

  getTasksArray: () =>
    Array.from(get().tasks.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getPendingTasks: () =>
    Array.from(get().tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)),
}));
