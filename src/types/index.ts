// ============================================================
// Vukixxx - Core Type Definitions
// ============================================================

// --- Prompt Domain ---

export type PromptCategory = 'core' | 'coding' | 'design' | 'backend' | 'frontend' | 'marketing' | 'writing' | 'data' | 'business' | 'creative' | 'other';

export interface PromptFrontmatter {
  id: string;
  label: string;
  parent?: string;
  category: PromptCategory;
  type?: 'root' | 'prompt';
  tags?: string[];
  created?: string;
  updated?: string;
}

export interface Prompt {
  id: string;
  label: string;
  category: PromptCategory;
  parent?: string;
  type: 'root' | 'prompt';
  tags: string[];
  content: string;         // Full markdown including frontmatter
  bodyContent: string;     // Markdown body without frontmatter
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptInput {
  id: string;
  label: string;
  category: PromptCategory;
  parent?: string;
  bodyContent: string;
  tags?: string[];
}

export interface UpdatePromptInput {
  label?: string;
  category?: PromptCategory;
  parent?: string;
  bodyContent?: string;
  tags?: string[];
}

// --- Memory Pack Domain (Phase 2) ---

export interface MemoryPack {
  id: string;
  name: string;
  description: string;
  promptIds: string[];
  systemRoleId?: string;
  exportFormat: 'toon' | 'markdown' | 'both';
  createdAt: string;
  updatedAt: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// --- Panel/Window System ---

export interface Position {
  x: number;
  y: number;
}

export interface PanelSize {
  width: number;
  height: number | 'auto';
}

export interface PanelConfig {
  id: string;
  title: string;
  visible: boolean;
  initialPosition: Position;
  width: number;
  height: number | 'auto';
  zIndex: number;
}

export interface PromptWindowConfig extends PanelConfig {
  prompt: Prompt;
}

export interface EditorPanelConfig extends PanelConfig {
  mode: 'create' | 'edit';
  data: Prompt | null;
}

// --- 3D Graph ---

export interface GraphNode {
  id: string;
  name: string;
  type: 'root' | 'prompt' | 'phantom';
  category: PromptCategory | 'phantom';
  val: number;
  color: string;
  content?: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// --- TOON ---

export interface TOONStats {
  originalLength: number;
  toonLength: number;
  originalTokens: number;
  toonTokens: number;
  tokensSaved: number;
  savingsPercent: string;
}

export interface BatchTOONStats {
  promptCount: number;
  totalOriginalTokens: number;
  totalToonTokens: number;
  savingsPercent: string;
}

// --- Toast / UI ---

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

export type TabId = 'dashboard' | 'prompts' | 'memory' | 'packs' | 'settings'
  | 'profile' | 'digest' | 'nightly';

// --- Confirm Dialog ---

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
}

// --- Filters ---

export type DateRange = 'week' | 'month' | 'quarter' | 'all';

export interface PromptFilters {
  search: string;
  categories: PromptCategory[];
  tags: string[];
  dateRange: DateRange;
  sortBy: 'label' | 'updatedAt' | 'createdAt' | 'category';
  sortOrder: 'asc' | 'desc';
}

// --- AI / LLM ---

export type LLMProviderId = 'ollama' | 'gemini' | 'claude';

export interface LLMProviderConfig {
  id: LLMProviderId;
  name: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model: string;
}

export interface ClassificationResult {
  category: PromptCategory;
  tags: string[];
  confidence: number;
}

export interface SuggestionResult {
  promptId: string;
  label: string;
  score: number;
  reason: string;
}

// --- Digital Twin ---

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  communicationStyle: 'direct' | 'detailed' | 'casual' | 'formal';
  preferredLanguage: 'en' | 'sr';
  preferredStack: string[];
  currentFocus: string;
  updatedAt: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '', role: '', bio: '',
  communicationStyle: 'direct', preferredLanguage: 'sr',
  preferredStack: [], currentFocus: '', updatedAt: '',
};

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'idea';
export type ProjectPriority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  name: string;
  goal: string;
  status: ProjectStatus;
  nextStep: string;
  priority: ProjectPriority;
  tags: string[];
  folderPath?: string; // Project folder path for CLAUDE.md export
  createdAt: string;
  updatedAt: string;
}

export interface ClaudeLogEntry {
  id: string;
  projectId: string;
  summary: string;
  outcome: 'success' | 'partial' | 'blocked' | 'info';
  createdAt: string;
}

export type NightlyTaskStatus = 'pending' | 'processing' | 'done' | 'error';

export interface NightlyTask {
  id: string;
  projectId: string;
  task: string;
  priority: ProjectPriority;
  status: NightlyTaskStatus;
  result: string | null;
  tokensUsed?: number;
  createdAt: string;
  completedAt: string | null;
}

// --- App Settings ---

export interface AppSettings {
  promptsDir: string;
  theme: 'light' | 'dark';
  language: 'en' | 'sr';
  aiProvider: LLMProviderId;
  aiProviders: Record<LLMProviderId, LLMProviderConfig>;
}
