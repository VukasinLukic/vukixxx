import { create } from 'zustand';
import type { Prompt, PanelConfig, PromptWindowConfig, EditorPanelConfig } from '@/types';

const Z_INDEX_BASE = 100;
const Z_INDEX_MAX = 1000;

interface PanelState {
  panels: Record<string, PanelConfig>;
  promptWindows: PromptWindowConfig[];
  editorPanel: EditorPanelConfig | null;
  topZIndex: number;

  // Panel visibility
  showPanel: (id: string) => void;
  hidePanel: (id: string) => void;

  // Z-index management
  bringToFront: (panelId: string, isPromptWindow?: boolean) => void;

  // Prompt windows
  openPromptWindow: (prompt: Prompt) => void;
  closePromptWindow: (id: string) => void;
  updatePromptInWindows: (prompt: Prompt) => void;

  // Editor
  openEditor: (mode: 'create' | 'edit', prompt?: Prompt) => void;
  closeEditor: () => void;
}

export const usePanelStore = create<PanelState>((set, get) => ({
  panels: {
    welcome: {
      id: 'welcome',
      title: 'Dobrodosli - Vukixxx',
      visible: true,
      initialPosition: { x: 50, y: 50 },
      width: 400,
      height: 'auto',
      zIndex: Z_INDEX_BASE,
    },
    browser: {
      id: 'browser',
      title: 'Baza Promptova',
      visible: false,
      initialPosition: { x: 100, y: 100 },
      width: 850,
      height: 520,
      zIndex: Z_INDEX_BASE + 1,
    },
  },
  promptWindows: [],
  editorPanel: null,
  topZIndex: Z_INDEX_BASE + 2,

  showPanel: (id) => {
    set(state => ({
      panels: {
        ...state.panels,
        [id]: { ...state.panels[id], visible: true },
      },
    }));
  },

  hidePanel: (id) => {
    set(state => ({
      panels: {
        ...state.panels,
        [id]: { ...state.panels[id], visible: false },
      },
    }));
  },

  bringToFront: (panelId, isPromptWindow = false) => {
    set(state => {
      let newZ = state.topZIndex + 1;

      // Reset if approaching max to prevent unbounded growth
      if (newZ > Z_INDEX_MAX) {
        newZ = Z_INDEX_BASE + 10;
      }

      if (isPromptWindow) {
        return {
          topZIndex: newZ,
          promptWindows: state.promptWindows.map(w =>
            w.id === panelId ? { ...w, zIndex: newZ } : w
          ),
        };
      }

      if (panelId === 'editor' && state.editorPanel) {
        return {
          topZIndex: newZ,
          editorPanel: { ...state.editorPanel, zIndex: newZ },
        };
      }

      return {
        topZIndex: newZ,
        panels: {
          ...state.panels,
          [panelId]: { ...state.panels[panelId], zIndex: newZ },
        },
      };
    });
  },

  openPromptWindow: (prompt) => {
    const state = get();

    // Check if already open
    const existing = state.promptWindows.find(w => w.id === prompt.id);
    if (existing) {
      state.bringToFront(prompt.id, true);
      return;
    }

    set(s => {
      const newZ = s.topZIndex + 1;
      const offset = s.promptWindows.length;

      return {
        topZIndex: newZ,
        promptWindows: [
          ...s.promptWindows,
          {
            id: prompt.id,
            title: prompt.label,
            visible: true,
            initialPosition: {
              x: 180 + offset * 30,
              y: 120 + offset * 30,
            },
            width: 520,
            height: 450,
            zIndex: newZ,
            prompt,
          },
        ],
      };
    });
  },

  closePromptWindow: (id) => {
    set(state => ({
      promptWindows: state.promptWindows.filter(w => w.id !== id),
    }));
  },

  updatePromptInWindows: (prompt) => {
    set(state => ({
      promptWindows: state.promptWindows.map(w =>
        w.id === prompt.id
          ? { ...w, title: prompt.label, prompt }
          : w
      ),
    }));
  },

  openEditor: (mode, prompt) => {
    set(state => {
      const newZ = state.topZIndex + 1;
      return {
        topZIndex: newZ,
        editorPanel: {
          id: 'editor',
          title: mode === 'edit' && prompt ? `Edit: ${prompt.label}` : 'New Prompt',
          visible: true,
          initialPosition: { x: 200, y: 80 },
          width: 500,
          height: 580,
          zIndex: newZ,
          mode,
          data: prompt ?? null,
        },
      };
    });
  },

  closeEditor: () => {
    set({ editorPanel: null });
  },
}));
