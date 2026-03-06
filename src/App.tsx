import React, { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dock } from './components/layout/Dock';
import { TitleBar } from './components/layout/TitleBar';
import { DraggablePanel } from './components/ui/DraggablePanel';
import { MemoryGraph } from './components/memory/MemoryGraph';
import { PromptBrowser } from './components/prompts/PromptBrowser';
import { PromptViewer } from './components/prompts/PromptViewer';
import { PromptEditor } from './components/prompts/PromptEditor';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { GraphErrorBoundary } from './components/ui/GraphErrorBoundary';
import { MemoryPacksView } from './components/packs/MemoryPacksView';
import { SettingsView } from './components/settings/SettingsView';
import { HelpModal } from './components/help/HelpModal';
import { usePromptStore } from './stores/promptStore';
import { usePanelStore } from './stores/panelStore';
import { useUIStore } from './stores/uiStore';
import { useAIStore } from './stores/aiStore';
import { initTauri } from './lib/tauriSetup';
import { initializeFirebase } from './services/firebase/firebaseConfig';
import { promptSyncService } from './services/firebase/promptSyncService';
import type { Prompt, GraphNode } from './types';

function App() {
  const [helpModalOpen, setHelpModalOpen] = React.useState(false);

  // --- Zustand stores ---
  const {
    prompts,
    loadPrompts,
    initWatcher,
    addPrompt,
    updatePrompt,
    deletePrompt,
    getPromptsArray,
  } = usePromptStore();

  const {
    panels,
    promptWindows,
    editorPanel,
    showPanel,
    hidePanel,
    bringToFront,
    openPromptWindow,
    closePromptWindow,
    updatePromptInWindows,
    openEditor,
    closeEditor,
  } = usePanelStore();

  const {
    activeTab,
    setActiveTab,
    toasts,
    removeToast,
    success,
    confirmDialog,
    showConfirm,
    hideConfirm,
  } = useUIStore();

  const { loadProvidersFromDisk } = useAIStore();

  // Load prompts and AI providers on mount + initialize Tauri + Firebase
  useEffect(() => {
    loadPrompts();
    loadProvidersFromDisk();
    initWatcher(); // Auto-reload prompts when files change
    initTauri(setActiveTab);

    // Initialize Firebase and start syncing prompts from extension
    try {
      initializeFirebase();
      promptSyncService.startSync((newPrompt) => {
        // When new prompt arrives from Firebase, reload prompts to include it
        console.log('📥 [App] New prompt synced from extension:', newPrompt.label);
        loadPrompts(); // Refresh prompt list
        success(`New prompt synced: ${newPrompt.label}`);
      });
    } catch (error) {
      console.warn('⚠️ [App] Firebase initialization failed:', error);
      // Don't block app if Firebase fails - it's an optional feature
    }

    // Cleanup: stop Firebase sync on unmount
    return () => {
      promptSyncService.stopSync();
    };
  }, [loadPrompts, loadProvidersFromDisk, initWatcher, setActiveTab, success]);

  // Show browser when prompts tab is active
  useEffect(() => {
    if (activeTab === 'prompts') {
      showPanel('browser');
    }
  }, [activeTab, showPanel]);

  // F1 keyboard listener for help modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setHelpModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Event handlers ---

  const handleOpenPrompt = useCallback((prompt: Prompt) => {
    openPromptWindow(prompt);
  }, [openPromptWindow]);

  const handleNodeSelect = useCallback((node: GraphNode) => {
    if (node?.id) {
      const prompt = prompts.get(node.id);
      if (prompt) {
        openPromptWindow(prompt);
      }
    }
  }, [prompts, openPromptWindow]);

  const handleAddPrompt = useCallback(() => {
    openEditor('create');
  }, [openEditor]);

  const handleEditPrompt = useCallback((prompt: Prompt) => {
    openEditor('edit', prompt);
  }, [openEditor]);

  const handleDeletePrompt = useCallback((promptId: string) => {
    const prompt = prompts.get(promptId);
    if (!prompt) return;

    showConfirm({
      title: 'Delete Prompt',
      message: `Are you sure you want to delete "${prompt.label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        deletePrompt(promptId);
        closePromptWindow(promptId);
        if (editorPanel?.data?.id === promptId) {
          closeEditor();
        }
        success(`"${prompt.label}" deleted`);
        hideConfirm();
      },
    });
  }, [prompts, deletePrompt, closePromptWindow, editorPanel, closeEditor, success, showConfirm, hideConfirm]);

  const handleCopySuccess = useCallback((message: string) => {
    success(message);
  }, [success]);

  const handleSavePrompt = useCallback(async (promptData: {
    id: string;
    label: string;
    category: string;
    parent: string;
    content: string;
    bodyContent: string;
  }) => {
    if (editorPanel?.mode === 'edit') {
      const updated = await updatePrompt(promptData.id, {
        label: promptData.label,
        category: promptData.category as Prompt['category'],
        parent: promptData.parent,
        bodyContent: promptData.bodyContent,
      });
      updatePromptInWindows(updated);
      success(`"${promptData.label}" updated`);
    } else {
      const created = await addPrompt({
        id: promptData.id,
        label: promptData.label,
        category: promptData.category as Prompt['category'],
        parent: promptData.parent,
        bodyContent: promptData.bodyContent,
      });
      openPromptWindow(created);
      success(`"${promptData.label}" created`);
    }
    closeEditor();
  }, [editorPanel?.mode, updatePrompt, addPrompt, updatePromptInWindows, openPromptWindow, closeEditor, success]);

  const promptsArray = getPromptsArray();

  // Welcome panel content
  const WelcomeContent = (
    <div style={{ padding: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      <h3 style={{ marginBottom: 12, fontSize: 17, fontWeight: 600, color: '#1d1d1f' }}>Vukixxx AI Workbench</h3>
      <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.6 }}>
        Welcome to your AI Context Workbench. Use the Dock below to navigate.
      </p>
      <div style={{ marginTop: 16, padding: 14, background: 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: '#1d1d1f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Tips</div>
        <ul style={{ fontSize: 13, color: '#86868b', marginTop: 10, paddingLeft: 18, lineHeight: 1.8 }}>
          <li><span style={{ color: '#1d1d1f' }}>Memory Graph</span> - Visualize your prompt hierarchy in 3D</li>
          <li><span style={{ color: '#1d1d1f' }}>Prompts</span> - Browse and manage your knowledge base</li>
          <li><span style={{ color: '#1d1d1f' }}>Copy TOON</span> - Export prompts in compressed format</li>
        </ul>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Custom Title Bar (Tauri only - returns null in browser) */}
        <TitleBar />

        {/* Memory Graph Background */}
        <AnimatePresence mode="wait">
          {activeTab === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', top: 36, left: 0, width: '100%', height: 'calc(100% - 116px)', zIndex: 1 }}
            >
              <GraphErrorBoundary>
                <MemoryGraph
                  onNodeSelect={handleNodeSelect}
                  onAddPrompt={handleAddPrompt}
                />
              </GraphErrorBoundary>
            </motion.div>
          )}

          {/* Memory Packs */}
          {activeTab === 'packs' && (
            <motion.div
              key="packs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'absolute', top: 36, left: 0, width: '100%',
                height: 'calc(100% - 116px)', zIndex: 2,
                background: 'rgba(245,245,247,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <MemoryPacksView />
            </motion.div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'absolute', top: 36, left: 0, width: '100%',
                height: 'calc(100% - 116px)', zIndex: 2,
                background: 'rgba(245,245,247,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panels Layer */}
        <div
          className="panels-layer"
          style={{
            position: 'absolute', top: 36, left: 0,
            width: '100%', height: 'calc(100% - 116px)',
            pointerEvents: 'none', zIndex: 50,
          }}
        >
          {/* Static Panels */}
          <AnimatePresence>
            {Object.values(panels).map(panel => (
              panel.visible && (
                <DraggablePanel
                  key={panel.id}
                  title={panel.title}
                  initialPosition={panel.initialPosition}
                  width={panel.width}
                  height={panel.height}
                  zIndex={panel.zIndex}
                  onClose={() => hidePanel(panel.id)}
                  onFocus={() => bringToFront(panel.id, false)}
                  className="pointer-events-auto"
                >
                  {panel.id === 'browser' ? (
                    <PromptBrowser
                      prompts={promptsArray}
                      onSelectPrompt={handleOpenPrompt}
                      onAddPrompt={handleAddPrompt}
                    />
                  ) : panel.id === 'welcome' ? (
                    WelcomeContent
                  ) : null}
                </DraggablePanel>
              )
            ))}
          </AnimatePresence>

          {/* Dynamic Prompt Windows */}
          <AnimatePresence>
            {promptWindows.map(window => (
              <DraggablePanel
                key={window.id}
                title={window.title}
                initialPosition={window.initialPosition}
                width={window.width}
                height={window.height}
                zIndex={window.zIndex}
                onClose={() => closePromptWindow(window.id)}
                onFocus={() => bringToFront(window.id, true)}
                className="pointer-events-auto"
              >
                <PromptViewer
                  prompt={window.prompt}
                  onEdit={() => handleEditPrompt(window.prompt)}
                  onDelete={() => handleDeletePrompt(window.prompt.id)}
                  onCopySuccess={handleCopySuccess}
                />
              </DraggablePanel>
            ))}
          </AnimatePresence>

          {/* Editor Panel */}
          <AnimatePresence>
            {editorPanel && (
              <DraggablePanel
                key="editor"
                title={editorPanel.title}
                initialPosition={editorPanel.initialPosition}
                width={editorPanel.width}
                height={editorPanel.height}
                zIndex={editorPanel.zIndex}
                onClose={closeEditor}
                onFocus={() => bringToFront('editor', false)}
                className="pointer-events-auto"
              >
                <PromptEditor
                  mode={editorPanel.mode}
                  initialData={editorPanel.data}
                  existingPrompts={promptsArray}
                  onSave={handleSavePrompt}
                  onCancel={closeEditor}
                />
              </DraggablePanel>
            )}
          </AnimatePresence>
        </div>

        {/* Dock Navigation */}
        <div style={{ zIndex: 1000, position: 'relative' }}>
          <Dock activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!confirmDialog?.isOpen}
          title={confirmDialog?.title || ''}
          message={confirmDialog?.message || ''}
          confirmText={confirmDialog?.confirmText || 'Confirm'}
          cancelText={confirmDialog?.cancelText || 'Cancel'}
          onConfirm={confirmDialog?.onConfirm || hideConfirm}
          onCancel={hideConfirm}
          variant={confirmDialog?.variant || 'default'}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Help Modal */}
        <HelpModal
          isOpen={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
