import React, { useState, useCallback } from 'react';
import { Search, X, Maximize2, Copy, Download, Eye, GripVertical, Layers, FileJson, FileText } from 'lucide-react';
import { promptToTOON, promptsToBatchTOON, getBatchTOONStats } from '@/lib/toonConverter';
import { usePromptLoader } from '@/hooks/usePromptLoader';
import type { Prompt } from '@/types';
import './WidgetApp.css';

interface PromptItem {
  id: string;
  label: string;
  category: string;
  content: string;
}

export const WidgetApp: React.FC = () => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Load prompts using shared hook with bundled prompts fallback
  const { prompts, isLoading } = usePromptLoader();

  const filteredPrompts = prompts.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.bodyContent.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyPrompt = useCallback(async (prompt: Prompt, format: 'toon' | 'markdown' = 'toon') => {
    try {
      const textToCopy = format === 'toon'
        ? promptToTOON(prompt)
        : prompt.bodyContent;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(prompt.id);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  }, []);

  const toggleSelectPrompt = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handlePreview = useCallback((prompt: Prompt, event: React.MouseEvent) => {
    event.stopPropagation();
    setPreviewPrompt(prompt);
  }, []);

  const handleExportSelected = useCallback(async (format: 'toon' | 'json' | 'text' | 'clipboard') => {
    const selected = prompts.filter(p => selectedPrompts.has(p.id));

    if (selected.length === 0) {
      alert('No prompts selected');
      return;
    }

    try {
      if (format === 'toon') {
        const toonText = promptsToBatchTOON(selected);
        const blob = new Blob([toonText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vukixxx-prompts-${Date.now()}.toon`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const json = JSON.stringify(selected, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vukixxx-prompts-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'text') {
        // Export as markdown
        const text = selected.map(p => `# ${p.label}\n\n${p.bodyContent}`).join('\n\n---\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vukixxx-prompts-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'clipboard') {
        const toonText = promptsToBatchTOON(selected);
        const stats = getBatchTOONStats(selected);
        await navigator.clipboard.writeText(toonText);
        alert(`✓ Copied ${selected.length} prompt(s) in TOON format!\n\nTOON: ${stats.totalTOONTokens} tokens\nOriginal: ${stats.totalOriginalTokens} tokens\nSaved: ${stats.averageSavingsPercent.toFixed(1)}% (${stats.totalOriginalTokens - stats.totalTOONTokens} tokens)`);
      }
      setExportMenuOpen(false);
    } catch (e) {
      console.warn('Export failed:', e);
      alert('Export failed: ' + e);
    }
  }, [prompts, selectedPrompts]);

  const handleOpenApp = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('show_main_window');
    } catch (e) {
      console.warn('Failed to open main app:', e);
    }
  }, []);

  const handleClose = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().hide();
    } catch (e) {
      console.warn('Failed to hide widget:', e);
    }
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
  }, [filteredPrompts]);

  const deselectAll = useCallback(() => {
    setSelectedPrompts(new Set());
  }, []);

  return (
    <div className="widget-container">
      <div className="widget-header" data-tauri-drag-region>
        <div className="widget-drag-handle" data-tauri-drag-region>
          <GripVertical size={12} />
        </div>
        <span className="widget-header-title" data-tauri-drag-region>Vukixxx</span>
        <div className="widget-header-actions">
          <button className="widget-header-btn" onClick={handleOpenApp} title="Open App">
            <Maximize2 size={12} />
          </button>
          <button className="widget-header-btn close" onClick={handleClose} title="Hide Widget">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="widget-body">
        <div className="widget-search">
          <Search size={14} className="widget-search-icon" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="widget-selection-bar">
          {selectedPrompts.size > 0 ? (
            <>
              <span className="widget-selection-count">{selectedPrompts.size} selected</span>
              <button className="widget-selection-btn" onClick={deselectAll}>Clear</button>
            </>
          ) : (
            <>
              <span className="widget-prompt-count">{filteredPrompts.length} prompts</span>
              {filteredPrompts.length > 0 && (
                <button className="widget-selection-btn" onClick={selectAll}>Select all</button>
              )}
            </>
          )}
        </div>

        <div className="widget-quick-actions">
          <button className="widget-action-btn" onClick={handleOpenApp}>
            <Layers size={11} />
            Packs
          </button>
          <div className="widget-export-menu">
            <button
              className="widget-action-btn"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={selectedPrompts.size === 0}
            >
              <Download size={11} />
              Export ({selectedPrompts.size})
            </button>
            {exportMenuOpen && (
              <div className="widget-export-dropdown">
                <button onClick={() => handleExportSelected('clipboard')}>
                  <Copy size={11} /> Copy as TOON (60% smaller)
                </button>
                <button onClick={() => handleExportSelected('toon')}>
                  <Download size={11} /> Download TOON
                </button>
                <button onClick={() => handleExportSelected('text')}>
                  <FileText size={11} /> Download Markdown
                </button>
                <button onClick={() => handleExportSelected('json')}>
                  <FileJson size={11} /> Download JSON
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="widget-prompts-list">
          {isLoading ? (
            <div className="widget-empty-state">Loading prompts...</div>
          ) : (
            <>
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`widget-prompt-item ${selectedPrompts.has(prompt.id) ? 'selected' : ''}`}
                  onClick={() => handleCopyPrompt(prompt, 'toon')}
                  title="Click to copy as TOON format"
                >
                  <input
                    type="checkbox"
                    className="widget-prompt-checkbox"
                    checked={selectedPrompts.has(prompt.id)}
                    onChange={(e) => toggleSelectPrompt(prompt.id, e as any)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="widget-prompt-item-content">
                    <div className="widget-prompt-item-name">
                      {copied === prompt.id ? '✓ Copied!' : prompt.label}
                    </div>
                    <div className="widget-prompt-item-category">{prompt.category}</div>
                  </div>
                  <button
                    className="widget-prompt-preview-btn"
                    onClick={(e) => handlePreview(prompt, e)}
                    title="Preview"
                  >
                    <Eye size={12} />
                  </button>
                </div>
              ))}
              {filteredPrompts.length === 0 && !isLoading && (
                <div className="widget-empty-state">
                  {search ? 'No results' : 'No prompts yet'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="widget-footer">
        <button className="widget-open-app-btn" onClick={handleOpenApp}>
          Open Vukixxx
        </button>
      </div>

      {/* Preview Modal */}
      {previewPrompt && (
        <div className="widget-preview-modal" onClick={() => setPreviewPrompt(null)}>
          <div className="widget-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="widget-preview-header">
              <div>
                <h3>{previewPrompt.label}</h3>
                <span className="widget-preview-category">{previewPrompt.category}</span>
              </div>
              <button onClick={() => setPreviewPrompt(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="widget-preview-body">
              <pre>{previewPrompt.bodyContent}</pre>
            </div>
            <div className="widget-preview-footer">
              <button
                className="widget-preview-copy-btn"
                onClick={() => {
                  handleCopyPrompt(previewPrompt, 'toon');
                  setPreviewPrompt(null);
                }}
              >
                <Copy size={12} /> Copy as TOON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resize handle indicator */}
      <div className="widget-resize-indicator" title="Drag to resize"></div>
    </div>
  );
};
