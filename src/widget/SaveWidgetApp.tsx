import React, { useState, useCallback, useEffect } from 'react';
import { X, Maximize2, GripVertical, Save, Sparkles, Loader2, Check, AlertCircle, Edit3 } from 'lucide-react';
import { classifyPrompt, generatePromptTitle, getConfidenceColor, getConfidenceLabel } from '@/services/ai/classificationService';
import { useAIStore } from '@/stores/aiStore';
import { usePromptLoader } from '@/hooks/usePromptLoader';
import type { PromptCategory } from '@/types';
import './SaveWidgetApp.css';

type SaveStep = 'input' | 'classifying' | 'review' | 'saving' | 'success' | 'error';

const CATEGORIES: PromptCategory[] = ['core', 'design', 'backend', 'marketing', 'other'];

export const SaveWidgetApp: React.FC = () => {
    const [step, setStep] = useState<SaveStep>('input');
    const [promptText, setPromptText] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<PromptCategory>('other');
    const [tags, setTags] = useState<string[]>([]);
    const [tagsInput, setTagsInput] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [savedCount, setSavedCount] = useState(0);

    const { addPrompt } = usePromptLoader();

    // Load AI provider settings from disk (save widget is a separate window with its own JS context)
    useEffect(() => {
        console.log('🔧 [SaveWidget] Loading AI provider settings from disk...');
        useAIStore.getState().loadProvidersFromDisk();
    }, []);

    const handleClassify = useCallback(async () => {
        if (!promptText.trim()) return;

        setStep('classifying');
        setErrorMsg('');

        try {
            // Run classification and title generation in parallel
            const [classification, generatedTitle] = await Promise.all([
                classifyPrompt(promptText),
                generatePromptTitle(promptText),
            ]);

            setTitle(generatedTitle);
            setCategory(classification.category);
            setTags(classification.tags);
            setTagsInput(classification.tags.join(', '));
            setConfidence(classification.confidence);
            setStep('review');
        } catch (err) {
            console.error('Classification failed:', err);
            // Fallback: let user fill in manually
            setTitle('');
            setCategory('other');
            setTags([]);
            setTagsInput('');
            setConfidence(0);
            setErrorMsg(err instanceof Error ? err.message : 'AI classification failed. Fill in manually.');
            setStep('review');
        }
    }, [promptText]);

    const handleSave = useCallback(async () => {
        if (!promptText.trim() || !title.trim()) return;

        setStep('saving');

        try {
            const finalTags = tagsInput
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            const id = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .slice(0, 50)
                + '-' + Date.now().toString(36);

            await addPrompt({
                id,
                label: title,
                category,
                tags: finalTags,
                bodyContent: promptText,
            });

            setSavedCount(prev => prev + 1);
            setStep('success');

            // Auto-reset after 2 seconds
            setTimeout(() => {
                setPromptText('');
                setTitle('');
                setCategory('other');
                setTags([]);
                setTagsInput('');
                setConfidence(0);
                setErrorMsg('');
                setStep('input');
            }, 2000);
        } catch (err) {
            console.error('Save failed:', err);
            setErrorMsg(err instanceof Error ? err.message : 'Failed to save prompt');
            setStep('error');
        }
    }, [promptText, title, category, tagsInput, addPrompt]);

    const handleReset = useCallback(() => {
        setPromptText('');
        setTitle('');
        setCategory('other');
        setTags([]);
        setTagsInput('');
        setConfidence(0);
        setErrorMsg('');
        setStep('input');
    }, []);

    const handleOpenApp = useCallback(async () => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('show_main_window');
        } catch (e) {
            console.warn('Failed to open main app:', e);
        }
    }, []);

    const handleClose = useCallback(async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            getCurrentWindow().hide();
        } catch (e) {
            console.warn('Failed to hide widget:', e);
        }
    }, []);

    return (
        <div className="widget-container save-widget">
            <div className="widget-header" data-tauri-drag-region>
                <div className="widget-drag-handle" data-tauri-drag-region>
                    <GripVertical size={12} />
                </div>
                <span className="widget-header-title" data-tauri-drag-region>
                    <Sparkles size={11} style={{ marginRight: 4 }} />
                    Save Prompt
                </span>
                <div className="widget-header-actions">
                    <button className="widget-header-btn" onClick={handleOpenApp} title="Open App">
                        <Maximize2 size={12} />
                    </button>
                    <button className="widget-header-btn close" onClick={handleClose} title="Hide Widget">
                        <X size={12} />
                    </button>
                </div>
            </div>

            <div className="widget-body">
                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="save-input-section">
                        <textarea
                            className="save-textarea"
                            placeholder="Paste your prompt here...&#10;&#10;AI will automatically generate a title, category, and tags."
                            value={promptText}
                            onChange={e => setPromptText(e.target.value)}
                            autoFocus
                        />
                        <div className="save-actions">
                            <span className="save-char-count">{promptText.length} chars</span>
                            <button
                                className="save-classify-btn"
                                onClick={handleClassify}
                                disabled={!promptText.trim()}
                            >
                                <Sparkles size={12} />
                                Classify & Save
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Classifying */}
                {step === 'classifying' && (
                    <div className="save-loading">
                        <Loader2 size={24} className="save-spinner" />
                        <span>AI is analyzing your prompt...</span>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 'review' && (
                    <div className="save-review-section">
                        {errorMsg && (
                            <div className="save-error-banner">
                                <AlertCircle size={12} />
                                {errorMsg}
                            </div>
                        )}

                        {confidence > 0 && (
                            <div className="save-confidence">
                                <span style={{ color: getConfidenceColor(confidence) }}>
                                    ● {getConfidenceLabel(confidence)} confidence ({Math.round(confidence * 100)}%)
                                </span>
                            </div>
                        )}

                        <div className="save-field">
                            <label>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Enter prompt title..."
                                autoFocus
                            />
                        </div>

                        <div className="save-field">
                            <label>Category</label>
                            <div className="save-category-chips">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        className={`save-chip ${category === cat ? 'active' : ''}`}
                                        onClick={() => setCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="save-field">
                            <label>Tags</label>
                            <input
                                type="text"
                                value={tagsInput}
                                onChange={e => setTagsInput(e.target.value)}
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>

                        <div className="save-preview-text">
                            <label>Prompt preview</label>
                            <pre>{promptText.slice(0, 200)}{promptText.length > 200 ? '...' : ''}</pre>
                        </div>

                        <div className="save-review-actions">
                            <button className="save-back-btn" onClick={handleReset}>
                                ← Back
                            </button>
                            <button
                                className="save-confirm-btn"
                                onClick={handleSave}
                                disabled={!title.trim()}
                            >
                                <Save size={12} />
                                Save Prompt
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Saving */}
                {step === 'saving' && (
                    <div className="save-loading">
                        <Loader2 size={24} className="save-spinner" />
                        <span>Saving prompt...</span>
                    </div>
                )}

                {/* Step 5: Success */}
                {step === 'success' && (
                    <div className="save-success">
                        <Check size={32} className="save-success-icon" />
                        <span>Prompt saved!</span>
                        <span className="save-success-sub">Total saved this session: {savedCount}</span>
                    </div>
                )}

                {/* Step 6: Error */}
                {step === 'error' && (
                    <div className="save-error">
                        <AlertCircle size={32} className="save-error-icon" />
                        <span>Failed to save</span>
                        <span className="save-error-detail">{errorMsg}</span>
                        <button className="save-back-btn" onClick={() => setStep('review')}>
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            <div className="widget-footer">
                <button className="widget-open-app-btn" onClick={handleOpenApp}>
                    Open Vukixxx
                </button>
            </div>

            <div className="widget-resize-indicator" title="Drag to resize"></div>
        </div>
    );
};
