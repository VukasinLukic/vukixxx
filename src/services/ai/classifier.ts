import type { PromptCategory, ClassificationResult } from '@/types';
import type { LLMProvider } from './LLMProvider';

const CLASSIFICATION_PROMPT = `You are a prompt classifier for an AI Context Workbench app.

Given a prompt's title and content, classify it into exactly ONE category and suggest relevant tags.

Categories:
- core: System prompts, meta-prompts, AI instructions, role definitions, agent configs
- coding: Programming, code review, debugging, algorithms, refactoring, testing
- frontend: React, CSS, HTML, UI components, web apps, mobile UI, responsive design
- backend: APIs, servers, databases, DevOps, infrastructure, authentication, deployment
- design: UI/UX design, wireframes, visual design, design systems, prototyping
- writing: Copywriting, content creation, editing, blog posts, documentation, emails
- marketing: SEO, ads, social media, growth, analytics, landing pages, conversion
- data: Data analysis, machine learning, data science, SQL, visualization, statistics
- business: Strategy, planning, management, product, finance, operations, consulting
- creative: Art, brainstorming, storytelling, creative writing, image prompts, ideas
- other: Does not fit any above category

Rules:
- Return a JSON object with: category (string), tags (string array, max 5), confidence (number 0-1)
- Tags should be lowercase, single-word or hyphenated
- Be concise with tags - only include highly relevant ones
- "coding" = general programming. "frontend" = UI/web specific. "backend" = server/API specific.

Example output:
{"category":"coding","tags":["code-review","debugging","best-practices"],"confidence":0.85}`;

/**
 * Auto-classify a prompt using an LLM provider.
 * Returns category, tags, and confidence score.
 */
export async function classifyPrompt(
  provider: LLMProvider,
  title: string,
  content: string,
): Promise<ClassificationResult> {
  const userMessage = `Title: ${title}\n\nContent:\n${content.slice(0, 2000)}`;

  try {
    const response = await provider.chat(
      [
        { role: 'system', content: CLASSIFICATION_PROMPT },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.1, maxTokens: 256, jsonMode: true }
    );

    const parsed = JSON.parse(response.content);

    // Validate category
    const validCategories: PromptCategory[] = [
      'core', 'coding', 'design', 'frontend', 'backend',
      'writing', 'marketing', 'data', 'business', 'creative', 'other',
    ];
    const category = validCategories.includes(parsed.category) ? parsed.category : 'other';

    // Validate tags
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5)
      : [];

    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.5;

    return { category, tags, confidence };
  } catch (error) {
    console.warn('Classification failed, using fallback:', error);
    return { category: 'other', tags: [], confidence: 0 };
  }
}

/**
 * Batch classify multiple prompts.
 * Processes sequentially to avoid rate limiting.
 */
export async function classifyPrompts(
  provider: LLMProvider,
  prompts: { title: string; content: string }[],
  onProgress?: (index: number, total: number) => void,
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    onProgress?.(i, prompts.length);
    const result = await classifyPrompt(provider, prompts[i].title, prompts[i].content);
    results.push(result);
  }

  onProgress?.(prompts.length, prompts.length);
  return results;
}
