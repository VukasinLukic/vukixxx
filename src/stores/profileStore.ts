import { create } from 'zustand';
import type { UserProfile, Project } from '@/types';
import { DEFAULT_USER_PROFILE } from '@/types';
import { createStorageAdapter } from '@/services/storage/createAdapter';

const storage = createStorageAdapter();

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ProfileState {
  profile: UserProfile;
  projects: Map<string, Project>;
  isLoading: boolean;

  // Profile actions
  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;

  // Project actions
  loadProjects: () => Promise<void>;
  createProject: (input: Pick<Project, 'name' | 'goal' | 'status' | 'nextStep' | 'priority' | 'tags'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;

  // Selectors
  getProjectsArray: () => Project[];
  getActiveProjects: () => Project[];
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: { ...DEFAULT_USER_PROFILE },
  projects: new Map(),
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await storage.loadProfile();
      if (profile) {
        set({ profile, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  saveProfile: async (profile) => {
    const updated = { ...profile, updatedAt: new Date().toISOString() };
    await storage.saveProfile(updated);
    set({ profile: updated });
  },

  loadProjects: async () => {
    try {
      const projects = await storage.loadAllProjects();
      const map = new Map<string, Project>();
      for (const p of projects) {
        map.set(p.id, p);
      }
      set({ projects: map });
    } catch {
      // ignore
    }
  },

  createProject: async (input) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveProject(project);
    set(state => {
      const newMap = new Map(state.projects);
      newMap.set(project.id, project);
      return { projects: newMap };
    });
    return project;
  },

  updateProject: async (id, updates) => {
    const existing = get().projects.get(id);
    if (!existing) throw new Error(`Project "${id}" not found`);
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await storage.saveProject(updated);
    set(state => {
      const newMap = new Map(state.projects);
      newMap.set(id, updated);
      return { projects: newMap };
    });
    return updated;
  },

  deleteProject: async (id) => {
    await storage.deleteProject(id);
    set(state => {
      const newMap = new Map(state.projects);
      newMap.delete(id);
      return { projects: newMap };
    });
  },

  getProjectsArray: () => Array.from(get().projects.values()),

  getActiveProjects: () =>
    Array.from(get().projects.values())
      .filter(p => p.status === 'active')
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)),
}));
