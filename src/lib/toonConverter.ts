import type { Prompt, TOONStats, BatchTOONStats } from '@/types';

/**
 * Estimate token count (rough approximation)
 * GPT-like tokenization: ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Strip markdown formatting for compact representation
 */
function stripMarkdown(content: string): string {
  if (!content) return '';

  return content
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^#{1,6}\s+(.+)$/gm, '$1:')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Escape special characters for TOON format
 */
function escapeValue(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

/**
 * Convert single prompt to TOON format
 */
export function promptToTOON(prompt: Prompt, index = 0): string {
  const cleanContent = stripMarkdown(prompt.bodyContent || prompt.content);
  const title = escapeValue(prompt.label || prompt.id);
  const category = escapeValue(prompt.category || 'other');
  const content = escapeValue(cleanContent);

  return `prompts[${index}]{title,category,content}:"${title}","${category}","${content}"`;
}

/**
 * Convert multiple prompts to TOON batch format
 */
export function promptsToBatchTOON(prompts: Prompt[]): string {
  if (!prompts || prompts.length === 0) return '';
  return prompts.map((p, i) => promptToTOON(p, i)).join('\n');
}

/**
 * Get statistics comparing original vs TOON format
 */
export function getTOONStats(prompt: Prompt): TOONStats {
  const toon = promptToTOON(prompt);
  const original = prompt.content || '';

  const originalTokens = estimateTokens(original);
  const toonTokens = estimateTokens(toon);
  const savings = originalTokens > 0
    ? ((1 - toonTokens / originalTokens) * 100).toFixed(1)
    : '0';

  return {
    originalLength: original.length,
    toonLength: toon.length,
    originalTokens,
    toonTokens,
    tokensSaved: originalTokens - toonTokens,
    savingsPercent: savings,
  };
}

/**
 * Get batch statistics for multiple prompts
 * BUG FIX: Previous version called estimateTokens on a stringified number
 */
export function getBatchTOONStats(prompts: Prompt[]): BatchTOONStats {
  if (!prompts || prompts.length === 0) {
    return { promptCount: 0, totalOriginalTokens: 0, totalToonTokens: 0, savingsPercent: '0' };
  }

  const toon = promptsToBatchTOON(prompts);

  // FIX: Sum tokens per-prompt instead of converting total length to string
  const totalOriginalTokens = prompts.reduce(
    (sum, p) => sum + estimateTokens(p.content || ''), 0
  );
  const totalToonTokens = estimateTokens(toon);

  return {
    promptCount: prompts.length,
    totalOriginalTokens,
    totalToonTokens,
    savingsPercent: totalOriginalTokens > 0
      ? ((1 - totalToonTokens / totalOriginalTokens) * 100).toFixed(1)
      : '0',
  };
}
