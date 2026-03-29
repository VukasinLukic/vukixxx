import React, { useState, useCallback } from 'react';
import type { ClaudeLogEntry, Project } from '@/types';

interface ClaudeLogFormProps {
  projects: Project[];
  selectedProjectId?: string;
  onSubmit: (data: Pick<ClaudeLogEntry, 'projectId' | 'summary' | 'outcome'>) => void;
}

export const ClaudeLogForm: React.FC<ClaudeLogFormProps> = ({ projects, selectedProjectId, onSubmit }) => {
  const [projectId, setProjectId] = useState(selectedProjectId ?? (projects[0]?.id || ''));
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState<ClaudeLogEntry['outcome']>('success');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !projectId) return;
    onSubmit({ projectId, summary: summary.trim(), outcome });
    setSummary('');
  }, [projectId, summary, outcome, onSubmit]);

  return (
    <form className="digest-add-form" onSubmit={handleSubmit}>
      <div className="digest-add-row">
        <select value={projectId} onChange={e => setProjectId(e.target.value)}>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={outcome} onChange={e => setOutcome(e.target.value as ClaudeLogEntry['outcome'])}>
          <option value="success">Success</option>
          <option value="partial">Partial</option>
          <option value="blocked">Blocked</option>
          <option value="info">Info</option>
        </select>
      </div>
      <div className="digest-add-row">
        <input
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Šta je Claude uradio..."
        />
        <button type="submit" className="digest-add-btn" disabled={!summary.trim() || !projectId}>
          Dodaj
        </button>
      </div>
    </form>
  );
};
