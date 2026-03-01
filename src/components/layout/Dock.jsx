import React from 'react';
import { motion } from 'framer-motion';
import { Home, Lightbulb, Brain, Layers, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import './Dock.css';

const DockItem = ({ icon: Icon, label, isActive, onClick }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "dock-item",
                isActive && "active"
            )}
        >
            <div className="dock-icon-wrapper">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="dock-tooltip">{label}</span>
            {isActive && <motion.div layoutId="dock-dot" className="dock-dot" />}
        </motion.button>
    );
};

export const Dock = ({ activeTab, onTabChange }) => {
    const items = [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'prompts', icon: Lightbulb, label: 'Prompts' },
        { id: 'memory', icon: Brain, label: 'Memorija' },
        { id: 'panels', icon: Layers, label: 'Paneli' },
        { id: 'settings', icon: Settings, label: 'Podešavanja' },
    ];

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
