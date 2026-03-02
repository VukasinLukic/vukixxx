import React, { useState, useMemo } from 'react';
import { Search, Folder, FileText, LayoutGrid, List as ListIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG, ALL_CATEGORIES } from '@/types/categories';
import type { Prompt, PromptCategory } from '@/types';
import './PromptBrowser.css';

interface PromptBrowserProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onAddPrompt?: () => void;
}

export const PromptBrowser: React.FC<PromptBrowserProps> = ({ prompts = [], onSelectPrompt, onAddPrompt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PromptCategory>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.bodyContent && p.bodyContent.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategory]);

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return prompts.length;
    return prompts.filter(p => p.category === catId).length;
  };

  // Build categories from config + actual data
  const categories = useMemo(() => {
    const cats: { id: 'all' | PromptCategory; label: string; icon: typeof Folder }[] = [
      { id: 'all', label: 'All Prompts', icon: LayoutGrid },
    ];
    for (const cat of ALL_CATEGORIES) {
      const config = CATEGORY_CONFIG[cat];
      if (config) {
        cats.push({ id: cat, label: config.label, icon: config.icon });
      }
    }
    return cats;
  }, []);

  return (
    <div className="prompt-browser">
      <div className="browser-sidebar">
        <div className="sidebar-group">
          <span className="sidebar-header">Categories</span>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={cn('sidebar-item', selectedCategory === cat.id && 'active')}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <cat.icon size={16} className="sidebar-icon" />
              <span className="sidebar-label">{cat.label}</span>
              <span className="sidebar-count">{getCategoryCount(cat.id)}</span>
            </button>
          ))}
        </div>

        {onAddPrompt && (
          <div className="sidebar-footer">
            <button className="add-prompt-btn" onClick={onAddPrompt}>
              <Plus size={16} />
              <span>New Prompt</span>
            </button>
          </div>
        )}
      </div>

      <div className="browser-content">
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
                className={cn('toggle-btn', viewMode === 'list' && 'active')}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <ListIcon size={14} />
              </button>
              <button
                className={cn('toggle-btn', viewMode === 'grid' && 'active')}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className={cn('file-view', viewMode)}>
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
