import { create } from 'zustand';
import type { MemoryPack, Prompt } from '@/types';
import { createStorageAdapter } from '@/services/storage/createAdapter';
import { promptsToBatchTOON, estimateTokens } from '@/lib/toonConverter';
import type { PackExportFormat } from '@/lib/packImportExport';

const storage = createStorageAdapter();

function generateId(): string {
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface PackExportResult {
  content: string;
  format: MemoryPack['exportFormat'];
  tokenCount: number;
}

interface PackState {
  packs: Map<string, MemoryPack>;
  selectedPackId: string | null;
  isLoading: boolean;

  // Actions
  loadPacks: () => Promise<void>;
  createPack: (name: string, description?: string) => Promise<MemoryPack>;
  updatePack: (id: string, updates: Partial<Pick<MemoryPack, 'name' | 'description' | 'exportFormat' | 'systemRoleId'>>) => Promise<MemoryPack>;
  deletePack: (id: string) => Promise<void>;
  importPack: (packData: PackExportFormat) => Promise<{ pack: MemoryPack; prompts: Prompt[] }>;
  selectPack: (id: string | null) => void;

  // Prompt management within packs
  addPromptToPack: (packId: string, promptId: string) => Promise<void>;
  removePromptFromPack: (packId: string, promptId: string) => Promise<void>;
  reorderPrompts: (packId: string, promptIds: string[]) => Promise<void>;
  setSystemRole: (packId: string, roleId: string | undefined) => Promise<void>;
  setExportFormat: (packId: string, format: MemoryPack['exportFormat']) => Promise<void>;

  // Export
  exportPack: (packId: string, prompts: Map<string, Prompt>, roleContent?: string) => PackExportResult | null;
  getPackTokenStats: (packId: string, prompts: Map<string, Prompt>) => { originalTokens: number; toonTokens: number; markdownTokens: number; promptCount: number } | null;

  // Selectors
  getPacksArray: () => MemoryPack[];
  getPackById: (id: string) => MemoryPack | undefined;
}

export const usePackStore = create<PackState>((set, get) => ({
  packs: new Map(),
  selectedPackId: null,
  isLoading: false,

  loadPacks: async () => {
    set({ isLoading: true });
    try {
      const packs = await storage.loadAllPacks();
      const packMap = new Map<string, MemoryPack>();
      for (const p of packs) {
        packMap.set(p.id, p);
      }
      set({ packs: packMap, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createPack: async (name, description = '') => {
    const now = new Date().toISOString();
    const pack: MemoryPack = {
      id: generateId(),
      name,
      description,
      promptIds: [],
      exportFormat: 'toon',
      createdAt: now,
      updatedAt: now,
    };
    await storage.savePack(pack);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(pack.id, pack);
      return { packs: newMap };
    });
    return pack;
  },

  updatePack: async (id, updates) => {
    const existing = get().packs.get(id);
    if (!existing) throw new Error(`Pack "${id}" not found`);

    const updated: MemoryPack = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await storage.savePack(updated);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(id, updated);
      return { packs: newMap };
    });
    return updated;
  },

  deletePack: async (id) => {
    await storage.deletePack(id);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.delete(id);
      const selectedPackId = state.selectedPackId === id ? null : state.selectedPackId;
      return { packs: newMap, selectedPackId };
    });
  },

  importPack: async (packData) => {
    // Generate new IDs to avoid conflicts
    const now = new Date().toISOString();
    const newPackId = generateId();

    // Import prompts first
    const importedPrompts: Prompt[] = [];
    for (const prompt of packData.prompts) {
      await storage.savePrompt(prompt);
      importedPrompts.push(prompt);
    }

    // Create pack with original prompt IDs (they're already unique)
    const importedPack: MemoryPack = {
      ...packData.pack,
      id: newPackId, // Use new ID to avoid conflicts
      createdAt: now,
      updatedAt: now,
    };

    // Save pack to storage
    await storage.savePack(importedPack);

    // Save system role if present
    if (packData.systemRole) {
      await storage.saveSystemRole(packData.systemRole);
    }

    // Update state
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(importedPack.id, importedPack);
      return { packs: newMap };
    });

    return { pack: importedPack, prompts: importedPrompts };
  },

  selectPack: (id) => set({ selectedPackId: id }),

  addPromptToPack: async (packId, promptId) => {
    const pack = get().packs.get(packId);
    if (!pack) return;
    if (pack.promptIds.includes(promptId)) return;

    const updated: MemoryPack = {
      ...pack,
      promptIds: [...pack.promptIds, promptId],
      updatedAt: new Date().toISOString(),
    };
    await storage.savePack(updated);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(packId, updated);
      return { packs: newMap };
    });
  },

  removePromptFromPack: async (packId, promptId) => {
    const pack = get().packs.get(packId);
    if (!pack) return;

    const updated: MemoryPack = {
      ...pack,
      promptIds: pack.promptIds.filter(id => id !== promptId),
      updatedAt: new Date().toISOString(),
    };
    await storage.savePack(updated);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(packId, updated);
      return { packs: newMap };
    });
  },

  reorderPrompts: async (packId, promptIds) => {
    const pack = get().packs.get(packId);
    if (!pack) return;

    const updated: MemoryPack = {
      ...pack,
      promptIds,
      updatedAt: new Date().toISOString(),
    };
    await storage.savePack(updated);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(packId, updated);
      return { packs: newMap };
    });
  },

  setSystemRole: async (packId, roleId) => {
    const pack = get().packs.get(packId);
    if (!pack) return;

    const updated: MemoryPack = {
      ...pack,
      systemRoleId: roleId,
      updatedAt: new Date().toISOString(),
    };
    await storage.savePack(updated);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(packId, updated);
      return { packs: newMap };
    });
  },

  setExportFormat: async (packId, format) => {
    const pack = get().packs.get(packId);
    if (!pack) return;

    const updated: MemoryPack = {
      ...pack,
      exportFormat: format,
      updatedAt: new Date().toISOString(),
    };
    await storage.savePack(updated);
    set(state => {
      const newMap = new Map(state.packs);
      newMap.set(packId, updated);
      return { packs: newMap };
    });
  },

  exportPack: (packId, prompts, roleContent) => {
    const pack = get().packs.get(packId);
    if (!pack) return null;

    const packPrompts: Prompt[] = [];
    for (const pid of pack.promptIds) {
      const p = prompts.get(pid);
      if (p) packPrompts.push(p);
    }

    if (packPrompts.length === 0) return null;

    let content = '';

    if (roleContent) {
      content += `[SYSTEM ROLE]\n${roleContent}\n\n[CONTEXT]\n`;
    }

    if (pack.exportFormat === 'toon') {
      content += promptsToBatchTOON(packPrompts);
    } else if (pack.exportFormat === 'markdown') {
      content += packPrompts.map(p =>
        `## ${p.label}\n\n${p.bodyContent || p.content}`
      ).join('\n\n---\n\n');
    } else {
      // 'both' format
      content += `--- TOON FORMAT ---\n${promptsToBatchTOON(packPrompts)}\n\n--- MARKDOWN FORMAT ---\n`;
      content += packPrompts.map(p =>
        `## ${p.label}\n\n${p.bodyContent || p.content}`
      ).join('\n\n---\n\n');
    }

    return {
      content,
      format: pack.exportFormat,
      tokenCount: estimateTokens(content),
    };
  },

  getPackTokenStats: (packId, prompts) => {
    const pack = get().packs.get(packId);
    if (!pack) return null;

    const packPrompts: Prompt[] = [];
    for (const pid of pack.promptIds) {
      const p = prompts.get(pid);
      if (p) packPrompts.push(p);
    }

    if (packPrompts.length === 0) {
      return { originalTokens: 0, toonTokens: 0, markdownTokens: 0, promptCount: 0 };
    }

    const toonContent = promptsToBatchTOON(packPrompts);
    const markdownContent = packPrompts.map(p => p.bodyContent || p.content).join('\n\n');

    return {
      originalTokens: packPrompts.reduce((sum, p) => sum + estimateTokens(p.content || ''), 0),
      toonTokens: estimateTokens(toonContent),
      markdownTokens: estimateTokens(markdownContent),
      promptCount: packPrompts.length,
    };
  },

  getPacksArray: () => Array.from(get().packs.values()),
  getPackById: (id) => get().packs.get(id),
}));
