import matter from 'gray-matter';
import type { Prompt, PromptCategory, CreatePromptInput } from '@/types';

const VALID_CATEGORIES: PromptCategory[] = ['core', 'design', 'backend', 'marketing', 'other'];

function normalizeCategory(value: string | undefined): PromptCategory {
  if (value && VALID_CATEGORIES.includes(value as PromptCategory)) {
    return value as PromptCategory;
  }
  return 'other';
}

function generateIdFromPath(filePath?: string): string {
  if (!filePath) return `prompt-${Date.now()}`;
  const filename = filePath.split('/').pop()?.replace('.md', '') ?? '';
  return filename || `prompt-${Date.now()}`;
}

export function parsePromptFile(rawContent: string, filePath?: string): Prompt {
  const { data, content } = matter(rawContent);

  const id = data.id || generateIdFromPath(filePath);
  const now = new Date().toISOString();

  return {
    id,
    label: data.label || data.title || id,
    category: normalizeCategory(data.category),
    parent: data.parent || undefined,
    type: data.type || (data.parent ? 'prompt' : 'root'),
    tags: Array.isArray(data.tags) ? data.tags : [],
    content: rawContent,
    bodyContent: content.trim(),
    createdAt: data.created || now,
    updatedAt: data.updated || now,
  };
}

export function serializePrompt(prompt: Prompt): string {
  const frontmatter: Record<string, unknown> = {
    id: prompt.id,
    label: prompt.label,
    category: prompt.category,
  };

  if (prompt.parent) {
    frontmatter.parent = prompt.parent;
  }
  if (prompt.type !== 'prompt') {
    frontmatter.type = prompt.type;
  }
  if (prompt.tags.length > 0) {
    frontmatter.tags = prompt.tags;
  }

  frontmatter.created = prompt.createdAt;
  frontmatter.updated = new Date().toISOString();

  return matter.stringify(prompt.bodyContent, frontmatter);
}

export function createPromptFromInput(input: CreatePromptInput): Prompt {
  const now = new Date().toISOString();

  const prompt: Prompt = {
    id: input.id,
    label: input.label,
    category: input.category,
    parent: input.parent,
    type: input.parent ? 'prompt' : 'root',
    tags: input.tags || [],
    content: '', // will be set below
    bodyContent: input.bodyContent,
    createdAt: now,
    updatedAt: now,
  };

  // Generate the full markdown content
  prompt.content = serializePrompt(prompt);

  return prompt;
}

export function loadBundledPrompts(): Prompt[] {
  const modules = import.meta.glob('../prompts/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const prompts: Prompt[] = [];

  for (const path in modules) {
    const rawContent = modules[path];

    if (!rawContent) {
      console.warn('⚠️ No content found for:', path);
      continue;
    }

    try {
      const prompt = parsePromptFile(rawContent, path);
      prompts.push(prompt);
      console.log('✅ Loaded prompt:', prompt.id, prompt.label);
    } catch (error) {
      console.error('❌ Error parsing prompt:', path, error);
    }
  }

  console.log(`📦 Total bundled prompts loaded: ${prompts.length}`);
  return prompts;
}
