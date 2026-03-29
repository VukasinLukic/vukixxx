import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Trash2 } from 'lucide-react';
import type { NightlyTask } from '@/types';

interface NightlyTaskCardProps {
  task: NightlyTask;
  projectName: string;
  onRun: () => void;
  onDelete: () => void;
}

export const NightlyTaskCard: React.FC<NightlyTaskCardProps> = ({ task, projectName, onRun, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const hasResult = task.status === 'done' || task.status === 'error';

  return (
    <div className="nightly-task-card">
      <div className="nightly-task-header">
        <div className="nightly-task-info" style={{ cursor: hasResult ? 'pointer' : 'default' }} onClick={() => hasResult && setExpanded(!expanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasResult && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            <p className="nightly-task-text">{task.task}</p>
          </div>
          <span className="nightly-task-meta">
            {projectName} &middot; {new Date(task.createdAt).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="nightly-task-badges">
          <span className={`project-badge priority-${task.priority}`}>{task.priority}</span>
          <span className={`nightly-status-badge ${task.status}`}>{task.status}</span>
        </div>
        <div className="nightly-task-actions" style={{ marginLeft: 8 }}>
          {task.status === 'pending' && (
            <button className="nightly-task-btn" onClick={onRun} title="Pokreni">
              <Play size={12} />
            </button>
          )}
          <button className="nightly-task-btn danger" onClick={onDelete} title="Obriši">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && task.result && (
        <div className="nightly-task-result">
          <p className="nightly-task-result-text">{task.result}</p>
          {task.tokensUsed && (
            <div className="nightly-task-result-meta">
              {task.tokensUsed} tokena &middot; Završeno: {task.completedAt ? new Date(task.completedAt).toLocaleString('sr-Latn') : '—'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
