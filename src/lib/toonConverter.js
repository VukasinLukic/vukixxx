/**
 * TOON Format Converter
 * Converts prompts to compact TOON notation for efficient LLM consumption
 *
 * Format: prompts[index]{fields}:"value1","value2",...
 * Example: prompts[0]{title,category,content}:"My Title","core","Prompt text..."
 *
 * Benefits:
 * - ~60% token reduction compared to markdown
 * - Structured format AI models can parse
 * - Batch support for memory packs
 */

/**
 * Estimate token count (rough approximation)
 * GPT-like tokenization: ~4 characters per token on average
 */
export function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * Strip markdown formatting for compact representation
 */
function stripMarkdown(content) {
    if (!content) return '';

    return content
        // Remove YAML frontmatter
        .replace(/^---[\s\S]*?---\n?/, '')
        // Remove headers (keep text)
        .replace(/^#{1,6}\s+(.+)$/gm, '$1:')
        // Remove bold/italic markers
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // Remove code blocks (keep content)
        .replace(/```[\w]*\n([\s\S]*?)```/g, '$1')
        // Remove inline code markers
        .replace(/`([^`]+)`/g, '$1')
        // Remove links, keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove images
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        // Convert list items to comma-separated
        .replace(/^[\s]*[-*+]\s+/gm, '')
        // Convert numbered lists
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // Compress multiple newlines
        .replace(/\n{2,}/g, ' ')
        // Compress whitespace
        .replace(/[ \t]+/g, ' ')
        // Trim
        .trim();
}

/**
 * Escape special characters for TOON format
 */
function escapeValue(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
}

/**
 * Convert single prompt to TOON format
 * @param {Object} prompt - Prompt object with id, label, category, content
 * @param {number} index - Index in the array (default 0)
 * @returns {string} TOON formatted string
 */
export function promptToTOON(prompt, index = 0) {
    const cleanContent = stripMarkdown(prompt.content);
    const title = escapeValue(prompt.label || prompt.id);
    const category = escapeValue(prompt.category || 'other');
    const content = escapeValue(cleanContent);

    return `prompts[${index}]{title,category,content}:"${title}","${category}","${content}"`;
}

/**
 * Convert multiple prompts to TOON batch format
 * @param {Array} prompts - Array of prompt objects
 * @returns {string} Multi-line TOON formatted string
 */
export function promptsToBatchTOON(prompts) {
    if (!prompts || prompts.length === 0) return '';

    const entries = prompts.map((p, i) => promptToTOON(p, i));
    return entries.join('\n');
}

/**
 * Get statistics comparing original vs TOON format
 * @param {Object} prompt - Prompt object
 * @returns {Object} Stats object with lengths and savings
 */
export function getTOONStats(prompt) {
    const toon = promptToTOON(prompt);
    const original = prompt.content || '';

    const originalTokens = estimateTokens(original);
    const toonTokens = estimateTokens(toon);
    const savings = originalTokens > 0
        ? ((1 - toonTokens / originalTokens) * 100).toFixed(1)
        : 0;

    return {
        originalLength: original.length,
        toonLength: toon.length,
        originalTokens,
        toonTokens,
        tokensSaved: originalTokens - toonTokens,
        savingsPercent: savings
    };
}

/**
 * Get batch statistics for multiple prompts
 * @param {Array} prompts - Array of prompt objects
 * @returns {Object} Aggregate stats
 */
export function getBatchTOONStats(prompts) {
    if (!prompts || prompts.length === 0) {
        return { totalOriginalTokens: 0, totalToonTokens: 0, savingsPercent: 0 };
    }

    const toon = promptsToBatchTOON(prompts);
    const originalTotal = prompts.reduce((sum, p) => sum + (p.content?.length || 0), 0);

    const originalTokens = estimateTokens(originalTotal.toString());
    const toonTokens = estimateTokens(toon);

    return {
        promptCount: prompts.length,
        totalOriginalTokens: prompts.reduce((sum, p) => sum + estimateTokens(p.content || ''), 0),
        totalToonTokens: toonTokens,
        savingsPercent: originalTokens > 0
            ? ((1 - toonTokens / originalTokens) * 100).toFixed(1)
            : 0
    };
}
