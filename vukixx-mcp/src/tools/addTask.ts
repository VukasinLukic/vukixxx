import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const addTaskSchema = z.object({
  project_id: z.string().describe('ID projekta'),
  task: z.string().describe('Opis zadatka'),
  priority: z.enum(['high', 'medium', 'low']).default('medium').describe('Prioritet zadatka'),
});

export async function addTask(args: z.infer<typeof addTaskSchema>): Promise<string> {
  const { project_id, task, priority } = args;
  const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const record = {
    id,
    projectId: project_id,
    task,
    priority,
    status: 'pending' as const,
    result: null,
    createdAt: now,
    completedAt: null,
    createdBy: 'claude' as const,
    _serverTimestamp: FieldValue.serverTimestamp(),
  };

  await db.collection('tasks').doc(id).set(record);

  return JSON.stringify({ success: true, taskId: id });
}
