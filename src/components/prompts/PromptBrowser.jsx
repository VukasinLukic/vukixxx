import React, { useState, useMemo } from 'react';
import { Search, Folder, FileText, LayoutGrid, List as ListIcon, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import './PromptBrowser.css';

const categories = [
    { id: 'all', label: 'All Prompts', icon: LayoutGrid },
    { id: 'core', label: 'Core', icon: Folder },
    { id: 'design', label: 'Design', icon: Folder },
    { id: 'backend', label: 'Backend', icon: Folder },
    { id: 'marketing', label: 'Marketing', icon: Folder },
    { id: 'other', label: 'Other', icon: Folder },
];

export const PromptBrowser = ({ prompts = [], onSelectPrompt, onAddPrompt }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('list');

    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => {
            const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.content && p.content.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.id.startsWith(selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [prompts, searchQuery, selectedCategory]);

    const getCategoryCount = (catId) => {
        if (catId === 'all') return prompts.length;
        return prompts.filter(p => p.category === catId || p.id.startsWith(catId)).length;
    };

    return (
        <div className="prompt-browser">
            {/* Sidebar */}
            <div className="browser-sidebar">
                <div className="sidebar-group">
                    <span className="sidebar-header">Categories</span>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={cn("sidebar-item", selectedCategory === cat.id && "active")}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            <cat.icon size={16} className="sidebar-icon" />
                            <span className="sidebar-label">{cat.label}</span>
                            <span className="sidebar-count">{getCategoryCount(cat.id)}</span>
                        </button>
                    ))}
                </div>

                {/* Add Prompt Button in Sidebar */}
                {onAddPrompt && (
                    <div className="sidebar-footer">
                        <button className="add-prompt-btn" onClick={onAddPrompt}>
                            <Plus size={16} />
                            <span>New Prompt</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="browser-content">
                {/* Toolbar */}
                <div className="browser-toolbar">
                    <div className="search-bar">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search Prompts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-actions">
                        <div className="view-toggles">
                            <button
                                className={cn("toggle-btn", viewMode === 'list' && "active")}
                                onClick={() => setViewMode('list')}
                                title="List View"
                            >
                                <ListIcon size={14} />
                            </button>
                            <button
                                className={cn("toggle-btn", viewMode === 'grid' && "active")}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className={cn("file-view", viewMode)}>
                    {filteredPrompts.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={32} strokeWidth={1} />
                            <span>No prompts found</span>
                            {onAddPrompt && (
                                <button className="empty-action" onClick={onAddPrompt}>
                                    Create New Prompt
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredPrompts.map(prompt => (
                            <div key={prompt.id} className="file-item" onClick={() => onSelectPrompt(prompt)}>
                                <div className="file-icon">
                                    <FileText size={viewMode === 'grid' ? 32 : 18} strokeWidth={1.5} />
                                </div>
                                <div className="file-info">
                                    <span className="file-name">{prompt.label}</span>
                                    <span className="file-meta">{prompt.category}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
