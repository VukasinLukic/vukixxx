import { z } from 'zod';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import type { FirestoreProfile, FirestoreProject, FirestoreClaudeLog, FirestoreTask, FirestorePrompt } from '../types.js';
import { isGitRepo, gitCommitPush } from '../gitSync.js';

export const generateClaudeMdSchema = z.object({
  project_id: z.string().describe('ID projekta za koji se generiše CLAUDE.md'),
});

const STYLE_LABELS: Record<string, string> = {
  direct: 'Direct and concise',
  detailed: 'Detailed explanations',
  casual: 'Casual and friendly',
  formal: 'Formal and professional',
};

export async function generateClaudeMdInternal(project_id: string): Promise<string> {
  const [profileDoc, projectDoc, logsSnap, tasksSnap, promptsSnap] = await Promise.all([
    db.collection('digitalTwin').doc('profile').get(),
    db.collection('projects').doc(project_id).get(),
    db.collection('claudeLogs')
      .where('projectId', '==', project_id)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get(),
    db.collection('tasks')
      .where('projectId', '==', project_id)
      .where('status', 'in', ['pending', 'in_progress'])
      .orderBy('createdAt', 'asc')
      .get(),
    db.collection('prompts')
      .orderBy('created', 'desc')
      .limit(100)
      .get(),
  ]);

  if (!projectDoc.exists) throw new Error(`Project ${project_id} not found`);

  const profile = (profileDoc.data() ?? {}) as FirestoreProfile;
  const project = { id: projectDoc.id, ...projectDoc.data() } as FirestoreProject;
  const logs = logsSnap.docs.map(d => d.data() as FirestoreClaudeLog);
  const tasks = tasksSnap.docs.map(d => d.data() as FirestoreTask);

  const projectTags: string[] = project.tags ?? [];
  const relevantPrompts = promptsSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as FirestorePrompt))
    .filter(p => (p.tags ?? []).some(t => projectTags.includes(t)))
    .slice(0, 3);

  const timestamp = new Date().toISOString();

  const logsSection = logs.length > 0
    ? logs.map(l => `- [${(l.createdAt ?? '').slice(0, 10)}] ${l.summary}`).join('\n')
    : '_No activity yet._';

  const tasksSection = tasks.length > 0
    ? tasks.map(t => `- [${t.priority.toUpperCase()}] ${t.task} (${t.status})`).join('\n')
    : '_No open tasks._';

  const promptsSection = relevantPrompts.length > 0
    ? relevantPrompts.map(p => `- **${p.title}** — ${p.text.slice(0, 80)}...`).join('\n')
    : '_No relevant prompts tagged to this project._';

  const lang = profile.preferredLanguage === 'sr' ? 'Srpski' : 'English';
  const style = STYLE_LABELS[profile.communicationStyle] ?? profile.communicationStyle;

  const markdown = `# CLAUDE.md — ${project.name}
_VukiXX auto-generated | ${timestamp}_

## Developer profile

**Name:** ${profile.name ?? ''}
**Role:** ${profile.role ?? ''}
**Stack:** ${(profile.preferredStack ?? []).join(', ') || 'Not specified'}
**Language:** ${lang}
**Style:** ${style}

## This project

**Goal:** ${project.goal}
**Status:** ${project.status} | **Priority:** ${project.priority}
**Next step:** ${project.nextStep || 'Not specified'}
**Folder:** ${project.folderPath ?? 'not set — add in VukiXX Profile tab'}

## Recent activity (last 3 logs)

${logsSection}

## Open tasks

${tasksSection}

## Relevant prompts from library

${promptsSection}

## Your instructions

- Respond in **${lang}** (${style})
- Start working immediately — do not ask what you already know
- Project files are at: **${project.folderPath ?? 'not set — check VukiXX Profile tab'}**
- You have full file system access via Cowork — use the folder path above directly
- After finishing, call \`add_claude_log\` and \`update_project\`
- If creating tasks for later, call \`add_task\`
`;

  await db.collection('projects').doc(project_id).update({
    claudeMd: markdown,
    claudeMdUpdatedAt: timestamp,
    _claudeMdServerTimestamp: FieldValue.serverTimestamp(),
  });

  // Git commit+push CLAUDE.md regeneration (best-effort)
  if (project.folderPath && isGitRepo(project.folderPath)) {
    gitCommitPush(project.folderPath, `vukixx: regenerate CLAUDE.md for ${project.name}`);
  }

  return markdown;
}

export async function generateClaudeMd(args: z.infer<typeof generateClaudeMdSchema>): Promise<string> {
  const md = await generateClaudeMdInternal(args.project_id);
  return JSON.stringify({ success: true, claudeMdLength: md.length, preview: md.slice(0, 200) + '...' });
}
