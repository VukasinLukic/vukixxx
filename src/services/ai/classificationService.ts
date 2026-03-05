import { useAIStore } from '@/stores/aiStore';
import { createProvider } from './LLMProvider';
import type { PromptCategory } from '@/types';

export interface ClassificationResult {
  category: PromptCategory;
  tags: string[];
  confidence: number;
}

/**
 * Classification prompt template for AI
 */
const CLASSIFICATION_PROMPT = `Analyze the following prompt content and suggest:
1. **Category**: Choose ONE from: core, design, backend, marketing, other
2. **Tags**: Suggest 2-4 relevant tags (single words, lowercase)
3. **Confidence**: Your confidence score from 0.0 to 1.0

**Categories explained:**
- core: System prompts, master prompts, platform context
- design: UI/UX, components, hero sections, landing pages
- backend: APIs, databases, server logic, infrastructure
- marketing: SEO, content, landing pages, copywriting
- other: Anything else

**Respond ONLY with valid JSON in this exact format:**
{
  "category": "backend",
  "tags": ["api", "rest", "nodejs"],
  "confidence": 0.85
}

**Prompt content to analyze:**
`;

/**
 * Classify a prompt using the active AI provider
 * Returns suggested category, tags, and confidence score
 */
export async function classifyPrompt(content: string): Promise<ClassificationResult> {
  const store = useAIStore.getState();
  const provider = await store.getActiveProvider();

  // Build classification request
  const fullPrompt = CLASSIFICATION_PROMPT + '\n\n' + content;

  try {
    // Call AI with JSON mode enabled
    const response = await provider.chat(
      [{ role: 'user', content: fullPrompt }],
      {
        temperature: 0.3, // Low temperature for more consistent results
        maxTokens: 200,
        jsonMode: true,
      }
    );

    // Parse JSON response
    const result = JSON.parse(response.content);

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
      .slice(0, 5); // Max 5 tags

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
    // If JSON parsing fails, try to extract info from text
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
  const store = useAIStore.getState();
  const provider = await store.getActiveProvider();

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
