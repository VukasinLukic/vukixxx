import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { loadBundledPrompts, parsePromptFile, createPromptFromInput, serializePrompt } from '@/lib/promptParser';
import type { Prompt, CreatePromptInput } from '@/types';

interface PromptFile {
  filename: string;
  content: string;
}

/**
 * Shared hook for loading prompts with bundled prompts fallback
 * Used by both main app and widget to ensure consistent behavior
 *
 * Attempts to load prompts from disk first, falls back to bundled prompts if:
 * - No prompts found on disk
 * - Error reading from disk
 */
export function usePromptLoader() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        // Attempt to load from disk
        console.log('🔍 [usePromptLoader] Attempting to read prompts from disk...');
        const files = await invoke<PromptFile[]>('read_prompts_dir');
        console.log(`📂 [usePromptLoader] Found ${files.length} .md files on disk:`, files.map(f => f.filename));

        if (files.length === 0) {
          // No prompts on disk - use bundled prompts as fallback
          console.log('⚠️ [usePromptLoader] No prompts found on disk, loading bundled prompts...');
          const bundled = loadBundledPrompts();
          console.log(`✅ [usePromptLoader] Loaded ${bundled.length} bundled prompts`);
          setPrompts(bundled);
        } else {
          // Parse prompts from disk
          console.log('📝 [usePromptLoader] Parsing prompts from disk...');
          const filtered = files.filter(f => !f.filename.startsWith('_'));
          console.log(`🔧 [usePromptLoader] After filtering: ${filtered.length} files (skipped ${files.length - filtered.length} internal files)`);

          const parsed = filtered.map((f, index) => {
            try {
              const prompt = parsePromptFile(f.content, f.filename);
              console.log(`  ✓ [${index + 1}/${filtered.length}] Parsed: ${prompt.id} - ${prompt.label}`);
              return prompt;
            } catch (parseErr) {
              console.error(`  ✗ [${index + 1}/${filtered.length}] Failed to parse ${f.filename}:`, parseErr);
              throw parseErr;
            }
          });

          console.log(`✅ [usePromptLoader] Successfully loaded ${parsed.length} prompts from disk`);
          setPrompts(parsed);
        }
      } catch (err) {
        // On error, fall back to bundled prompts
        console.error('❌ [usePromptLoader] Failed to load prompts from disk:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prompts');

        try {
          console.log('🔄 [usePromptLoader] Falling back to bundled prompts...');
          const bundled = loadBundledPrompts();
          console.log(`✅ [usePromptLoader] Fallback successful: ${bundled.length} bundled prompts loaded`);
          setPrompts(bundled);
        } catch (bundledErr) {
          console.error('💥 [usePromptLoader] Failed to load bundled prompts:', bundledErr);
          setError('Failed to load any prompts');
          setPrompts([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const addPrompt = useCallback(async (input: CreatePromptInput): Promise<Prompt> => {
    const prompt = createPromptFromInput(input);
    try {
      const filename = `${prompt.id}.md`;
      const content = serializePrompt(prompt);
      await invoke('write_prompt_file', { filename, content });
      console.log(`✅ [usePromptLoader] Saved new prompt: ${prompt.id} - ${prompt.label}`);
      setPrompts(prev => [...prev, prompt]);
    } catch (err) {
      console.error('❌ [usePromptLoader] Failed to save prompt:', err);
      throw err;
    }
    return prompt;
  }, []);

  return { prompts, isLoading, error, addPrompt };
}
