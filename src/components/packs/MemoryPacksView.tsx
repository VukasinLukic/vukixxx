import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { usePackStore } from '@/stores/packStore';
import { useRoleStore } from '@/stores/roleStore';
import { useUIStore } from '@/stores/uiStore';
import { PackList } from './PackList';
import { PackDetail } from './PackDetail';
import { PackEditor } from './PackEditor';
import { RoleList } from '../roles/RoleList';
import type { SystemRole } from '@/types';
import './Packs.css';

export const MemoryPacksView: React.FC = () => {
  const { loadPacks, selectedPackId, getPackById, createPack, updatePack, deletePack, selectPack } = usePackStore();
  const { loadRoles, deleteRole } = useRoleStore();
  const { success, showConfirm, hideConfirm } = useUIStore();

  const selectedPack = selectedPackId ? getPackById(selectedPackId) : undefined;

  // Load packs and roles on mount
  useEffect(() => {
    loadPacks();
    loadRoles();
  }, [loadPacks, loadRoles]);

  // Pack editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  const handleCreatePack = () => {
    setEditorMode('create');
    setEditorOpen(true);
  };

  const handleEditPack = () => {
    setEditorMode('edit');
    setEditorOpen(true);
  };

  const handleSavePack = async (name: string, description: string) => {
    if (editorMode === 'edit' && selectedPack) {
      await updatePack(selectedPack.id, { name, description });
      success(`"${name}" updated`);
    } else {
      const pack = await createPack(name, description);
      selectPack(pack.id);
      success(`"${name}" created`);
    }
    setEditorOpen(false);
  };

  const handleDeletePack = () => {
    if (!selectedPack) return;
    showConfirm({
      title: 'Delete Pack',
      message: `Are you sure you want to delete "${selectedPack.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deletePack(selectedPack.id);
        success(`"${selectedPack.name}" deleted`);
        hideConfirm();
      },
    });
  };

  const handleDeleteRole = (role: SystemRole) => {
    showConfirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.name}"?`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deleteRole(role.id);
        success(`"${role.name}" deleted`);
        hideConfirm();
      },
    });
  };

  const handleCopySuccess = (message: string) => {
    success(message);
  };

  return (
    <>
      <div className="packs-container">
        <PackList onCreatePack={handleCreatePack} />

        <div className="packs-main">
          {selectedPack ? (
            <>
              <PackDetail
                pack={selectedPack}
                onEdit={handleEditPack}
                onDelete={handleDeletePack}
                onCopySuccess={handleCopySuccess}
              />

              {/* Role management below pack detail */}
              <div style={{ marginTop: 32, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 24 }}>
                <RoleList onDeleteRole={handleDeleteRole} onSuccess={success} />
              </div>
            </>
          ) : (
            <div className="packs-empty-state">
              <Layers size={48} strokeWidth={1} />
              <h3>Select or Create a Memory Pack</h3>
              <p>
                Memory Packs let you bundle prompts together with a system role for quick context injection into AI conversations.
              </p>
            </div>
          )}
        </div>
      </div>

      <PackEditor
        isOpen={editorOpen}
        mode={editorMode}
        initialName={editorMode === 'edit' ? selectedPack?.name : ''}
        initialDescription={editorMode === 'edit' ? selectedPack?.description : ''}
        onSave={handleSavePack}
        onCancel={() => setEditorOpen(false)}
      />
    </>
  );
};
