import { create } from 'zustand';
import type { LLMProviderId, LLMProviderConfig } from '@/types';
import { createProvider, type LLMProvider } from '@/services/ai/LLMProvider';
import { createStorageAdapter } from '@/services/storage/createAdapter';

const storage = createStorageAdapter();

const DEFAULT_PROVIDERS: Record<LLMProviderId, LLMProviderConfig> = {
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    enabled: true,
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: false,
    apiKey: '',
    model: 'gemini-2.0-flash',
  },
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    enabled: false,
    apiKey: '',
    model: 'claude-sonnet-4-5-20250929',
  },
};

interface AIState {
  activeProviderId: LLMProviderId;
  providers: Record<LLMProviderId, LLMProviderConfig>;
  providerStatus: Record<LLMProviderId, 'unknown' | 'available' | 'unavailable' | 'checking'>;
  isProcessing: boolean;

  // Actions
  loadProvidersFromDisk: () => Promise<void>;
  setActiveProvider: (id: LLMProviderId) => Promise<void>;
  updateProviderConfig: (id: LLMProviderId, updates: Partial<LLMProviderConfig>) => Promise<void>;
  checkProviderStatus: (id: LLMProviderId) => Promise<void>;
  checkAllProviders: () => Promise<void>;
  getActiveProvider: () => Promise<LLMProvider>;
  setProcessing: (value: boolean) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  activeProviderId: 'ollama',
  providers: { ...DEFAULT_PROVIDERS },
  providerStatus: {
    ollama: 'unknown',
    gemini: 'unknown',
    claude: 'unknown',
  },
  isProcessing: false,

  loadProvidersFromDisk: async () => {
    try {
      const settings = await storage.loadSettings();
      if (settings?.aiProviders) {
        set({
          providers: settings.aiProviders,
          activeProviderId: settings.aiProvider || 'ollama',
        });
      }
    } catch (error) {
      console.warn('Failed to load AI providers from disk:', error);
    }
  },

  setActiveProvider: async (id) => {
    set({ activeProviderId: id });

    // Persist to disk
    try {
      const currentSettings = await storage.loadSettings() || {};
      await storage.saveSettings({
        ...currentSettings,
        aiProvider: id,
      });
    } catch (error) {
      console.warn('Failed to save active provider:', error);
    }
  },

  updateProviderConfig: async (id, updates) => {
    set(state => ({
      providers: {
        ...state.providers,
        [id]: { ...state.providers[id], ...updates },
      },
    }));

    // Persist to disk
    try {
      const currentSettings = await storage.loadSettings() || {};
      await storage.saveSettings({
        ...currentSettings,
        aiProviders: get().providers,
      });
    } catch (error) {
      console.warn('Failed to save provider config:', error);
    }
  },

  checkProviderStatus: async (id) => {
    console.log(`🔄 [AIStore] Checking status for provider: ${id}`);
    set(state => ({
      providerStatus: { ...state.providerStatus, [id]: 'checking' as const },
    }));

    try {
      const config = get().providers[id];
      console.log(`🔧 [AIStore] Provider config:`, { id: config.id, enabled: config.enabled, hasApiKey: !!config.apiKey, model: config.model });
      const provider = await createProvider(config);
      const available = await provider.isAvailable();
      console.log(`📡 [AIStore] Provider ${id} available: ${available}`);

      set(state => ({
        providerStatus: {
          ...state.providerStatus,
          [id]: available ? 'available' as const : 'unavailable' as const,
        },
      }));
    } catch (err) {
      console.error(`❌ [AIStore] Provider ${id} check failed:`, err);
      set(state => ({
        providerStatus: { ...state.providerStatus, [id]: 'unavailable' as const },
      }));
    }
  },

  checkAllProviders: async () => {
    const { checkProviderStatus, providers } = get();
    const checks = Object.keys(providers).map(id =>
      checkProviderStatus(id as LLMProviderId)
    );
    await Promise.allSettled(checks);
  },

  getActiveProvider: async () => {
    const { activeProviderId, providers } = get();
    return createProvider(providers[activeProviderId]);
  },

  setProcessing: (value) => set({ isProcessing: value }),
}));
