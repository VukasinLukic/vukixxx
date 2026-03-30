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
import { ProfileView } from './components/profile/ProfileView';
import { DigestView } from './components/digest/DigestView';
import { NightlyView } from './components/nightly/NightlyView';
import { HelpModal } from './components/help/HelpModal';
import { usePromptStore } from './stores/promptStore';
import { usePanelStore } from './stores/panelStore';
import { useUIStore } from './stores/uiStore';
import { useAIStore } from './stores/aiStore';
import { useProfileStore } from './stores/profileStore';
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
  const { loadProfile, loadProjects } = useProfileStore();

  // Load prompts and AI providers on mount + initialize Tauri + Firebase
  useEffect(() => {
    async function init() {
      // Load prompts and AI providers FIRST (classification needs API keys)
      await Promise.all([
        loadPrompts(),
        loadProvidersFromDisk(),
        loadProfile(),
        loadProjects(),
      ]);

      initWatcher();
      initTauri(setActiveTab);

      // Initialize Firebase AFTER providers are loaded
      try {
  initializeFirebase();

        // Clean up any existing duplicates before starting sync
        try {
          const cleaned = await promptSyncService.cleanupDuplicates();
          if (cleaned > 0) {
            await loadPrompts(); // Reload after cleanup
          }
        } catch (err) {
          console.warn('⚠️ [App] Duplicate cleanup failed:', err);
        }

        promptSyncService.startSync((newPrompt) => {
          console.log('📥 [App] New prompt synced from extension:', newPrompt.label);
          loadPrompts();
          success(`New prompt synced: ${newPrompt.label}`);
        });
      } catch (error) {
        console.warn('⚠️ [App] Firebase initialization failed:', error);
      }
    }

    init();

    return () => {
      promptSyncService.stopSync();
    };
  }, [loadPrompts, loadProvidersFromDisk, loadProfile, loadProjects, initWatcher, setActiveTab, success]);

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
    <div style={{ padding: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', overflowY: 'auto', maxHeight: '100%' }}>
      <h3 style={{ marginBottom: 4, fontSize: 17, fontWeight: 700, color: '#1d1d1f' }}>Vukixxx AI Workbench</h3>
      <p style={{ fontSize: 12, color: '#86868b', lineHeight: 1.5, marginBottom: 14 }}>
        Your AI brain. Powered by Dispatch + MCP.
      </p>

      {/* Quick Tips */}
      <div style={{ marginBottom: 12, padding: 12, background: 'rgba(0,113,227,0.06)', borderRadius: 10, border: '1px solid rgba(0,113,227,0.12)' }}>
        <div style={{ fontSize: 11, color: '#0071e3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Quick Tips</div>
        <ul style={{ fontSize: 12, color: '#444', margin: 0, paddingLeft: 16, lineHeight: 1.9 }}>
          <li><span style={{ color: '#1d1d1f', fontWeight: 600 }}>Task Queue</span> — dodaj zadatke, kopiraj za Dispatch</li>
          <li><span style={{ color: '#1d1d1f', fontWeight: 600 }}>Digest</span> — pregled projekata + CLAUDE.md generator</li>
          <li><span style={{ color: '#1d1d1f', fontWeight: 600 }}>Moj Profil</span> — postavi folderPath za Git sync</li>
          <li><span style={{ color: '#1d1d1f', fontWeight: 600 }}>MCP server</span> — pokreni vukixx-mcp za Claude Dispatch</li>
          <li><span style={{ color: '#1d1d1f', fontWeight: 600 }}>Memory Graph</span> — 3D vizualizacija prompt hijerarhije</li>
        </ul>
      </div>

      {/* Checklist pre rada */}
      <div style={{ marginBottom: 12, padding: 12, background: 'rgba(52,199,89,0.06)', borderRadius: 10, border: '1px solid rgba(52,199,89,0.18)' }}>
        <div style={{ fontSize: 11, color: '#34c759', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Checklist pre rada</div>
        {[
          'Firebase Firestore je aktivan',
          'MCP server pokrenut (vukixx-mcp)',
          'Claude Desktop konfigurisan sa MCP',
          'Profile popunjen (ime, stack, stil)',
          'Projekat ima folderPath polje',
          'Chrome extension šalje promptove',
          'Task Queue je prazan ili ažuriran',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#444', lineHeight: 2 }}>
            <span style={{ color: '#34c759', fontSize: 13, fontWeight: 700 }}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Kako koristiti */}
      <div style={{ marginBottom: 12, padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: '#1d1d1f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Kako koristiti sistem</div>
        {[
          { n: '1', label: 'Dodaj task', desc: 'U Task Queue kreiraj zadatak i kopiraj za Dispatch' },
          { n: '2', label: 'Pokreni Claude', desc: 'Zalepi u Claude Desktop — MCP automatski čita kontekst' },
          { n: '3', label: 'Claude piše nazad', desc: 'add_claude_log + complete_task ažuriraju Firebase i Git' },
        ].map(({ n, label, desc }) => (
          <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span style={{ minWidth: 20, height: 20, borderRadius: '50%', background: '#1d1d1f', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#86868b', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upozorenja */}
      <div style={{ padding: 12, background: 'rgba(255,149,0,0.06)', borderRadius: 10, border: '1px solid rgba(255,149,0,0.2)' }}>
        <div style={{ fontSize: 11, color: '#ff9500', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Na sta pazi</div>
        {[
          'Render server može zaspati (free tier) — podesi UptimeRobot ping na /healthz, interval 5 min → uptimerobot.com',
          'Git sync radi samo ako je folderPath validan git repo',
          'MCP server mora biti pokrenut pre Claude Dispatcha',
          'Firebase rules moraju dozvoliti write za claudeLogs i tasks',
          'completeTask ažurira nextStep samo za HIGH priority taskove',
        ].map((warn, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: '#555', lineHeight: 1.7 }}>
            <span style={{ color: '#ff9500', marginTop: 2 }}>!</span>
            <span>{warn}</span>
          </div>
        ))}
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

          {/* Profile */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
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
              <ProfileView />
            </motion.div>
          )}

          {/* Digest */}
          {activeTab === 'digest' && (
            <motion.div
              key="digest"
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
              <DigestView />
            </motion.div>
          )}

          {/* Nightly */}
          {activeTab === 'nightly' && (
            <motion.div
              key="nightly"
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
              <NightlyView />
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
