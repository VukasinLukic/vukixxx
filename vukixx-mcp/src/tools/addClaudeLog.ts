import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { generateClaudeMdInternal } from './generateClaudeMd.js';
import { isGitRepo, gitPull, gitCommitPush } from '../gitSync.js';

export const addClaudeLogSchema = z.object({
  project_id: z.string().describe('ID projekta'),
  entry: z.string().max(200).describe('Šta je Claude uradio (max 200 karaktera)'),
  work_done: z.string().optional().describe('Detalji završenog rada'),
});

export async function addClaudeLog(args: z.infer<typeof addClaudeLogSchema>): Promise<string> {
  const { project_id, entry, work_done } = args;
  const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const projectDoc = await db.collection('projects').doc(project_id).get();
  const folderPath: string | undefined = projectDoc.data()?.['folderPath'];

  // Git pull before writing log (best-effort)
  let gitPullResult: string | null = null;
  if (folderPath && isGitRepo(folderPath)) {
    gitPullResult = gitPull(folderPath);
  }

  await db.collection('claudeLogs').doc(id).set({
    id,
    projectId: project_id,
    summary: entry,
    workDone: work_done ?? null,
    outcome: 'info',
    createdAt: now,
    _serverTimestamp: FieldValue.serverTimestamp(),
  });

  // Regenerate CLAUDE.md in background — don't fail the log if it errors
  generateClaudeMdInternal(project_id).catch(err =>
    console.error('[addClaudeLog] generate_claude_md failed:', err)
  );

  // Git commit+push after saving log (best-effort)
  let gitPushResult: string | null = null;
  if (folderPath && isGitRepo(folderPath)) {
    gitPushResult = gitCommitPush(folderPath, `vukixx: log — ${entry.slice(0, 50)}`);
  }

  return JSON.stringify({ success: true, logId: id, git: { pull: gitPullResult, push: gitPushResult } });
}
