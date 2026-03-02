import { create } from 'zustand';
import type { LLMProviderId, LLMProviderConfig } from '@/types';
import { createProvider, type LLMProvider } from '@/services/ai/LLMProvider';

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
  setActiveProvider: (id: LLMProviderId) => void;
  updateProviderConfig: (id: LLMProviderId, updates: Partial<LLMProviderConfig>) => void;
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

  setActiveProvider: (id) => set({ activeProviderId: id }),

  updateProviderConfig: (id, updates) => set(state => ({
    providers: {
      ...state.providers,
      [id]: { ...state.providers[id], ...updates },
    },
  })),

  checkProviderStatus: async (id) => {
    set(state => ({
      providerStatus: { ...state.providerStatus, [id]: 'checking' as const },
    }));

    try {
      const config = get().providers[id];
      const provider = await createProvider(config);
      const available = await provider.isAvailable();

      set(state => ({
        providerStatus: {
          ...state.providerStatus,
          [id]: available ? 'available' as const : 'unavailable' as const,
        },
      }));
    } catch {
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
