import React from 'react';
import { motion } from 'framer-motion';
import { Home, Lightbulb, Brain, Layers, Settings, User, LayoutDashboard, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabId } from '@/types';
import './Dock.css';

interface DockItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const DockItem: React.FC<DockItemProps> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn('dock-item', isActive && 'active')}
    >
      <div className="dock-icon-wrapper">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <span className="dock-tooltip">{label}</span>
      {isActive && <motion.div layoutId="dock-dot" className="dock-dot" />}
    </motion.button>
  );
};

interface DockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const items: { id: TabId; icon: LucideIcon; label: string }[] = [
  { id: 'dashboard', icon: Home, label: 'Dashboard' },
  { id: 'prompts', icon: Lightbulb, label: 'Prompts' },
  { id: 'memory', icon: Brain, label: 'Memory Graph' },
  { id: 'packs', icon: Layers, label: 'Memory Packs' },
  { id: 'profile',  icon: User,            label: 'Moj Profil' },
  { id: 'digest',   icon: LayoutDashboard, label: 'Digest' },
  { id: 'nightly',  icon: Moon,            label: 'Nightly' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export const Dock: React.FC<DockProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="dock-container">
      <div className="dock-glass">
        {items.map((item) => (
          <DockItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </div>
    </div>
  );
};
