import type { Prompt, MemoryPack, SystemRole, AppSettings } from '@/types';

export interface StorageAdapter {
  // Prompts
  loadAllPrompts(): Promise<Prompt[]>;
  savePrompt(prompt: Prompt): Promise<void>;
  deletePrompt(id: string): Promise<void>;

  // Memory Packs (Phase 2)
  loadAllPacks(): Promise<MemoryPack[]>;
  savePack(pack: MemoryPack): Promise<void>;
  deletePack(id: string): Promise<void>;

  // System Roles (Phase 2)
  loadAllRoles(): Promise<SystemRole[]>;
  saveRole(role: SystemRole): Promise<void>;
  deleteRole(id: string): Promise<void>;

  // Settings
  loadSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<void>;
}
