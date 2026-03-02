import type { LLMProviderConfig } from '@/types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

/**
 * Abstract LLM provider interface.
 * All providers implement this contract for interchangeability.
 */
export interface LLMProvider {
  readonly id: string;
  readonly name: string;

  /** Check if the provider is reachable and configured */
  isAvailable(): Promise<boolean>;

  /** Send a chat completion request */
  chat(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse>;

  /** Get available models from this provider */
  listModels(): Promise<string[]>;
}

/**
 * Create an LLM provider from config
 */
export async function createProvider(config: LLMProviderConfig): Promise<LLMProvider> {
  switch (config.id) {
    case 'ollama': {
      const { OllamaProvider } = await import('./OllamaProvider');
      return new OllamaProvider(config);
    }
    case 'gemini': {
      const { GeminiProvider } = await import('./GeminiProvider');
      return new GeminiProvider(config);
    }
    case 'claude': {
      const { ClaudeProvider } = await import('./ClaudeProvider');
      return new ClaudeProvider(config);
    }
    default:
      throw new Error(`Unknown provider: ${config.id}`);
  }
}
