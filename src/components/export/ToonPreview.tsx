import React, { useMemo, useState } from 'react';
import { Copy, FileText, Zap, ArrowRight } from 'lucide-react';
import { promptToTOON, getTOONStats, promptsToBatchTOON, getBatchTOONStats } from '@/lib/toonConverter';
import type { Prompt, TOONStats, BatchTOONStats } from '@/types';
import './ToonPreview.css';

interface ToonPreviewProps {
  prompts: Prompt[];
  onCopySuccess?: (message: string) => void;
}

export const ToonPreview: React.FC<ToonPreviewProps> = ({ prompts, onCopySuccess }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const selectedPrompt = prompts[selectedIndex];

  const singleStats: TOONStats | null = useMemo(() => {
    if (!selectedPrompt) return null;
    return getTOONStats(selectedPrompt);
  }, [selectedPrompt]);

  const batchStats: BatchTOONStats = useMemo(() => {
    return getBatchTOONStats(prompts);
  }, [prompts]);

  const toonOutput = useMemo(() => {
    if (activeTab === 'single' && selectedPrompt) {
      return promptToTOON(selectedPrompt);
    }
    return promptsToBatchTOON(prompts);
  }, [activeTab, selectedPrompt, prompts]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toonOutput);
      setCopyFeedback(true);
      const stats = activeTab === 'single' && singleStats
        ? `Copied TOON (${singleStats.savingsPercent}% smaller)`
        : `Copied ${batchStats.promptCount} prompts as TOON (${batchStats.savingsPercent}% smaller)`;
      onCopySuccess?.(stats);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const stats = activeTab === 'single' && singleStats
    ? {
      originalTokens: singleStats.originalTokens,
      toonTokens: singleStats.toonTokens,
      saved: singleStats.tokensSaved,
      percent: singleStats.savingsPercent,
    }
    : {
      originalTokens: batchStats.totalOriginalTokens,
      toonTokens: batchStats.totalToonTokens,
      saved: batchStats.totalOriginalTokens - batchStats.totalToonTokens,
      percent: batchStats.savingsPercent,
    };

  return (
    <div className="toon-preview">
      {/* Tabs */}
      <div className="toon-tabs">
        <button
          className={`toon-tab ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Prompt
        </button>
        <button
          className={`toon-tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          Batch ({prompts.length})
        </button>
      </div>

      {/* Prompt Selector (single mode) */}
      {activeTab === 'single' && prompts.length > 1 && (
        <div className="toon-selector">
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          >
            {prompts.map((p, i) => (
              <option key={p.id} value={i}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Bar */}
      <div className="toon-stats">
        <div className="stat-comparison">
          <div className="stat-box">
            <span className="stat-label">Original</span>
            <span className="stat-value">{stats.originalTokens}</span>
            <span className="stat-unit">tokens</span>
          </div>
          <ArrowRight size={16} className="stat-arrow" />
          <div className="stat-box toon">
            <span className="stat-label">TOON</span>
            <span className="stat-value">{stats.toonTokens}</span>
            <span className="stat-unit">tokens</span>
          </div>
        </div>

        <div className="stat-savings">
          <Zap size={14} />
          <span className="savings-value">{stats.percent}%</span>
          <span className="savings-label">smaller</span>
          <span className="savings-detail">({stats.saved} tokens saved)</span>
        </div>
      </div>

      {/* TOON Output Preview */}
      <div className="toon-output">
        <div className="toon-output-header">
          <FileText size={12} />
          <span>TOON Output</span>
        </div>
        <pre className="toon-code">{toonOutput}</pre>
      </div>

      {/* Copy Button */}
      <button
        className={`toon-copy-btn ${copyFeedback ? 'copied' : ''}`}
        onClick={handleCopy}
      >
        <Copy size={14} />
        {copyFeedback ? 'Copied!' : `Copy ${activeTab === 'batch' ? 'All' : ''} TOON`}
      </button>
    </div>
  );
};
