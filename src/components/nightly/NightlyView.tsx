import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Plus } from 'lucide-react';
import { useNightlyStore } from '@/stores/nightlyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useUIStore } from '@/stores/uiStore';
import { NightlyTaskCard } from './NightlyTaskCard';
import type { ProjectPriority, Task } from '@/types';
import './Nightly.css';

export const NightlyView: React.FC = () => {
  const {
    loadTasks,
    addTask,
    deleteTask,
    subscribeToFirestoreTasks,
    unsubscribeFromFirestoreTasks,
    getTasksArray,
    getPendingTasks,
  } = useNightlyStore();

  const { getProjectsArray } = useProfileStore();
  const { success } = useUIStore();

  const [showForm, setShowForm] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');

  useEffect(() => {
    loadTasks();
    subscribeToFirestoreTasks();
    return () => unsubscribeFromFirestoreTasks();
  }, [loadTasks, subscribeToFirestoreTasks, unsubscribeFromFirestoreTasks]);

  const projects = getProjectsArray();
  const tasks = getTasksArray();
  const projectNameMap = new Map(projects.map(p => [p.id, p.name]));

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

  const handleCopyForDispatch = useCallback((task: Task) => {
    const projectName = projectNameMap.get(task.projectId) ?? 'Unknown project';
    const msg = `[Task] ${task.task}
Project: ${projectName}
Priority: ${task.priority}
Context: Use get_my_context tool first, then work on this task.
When done: call complete_task(${task.id}, result) and add_claude_log.`;
    navigator.clipboard.writeText(msg);
    success('Kopirano za Dispatch');
  }, [projectNameMap, success]);

  // Per-project open task counts
  const openCountByProject = projects
    .map(p => ({ name: p.name, count: tasks.filter(t => t.projectId === p.id && t.status === 'pending').length }))
    .filter(x => x.count > 0);

  return (
    <div className="nightly-container">
      <div className="nightly-content">
        <h2 className="nightly-title">Task Queue</h2>
        <p className="nightly-subtitle">
          Taskovi za Claude Dispatch. Kopiraj task i pokreni kroz MCP interfejs.
        </p>

        {/* Per-project open task badges */}
        {openCountByProject.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {openCountByProject.map(({ name, count }) => (
              <span
                key={name}
                style={{
                  fontSize: 12,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: 'rgba(0,113,227,0.1)',
                  color: '#0071e3',
                  fontWeight: 500,
                }}
              >
                {name}: {count} open
              </span>
            ))}
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

        {/* Task list */}
        <div className="nightly-task-list">
          {tasks.length === 0 ? (
            <p className="nightly-empty">
              Nema zadataka. Dodaj ih ovde ili neka Claude kreira via MCP.
            </p>
          ) : (
            tasks.map(task => (
              <NightlyTaskCard
                key={task.id}
                task={task}
                projectName={projectNameMap.get(task.projectId) ?? 'Nepoznat projekat'}
                onCopyDispatch={() => handleCopyForDispatch(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
