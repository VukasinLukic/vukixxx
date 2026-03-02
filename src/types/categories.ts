import { Folder, Server, Palette, Megaphone } from 'lucide-react';
import type { PromptCategory } from './index';
import type { LucideIcon } from 'lucide-react';

export interface CategoryConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORY_CONFIG: Record<PromptCategory, CategoryConfig> = {
  core: { label: 'Core', color: '#6e6e73', icon: Folder },
  design: { label: 'Design', color: '#bf5af2', icon: Palette },
  backend: { label: 'Backend', color: '#30d158', icon: Server },
  marketing: { label: 'Marketing', color: '#ff453a', icon: Megaphone },
  other: { label: 'Other', color: '#98989d', icon: Folder },
};

export const GRAPH_COLORS: Record<string, string> = {
  root: '#1d1d1f',
  core: '#6e6e73',
  design: '#bf5af2',
  backend: '#30d158',
  marketing: '#ff453a',
  other: '#98989d',
  phantom: '#d1d1d6',
};

export const NODE_SIZES: Record<string, number> = {
  root: 6,
  core: 4,
  prompt: 3,
  phantom: 2,
};

export const ALL_CATEGORIES: PromptCategory[] = ['core', 'design', 'backend', 'marketing', 'other'];
