import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Copy } from 'lucide-react';
import { useDigestStore } from '@/stores/digestStore';
import { useProfileStore } from '@/stores/profileStore';
import { usePromptStore } from '@/stores/promptStore';
import { useUIStore } from '@/stores/uiStore';
import { ClaudeLogForm } from './ClaudeLogForm';
import type { ClaudeLogEntry } from '@/types';
import './Digest.css';

export const DigestView: React.FC = () => {
  const { entries, loadEntries, addEntry, deleteEntry, getEntriesByProject } = useDigestStore();
  const { getProjectsArray, profile } = useProfileStore();
  const { getPromptsArray } = usePromptStore();
  const { success } = useUIStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [selectedDispatchProject, setSelectedDispatchProject] = useState<string>('');

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const projects = getProjectsArray();

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const handleAddEntry = useCallback(async (data: Pick<ClaudeLogEntry, 'projectId' | 'summary' | 'outcome'>) => {
    await addEntry(data);
    success('Log dodat');
    setShowAddForm(false);
  }, [addEntry, success]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Generate dispatch context for selected project
  const generateDispatchContext = useCallback((projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return '';

    const topPrompts = getPromptsArray()
      .filter(p => project.tags.some(tag => p.tags.includes(tag)))
      .slice(0, 3);

    const projectLogs = getEntriesByProject(projectId).slice(0, 3);

    const lines: string[] = [];
    lines.push(`# ${project.name} — Dispatch Context`);
    lines.push(`_Updated: ${new Date().toISOString()}_\n`);

    if (profile.name) lines.push(`**Developer:** ${profile.name}`);
    if (project.goal) lines.push(`**Goal:** ${project.goal}`);
    if (project.nextStep) lines.push(`**Next:** ${project.nextStep}`);
    if (project.tags.length > 0) lines.push(`**Tags:** ${project.tags.join(', ')}`);

    if (projectLogs.length > 0) {
      lines.push('\n**Recent Activity:**');
      projectLogs.forEach(log => {
        lines.push(`- ${log.summary} [${log.outcome}]`);
      });
    }

    if (topPrompts.length > 0) {
      lines.push('\n**Relevant Prompts:**');
      topPrompts.forEach(p => {
        lines.push(`- ${p.label} (${p.category})`);
      });
    }

    return lines.join('\n');
  }, [projects, getPromptsArray, getEntriesByProject, profile]);

  const handleCopyDispatchContext = useCallback(() => {
    if (!selectedDispatchProject) return;
    const context = generateDispatchContext(selectedDispatchProject);
    navigator.clipboard.writeText(context);
    success('Kontekst kopiran za Dispatch!');
  }, [selectedDispatchProject, generateDispatchContext, success]);

  // Filter entries
  const filteredEntriesByProject = (projectId: string) => {
    const pEntries = getEntriesByProject(projectId);
    if (filterOutcome === 'all') return pEntries;
    return pEntries.filter(e => e.outcome === filterOutcome);
  };

  return (
    <div className="digest-container">
      <div className="digest-content">
        <h2 className="digest-title">Project Digest</h2>

        {/* Dispatch Ready Section */}
        {projects.length > 0 && (
          <div className="digest-dispatch-section">
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>📱 Dispatch Ready</h3>
              <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>
                Generiši kontekst za Dispatch — mobilni interface za nastavak rada
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={selectedDispatchProject}
                  onChange={e => setSelectedDispatchProject(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #d5d5d7',
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Izaberi projekat...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCopyDispatchContext}
                  disabled={!selectedDispatchProject}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 6,
                    backgroundColor: selectedDispatchProject ? '#0071e3' : '#d5d5d7',
                    color: 'white',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: selectedDispatchProject ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Copy size={14} /> Kopiraj
                </button>
              </div>
            </div>
            {selectedDispatchProject && (
              <div style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#f5f5f7',
                borderRadius: 8,
                fontSize: 12,
                color: '#1d1d1f',
                fontFamily: 'monospace',
                maxHeight: 200,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }}>
                {generateDispatchContext(selectedDispatchProject)}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="digest-filters">
          {['all', 'success', 'partial', 'blocked', 'info'].map(f => (
            <button
              key={f}
              className={`digest-filter-btn ${filterOutcome === f ? 'active' : ''}`}
              onClick={() => setFilterOutcome(f)}
            >
              {f === 'all' ? 'Sve' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button
            className="digest-filter-btn"
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Dodaj log
          </button>
        </div>

        {/* Add form */}
        {showAddForm && projects.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ClaudeLogForm projects={projects} onSubmit={handleAddEntry} />
          </div>
        )}

        {/* Project cards with logs */}
        {projects.length === 0 ? (
          <p className="digest-empty">Nema projekata. Dodaj projekat u "Moj Profil" tabu.</p>
        ) : (
          projects.map(project => {
            const projectEntries = filteredEntriesByProject(project.id);
            const isExpanded = expandedProjects.has(project.id);

            return (
              <div key={project.id} className="digest-project-card">
                <div className="digest-project-header" onClick={() => toggleProject(project.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="digest-project-name">{project.name}</span>
                  </div>
                  <div className="digest-project-meta">
                    <span className={`project-badge status-${project.status}`}>{project.status}</span>
                    <span className="digest-log-count">{projectEntries.length} log</span>
                  </div>
                </div>

                {isExpanded && (
                  <>
                    {projectEntries.length === 0 ? (
                      <div className="digest-log-list">
                        <p style={{ fontSize: 12, color: '#86868b', margin: '8px 0' }}>
                          Nema log unosa za ovaj projekat.
                        </p>
                      </div>
                    ) : (
                      <div className="digest-log-list">
                        {projectEntries.map(entry => (
                          <div key={entry.id} className="digest-log-entry">
                            <div className={`digest-outcome-dot ${entry.outcome}`} />
                            <div className="digest-log-content">
                              <p className="digest-log-summary">{entry.summary}</p>
                              <span className="digest-log-date">{formatDate(entry.createdAt)}</span>
                            </div>
                            <button
                              className="digest-log-delete"
                              onClick={() => deleteEntry(entry.id)}
                              title="Obriši"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ClaudeLogForm
                      projects={[project]}
                      selectedProjectId={project.id}
                      onSubmit={handleAddEntry}
                    />
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
