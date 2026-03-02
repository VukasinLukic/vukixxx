import { create } from 'zustand';
import Fuse from 'fuse.js';
import type { Prompt, PromptCategory, CreatePromptInput, UpdatePromptInput, PromptFilters, DateRange } from '@/types';
import { loadBundledPrompts, createPromptFromInput, serializePrompt } from '@/lib/promptParser';
import { createStorageAdapter } from '@/services/storage/createAdapter';

const storage = createStorageAdapter();

const DEFAULT_FILTERS: PromptFilters = {
  search: '',
  categories: [],
  tags: [],
  dateRange: 'all',
  sortBy: 'label',
  sortOrder: 'asc',
};

function getDateThreshold(range: DateRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  switch (range) {
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
}

interface PromptState {
  prompts: Map<string, Prompt>;
  isLoading: boolean;
  error: string | null;
  filters: PromptFilters;

  // Actions
  loadPrompts: () => Promise<void>;
  addPrompt: (input: CreatePromptInput) => Promise<Prompt>;
  updatePrompt: (id: string, updates: UpdatePromptInput) => Promise<Prompt>;
  deletePrompt: (id: string) => Promise<void>;

  // Filters
  setSearch: (query: string) => void;
  setCategories: (categories: PromptCategory[]) => void;
  toggleCategory: (category: PromptCategory) => void;
  setDateRange: (range: DateRange) => void;
  setSortBy: (sortBy: PromptFilters['sortBy']) => void;
  toggleSortOrder: () => void;
  resetFilters: () => void;

  // Selectors
  getPromptById: (id: string) => Prompt | undefined;
  getPromptsByCategory: (cat: PromptCategory) => Prompt[];
  getPromptsArray: () => Prompt[];
  getFilteredPrompts: () => Prompt[];
  getUniqueCategories: () => PromptCategory[];
  getAllTags: () => string[];
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: new Map(),
  isLoading: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },

  loadPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      let prompts = await storage.loadAllPrompts();

      if (prompts.length === 0) {
        prompts = loadBundledPrompts();
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

  // --- Filter actions ---

  setSearch: (query) => set(state => ({
    filters: { ...state.filters, search: query },
  })),

  setCategories: (categories) => set(state => ({
    filters: { ...state.filters, categories },
  })),

  toggleCategory: (category) => set(state => {
    const existing = state.filters.categories;
    const updated = existing.includes(category)
      ? existing.filter(c => c !== category)
      : [...existing, category];
    return { filters: { ...state.filters, categories: updated } };
  }),

  setDateRange: (range) => set(state => ({
    filters: { ...state.filters, dateRange: range },
  })),

  setSortBy: (sortBy) => set(state => ({
    filters: { ...state.filters, sortBy },
  })),

  toggleSortOrder: () => set(state => ({
    filters: {
      ...state.filters,
      sortOrder: state.filters.sortOrder === 'asc' ? 'desc' : 'asc',
    },
  })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // --- Selectors ---

  getPromptById: (id) => get().prompts.get(id),

  getPromptsByCategory: (cat) => {
    return Array.from(get().prompts.values()).filter(p => p.category === cat);
  },

  getPromptsArray: () => Array.from(get().prompts.values()),

  getFilteredPrompts: () => {
    const { prompts, filters } = get();
    let results = Array.from(prompts.values());

    // Fuzzy search with Fuse.js
    if (filters.search.trim()) {
      const fuse = new Fuse(results, {
        keys: [
          { name: 'label', weight: 2 },
          { name: 'bodyContent', weight: 1 },
          { name: 'category', weight: 0.5 },
          { name: 'tags', weight: 1 },
          { name: 'id', weight: 0.5 },
        ],
        threshold: 0.35,
        includeScore: true,
      });
      results = fuse.search(filters.search).map(r => r.item);
    }

    // Category filter
    if (filters.categories.length > 0) {
      results = results.filter(p => filters.categories.includes(p.category));
    }

    // Tag filter
    if (filters.tags.length > 0) {
      results = results.filter(p =>
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }

    // Date range filter
    const threshold = getDateThreshold(filters.dateRange);
    if (threshold) {
      results = results.filter(p => new Date(p.updatedAt) >= threshold);
    }

    // Sort (skip if fuzzy search active - Fuse already sorts by relevance)
    if (!filters.search.trim()) {
      results.sort((a, b) => {
        let cmp = 0;
        switch (filters.sortBy) {
          case 'label':
            cmp = a.label.localeCompare(b.label);
            break;
          case 'updatedAt':
            cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
          case 'createdAt':
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'category':
            cmp = a.category.localeCompare(b.category);
            break;
        }
        return filters.sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    return results;
  },

  getUniqueCategories: () => {
    const cats = new Set<PromptCategory>();
    for (const p of get().prompts.values()) {
      cats.add(p.category);
    }
    return Array.from(cats);
  },

  getAllTags: () => {
    const tags = new Set<string>();
    for (const p of get().prompts.values()) {
      for (const tag of p.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  },
}));
