import type { LLMProviderConfig } from '@/types';
import type { LLMProvider, ChatMessage, LLMResponse } from './LLMProvider';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';

/**
 * Claude/Anthropic provider.
 * Requires API key from Anthropic console.
 */
export class ClaudeProvider implements LLMProvider {
  readonly id = 'claude';
  readonly name = 'Claude (Anthropic)';
  private apiKey: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'claude-sonnet-4-5-20250929';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Lightweight test: minimal messages API call
      const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      // 200 = success, 400 = validation error but key is valid
      // We accept both since we're just testing if the key is recognized
      return res.ok || res.status === 400;
    } catch {
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse> {
    if (!this.apiKey) throw new Error('Claude API key not configured');

    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options?.maxTokens ?? 1024,
      messages: chatMessages,
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Claude error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';

    return {
      content,
      model: data.model || this.model,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
    };
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-opus-4-6',
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
    ];
  }
}
