import { ClaudeProvider } from '@/services/ai/ClaudeProvider';
import type { NightlyTask, LLMProviderConfig } from '@/types';

export async function runNightlyTask(
  task: NightlyTask,
  context: string,
  claudeConfig: LLMProviderConfig,
): Promise<{ result: string; tokensUsed: number }> {
  const provider = new ClaudeProvider(claudeConfig);

  const response = await provider.chat(
    [
      { role: 'system', content: context },
      { role: 'user', content: task.task },
    ],
    { temperature: 0.3, maxTokens: 4096 },
  );

  return {
    result: response.content,
    tokensUsed: response.tokensUsed ?? 0,
  };
}
