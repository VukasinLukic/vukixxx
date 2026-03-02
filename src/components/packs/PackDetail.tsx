import React, { useState, useMemo } from 'react';
import { GripVertical, X, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePackStore } from '@/stores/packStore';
import { usePromptStore } from '@/stores/promptStore';
import { useRoleStore } from '@/stores/roleStore';
import { TokenCounter } from './TokenCounter';
import { ExportPanel } from './ExportPanel';
import type { MemoryPack, Prompt } from '@/types';

// --- Sortable prompt item ---

interface SortablePromptProps {
  promptId: string;
  prompt: Prompt | undefined;
  packId: string;
}

const SortablePromptItem: React.FC<SortablePromptProps> = ({ promptId, prompt, packId }) => {
  const removePromptFromPack = usePackStore(s => s.removePromptFromPack);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: promptId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`pack-prompt-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </div>
      <div className="prompt-info">
        <span className="prompt-label">
          {prompt ? prompt.label : `(missing: ${promptId})`}
        </span>
        <span className="prompt-category">
          {prompt ? prompt.category : 'unknown'}
        </span>
      </div>
      <button
        className="remove-btn"
        onClick={() => removePromptFromPack(packId, promptId)}
        title="Remove from pack"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// --- Main PackDetail component ---

interface PackDetailProps {
  pack: MemoryPack;
  onEdit: () => void;
  onDelete: () => void;
  onCopySuccess: (message: string) => void;
}

export const PackDetail: React.FC<PackDetailProps> = ({ pack, onEdit, onDelete, onCopySuccess }) => {
  const prompts = usePromptStore(s => s.prompts);
  const rolesList = useRoleStore(s => s.roles);
  const reorderPrompts = usePackStore(s => s.reorderPrompts);
  const addPromptToPack = usePackStore(s => s.addPromptToPack);
  const setSystemRole = usePackStore(s => s.setSystemRole);
  const getPackTokenStats = usePackStore(s => s.getPackTokenStats);

  const [selectedPromptToAdd, setSelectedPromptToAdd] = useState('');
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  // Memoize arrays to avoid infinite loops
  const promptsArray = useMemo(() => Array.from(prompts.values()), [prompts]);
  const roles = useMemo(() => Array.from(rolesList.values()), [rolesList]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pack.promptIds.indexOf(active.id as string);
    const newIndex = pack.promptIds.indexOf(over.id as string);
    const newOrder = arrayMove(pack.promptIds, oldIndex, newIndex);
    reorderPrompts(pack.id, newOrder);
  };

  const handleAddPrompt = () => {
    if (!selectedPromptToAdd) return;
    addPromptToPack(pack.id, selectedPromptToAdd);
    setSelectedPromptToAdd('');
    setShowAddPrompt(false);
  };

  // Prompts not yet in this pack
  const availablePrompts = useMemo(
    () => promptsArray.filter(p => !pack.promptIds.includes(p.id)),
    [promptsArray, pack.promptIds]
  );

  const tokenStats = getPackTokenStats(pack.id, prompts);

  return (
    <div>
      {/* Header */}
      <div className="pack-detail-header">
        <div>
          <h2>{pack.name}</h2>
          {pack.description && (
            <p className="pack-description">{pack.description}</p>
          )}
        </div>
        <div className="pack-detail-actions">
          <button onClick={onEdit}>
            <Edit2 size={14} />
            Edit
          </button>
          <button className="danger" onClick={onDelete}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Token Stats */}
      {tokenStats && tokenStats.promptCount > 0 && (
        <div className="pack-section">
          <TokenCounter
            originalTokens={tokenStats.originalTokens}
            toonTokens={tokenStats.toonTokens}
            markdownTokens={tokenStats.markdownTokens}
            promptCount={tokenStats.promptCount}
          />
        </div>
      )}

      {/* System Role */}
      <div className="pack-section">
        <div className="pack-section-header">
          <h4>System Role</h4>
        </div>
        <div className="role-selector">
          <select
            value={pack.systemRoleId || ''}
            onChange={e => setSystemRole(pack.id, e.target.value || undefined)}
          >
            <option value="">No system role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          {pack.systemRoleId && (() => {
            const role = roles.find(r => r.id === pack.systemRoleId);
            return role ? (
              <div className="role-preview-mini">
                {role.content.slice(0, 200)}{role.content.length > 200 ? '...' : ''}
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Prompts in Pack */}
      <div className="pack-section">
        <div className="pack-section-header">
          <h4>Prompts ({pack.promptIds.length})</h4>
          <button onClick={() => setShowAddPrompt(!showAddPrompt)}>
            <Plus size={12} />
            Add
          </button>
        </div>

        {showAddPrompt && availablePrompts.length > 0 && (
          <div className="add-prompt-picker">
            <select
              value={selectedPromptToAdd}
              onChange={e => setSelectedPromptToAdd(e.target.value)}
            >
              <option value="">Select a prompt...</option>
              {availablePrompts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.category})
                </option>
              ))}
            </select>
            <button onClick={handleAddPrompt} disabled={!selectedPromptToAdd}>
              Add
            </button>
          </div>
        )}

        {pack.promptIds.length === 0 ? (
          <div className="pack-prompt-empty">
            No prompts in this pack yet.<br />
            Click "Add" above or use "Add to Pack" from the Memory Graph.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pack.promptIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="pack-prompt-list">
                {pack.promptIds.map(pid => (
                  <SortablePromptItem
                    key={pid}
                    promptId={pid}
                    prompt={prompts.get(pid)}
                    packId={pack.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Export */}
      <div className="pack-section">
        <div className="pack-section-header">
          <h4>Export</h4>
        </div>
        <ExportPanel pack={pack} onCopySuccess={onCopySuccess} />
      </div>
    </div>
  );
};
