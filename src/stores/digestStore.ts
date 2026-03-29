import { create } from 'zustand';
import type { ClaudeLogEntry } from '@/types';
import { createStorageAdapter } from '@/services/storage/createAdapter';
import { digitalTwinSyncService } from '@/services/firebase/digitalTwinSyncService';

const storage = createStorageAdapter();

function generateId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface DigestState {
  entries: Map<string, ClaudeLogEntry>;
  isLoading: boolean;

  loadEntries: () => Promise<void>;
  addEntry: (input: Pick<ClaudeLogEntry, 'projectId' | 'summary' | 'outcome'>) => Promise<ClaudeLogEntry>;
  deleteEntry: (id: string) => Promise<void>;

  getEntriesArray: () => ClaudeLogEntry[];
  getEntriesByProject: (projectId: string) => ClaudeLogEntry[];
}

export const useDigestStore = create<DigestState>((set, get) => ({
  entries: new Map(),
  isLoading: false,

  loadEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await storage.loadAllLogEntries();
      const map = new Map<string, ClaudeLogEntry>();
      for (const e of entries) map.set(e.id, e);
      set({ entries: map, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addEntry: async (input) => {
    const entry: ClaudeLogEntry = {
      id: generateId(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    await storage.saveLogEntry(entry);
    digitalTwinSyncService.saveLogEntry(entry);
    set(state => {
      const newMap = new Map(state.entries);
      newMap.set(entry.id, entry);
      return { entries: newMap };
    });
    return entry;
  },

  deleteEntry: async (id) => {
    await storage.deleteLogEntry(id);
    set(state => {
      const newMap = new Map(state.entries);
      newMap.delete(id);
      return { entries: newMap };
    });
  },

  getEntriesArray: () =>
    Array.from(get().entries.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getEntriesByProject: (projectId) =>
    Array.from(get().entries.values())
      .filter(e => e.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
}));
