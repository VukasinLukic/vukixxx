import { promptsToBatchTOON } from '@/lib/toonConverter';
import type { UserProfile, Project, Prompt } from '@/types';

const STYLE_LABELS: Record<string, string> = {
  direct: 'Direct and concise',
  detailed: 'Detailed explanations',
  casual: 'Casual and friendly',
  formal: 'Formal and professional',
};

export function buildVukiContext(input: {
  profile: UserProfile;
  activeProjects: Project[];
  topPrompts: Prompt[];
}): string {
  const { profile, activeProjects, topPrompts } = input;
  const lines: string[] = [];

  // --- Profile section ---
  lines.push('# Moj Profil\n');
  if (profile.name) lines.push(`**Ime:** ${profile.name}`);
  if (profile.role) lines.push(`**Uloga:** ${profile.role}`);
  if (profile.bio) lines.push(`**Bio:** ${profile.bio}`);
  if (profile.preferredStack.length > 0) {
    lines.push(`**Stack:** ${profile.preferredStack.join(', ')}`);
  }
  if (profile.currentFocus) lines.push(`**Trenutni fokus:** ${profile.currentFocus}`);
  lines.push(`**Stil komunikacije:** ${STYLE_LABELS[profile.communicationStyle] || profile.communicationStyle}`);
  lines.push(`**Jezik:** ${profile.preferredLanguage === 'sr' ? 'Srpski' : 'English'}`);

  // --- Active Projects section ---
  if (activeProjects.length > 0) {
    lines.push('\n# Aktivni Projekti\n');
    for (const p of activeProjects) {
      lines.push(`## ${p.name} [${p.priority}]`);
      lines.push(`**Cilj:** ${p.goal}`);
      if (p.nextStep) lines.push(`**Sledeći korak:** ${p.nextStep}`);
      if (p.tags.length > 0) lines.push(`**Tagovi:** ${p.tags.join(', ')}`);
      lines.push('');
    }
  }

  // --- Top Prompts section ---
  if (topPrompts.length > 0) {
    lines.push('\n# Top Promptovi\n');
    lines.push(promptsToBatchTOON(topPrompts));
  }

  return lines.join('\n');
}
