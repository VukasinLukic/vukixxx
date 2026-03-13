import { Folder, Server, Palette, Megaphone, Code, PenTool, BarChart3, Briefcase, Sparkles, Monitor } from 'lucide-react';
import type { PromptCategory } from './index';
import type { LucideIcon } from 'lucide-react';

export interface CategoryConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORY_CONFIG: Record<PromptCategory, CategoryConfig> = {
  core: { label: 'Core', color: '#6e6e73', icon: Folder },
  coding: { label: 'Coding', color: '#64d2ff', icon: Code },
  design: { label: 'Design', color: '#bf5af2', icon: Palette },
  backend: { label: 'Backend', color: '#30d158', icon: Server },
  frontend: { label: 'Frontend', color: '#5e5ce6', icon: Monitor },
  marketing: { label: 'Marketing', color: '#ff453a', icon: Megaphone },
  writing: { label: 'Writing', color: '#0a84ff', icon: PenTool },
  data: { label: 'Data', color: '#5ac8fa', icon: BarChart3 },
  business: { label: 'Business', color: '#ff9f0a', icon: Briefcase },
  creative: { label: 'Creative', color: '#ff375f', icon: Sparkles },
  other: { label: 'Other', color: '#98989d', icon: Folder },
};

export const GRAPH_COLORS: Record<string, string> = {
  root: '#1d1d1f',
  core: '#6e6e73',
  coding: '#64d2ff',
  design: '#bf5af2',
  backend: '#30d158',
  frontend: '#5e5ce6',
  marketing: '#ff453a',
  writing: '#0a84ff',
  data: '#5ac8fa',
  business: '#ff9f0a',
  creative: '#ff375f',
  other: '#98989d',
  phantom: '#d1d1d6',
};

export const NODE_SIZES: Record<string, number> = {
  root: 6,
  core: 4.5,
  coding: 3.5,
  design: 3.5,
  backend: 3.5,
  frontend: 3.5,
  marketing: 3.5,
  writing: 3.5,
  data: 3.5,
  business: 3.5,
  creative: 3.5,
  other: 3,
  prompt: 3,
  phantom: 2,
};

export const ALL_CATEGORIES: PromptCategory[] = [
  'core', 'coding', 'design', 'frontend', 'backend',
  'writing', 'marketing', 'data', 'business', 'creative', 'other',
];
