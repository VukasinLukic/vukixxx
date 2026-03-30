import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { isGitRepo, gitCommitPush } from '../gitSync.js';

export const completeTaskSchema = z.object({
  task_id: z.string().describe('ID zadatka koji se završava'),
  result: z.string().describe('Rezultat / šta je urađeno'),
});

export async function completeTask(args: z.infer<typeof completeTaskSchema>): Promise<string> {
  const { task_id, result } = args;
  const now = new Date().toISOString();

  const taskDoc = await db.collection('tasks').doc(task_id).get();
  if (!taskDoc.exists) {
    return JSON.stringify({ error: `Task ${task_id} not found` });
  }

  const task = taskDoc.data()!;

  // Get folderPath from project for git sync
  const projectDoc = await db.collection('projects').doc(task['projectId'] as string).get();
  const folderPath: string | undefined = projectDoc.data()?.['folderPath'];

  await db.collection('tasks').doc(task_id).update({
    status: 'done',
    result,
    completedAt: now,
    _completedServerTimestamp: FieldValue.serverTimestamp(),
  });

  // If high priority task — update project nextStep to the next pending task
  if (task['priority'] === 'high') {
    const nextSnap = await db
      .collection('tasks')
      .where('projectId', '==', task['projectId'])
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();

    const nextStep = nextSnap.empty
      ? 'All tasks complete — review project goals'
      : nextSnap.docs[0].data()['task'];

    await db.collection('projects').doc(task['projectId'] as string).update({
      nextStep,
      updatedAt: now,
    });
  }

  // Git commit+push after task completion (best-effort)
  let gitResult: string | null = null;
  if (folderPath && isGitRepo(folderPath)) {
    const taskText = (task['task'] as string | undefined) ?? task_id;
    gitResult = gitCommitPush(folderPath, `vukixx: task done — ${taskText.slice(0, 50)}`);
  }

  return JSON.stringify({ success: true, task_id, result, git: gitResult });
}
