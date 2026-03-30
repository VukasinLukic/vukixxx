import { z } from 'zod';
import { db } from '../firebase.js';
import type { FirestoreProfile, FirestoreProject, FirestoreClaudeLog } from '../types.js';

export const getMyContextSchema = z.object({});

export async function getMyContext(): Promise<string> {
  const profileDoc = await db.collection('digitalTwin').doc('profile').get();
  const profile = profileDoc.data() as FirestoreProfile | undefined;

  const projectsSnap = await db
    .collection('projects')
    .where('status', '==', 'active')
    .get();

  const projects = projectsSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as FirestoreProject))
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    });

  const logsPerProject = await Promise.all(
    projects.map(async (p) => {
      const snap = await db
        .collection('claudeLogs')
        .where('projectId', '==', p.id)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();
      return snap.docs.map(d => d.data() as FirestoreClaudeLog);
    })
  );

  const result = {
    profile,
    projects: projects.map((p, i) => ({
      ...p,
      recentLogs: logsPerProject[i],
    })),
  };

  return JSON.stringify(result, null, 2);
}
