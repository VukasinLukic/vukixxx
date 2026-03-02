import { create } from 'zustand';
import type { SystemRole } from '@/types';
import { createStorageAdapter } from '@/services/storage/createAdapter';

const storage = createStorageAdapter();

function generateId(): string {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface RoleState {
  roles: Map<string, SystemRole>;
  isLoading: boolean;

  // Actions
  loadRoles: () => Promise<void>;
  createRole: (name: string, description: string, content: string) => Promise<SystemRole>;
  updateRole: (id: string, updates: Partial<Pick<SystemRole, 'name' | 'description' | 'content'>>) => Promise<SystemRole>;
  deleteRole: (id: string) => Promise<void>;

  // Selectors
  getRolesArray: () => SystemRole[];
  getRoleById: (id: string) => SystemRole | undefined;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  roles: new Map(),
  isLoading: false,

  loadRoles: async () => {
    set({ isLoading: true });
    try {
      const roles = await storage.loadAllRoles();
      const roleMap = new Map<string, SystemRole>();
      for (const r of roles) {
        roleMap.set(r.id, r);
      }
      set({ roles: roleMap, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createRole: async (name, description, content) => {
    const now = new Date().toISOString();
    const role: SystemRole = {
      id: generateId(),
      name,
      description,
      content,
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveRole(role);
    set(state => {
      const newMap = new Map(state.roles);
      newMap.set(role.id, role);
      return { roles: newMap };
    });
    return role;
  },

  updateRole: async (id, updates) => {
    const existing = get().roles.get(id);
    if (!existing) throw new Error(`Role "${id}" not found`);

    const updated: SystemRole = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await storage.saveRole(updated);
    set(state => {
      const newMap = new Map(state.roles);
      newMap.set(id, updated);
      return { roles: newMap };
    });
    return updated;
  },

  deleteRole: async (id) => {
    await storage.deleteRole(id);
    set(state => {
      const newMap = new Map(state.roles);
      newMap.delete(id);
      return { roles: newMap };
    });
  },

  getRolesArray: () => Array.from(get().roles.values()),
  getRoleById: (id) => get().roles.get(id),
}));
