import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { parsePromptFile, serializePrompt } from '@/lib/promptParser';
import type { Prompt, MemoryPack, SystemRole, AppSettings, UserProfile, Project, ClaudeLogEntry, NightlyTask } from '@/types';
import type { StorageAdapter } from './StorageAdapter';

interface PromptFile {
  filename: string;
  content: string;
}

/**
 * Tauri-native storage adapter.
 * - Prompts: stored as .md files on disk (with frontmatter)
 * - Packs, Roles: stored as JSON in app data directory
 * - Settings: stored via Rust settings command
 */
export class TauriFileAdapter implements StorageAdapter {
  private packsCache: Map<string, MemoryPack> = new Map();
  private rolesCache: Map<string, SystemRole> = new Map();
  private initialized = false;

  private async init() {
    if (this.initialized) return;
    await invoke('ensure_prompts_dir');
    await this.loadJsonStore();
    this.initialized = true;
  }

  // --- JSON store for packs and roles (stored alongside prompts) ---

  private async getJsonStorePath(type: 'packs' | 'roles'): Promise<string> {
    return `_${type}.json`;
  }

  private async loadJsonStore() {
    try {
      const packsContent = await invoke<string>('read_prompt_file', { filename: '_packs.json' });
      const packs: MemoryPack[] = JSON.parse(packsContent);
      this.packsCache = new Map(packs.map(p => [p.id, p]));
    } catch {
      this.packsCache = new Map();
    }

    try {
      const rolesContent = await invoke<string>('read_prompt_file', { filename: '_roles.json' });
      const roles: SystemRole[] = JSON.parse(rolesContent);
      this.rolesCache = new Map(roles.map(r => [r.id, r]));
    } catch {
      this.rolesCache = new Map();
    }
  }

  private async saveJsonStore(type: 'packs' | 'roles') {
    const filename = await this.getJsonStorePath(type);
    const data = type === 'packs'
      ? Array.from(this.packsCache.values())
      : Array.from(this.rolesCache.values());
    await invoke('write_prompt_file', {
      filename,
      content: JSON.stringify(data, null, 2),
    });
  }

  // --- Prompts (file-based) ---

  async loadAllPrompts(): Promise<Prompt[]> {
    await this.init();
    const files = await invoke<PromptFile[]>('read_prompts_dir');
    return files
      .filter(f => !f.filename.startsWith('_') && !f.filename.startsWith('vuki-')) // skip internal JSON files
      .map(f => parsePromptFile(f.content, f.filename));
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    await this.init();
    const filename = `${prompt.id}.md`;
    const content = serializePrompt(prompt);
    await invoke('write_prompt_file', { filename, content });
  }

  async deletePrompt(id: string): Promise<void> {
    await this.init();
    const filename = `${id}.md`;
    await invoke('delete_prompt_file', { filename });
  }

  // --- Memory Packs (JSON-based) ---

  async loadAllPacks(): Promise<MemoryPack[]> {
    await this.init();
    return Array.from(this.packsCache.values());
  }

  async savePack(pack: MemoryPack): Promise<void> {
    await this.init();
    this.packsCache.set(pack.id, pack);
    await this.saveJsonStore('packs');
  }

  async deletePack(id: string): Promise<void> {
    await this.init();
    this.packsCache.delete(id);
    await this.saveJsonStore('packs');
  }

  // --- System Roles (JSON-based) ---

  async loadAllRoles(): Promise<SystemRole[]> {
    await this.init();
    return Array.from(this.rolesCache.values());
  }

  async saveRole(role: SystemRole): Promise<void> {
    await this.init();
    this.rolesCache.set(role.id, role);
    await this.saveJsonStore('roles');
  }

  async deleteRole(id: string): Promise<void> {
    await this.init();
    this.rolesCache.delete(id);
    await this.saveJsonStore('roles');
  }

  // --- Settings ---

  async loadSettings(): Promise<AppSettings | null> {
    try {
      return await invoke<AppSettings>('load_settings');
    } catch {
      return null;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await invoke('save_settings', { settings });
  }

  // --- UserProfile ---

  async loadProfile(): Promise<UserProfile | null> {
    try {
      const content = await invoke<string>('read_prompt_file', { filename: '_profile.json' });
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await invoke('write_prompt_file', {
      filename: '_profile.json',
      content: JSON.stringify(profile, null, 2),
    });
  }

  // --- Projects ---

  async loadAllProjects(): Promise<Project[]> {
    try {
      const content = await invoke<string>('read_prompt_file', { filename: '_projects.json' });
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async saveProject(project: Project): Promise<void> {
    const projects = await this.loadAllProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) projects[idx] = project;
    else projects.push(project);
    await invoke('write_prompt_file', {
      filename: '_projects.json',
      content: JSON.stringify(projects, null, 2),
    });
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.loadAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    await invoke('write_prompt_file', {
      filename: '_projects.json',
      content: JSON.stringify(filtered, null, 2),
    });
  }

  // --- Claude Log ---

  async loadAllLogEntries(): Promise<ClaudeLogEntry[]> {
    try {
      const content = await invoke<string>('read_prompt_file', { filename: '_claudelog.json' });
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async saveLogEntry(entry: ClaudeLogEntry): Promise<void> {
    const entries = await this.loadAllLogEntries();
    const idx = entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) entries[idx] = entry;
    else entries.push(entry);
    await invoke('write_prompt_file', {
      filename: '_claudelog.json',
      content: JSON.stringify(entries, null, 2),
    });
  }

  async deleteLogEntry(id: string): Promise<void> {
    const entries = await this.loadAllLogEntries();
    const filtered = entries.filter(e => e.id !== id);
    await invoke('write_prompt_file', {
      filename: '_claudelog.json',
      content: JSON.stringify(filtered, null, 2),
    });
  }

  // --- Nightly Tasks ---

  async loadAllNightlyTasks(): Promise<NightlyTask[]> {
    try {
      const content = await invoke<string>('read_prompt_file', { filename: '_nightly.json' });
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async saveNightlyTask(task: NightlyTask): Promise<void> {
    const tasks = await this.loadAllNightlyTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) tasks[idx] = task;
    else tasks.push(task);
    await invoke('write_prompt_file', {
      filename: '_nightly.json',
      content: JSON.stringify(tasks, null, 2),
    });
  }

  async deleteNightlyTask(id: string): Promise<void> {
    const tasks = await this.loadAllNightlyTasks();
    const filtered = tasks.filter(t => t.id !== id);
    await invoke('write_prompt_file', {
      filename: '_nightly.json',
      content: JSON.stringify(filtered, null, 2),
    });
  }

  // --- File Watcher ---

  async startWatcher(callback: (event: { type: string; path: string }) => void): Promise<UnlistenFn> {
    await invoke('start_watcher');
    return listen<{ type: string; path: string }>('fs-change', (event) => {
      callback(event.payload);
    });
  }

  async stopWatcher(): Promise<void> {
    await invoke('stop_watcher');
  }
}
