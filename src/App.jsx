import { useState, useEffect, useCallback } from 'react';
import { Dock } from './components/layout/Dock';
import { DraggablePanel } from './components/ui/DraggablePanel';
import { MemoryGraph } from './components/memory/MemoryGraph';
import { PromptBrowser } from './components/prompts/PromptBrowser';
import { PromptViewer } from './components/prompts/PromptViewer';
import { PromptEditor } from './components/prompts/PromptEditor';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [prompts, setPrompts] = useState([]);
    const [topZIndex, setTopZIndex] = useState(100);

    // Toast notifications
    const { toasts, removeToast, success } = useToast();

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Dynamic Panel State
    const [panels, setPanels] = useState({
        welcome: {
            id: 'welcome',
            title: 'Dobrodosli - Vukixxx',
            visible: true,
            initialPosition: { x: 50, y: 50 },
            width: 400,
            height: 'auto',
            zIndex: 10
        },
        browser: {
            id: 'browser',
            title: 'Baza Promptova',
            visible: false,
            initialPosition: { x: 100, y: 100 },
            width: 850,
            height: 520,
            zIndex: 11
        }
    });

    // State to track dynamically opened prompt windows
    const [promptWindows, setPromptWindows] = useState([]);

    // State for editor panel
    const [editorPanel, setEditorPanel] = useState(null);

    // Load prompts on mount
    useEffect(() => {
        const modules = import.meta.glob('./prompts/*.md', { query: '?raw', import: 'default', eager: true });
        const loadedPrompts = [];
        for (const path in modules) {
            const content = modules[path];
            const idMatch = content.match(/id:\s*(.*)/);
            const labelMatch = content.match(/label:\s*(.*)/);
            const categoryMatch = content.match(/category:\s*(.*)/);

            const id = idMatch ? idMatch[1].trim() : path;
            const label = labelMatch ? labelMatch[1].trim() : path.split('/').pop();
            const category = categoryMatch ? categoryMatch[1].trim() : 'other';

            loadedPrompts.push({ id, label, category, content });
        }
        setPrompts(loadedPrompts);
    }, []);

    // Bring panel to front
    const bringToFront = useCallback((panelId, isPromptWindow = false) => {
        const newZ = topZIndex + 1;
        setTopZIndex(newZ);

        if (isPromptWindow) {
            setPromptWindows(prev => prev.map(w =>
                w.id === panelId ? { ...w, zIndex: newZ } : w
            ));
        } else if (panelId === 'editor' && editorPanel) {
            setEditorPanel(prev => prev ? { ...prev, zIndex: newZ } : null);
        } else {
            setPanels(prev => ({
                ...prev,
                [panelId]: { ...prev[panelId], zIndex: newZ }
            }));
        }
    }, [topZIndex, editorPanel]);

    const closePanel = (id) => {
        setPanels(prev => ({
            ...prev,
            [id]: { ...prev[id], visible: false }
        }));
    };

    const closePromptWindow = (id) => {
        setPromptWindows(prev => prev.filter(w => w.id !== id));
    };

    // Handle edit prompt - open editor with existing data
    const handleEditPrompt = useCallback((prompt) => {
        const newZ = topZIndex + 1;
        setTopZIndex(newZ);

        setEditorPanel({
            id: 'editor',
            title: `Edit: ${prompt.label}`,
            initialPosition: { x: 200, y: 80 },
            width: 500,
            height: 580,
            zIndex: newZ,
            mode: 'edit',
            data: prompt
        });
    }, [topZIndex]);

    // Handle delete prompt - show confirmation
    const handleDeletePrompt = useCallback((promptId) => {
        const prompt = prompts.find(p => p.id === promptId);
        if (prompt) {
            setDeleteConfirm({
                promptId,
                promptLabel: prompt.label
            });
        }
    }, [prompts]);

    // Confirm delete action
    const confirmDelete = useCallback(() => {
        if (!deleteConfirm) return;

        const { promptId, promptLabel } = deleteConfirm;

        // Remove from prompts state
        setPrompts(prev => prev.filter(p => p.id !== promptId));

        // Close related windows
        setPromptWindows(prev => prev.filter(w => w.id !== promptId));

        // Close editor if editing this prompt
        if (editorPanel?.data?.id === promptId) {
            setEditorPanel(null);
        }

        // Show toast
        success(`"${promptLabel}" deleted`);

        // Clear confirmation
        setDeleteConfirm(null);
    }, [deleteConfirm, editorPanel, success]);

    // Cancel delete
    const cancelDelete = useCallback(() => {
        setDeleteConfirm(null);
    }, []);

    // Handle copy success - show toast
    const handleCopySuccess = useCallback((message) => {
        success(message);
    }, [success]);

    // Open prompt viewer with full prompt object and callbacks
    const handleOpenPrompt = useCallback((prompt) => {
        // Check if already open - bring to front instead
        const existing = promptWindows.find(w => w.id === prompt.id);
        if (existing) {
            bringToFront(prompt.id, true);
            return;
        }

        const newZ = topZIndex + 1;
        setTopZIndex(newZ);

        setPromptWindows(prev => [
            ...prev,
            {
                id: prompt.id,
                title: prompt.label,
                prompt: prompt, // Store the full prompt
                initialPosition: { x: 180 + (prev.length * 30), y: 120 + (prev.length * 30) },
                width: 520,
                height: 450,
                zIndex: newZ
            }
        ]);
    }, [topZIndex, bringToFront, promptWindows]);

    // Handle node selection from memory graph
    const handleNodeSelect = useCallback((node) => {
        if (node && node.id) {
            const prompt = prompts.find(p => p.id === node.id);
            if (prompt) {
                handleOpenPrompt(prompt);
            }
        }
    }, [prompts, handleOpenPrompt]);

    // Open editor for creating new prompt
    const handleAddPrompt = useCallback(() => {
        const newZ = topZIndex + 1;
        setTopZIndex(newZ);

        setEditorPanel({
            id: 'editor',
            title: 'New Prompt',
            initialPosition: { x: 200, y: 80 },
            width: 500,
            height: 580,
            zIndex: newZ,
            mode: 'create',
            data: null
        });
    }, [topZIndex]);

    // Handle saving prompt (create or edit)
    const handleSavePrompt = useCallback((promptData) => {
        if (editorPanel?.mode === 'edit') {
            // Update existing prompt
            setPrompts(prev => prev.map(p =>
                p.id === promptData.id
                    ? {
                        id: promptData.id,
                        label: promptData.label,
                        category: promptData.category,
                        content: promptData.content
                    }
                    : p
            ));

            // Update open window if exists
            setPromptWindows(prev => prev.map(w =>
                w.id === promptData.id
                    ? {
                        ...w,
                        title: promptData.label,
                        prompt: {
                            id: promptData.id,
                            label: promptData.label,
                            category: promptData.category,
                            content: promptData.content
                        }
                    }
                    : w
            ));

            success(`"${promptData.label}" updated`);
        } else {
            // Create new prompt
            const newPrompt = {
                id: promptData.id,
                label: promptData.label,
                category: promptData.category,
                content: promptData.content
            };

            setPrompts(prev => [...prev, newPrompt]);

            // Open the newly created prompt
            handleOpenPrompt(newPrompt);

            success(`"${promptData.label}" created`);
        }

        // Close the editor
        setEditorPanel(null);
    }, [editorPanel?.mode, success, handleOpenPrompt]);

    // Close editor
    const handleCloseEditor = useCallback(() => {
        setEditorPanel(null);
    }, []);

    // Show browser when prompts tab is active
    useEffect(() => {
        if (activeTab === 'prompts') {
            setPanels(prev => ({ ...prev, browser: { ...prev.browser, visible: true } }));
        }
    }, [activeTab]);

    // Welcome panel content
    const WelcomeContent = (
        <div style={{ padding: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
            <h3 style={{ marginBottom: 12, fontSize: 17, fontWeight: 600, color: '#1d1d1f' }}>Vukixxx AI Assistant</h3>
            <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.6 }}>
                Dobrodosli u vas AI asistent. Koristite Dock ispod za navigaciju.
            </p>
            <div style={{ marginTop: 16, padding: 14, background: 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#1d1d1f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Tips</div>
                <ul style={{ fontSize: 13, color: '#86868b', marginTop: 10, paddingLeft: 18, lineHeight: 1.8 }}>
                    <li><span style={{ color: '#1d1d1f' }}>Memory Core</span> - Vizualizacija prompt hijerarhije</li>
                    <li><span style={{ color: '#1d1d1f' }}>Prompts</span> - Pretrazivanje i upravljanje promptovima</li>
                    <li><span style={{ color: '#1d1d1f' }}>Copy TOON</span> - Kopiraj prompt u kompresovanom formatu</li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            {/* Memory Graph Background */}
            {activeTab === 'memory' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <MemoryGraph
                        onNodeSelect={handleNodeSelect}
                        onAddPrompt={handleAddPrompt}
                    />
                </div>
            )}

            {/* Panels Layer */}
            <div
                className="panels-layer"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 'calc(100% - 80px)',
                    pointerEvents: 'none',
                    zIndex: 50
                }}
            >
                {/* Static Panels */}
                {Object.values(panels).map(panel => (
                    panel.visible && (
                        <DraggablePanel
                            key={panel.id}
                            title={panel.title}
                            initialPosition={panel.initialPosition}
                            width={panel.width}
                            height={panel.height}
                            zIndex={panel.zIndex}
                            onClose={() => closePanel(panel.id)}
                            onFocus={() => bringToFront(panel.id, false)}
                            className="pointer-events-auto"
                        >
                            {panel.id === 'browser' ? (
                                <PromptBrowser
                                    prompts={prompts}
                                    onSelectPrompt={handleOpenPrompt}
                                    onAddPrompt={handleAddPrompt}
                                />
                            ) : panel.id === 'welcome' ? (
                                WelcomeContent
                            ) : (
                                panel.content
                            )}
                        </DraggablePanel>
                    )
                ))}

                {/* Dynamic Prompt Windows */}
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

                {/* Editor Panel */}
                {editorPanel && (
                    <DraggablePanel
                        key="editor"
                        title={editorPanel.title}
                        initialPosition={editorPanel.initialPosition}
                        width={editorPanel.width}
                        height={editorPanel.height}
                        zIndex={editorPanel.zIndex}
                        onClose={handleCloseEditor}
                        onFocus={() => bringToFront('editor', false)}
                        className="pointer-events-auto"
                    >
                        <PromptEditor
                            mode={editorPanel.mode}
                            initialData={editorPanel.data}
                            existingPrompts={prompts}
                            onSave={handleSavePrompt}
                            onCancel={handleCloseEditor}
                        />
                    </DraggablePanel>
                )}
            </div>

            {/* Dock Navigation */}
            <div style={{ zIndex: 1000, position: 'relative' }}>
                <Dock activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                title="Delete Prompt"
                message={`Are you sure you want to delete "${deleteConfirm?.promptLabel}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                variant="danger"
            />

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

export default App;
