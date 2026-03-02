import type { LLMProviderConfig } from '@/types';
import type { LLMProvider, ChatMessage, LLMResponse } from './LLMProvider';

const DEFAULT_BASE_URL = 'http://localhost:11434';

/**
 * Ollama provider - local LLM inference.
 * Requires Ollama running locally.
 */
export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';
  private baseUrl: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.model = config.model || 'llama3.2';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.3,
        num_predict: options?.maxTokens ?? 1024,
      },
    };

    if (options?.jsonMode) {
      body.format = 'json';
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();

    return {
      content: data.message?.content || '',
      model: data.model || this.model,
      tokensUsed: data.eval_count,
    };
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map((m: { name: string }) => m.name);
    } catch {
      return [];
    }
  }
}
