import type { Prompt, SuggestionResult } from '@/types';
import type { LLMProvider } from './LLMProvider';

const SUGGESTIONS_PROMPT = `You are a smart assistant for an AI Context Workbench app that manages reusable prompts.

Given a target prompt and a list of candidate prompts, identify the most relevant candidates that would pair well in a "Memory Pack" (a bundle of prompts sent as context to an AI).

Consider:
- Topical overlap (same domain/subject)
- Complementary roles (e.g., a system prompt + a task prompt)
- Shared tags or categories
- Logical grouping for a complete context

Return a JSON array of objects with: promptId, score (0-1), reason (brief explanation).
Maximum 5 suggestions, sorted by relevance. Only include prompts with score > 0.3.

Example output:
[{"promptId":"design-system","score":0.9,"reason":"Same design domain, complementary focus"},{"promptId":"frontend-arch","score":0.7,"reason":"Related frontend architecture context"}]`;

/**
 * Get smart suggestions for related prompts using an LLM.
 */
export async function getSuggestions(
  provider: LLMProvider,
  targetPrompt: Prompt,
  candidates: Prompt[],
): Promise<SuggestionResult[]> {
  if (candidates.length === 0) return [];

  // Limit candidates to avoid token overflow
  const limitedCandidates = candidates
    .filter(c => c.id !== targetPrompt.id)
    .slice(0, 20);

  if (limitedCandidates.length === 0) return [];

  const candidateList = limitedCandidates.map(c =>
    `- id: "${c.id}", label: "${c.label}", category: "${c.category}", tags: [${c.tags.join(',')}], preview: "${c.bodyContent.slice(0, 100).replace(/"/g, "'")}"`
  ).join('\n');

  const userMessage = `Target prompt:
- id: "${targetPrompt.id}"
- label: "${targetPrompt.label}"
- category: "${targetPrompt.category}"
- tags: [${targetPrompt.tags.join(',')}]
- content preview: "${targetPrompt.bodyContent.slice(0, 300).replace(/"/g, "'")}"

Candidate prompts:
${candidateList}`;

  try {
    const response = await provider.chat(
      [
        { role: 'system', content: SUGGESTIONS_PROMPT },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.2, maxTokens: 512, jsonMode: true }
    );

    const parsed = JSON.parse(response.content);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s: Record<string, unknown>) =>
        typeof s.promptId === 'string' &&
        typeof s.score === 'number' &&
        s.score > 0.3
      )
      .map((s: Record<string, unknown>) => ({
        promptId: s.promptId as string,
        label: limitedCandidates.find(c => c.id === s.promptId)?.label || s.promptId as string,
        score: s.score as number,
        reason: (s.reason as string) || '',
      }))
      .slice(0, 5);
  } catch (error) {
    console.warn('Suggestions failed:', error);
    return [];
  }
}

/**
 * Get suggestions using a simple heuristic (no LLM required).
 * Uses tag overlap and category matching as a fallback.
 */
export function getHeuristicSuggestions(
  targetPrompt: Prompt,
  candidates: Prompt[],
): SuggestionResult[] {
  const results: SuggestionResult[] = [];

  for (const candidate of candidates) {
    if (candidate.id === targetPrompt.id) continue;

    let score = 0;
    const reasons: string[] = [];

    // Category match
    if (candidate.category === targetPrompt.category) {
      score += 0.4;
      reasons.push('same category');
    }

    // Tag overlap
    const tagOverlap = candidate.tags.filter(t => targetPrompt.tags.includes(t));
    if (tagOverlap.length > 0) {
      score += Math.min(0.4, tagOverlap.length * 0.15);
      reasons.push(`${tagOverlap.length} shared tag${tagOverlap.length > 1 ? 's' : ''}`);
    }

    // Parent-child relationship
    if (candidate.parent === targetPrompt.id || targetPrompt.parent === candidate.id) {
      score += 0.3;
      reasons.push('parent-child relationship');
    }

    // Same parent
    if (candidate.parent && candidate.parent === targetPrompt.parent) {
      score += 0.2;
      reasons.push('sibling prompts');
    }

    if (score > 0.3) {
      results.push({
        promptId: candidate.id,
        label: candidate.label,
        score: Math.min(1, score),
        reason: reasons.join(', '),
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
