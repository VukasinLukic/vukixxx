import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, FileText, LayoutGrid, List as ListIcon, Plus, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG, ALL_CATEGORIES } from '@/types/categories';
import { usePromptStore } from '@/stores/promptStore';
import { FilterPanel } from './FilterPanel';
import type { Prompt, PromptCategory } from '@/types';
import './PromptBrowser.css';

interface PromptBrowserProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
  onAddPrompt?: () => void;
}

export const PromptBrowser: React.FC<PromptBrowserProps> = ({ prompts = [], onSelectPrompt, onAddPrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PromptCategory>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Use store search and filtered results
  const filters = usePromptStore(state => state.filters);
  const setSearch = usePromptStore(state => state.setSearch);
  const getFilteredPrompts = usePromptStore(state => state.getFilteredPrompts);

  // Get filtered prompts from the store (uses Fuse.js)
  const filteredPrompts = useMemo(() => {
    let results = getFilteredPrompts();

    // Also apply local category sidebar filter
    if (selectedCategory !== 'all') {
      results = results.filter(p => p.category === selectedCategory);
    }

    return results;
  }, [getFilteredPrompts, selectedCategory, filters]);

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return prompts.length;
    return prompts.filter(p => p.category === catId).length;
  };

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

  const hasActiveFilters = filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateRange !== 'all';

  return (
    <div className="prompt-browser">
      <div className="browser-sidebar">
        <div className="sidebar-group">
          <span className="sidebar-header">Categories</span>
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              className={cn('sidebar-item', selectedCategory === cat.id && 'active')}
              onClick={() => setSelectedCategory(cat.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <cat.icon size={16} className="sidebar-icon" />
              <span className="sidebar-label">{cat.label}</span>
              <span className="sidebar-count">{getCategoryCount(cat.id)}</span>
            </motion.button>
          ))}
        </div>

        {onAddPrompt && (
          <div className="sidebar-footer">
            <motion.button
              className="add-prompt-btn"
              onClick={onAddPrompt}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Plus size={16} />
              <span>New Prompt</span>
            </motion.button>
          </div>
        )}
      </div>

      <div className="browser-content">
        <div className="browser-toolbar">
          <div className="search-bar">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <motion.button
              className={cn('filter-toggle-btn', (showFilters || hasActiveFilters) && 'active')}
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle filters"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SlidersHorizontal size={14} />
              {hasActiveFilters && <span className="filter-badge" />}
            </motion.button>
            <div className="view-toggles">
              <motion.button
                className={cn('toggle-btn', viewMode === 'list' && 'active')}
                onClick={() => setViewMode('list')}
                title="List View"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ListIcon size={14} />
              </motion.button>
              <motion.button
                className={cn('toggle-btn', viewMode === 'grid' && 'active')}
                onClick={() => setViewMode('grid')}
                title="Grid View"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LayoutGrid size={14} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ overflow: "hidden" }}
            >
              <FilterPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {(filters.search || hasActiveFilters) && (
          <div className="results-count">
            {filteredPrompts.length} {filteredPrompts.length === 1 ? 'result' : 'results'}
            {filters.search && <span className="results-query"> for "{filters.search}"</span>}
          </div>
        )}

        <div className={cn('file-view', viewMode)}>
          {filteredPrompts.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <FileText size={32} strokeWidth={1} />
              </motion.div>
              <span>{filters.search ? 'No matching prompts' : 'No prompts found'}</span>
              {!filters.search && onAddPrompt && (
                <button className="empty-action" onClick={onAddPrompt}>
                  Create New Prompt
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredPrompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  className="file-item"
                  onClick={() => onSelectPrompt(prompt)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="file-icon">
                    <FileText size={viewMode === 'grid' ? 32 : 18} strokeWidth={1.5} />
                  </div>
                  <div className="file-info">
                    <span className="file-name">{prompt.label}</span>
                    <span className="file-meta">{prompt.category}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
