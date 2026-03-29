import React from 'react';
import { FileText } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onExportClaudeMd?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, onExportClaudeMd }) => {
  return (
    <div className="project-card">
      <div className="project-card-header">
        <span className="project-card-name">{project.name}</span>
        <div className="project-card-badges">
          <span className={`project-badge status-${project.status}`}>{project.status}</span>
          <span className={`project-badge priority-${project.priority}`}>{project.priority}</span>
          {project.folderPath && <span className="project-badge" style={{ background: '#34C759' }}>📁</span>}
        </div>
      </div>
      <p className="project-card-goal">{project.goal}</p>
      {project.nextStep && (
        <p className="project-card-next">
          <strong>Sledeći korak: </strong>{project.nextStep}
        </p>
      )}
      <div className="project-card-actions">
        {onExportClaudeMd && project.folderPath && (
          <button className="project-card-btn" onClick={onExportClaudeMd} title="Eksportuj CLAUDE.md za projekat">
            <FileText size={14} /> CLAUDE.md
          </button>
        )}
        <button className="project-card-btn" onClick={onEdit}>Izmeni</button>
        <button className="project-card-btn danger" onClick={onDelete}>Obriši</button>
      </div>
    </div>
  );
};
