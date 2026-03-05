import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Upload } from 'lucide-react';
import { usePackStore } from '@/stores/packStore';
import { usePromptStore } from '@/stores/promptStore';
import { useUIStore } from '@/stores/uiStore';
import { importPackFromFile } from '@/lib/packImportExport';
import type { MemoryPack } from '@/types';

interface PackListProps {
  onCreatePack: () => void;
}

export const PackList: React.FC<PackListProps> = ({ onCreatePack }) => {
  // Stable packs selection to avoid infinite loops
  const [packs, setPacks] = useState<MemoryPack[]>([]);
  const selectedPackId = usePackStore(s => s.selectedPackId);
  const selectPack = usePackStore(s => s.selectPack);
  const importPack = usePackStore(s => s.importPack);
  const prompts = usePromptStore(s => s.prompts);
  const { success, error } = useUIStore();

  // Subscribe to packs changes
  useEffect(() => {
    const unsubscribe = usePackStore.subscribe((state) => {
      setPacks(Array.from(state.packs.values()));
    });

    // Initial load
    setPacks(Array.from(usePackStore.getState().packs.values()));

    return unsubscribe;
  }, []);

  const handleImportPack = async () => {
    try {
      const packData = await importPackFromFile();
      if (!packData) return; // User cancelled

      const result = await importPack(packData);
      success(`Pack "${result.pack.name}" imported with ${result.prompts.length} prompts`);
      selectPack(result.pack.id);
    } catch (err) {
      error('Import failed: ' + (err as Error).message);
      console.error('Pack import failed:', err);
    }
  };

  return (
    <div className="packs-sidebar">
      <div className="packs-sidebar-header">
        <h3>Memory Packs</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleImportPack}>
            <Upload size={14} />
            Import
          </button>
          <button onClick={onCreatePack}>
            <Plus size={14} />
            New
          </button>
        </div>
      </div>

      <div className="pack-list">
        {packs.length === 0 ? (
          <motion.div
            className="pack-list-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Layers size={32} strokeWidth={1} />
            </motion.div>
            <span>No packs yet.<br />Create one to bundle prompts.</span>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {packs.map((pack, index) => {
              const validCount = pack.promptIds.filter(id => prompts.has(id)).length;
              return (
                <motion.button
                  key={pack.id}
                  className={`pack-list-item ${selectedPackId === pack.id ? 'active' : ''}`}
                  onClick={() => selectPack(pack.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: index * 0.05,
                  }}
                  layout
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="pack-icon">
                    <Layers size={16} />
                  </div>
                  <div className="pack-info">
                    <span className="pack-name">{pack.name}</span>
                    <span className="pack-meta">
                      {validCount} prompt{validCount !== 1 ? 's' : ''}
                      {pack.systemRoleId && ' · Role attached'}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
