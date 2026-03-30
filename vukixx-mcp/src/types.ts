export interface FirestoreProfile {
  name: string;
  role: string;
  bio: string;
  communicationStyle: string;
  preferredLanguage: string;
  preferredStack: string[];
  currentFocus: string;
}

export interface FirestoreProject {
  id: string;
  name: string;
  goal: string;
  status: string;
  nextStep: string;
  priority: string;
  tags: string[];
  folderPath?: string;
  claudeMd?: string;
  claudeMdUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreClaudeLog {
  id: string;
  projectId: string;
  summary: string;
  outcome: string;
  workDone?: string;
  createdAt: string;
}

export interface FirestoreTask {
  id: string;
  projectId: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'done' | 'error';
  result: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: 'user' | 'claude';
}

export interface FirestorePrompt {
  id?: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
}
