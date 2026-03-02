import React, { useState, useEffect } from 'react';

interface RoleEditorProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialDescription?: string;
  initialContent?: string;
  onSave: (name: string, description: string, content: string) => void;
  onCancel: () => void;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({
  isOpen,
  mode,
  initialName = '',
  initialDescription = '',
  initialContent = '',
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setContent(initialContent);
    }
  }, [isOpen, initialName, initialDescription, initialContent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onSave(name.trim(), description.trim(), content.trim());
  };

  return (
    <div className="pack-editor-overlay" onClick={onCancel}>
      <form
        className="pack-editor-dialog"
        style={{ width: 520 }}
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3>{mode === 'create' ? 'New System Role' : 'Edit Role'}</h3>

        <div className="pack-editor-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Senior Frontend Architect"
            autoFocus
          />
        </div>

        <div className="pack-editor-field">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of this role"
          />
        </div>

        <div className="pack-editor-field">
          <label>System Prompt Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="You are a senior frontend architect with 10+ years of experience..."
            style={{ minHeight: 160 }}
          />
        </div>

        <div className="pack-editor-buttons">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={!name.trim() || !content.trim()}>
            {mode === 'create' ? 'Create Role' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
