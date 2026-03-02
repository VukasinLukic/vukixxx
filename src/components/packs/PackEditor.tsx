import React, { useState, useEffect } from 'react';

interface PackEditorProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialDescription?: string;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}

export const PackEditor: React.FC<PackEditorProps> = ({
  isOpen,
  mode,
  initialName = '',
  initialDescription = '',
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
    }
  }, [isOpen, initialName, initialDescription]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  };

  return (
    <div className="pack-editor-overlay" onClick={onCancel}>
      <form
        className="pack-editor-dialog"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3>{mode === 'create' ? 'New Memory Pack' : 'Edit Pack'}</h3>

        <div className="pack-editor-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Frontend Architecture Context"
            autoFocus
          />
        </div>

        <div className="pack-editor-field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this pack for?"
          />
        </div>

        <div className="pack-editor-buttons">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={!name.trim()}>
            {mode === 'create' ? 'Create Pack' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
