import React, { useState, useMemo } from 'react';
import { Shield, Edit2, Trash2, Plus } from 'lucide-react';
import { useRoleStore } from '@/stores/roleStore';
import { RoleEditor } from './RoleEditor';
import type { SystemRole } from '@/types';

interface RoleListProps {
  onDeleteRole: (role: SystemRole) => void;
  onSuccess: (message: string) => void;
}

export const RoleList: React.FC<RoleListProps> = ({ onDeleteRole, onSuccess }) => {
  const rolesList = useRoleStore(s => s.roles);
  const createRole = useRoleStore(s => s.createRole);
  const updateRole = useRoleStore(s => s.updateRole);

  // Memoize array to avoid infinite loops
  const roles = useMemo(() => Array.from(rolesList.values()), [rolesList]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);

  const handleCreate = () => {
    setEditingRole(null);
    setEditorOpen(true);
  };

  const handleEdit = (role: SystemRole) => {
    setEditingRole(role);
    setEditorOpen(true);
  };

  const handleSave = async (name: string, description: string, content: string) => {
    if (editingRole) {
      await updateRole(editingRole.id, { name, description, content });
      onSuccess(`Role "${name}" updated`);
    } else {
      await createRole(name, description, content);
      onSuccess(`Role "${name}" created`);
    }
    setEditorOpen(false);
    setEditingRole(null);
  };

  return (
    <>
      <div className="pack-section">
        <div className="pack-section-header">
          <h4>System Roles</h4>
          <button onClick={handleCreate}>
            <Plus size={12} />
            New Role
          </button>
        </div>

        {roles.length === 0 ? (
          <div className="pack-prompt-empty">
            No system roles yet.<br />
            Create one to prepend to your pack exports.
          </div>
        ) : (
          <div className="role-list">
            {roles.map(role => (
              <div key={role.id} className="role-item">
                <div className="role-icon">
                  <Shield size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="role-name">{role.name}</div>
                  {role.description && (
                    <div className="role-desc">{role.description}</div>
                  )}
                </div>
                <div className="role-item-actions">
                  <button onClick={() => handleEdit(role)} title="Edit">
                    <Edit2 size={12} />
                  </button>
                  <button className="delete" onClick={() => onDeleteRole(role)} title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RoleEditor
        isOpen={editorOpen}
        mode={editingRole ? 'edit' : 'create'}
        initialName={editingRole?.name}
        initialDescription={editingRole?.description}
        initialContent={editingRole?.content}
        onSave={handleSave}
        onCancel={() => { setEditorOpen(false); setEditingRole(null); }}
      />
    </>
  );
};
