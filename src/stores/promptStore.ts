import { create } from 'zustand';
import type { Prompt, PromptCategory, CreatePromptInput, UpdatePromptInput } from '@/types';
import { loadBundledPrompts, createPromptFromInput, serializePrompt } from '@/lib/promptParser';
import { createStorageAdapter } from '@/services/storage/createAdapter';

const storage = createStorageAdapter();

interface PromptState {
  prompts: Map<string, Prompt>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPrompts: () => Promise<void>;
  addPrompt: (input: CreatePromptInput) => Promise<Prompt>;
  updatePrompt: (id: string, updates: UpdatePromptInput) => Promise<Prompt>;
  deletePrompt: (id: string) => Promise<void>;

  // Selectors (computed in components via getters)
  getPromptById: (id: string) => Prompt | undefined;
  getPromptsByCategory: (cat: PromptCategory) => Prompt[];
  getPromptsArray: () => Prompt[];
  getUniqueCategories: () => PromptCategory[];
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: new Map(),
  isLoading: false,
  error: null,

  loadPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try loading from persistent storage first
      let prompts = await storage.loadAllPrompts();

      // If empty, seed from bundled .md files
      if (prompts.length === 0) {
        prompts = loadBundledPrompts();
        // Persist the bundled prompts
        for (const prompt of prompts) {
          await storage.savePrompt(prompt);
        }
      }

      const promptMap = new Map<string, Prompt>();
      for (const p of prompts) {
        promptMap.set(p.id, p);
      }

      set({ prompts: promptMap, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load prompts',
        isLoading: false,
      });
    }
  },

  addPrompt: async (input: CreatePromptInput) => {
    const prompt = createPromptFromInput(input);

    await storage.savePrompt(prompt);

    set(state => {
      const newMap = new Map(state.prompts);
      newMap.set(prompt.id, prompt);
      return { prompts: newMap };
    });

    return prompt;
  },

  updatePrompt: async (id: string, updates: UpdatePromptInput) => {
    const existing = get().prompts.get(id);
    if (!existing) throw new Error(`Prompt "${id}" not found`);

    const updated: Prompt = {
      ...existing,
      label: updates.label ?? existing.label,
      category: updates.category ?? existing.category,
      parent: updates.parent ?? existing.parent,
      bodyContent: updates.bodyContent ?? existing.bodyContent,
      tags: updates.tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    };
    // Re-serialize content
    updated.content = serializePrompt(updated);

    await storage.savePrompt(updated);

    set(state => {
      const newMap = new Map(state.prompts);
      newMap.set(id, updated);
      return { prompts: newMap };
    });

    return updated;
  },

  deletePrompt: async (id: string) => {
    await storage.deletePrompt(id);

    set(state => {
      const newMap = new Map(state.prompts);
      newMap.delete(id);
      return { prompts: newMap };
    });
  },

  getPromptById: (id: string) => get().prompts.get(id),

  getPromptsByCategory: (cat: PromptCategory) => {
    return Array.from(get().prompts.values()).filter(p => p.category === cat);
  },

  getPromptsArray: () => Array.from(get().prompts.values()),

  getUniqueCategories: () => {
    const cats = new Set<PromptCategory>();
    for (const p of get().prompts.values()) {
      cats.add(p.category);
    }
    return Array.from(cats);
  },
}));
