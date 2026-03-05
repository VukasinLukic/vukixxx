import type { LLMProviderConfig } from '@/types';
import type { LLMProvider, ChatMessage, LLMResponse } from './LLMProvider';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Google Gemini provider - free tier available.
 * Requires API key from Google AI Studio.
 */
export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  private apiKey: string;
  private model: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gemini-2.0-flash';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('🔑 [GeminiProvider] No API key configured');
      return false;
    }
    try {
      const url = `${GEMINI_API_BASE}/models?key=${this.apiKey.slice(0, 4)}...`;
      console.log(`🔍 [GeminiProvider] Checking availability: ${url}`);
      const res = await fetch(
        `${GEMINI_API_BASE}/models?key=${this.apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      console.log(`📡 [GeminiProvider] Status: ${res.status} ${res.statusText}`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'unable to read body');
        console.error(`❌ [GeminiProvider] Availability check failed: ${res.status} — ${errorText}`);
      }
      return res.ok;
    } catch (err) {
      console.error('❌ [GeminiProvider] Availability check error:', err);
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse> {
    if (!this.apiKey) throw new Error('Gemini API key not configured');
    console.log(`💬 [GeminiProvider] Sending chat request with ${messages.length} messages, model: ${this.model}`);

    // Convert chat messages to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction.content }],
      };
    }

    if (options?.jsonMode) {
      (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
    }

    const url = `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = data.usageMetadata?.totalTokenCount;

    return {
      content,
      model: this.model,
      tokensUsed,
    };
  }

  async listModels(): Promise<string[]> {
    if (!this.apiKey) return [];
    try {
      const res = await fetch(`${GEMINI_API_BASE}/models?key=${this.apiKey}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || [])
        .filter((m: { name: string }) => m.name.includes('gemini'))
        .map((m: { name: string }) => m.name.replace('models/', ''));
    } catch {
      return [];
    }
  }
}
