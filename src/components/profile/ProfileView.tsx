import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Copy, Save, Plus } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { usePromptStore } from '@/stores/promptStore';
import { useDigestStore } from '@/stores/digestStore';
import { useUIStore } from '@/stores/uiStore';
import { buildVukiContext } from '@/services/contextBuilder';
import { generateAndSaveClaudeMd } from '@/services/claudeMdGenerator';
import { debounce } from '@/utils/debounce';
import { ProjectCard } from './ProjectCard';
import { ProjectEditor } from './ProjectEditor';
import type { Project, UserProfile } from '@/types';
import './Profile.css';

const COMM_STYLES = [
  { value: 'direct', label: 'Direktan i koncizan' },
  { value: 'detailed', label: 'Detaljno objašnjavanje' },
  { value: 'casual', label: 'Opušteno i prijateljski' },
  { value: 'formal', label: 'Formalno i profesionalno' },
];

export const ProfileView: React.FC = () => {
  const {
    profile,
    saveProfile,
    getProjectsArray,
    getActiveProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProfileStore();

  const { getPromptsArray } = usePromptStore();
  const { getEntriesByProject } = useDigestStore();
  const { success, error, showConfirm, hideConfirm } = useUIStore();

  const [localProfile, setLocalProfile] = useState<UserProfile>({ ...profile });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [stackInput, setStackInput] = useState(profile.preferredStack.join(', '));

  // Sync local state when store profile changes
  useEffect(() => {
    setLocalProfile({ ...profile });
    setStackInput(profile.preferredStack.join(', '));
  }, [profile]);

  // Debounced save
  const debouncedSave = useCallback(
    debounce((p: UserProfile) => {
      saveProfile(p);
    }, 800),
    [saveProfile],
  );

  const updateField = useCallback((field: keyof UserProfile, value: string) => {
    setLocalProfile(prev => {
      const updated = { ...prev, [field]: value };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const handleStackChange = useCallback((value: string) => {
    setStackInput(value);
    const stack = value.split(',').map(s => s.trim()).filter(Boolean);
    setLocalProfile(prev => {
      const updated = { ...prev, preferredStack: stack };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // Export to clipboard
  const handleExportClipboard = useCallback(async () => {
    try {
      const prompts = getPromptsArray()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10);
      const context = buildVukiContext({
        profile: localProfile,
        activeProjects: getActiveProjects(),
        topPrompts: prompts,
      });
      await navigator.clipboard.writeText(context);
      success('Kontekst kopiran u clipboard!');
    } catch {
      error('Greška pri kopiranju');
    }
  }, [localProfile, getActiveProjects, getPromptsArray, success, error]);

  // Save as file
  const handleSaveFile = useCallback(async () => {
    try {
      const prompts = getPromptsArray()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10);
      const context = buildVukiContext({
        profile: localProfile,
        activeProjects: getActiveProjects(),
        topPrompts: prompts,
      });
      await invoke('write_prompt_file', { filename: 'vuki-context.md', content: context });
      success('vuki-context.md sačuvan!');
    } catch {
      error('Greška pri čuvanju fajla');
    }
  }, [localProfile, getActiveProjects, getPromptsArray, success, error]);

  // Project CRUD
  const handleSaveProject = useCallback(async (data: Pick<Project, 'name' | 'goal' | 'status' | 'nextStep' | 'priority' | 'tags' | 'folderPath'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, data);
      success(`"${data.name}" ažuriran`);
    } else {
      await createProject(data);
      success(`"${data.name}" kreiran`);
    }
    setShowProjectEditor(false);
    setEditingProject(null);
  }, [editingProject, updateProject, createProject, success]);

  // Export CLAUDE.md for project
  const handleExportClaudeMd = useCallback(async (project: Project) => {
    if (!project.folderPath) {
      error(`Projekat "${project.name}" nema postavljenu putanju foldera`);
      return;
    }

    try {
      const topPrompts = getPromptsArray()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10);

      const projectLogs = getEntriesByProject(project.id).slice(0, 3);

      const path = await generateAndSaveClaudeMd({
        profile: localProfile,
        project,
        claudeLogs: projectLogs,
        topPrompts,
      });

      success(`CLAUDE.md sačuvan: ${path}`);
    } catch (err) {
      error(`Greška pri eksportu: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [localProfile, getPromptsArray, getEntriesByProject, success, error]);

  const handleDeleteProject = useCallback((project: Project) => {
    showConfirm({
      title: 'Obriši projekat',
      message: `Da li si siguran da želiš da obrišeš "${project.name}"?`,
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
      onConfirm: () => {
        deleteProject(project.id);
        success(`"${project.name}" obrisan`);
        hideConfirm();
      },
    });
  }, [deleteProject, success, showConfirm, hideConfirm]);

  const projects = getProjectsArray();

  return (
    <div className="profile-container">
      <div className="profile-content">
        <h2 className="profile-title">Moj Profil</h2>

        {/* Profile form */}
        <section className="profile-section">
          <h3 className="profile-section-title">Osnovni podaci</h3>
          <p className="profile-section-desc">
            Ovi podaci pomažu Claudeu da te prepozna i prilagodi komunikaciju.
          </p>

          <div className="profile-row">
            <div className="profile-field">
              <label>Ime</label>
              <input
                value={localProfile.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Tvoje ime"
              />
            </div>
            <div className="profile-field">
              <label>Uloga</label>
              <input
                value={localProfile.role}
                onChange={e => updateField('role', e.target.value)}
                placeholder="npr. Full-stack developer"
              />
            </div>
          </div>

          <div className="profile-field">
            <label>Bio</label>
            <textarea
              value={localProfile.bio}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Kratko o sebi..."
              rows={2}
            />
          </div>

          <div className="profile-field">
            <label>Preferred Stack (odvojeno zarezom)</label>
            <input
              value={stackInput}
              onChange={e => handleStackChange(e.target.value)}
              placeholder="React, TypeScript, Tauri, Node.js"
            />
          </div>

          <div className="profile-field">
            <label>Trenutni fokus</label>
            <input
              value={localProfile.currentFocus}
              onChange={e => updateField('currentFocus', e.target.value)}
              placeholder="Na čemu trenutno radiš"
            />
          </div>

          <div className="profile-row">
            <div className="profile-field">
              <label>Stil komunikacije</label>
              <select
                value={localProfile.communicationStyle}
                onChange={e => updateField('communicationStyle', e.target.value)}
              >
                {COMM_STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label>Jezik</label>
              <select
                value={localProfile.preferredLanguage}
                onChange={e => updateField('preferredLanguage', e.target.value)}
              >
                <option value="sr">Srpski</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        {/* Export actions */}
        <section className="profile-section">
          <h3 className="profile-section-title">Export za Claude</h3>
          <p className="profile-section-desc">
            Generiši kontekst fajl koji Claude odmah razume — profil + projekti + top promptovi.
          </p>
          <div className="profile-actions">
            <button className="profile-btn" onClick={handleExportClipboard}>
              <Copy size={14} /> Export za Claude
            </button>
            <button className="profile-btn primary" onClick={handleSaveFile}>
              <Save size={14} /> Sačuvaj kao fajl
            </button>
          </div>
        </section>

        {/* Projects */}
        <section className="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 className="profile-section-title" style={{ margin: 0 }}>Projekti</h3>
              <p className="profile-section-desc" style={{ margin: 0 }}>
                {projects.length} {projects.length === 1 ? 'projekat' : 'projekata'}
              </p>
            </div>
            <button
              className="profile-btn primary"
              onClick={() => { setEditingProject(null); setShowProjectEditor(true); }}
            >
              <Plus size={14} /> Novi projekat
            </button>
          </div>

          <div className="projects-list">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={() => { setEditingProject(p); setShowProjectEditor(true); }}
                onDelete={() => handleDeleteProject(p)}
                onExportClaudeMd={() => handleExportClaudeMd(p)}
              />
            ))}
            {projects.length === 0 && (
              <p style={{ fontSize: 13, color: '#86868b', textAlign: 'center', padding: 24 }}>
                Nema projekata. Klikni "Novi projekat" da dodaš prvi.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Project Editor Modal */}
      {showProjectEditor && (
        <ProjectEditor
          project={editingProject ?? undefined}
          onSave={handleSaveProject}
          onCancel={() => { setShowProjectEditor(false); setEditingProject(null); }}
        />
      )}
    </div>
  );
};
