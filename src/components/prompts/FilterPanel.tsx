import React from 'react';
import { Calendar, Tag, ArrowUpDown, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG, ALL_CATEGORIES } from '@/types/categories';
import { usePromptStore } from '@/stores/promptStore';
import type { DateRange, PromptFilters } from '@/types';
import './FilterPanel.css';

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 3 Months' },
];

const SORT_OPTIONS: { value: PromptFilters['sortBy']; label: string }[] = [
  { value: 'label', label: 'Name' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'category', label: 'Category' },
];

export const FilterPanel: React.FC = () => {
  const filters = usePromptStore(state => state.filters);
  const toggleCategory = usePromptStore(state => state.toggleCategory);
  const setDateRange = usePromptStore(state => state.setDateRange);
  const setSortBy = usePromptStore(state => state.setSortBy);
  const toggleSortOrder = usePromptStore(state => state.toggleSortOrder);
  const resetFilters = usePromptStore(state => state.resetFilters);
  const getAllTags = usePromptStore(state => state.getAllTags);

  const tags = getAllTags();
  const hasActiveFilters = filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateRange !== 'all';

  return (
    <div className="filter-panel">
      {/* Header */}
      <div className="filter-header">
        <span className="filter-title">Filters</span>
        {hasActiveFilters && (
          <button className="filter-reset" onClick={resetFilters} title="Reset all filters">
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="filter-section">
        <span className="filter-section-title">Categories</span>
        <div className="filter-chips">
          {ALL_CATEGORIES.map(cat => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                className={cn('filter-chip', isActive && 'active')}
                onClick={() => toggleCategory(cat)}
                style={isActive ? { borderColor: config.color, background: `${config.color}15` } : undefined}
              >
                <div
                  className="chip-dot"
                  style={{ background: config.color }}
                />
                {config.label}
                {isActive && <X size={10} className="chip-remove" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range */}
      <div className="filter-section">
        <span className="filter-section-title">
          <Calendar size={12} />
          Date Range
        </span>
        <div className="filter-options">
          {DATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={cn('filter-option', filters.dateRange === opt.value && 'active')}
              onClick={() => setDateRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="filter-section">
        <span className="filter-section-title">
          <ArrowUpDown size={12} />
          Sort By
        </span>
        <div className="filter-sort-row">
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => setSortBy(e.target.value as PromptFilters['sortBy'])}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            className="sort-direction-btn"
            onClick={toggleSortOrder}
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="filter-section">
          <span className="filter-section-title">
            <Tag size={12} />
            Tags
          </span>
          <div className="filter-chips">
            {tags.map(tag => {
              const isActive = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  className={cn('filter-chip tag-chip', isActive && 'active')}
                  onClick={() => {
                    const updated = isActive
                      ? filters.tags.filter(t => t !== tag)
                      : [...filters.tags, tag];
                    usePromptStore.setState(s => ({
                      filters: { ...s.filters, tags: updated },
                    }));
                  }}
                >
                  #{tag}
                  {isActive && <X size={10} className="chip-remove" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
