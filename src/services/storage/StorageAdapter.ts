import type { Prompt, MemoryPack, SystemRole, AppSettings, UserProfile, Project, ClaudeLogEntry, NightlyTask } from '@/types';

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

  // UserProfile
  loadProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;

  // Projects
  loadAllProjects(): Promise<Project[]>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // Claude Log
  loadAllLogEntries(): Promise<ClaudeLogEntry[]>;
  saveLogEntry(entry: ClaudeLogEntry): Promise<void>;
  deleteLogEntry(id: string): Promise<void>;

  // Nightly Tasks
  loadAllNightlyTasks(): Promise<NightlyTask[]>;
  saveNightlyTask(task: NightlyTask): Promise<void>;
  deleteNightlyTask(id: string): Promise<void>;
}
