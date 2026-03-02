import Dexie, { type Table } from 'dexie';
import type { Prompt, MemoryPack, SystemRole, AppSettings } from '@/types';
import type { StorageAdapter } from './StorageAdapter';

class VukixxxDB extends Dexie {
  prompts!: Table<Prompt, string>;
  packs!: Table<MemoryPack, string>;
  roles!: Table<SystemRole, string>;
  settings!: Table<AppSettings & { key: string }, string>;

  constructor() {
    super('VukixxxDB');
    this.version(1).stores({
      prompts: 'id, category, createdAt, updatedAt',
      packs: 'id, createdAt',
      roles: 'id',
      settings: 'key',
    });
  }
}

const db = new VukixxxDB();

export class IndexedDBAdapter implements StorageAdapter {
  // --- Prompts ---

  async loadAllPrompts(): Promise<Prompt[]> {
    return db.prompts.toArray();
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    await db.prompts.put(prompt);
  }

  async deletePrompt(id: string): Promise<void> {
    await db.prompts.delete(id);
  }

  // --- Memory Packs ---

  async loadAllPacks(): Promise<MemoryPack[]> {
    return db.packs.toArray();
  }

  async savePack(pack: MemoryPack): Promise<void> {
    await db.packs.put(pack);
  }

  async deletePack(id: string): Promise<void> {
    await db.packs.delete(id);
  }

  // --- System Roles ---

  async loadAllRoles(): Promise<SystemRole[]> {
    return db.roles.toArray();
  }

  async saveRole(role: SystemRole): Promise<void> {
    await db.roles.put(role);
  }

  async deleteRole(id: string): Promise<void> {
    await db.roles.delete(id);
  }

  // --- Settings ---

  async loadSettings(): Promise<AppSettings | null> {
    const entry = await db.settings.get('app');
    if (!entry) return null;
    const { key: _key, ...settings } = entry;
    return settings;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({ ...settings, key: 'app' });
  }
}
