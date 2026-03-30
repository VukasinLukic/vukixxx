import { z } from 'zod';
import { db } from '../firebase.js';
import type { FirestorePrompt } from '../types.js';

export const getProjectSchema = z.object({
  project_id: z.string().describe('ID projekta'),
});

export async function getProject(args: z.infer<typeof getProjectSchema>): Promise<string> {
  const { project_id } = args;

  const [projectDoc, logsSnap, tasksSnap, promptsSnap] = await Promise.all([
    db.collection('projects').doc(project_id).get(),
    db.collection('claudeLogs')
      .where('projectId', '==', project_id)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get(),
    db.collection('tasks')
      .where('projectId', '==', project_id)
      .orderBy('createdAt', 'desc')
      .get(),
    db.collection('prompts')
      .orderBy('created', 'desc')
      .limit(100)
      .get(),
  ]);

  if (!projectDoc.exists) {
    return JSON.stringify({ error: `Project ${project_id} not found` });
  }

  const project = { id: projectDoc.id, ...projectDoc.data() };
  const logs = logsSnap.docs.map(d => d.data());
  const tasks = tasksSnap.docs.map(d => d.data());

  const projectTags: string[] = (project as { tags?: string[] }).tags ?? [];
  const relevantPrompts = promptsSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as FirestorePrompt))
    .filter(p => (p.tags ?? []).some(t => projectTags.includes(t)))
    .slice(0, 10);

  return JSON.stringify({ project, logs, tasks, relevantPrompts }, null, 2);
}
