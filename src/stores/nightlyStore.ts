import { create } from 'zustand';
import type { NightlyTask, ProjectPriority } from '@/types';
import { createStorageAdapter } from '@/services/storage/createAdapter';
import { runNightlyTask } from '@/services/nightlyTaskService';
import { buildVukiContext } from '@/services/contextBuilder';
import { digitalTwinSyncService } from '@/services/firebase/digitalTwinSyncService';
import { useProfileStore } from './profileStore';
import { usePromptStore } from './promptStore';
import { useAIStore } from './aiStore';

const storage = createStorageAdapter();

function generateId(): string {
  return `ntask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface NightlyState {
  tasks: Map<string, NightlyTask>;
  isProcessing: boolean;
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  addTask: (input: Pick<NightlyTask, 'projectId' | 'task' | 'priority'>) => Promise<NightlyTask>;
  deleteTask: (id: string) => Promise<void>;
  runTask: (taskId: string) => Promise<void>;
  runAllPending: () => Promise<void>;

  getTasksArray: () => NightlyTask[];
  getPendingTasks: () => NightlyTask[];
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const useNightlyStore = create<NightlyState>((set, get) => ({
  tasks: new Map(),
  isProcessing: false,
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await storage.loadAllNightlyTasks();
      const map = new Map<string, NightlyTask>();
      for (const t of tasks) map.set(t.id, t);
      set({ tasks: map, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTask: async (input) => {
    const now = new Date().toISOString();
    const task: NightlyTask = {
      id: generateId(),
      ...input,
      status: 'pending',
      result: null,
      createdAt: now,
      completedAt: null,
    };
    await storage.saveNightlyTask(task);
    set(state => {
      const newMap = new Map(state.tasks);
      newMap.set(task.id, task);
      return { tasks: newMap };
    });
    return task;
  },

  deleteTask: async (id) => {
    await storage.deleteNightlyTask(id);
    set(state => {
      const newMap = new Map(state.tasks);
      newMap.delete(id);
      return { tasks: newMap };
    });
  },

  runTask: async (taskId) => {
    const task = get().tasks.get(taskId);
    if (!task) return;

    // Get Claude config
    const providers = useAIStore.getState().providers;
    const claudeConfig = providers.claude;
    if (!claudeConfig?.apiKey) {
      throw new Error('Claude API ključ nije konfigurisan');
    }

    // Update status to processing
    const processing: NightlyTask = { ...task, status: 'processing' };
    set(state => {
      const newMap = new Map(state.tasks);
      newMap.set(taskId, processing);
      return { tasks: newMap };
    });
    await storage.saveNightlyTask(processing);

    try {
      // Build context from live store snapshots
      const { profile, getActiveProjects } = useProfileStore.getState();
      const topPrompts = usePromptStore.getState().getPromptsArray()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10);

      const context = buildVukiContext({
        profile,
        activeProjects: getActiveProjects(),
        topPrompts,
      });

      const { result, tokensUsed } = await runNightlyTask(task, context, claudeConfig);

      const done: NightlyTask = {
        ...task,
        status: 'done',
        result,
        tokensUsed,
        completedAt: new Date().toISOString(),
      };
      await storage.saveNightlyTask(done);
      digitalTwinSyncService.saveNightlyResult(done);
      set(state => {
        const newMap = new Map(state.tasks);
        newMap.set(taskId, done);
        return { tasks: newMap };
      });
    } catch (err) {
      const errTask: NightlyTask = {
        ...task,
        status: 'error',
        result: err instanceof Error ? err.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      };
      await storage.saveNightlyTask(errTask);
      set(state => {
        const newMap = new Map(state.tasks);
        newMap.set(taskId, errTask);
        return { tasks: newMap };
      });
    }
  },

  runAllPending: async () => {
    if (get().isProcessing) return;
    set({ isProcessing: true });

    const pending = get().getPendingTasks();
    for (const task of pending) {
      try {
        await get().runTask(task.id);
      } catch {
        // continue with next task
      }
    }

    set({ isProcessing: false });
  },

  getTasksArray: () =>
    Array.from(get().tasks.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getPendingTasks: () =>
    Array.from(get().tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)),
}));
