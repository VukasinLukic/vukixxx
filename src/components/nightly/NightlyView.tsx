import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Play, Plus } from 'lucide-react';
import { useNightlyStore } from '@/stores/nightlyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useAIStore } from '@/stores/aiStore';
import { useUIStore } from '@/stores/uiStore';
import { NightlyTaskCard } from './NightlyTaskCard';
import type { ProjectPriority } from '@/types';
import './Nightly.css';

export const NightlyView: React.FC = () => {
  const {
    loadTasks,
    addTask,
    deleteTask,
    runTask,
    runAllPending,
    isProcessing,
    getTasksArray,
    getPendingTasks,
  } = useNightlyStore();

  const { getProjectsArray } = useProfileStore();
  const { providers } = useAIStore();
  const { success, error, setActiveTab } = useUIStore();

  const [showForm, setShowForm] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const projects = getProjectsArray();
  const tasks = getTasksArray();
  const pendingCount = getPendingTasks().length;
  const hasClaude = !!providers.claude?.apiKey;

  // Set default projectId when projects load
  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const handleAddTask = useCallback(async () => {
    if (!taskText.trim() || !projectId) return;
    await addTask({ projectId, task: taskText.trim(), priority });
    success('Zadatak dodat');
    setTaskText('');
    setShowForm(false);
  }, [taskText, projectId, priority, addTask, success]);

  const handleRunAll = useCallback(async () => {
    try {
      await runAllPending();
      success('Svi zadaci završeni');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Greška pri pokretanju');
    }
  }, [runAllPending, success, error]);

  const handleRunSingle = useCallback(async (taskId: string) => {
    try {
      await runTask(taskId);
      success('Zadatak završen');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Greška pri pokretanju');
    }
  }, [runTask, success, error]);

  // Find project name by ID
  const projectNameMap = new Map(projects.map(p => [p.id, p.name]));

  return (
    <div className="nightly-container">
      <div className="nightly-content">
        <h2 className="nightly-title">Nightly Tasks</h2>
        <p className="nightly-subtitle">
          Zadaci koje Claude obrađuje za tebe. Dodaj zadatak, klikni "Pokreni sve".
        </p>

        {/* Warning if no Claude API key */}
        {!hasClaude && (
          <div className="nightly-warning">
            <AlertTriangle size={18} color="#ff9f0a" />
            <span className="nightly-warning-text">
              Claude API ključ nije konfigurisan.{' '}
              <span className="nightly-warning-link" onClick={() => setActiveTab('settings')}>
                Podesi u Settings
              </span>
            </span>
          </div>
        )}

        {/* Add task form */}
        {showForm ? (
          <div className="nightly-add-form">
            <div className="nightly-add-form-title">Novi zadatak</div>
            <div className="nightly-form-row">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ flex: 1 }}>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select value={priority} onChange={e => setPriority(e.target.value as ProjectPriority)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <textarea
              value={taskText}
              onChange={e => setTaskText(e.target.value)}
              placeholder="Opiši zadatak za Claudea..."
              autoFocus
            />
            <div className="nightly-add-actions">
              <button className="profile-btn" onClick={() => setShowForm(false)}>Otkaži</button>
              <button
                className="profile-btn primary"
                onClick={handleAddTask}
                disabled={!taskText.trim() || !projectId}
              >
                Dodaj
              </button>
            </div>
          </div>
        ) : (
          <button
            className="profile-btn"
            onClick={() => setShowForm(true)}
            style={{ marginBottom: 16 }}
            disabled={projects.length === 0}
          >
            <Plus size={14} /> Dodaj zadatak
          </button>
        )}

        {/* Run all button */}
        {pendingCount > 0 && (
          <button
            className="nightly-run-all"
            onClick={handleRunAll}
            disabled={isProcessing || !hasClaude}
          >
            {isProcessing ? (
              <>
                <span className="nightly-spinner" />
                Obrađujem...
              </>
            ) : (
              <>
                <Play size={16} />
                Pokreni sve ({pendingCount} {pendingCount === 1 ? 'zadatak' : 'zadataka'})
              </>
            )}
          </button>
        )}

        {/* Task list */}
        <div className="nightly-task-list">
          {tasks.length === 0 ? (
            <p className="nightly-empty">
              Nema zadataka. Klikni "Dodaj zadatak" da kreiraš prvi.
            </p>
          ) : (
            tasks.map(task => (
              <NightlyTaskCard
                key={task.id}
                task={task}
                projectName={projectNameMap.get(task.projectId) ?? 'Nepoznat projekat'}
                onRun={() => handleRunSingle(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
