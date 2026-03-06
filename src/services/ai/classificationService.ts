import { useAIStore } from '@/stores/aiStore';
import { createProvider } from './LLMProvider';
import type { PromptCategory, LLMProviderId } from '@/types';
import type { LLMProvider } from './LLMProvider';

export interface ClassificationResult {
  category: PromptCategory;
  tags: string[];
  confidence: number;
}

/**
 * Get the best available provider — tries active first, then falls back to others
 */
async function getAvailableProvider(): Promise<LLMProvider> {
  const store = useAIStore.getState();
  let { activeProviderId, providers } = store;

  // Check if any provider has an API key — if not, force reload from disk
  const hasAnyKey = Object.values(providers).some(p => !!p.apiKey);
  if (!hasAnyKey) {
    console.log('⚠️ [Classification] No API keys in store — forcing reload from disk...');
    await store.loadProvidersFromDisk();
    // Re-read after load
    const refreshed = useAIStore.getState();
    activeProviderId = refreshed.activeProviderId;
    providers = refreshed.providers;
  }

  console.log(`🔍 [Classification] Active provider: ${activeProviderId}`);
  console.log(`🔍 [Classification] All providers:`, Object.entries(providers).map(([id, cfg]) => ({
    id,
    hasApiKey: !!cfg.apiKey,
    apiKeyPrefix: cfg.apiKey ? cfg.apiKey.slice(0, 6) + '...' : 'none',
    model: cfg.model,
    enabled: cfg.enabled,
  })));

  // Try active provider first
  try {
    const activeProvider = await createProvider(providers[activeProviderId]);
    const isUp = await activeProvider.isAvailable();
    if (isUp) {
      console.log(`✅ [Classification] Using active provider: ${activeProviderId}`);
      return activeProvider;
    }
    console.warn(`⚠️ [Classification] Active provider ${activeProviderId} is not available`);
  } catch (e) {
    console.warn(`⚠️ [Classification] Active provider ${activeProviderId} failed:`, e);
  }

  // Fallback: try other providers that have an API key or config
  const fallbackOrder: LLMProviderId[] = ['gemini', 'claude', 'ollama'];
  for (const id of fallbackOrder) {
    if (id === activeProviderId) continue; // already tried
    const config = providers[id];
    if (!config) {
      console.log(`⏭️ [Classification] Skipping ${id}: no config`);
      continue;
    }
    // Skip providers without API keys (except ollama which uses baseUrl)
    if (id !== 'ollama' && !config.apiKey) {
      console.log(`⏭️ [Classification] Skipping ${id}: no API key`);
      continue;
    }

    try {
      console.log(`🔄 [Classification] Trying fallback provider: ${id}`);
      const provider = await createProvider(config);
      const isUp = await provider.isAvailable();
      if (isUp) {
        console.log(`✅ [Classification] Falling back to provider: ${id}`);
        return provider;
      }
      console.warn(`⚠️ [Classification] Fallback provider ${id} not available`);
    } catch (e) {
      console.warn(`⚠️ [Classification] Fallback provider ${id} failed:`, e);
    }
  }

  throw new Error('No AI provider available. Please check Settings and ensure at least one provider is connected.');
}

/**
 * Classification prompt template for AI
 */
const CLASSIFICATION_SYSTEM = `You are a JSON-only classifier. You MUST respond with ONLY a raw JSON object. No text before or after. No markdown. No explanation. Just the JSON object.`;

const CLASSIFICATION_PROMPT = `Classify this prompt. Categories: core, design, backend, marketing, other.
Respond with ONLY this JSON (nothing else):
{"category":"backend","tags":["api","rest"],"confidence":0.85}

Prompt to classify:
`;

/**
 * Classify a prompt using the best available AI provider
 * Returns suggested category, tags, and confidence score
 */
export async function classifyPrompt(content: string): Promise<ClassificationResult> {
  const provider = await getAvailableProvider();

  // Build classification request
  // Only send first 500 chars — AI just needs enough to classify
  const truncated = content.length > 500 ? content.slice(0, 500) + '...' : content;
  const fullPrompt = CLASSIFICATION_PROMPT + '\n\n' + truncated;

  try {
    const response = await provider.chat(
      [
        { role: 'system', content: CLASSIFICATION_SYSTEM },
        { role: 'user', content: fullPrompt },
      ],
      {
        temperature: 0.1,
        maxTokens: 500,
        jsonMode: true,
      }
    );

    // Parse JSON response — try direct parse, then extract, then repair truncated JSON
    let result: any;
    const raw = response.content.trim();
    try {
      result = JSON.parse(raw);
    } catch {
      console.warn('⚠️ [Classification] Direct JSON parse failed, extracting from text...');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          // Try to repair truncated JSON by closing brackets
          const repaired = jsonMatch[0].replace(/,?\s*$/, '') + ']}';
          try { result = JSON.parse(repaired); } catch { }
          if (!result) {
            const repaired2 = jsonMatch[0].replace(/,?\s*$/, '') + '}';
            try { result = JSON.parse(repaired2); } catch { }
          }
        }
      }
      if (!result) {
        console.error('Raw AI response:', raw);
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate category
    const validCategories: PromptCategory[] = ['core', 'design', 'backend', 'marketing', 'other'];
    if (!validCategories.includes(result.category)) {
      result.category = 'other';
    }

    // Validate tags (ensure array of strings)
    if (!Array.isArray(result.tags)) {
      result.tags = [];
    }
    result.tags = result.tags
      .filter((tag: any) => typeof tag === 'string')
      .map((tag: string) => tag.toLowerCase().trim())
      .slice(0, 5);

    // Validate confidence
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5;
    }

    return {
      category: result.category,
      tags: result.tags,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('Classification failed:', error);
    throw new Error('Failed to classify prompt. Please check your AI provider settings.');
  }
}

/**
 * Get a human-readable confidence description
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.75) return 'High';
  if (confidence >= 0.5) return 'Medium';
  if (confidence >= 0.25) return 'Low';
  return 'Very Low';
}

/**
 * Get confidence color for UI
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.75) return '#34c759'; // Green
  if (confidence >= 0.5) return '#ff9500';  // Orange
  return '#ff3b30'; // Red
}

/**
 * Generate a short, descriptive title for a prompt using AI
 */
export async function generatePromptTitle(content: string): Promise<string> {
  const provider = await getAvailableProvider();

  const titlePrompt = `Generate a short, descriptive title (max 6 words) for this prompt. 
Respond ONLY with the title text, nothing else. No quotes, no explanation.

Prompt content:
${content.slice(0, 500)}`;

  try {
    const response = await provider.chat(
      [{ role: 'user', content: titlePrompt }],
      { temperature: 0.3, maxTokens: 50 }
    );

    // Clean up the response
    const title = response.content
      .trim()
      .replace(/^["']|["']$/g, '') // Remove wrapping quotes
      .replace(/\n/g, ' ')
      .slice(0, 60);

    return title || 'Untitled Prompt';
  } catch (error) {
    console.error('Title generation failed:', error);
    // Fallback: extract first meaningful line
    const firstLine = content.trim().split('\n')[0].slice(0, 50).trim();
    return firstLine || 'Untitled Prompt';
  }
}

