import Dexie, { type Table } from 'dexie';
import type { Prompt, MemoryPack, SystemRole, AppSettings, UserProfile, Project, ClaudeLogEntry, NightlyTask } from '@/types';
import type { StorageAdapter } from './StorageAdapter';

class VukixxxDB extends Dexie {
  prompts!: Table<Prompt, string>;
  packs!: Table<MemoryPack, string>;
  roles!: Table<SystemRole, string>;
  settings!: Table<AppSettings & { key: string }, string>;
  profiles!: Table<UserProfile & { key: string }, string>;
  projects!: Table<Project, string>;
  logEntries!: Table<ClaudeLogEntry, string>;
  nightlyTasks!: Table<NightlyTask, string>;

  constructor() {
    super('VukixxxDB');
    this.version(1).stores({
      prompts: 'id, category, createdAt, updatedAt',
      packs: 'id, createdAt',
      roles: 'id',
      settings: 'key',
    });
    this.version(2).stores({
      prompts: 'id, category, createdAt, updatedAt',
      packs: 'id, createdAt',
      roles: 'id',
      settings: 'key',
      profiles: 'key',
      projects: 'id, status, priority, createdAt',
      logEntries: 'id, projectId, createdAt',
      nightlyTasks: 'id, projectId, status, createdAt',
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

  // --- UserProfile ---

  async loadProfile(): Promise<UserProfile | null> {
    const entry = await db.profiles.get('default');
    if (!entry) return null;
    const { key: _key, ...profile } = entry;
    return profile;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await db.profiles.put({ ...profile, key: 'default' });
  }

  // --- Projects ---

  async loadAllProjects(): Promise<Project[]> {
    return db.projects.toArray();
  }

  async saveProject(project: Project): Promise<void> {
    await db.projects.put(project);
  }

  async deleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
  }

  // --- Claude Log ---

  async loadAllLogEntries(): Promise<ClaudeLogEntry[]> {
    return db.logEntries.toArray();
  }

  async saveLogEntry(entry: ClaudeLogEntry): Promise<void> {
    await db.logEntries.put(entry);
  }

  async deleteLogEntry(id: string): Promise<void> {
    await db.logEntries.delete(id);
  }

  // --- Nightly Tasks ---

  async loadAllNightlyTasks(): Promise<NightlyTask[]> {
    return db.nightlyTasks.toArray();
  }

  async saveNightlyTask(task: NightlyTask): Promise<void> {
    await db.nightlyTasks.put(task);
  }

  async deleteNightlyTask(id: string): Promise<void> {
    await db.nightlyTasks.delete(id);
  }
}
