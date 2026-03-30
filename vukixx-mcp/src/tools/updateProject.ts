import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { isGitRepo, gitCommitPush } from '../gitSync.js';

export const updateProjectSchema = z.object({
  project_id: z.string().describe('ID projekta'),
  fields: z.object({
    nextStep: z.string().optional().describe('Sledeći korak na projektu'),
    status: z.enum(['active', 'paused', 'completed', 'idea']).optional(),
    notes: z.string().optional().describe('Slobodne napomene'),
    priority: z.enum(['high', 'medium', 'low']).optional(),
  }),
});

export async function updateProject(args: z.infer<typeof updateProjectSchema>): Promise<string> {
  const { project_id, fields } = args;

  const projectDoc = await db.collection('projects').doc(project_id).get();
  if (!projectDoc.exists) {
    return JSON.stringify({ error: `Project ${project_id} not found` });
  }

  const folderPath: string | undefined = projectDoc.data()?.['folderPath'];

  await db.collection('projects').doc(project_id).update({
    ...fields,
    updatedAt: new Date().toISOString(),
    _mcpUpdatedAt: FieldValue.serverTimestamp(),
  });

  // Git commit+push after update (best-effort)
  let gitResult: string | null = null;
  if (folderPath && isGitRepo(folderPath)) {
    const fieldNames = Object.keys(fields).join(', ');
    const projectName = (projectDoc.data()?.['name'] as string | undefined) ?? project_id;
    gitResult = gitCommitPush(folderPath, `vukixx: update ${projectName} — ${fieldNames}`);
  }

  return JSON.stringify({ success: true, project_id, updated: fields, git: gitResult });
}
