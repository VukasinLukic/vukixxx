import React, { useState, useCallback } from 'react';
import type { Project, ProjectStatus, ProjectPriority } from '@/types';

interface ProjectEditorProps {
  project?: Project;
  onSave: (data: Pick<Project, 'name' | 'goal' | 'status' | 'nextStep' | 'priority' | 'tags' | 'folderPath'>) => void;
  onCancel: () => void;
}

export const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onSave, onCancel }) => {
  const [name, setName] = useState(project?.name ?? '');
  const [goal, setGoal] = useState(project?.goal ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active');
  const [nextStep, setNextStep] = useState(project?.nextStep ?? '');
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? 'medium');
  const [tagsInput, setTagsInput] = useState(project?.tags.join(', ') ?? '');
  const [folderPath, setFolderPath] = useState(project?.folderPath ?? '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      goal: goal.trim(),
      status,
      nextStep: nextStep.trim(),
      priority,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      folderPath: folderPath.trim() || undefined,
    });
  }, [name, goal, status, nextStep, priority, tagsInput, folderPath, onSave]);

  return (
    <div className="project-editor-overlay" onClick={onCancel}>
      <div className="project-editor-modal" onClick={e => e.stopPropagation()}>
        <h3 className="project-editor-title">
          {project ? 'Izmeni projekat' : 'Novi projekat'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="profile-field">
            <label>Ime projekta</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="profile-field">
            <label>Cilj</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2} />
          </div>
          <div className="profile-row">
            <div className="profile-field">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="idea">Idea</option>
              </select>
            </div>
            <div className="profile-field">
              <label>Prioritet</label>
              <select value={priority} onChange={e => setPriority(e.target.value as ProjectPriority)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="profile-field">
            <label>Sledeći korak</label>
            <input value={nextStep} onChange={e => setNextStep(e.target.value)} />
          </div>
          <div className="profile-field">
            <label>Tagovi (odvojeni zarezom)</label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="react, tauri, ai" />
          </div>
          <div className="profile-field">
            <label>Putanja foldera projekta (za CLAUDE.md)</label>
            <input value={folderPath} onChange={e => setFolderPath(e.target.value)} placeholder="npr. C:\Users\Vukixxx\projects\myproject" />
          </div>
          <div className="project-editor-actions">
            <button type="button" className="profile-btn" onClick={onCancel}>Otkaži</button>
            <button type="submit" className="profile-btn primary" disabled={!name.trim()}>
              {project ? 'Sačuvaj' : 'Kreiraj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
