import { create } from 'zustand';
import type { Toast, ToastType, TabId, ConfirmDialogConfig } from '@/types';

let toastIdCounter = 0;

interface UIState {
  activeTab: TabId;
  toasts: Toast[];
  confirmDialog: (ConfirmDialogConfig & { isOpen: boolean }) | null;

  // Tab
  setActiveTab: (tab: TabId) => void;

  // Toast
  addToast: (message: string, type?: ToastType, duration?: number) => number;
  removeToast: (id: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;

  // Confirm Dialog
  showConfirm: (config: ConfirmDialogConfig) => void;
  hideConfirm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  toasts: [],
  confirmDialog: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  addToast: (message, type = 'success', duration = 3000) => {
    const id = ++toastIdCounter;
    set(state => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    return id;
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },

  success: (message) => {
    const id = ++toastIdCounter;
    set(state => ({
      toasts: [...state.toasts, { id, message, type: 'success', duration: 3000 }],
    }));
  },

  error: (message) => {
    const id = ++toastIdCounter;
    set(state => ({
      toasts: [...state.toasts, { id, message, type: 'error', duration: 5000 }],
    }));
  },

  info: (message) => {
    const id = ++toastIdCounter;
    set(state => ({
      toasts: [...state.toasts, { id, message, type: 'info', duration: 3000 }],
    }));
  },

  showConfirm: (config) => {
    set({ confirmDialog: { ...config, isOpen: true } });
  },

  hideConfirm: () => {
    set({ confirmDialog: null });
  },
}));
