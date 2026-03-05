import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { parsePromptFile } from '@/lib/promptParser';
import { ALL_CATEGORIES, CATEGORY_CONFIG } from '@/types/categories';
import { useAIStore } from '@/stores/aiStore';
import { classifyPrompt } from '@/services/ai/classificationService';
import type { Prompt, PromptCategory } from '@/types';
import './PromptEditor.css';

interface PromptEditorProps {
  initialData?: Prompt | null;
  existingPrompts: Prompt[];
  onSave: (data: {
    id: string;
    label: string;
    category: PromptCategory;
    parent: string;
    content: string;
    bodyContent: string;
  }) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

interface FormData {
  id: string;
  label: string;
  category: PromptCategory;
  parent: string;
  content: string;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  initialData = null,
  existingPrompts = [],
  onSave,
  onCancel,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    label: '',
    category: 'other',
    parent: 'master',
    content: '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const getActiveProvider = useAIStore(s => s.getActiveProvider);

  const handleAutoClassify = useCallback(async () => {
    if (!formData.label && !formData.content) return;
    setIsClassifying(true);
    try {
      // Combine label and content for classification
      const contentToClassify = formData.label
        ? `${formData.label}\n\n${formData.content}`
        : formData.content;

      const result = await classifyPrompt(contentToClassify);

      setFormData(prev => ({
        ...prev,
        category: result.category,
      }));

      // Log additional classification info (tags & confidence)
      console.log('Classification result:', {
        category: result.category,
        tags: result.tags,
        confidence: result.confidence,
      });
    } catch (err) {
      console.warn('Auto-classify failed:', err);
    } finally {
      setIsClassifying(false);
    }
  }, [formData.label, formData.content]);

  useEffect(() => {
    if (initialData) {
      // Use gray-matter based parser instead of regex
      const parsed = parsePromptFile(initialData.content);

      setFormData({
        id: parsed.id || initialData.id || '',
        label: parsed.label || initialData.label || '',
        category: parsed.category || 'other',
        parent: parsed.parent || 'master',
        content: parsed.bodyContent || '',
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const generateId = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  };

  const handleLabelChange = (value: string) => {
    handleChange('label', value);
    if (mode === 'create' && !formData.id) {
      handleChange('id', generateId(value));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string | null> = {};

    if (!formData.id.trim()) {
      newErrors.id = 'ID is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = 'ID can only contain lowercase letters, numbers, and hyphens';
    } else if (mode === 'create' && existingPrompts.some(p => p.id === formData.id)) {
      newErrors.id = 'A prompt with this ID already exists';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const markdown = `---
id: ${formData.id}
label: ${formData.label}
parent: ${formData.parent}
category: ${formData.category}
---

${formData.content}`;

    try {
      onSave({
        id: formData.id,
        label: formData.label,
        category: formData.category as PromptCategory,
        parent: formData.parent,
        content: markdown,
        bodyContent: formData.content,
      });
    } catch (error) {
      console.error('Failed to save prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const parentOptions = useMemo(() => [
    { value: 'master', label: 'Master (Root)' },
    ...existingPrompts
      .filter(p => p.id !== formData.id)
      .map(p => ({ value: p.id, label: p.label })),
  ], [existingPrompts, formData.id]);

  const categoryOptions = ALL_CATEGORIES.map(cat => ({
    value: cat,
    label: CATEGORY_CONFIG[cat].label,
  }));

  return (
    <div className="prompt-editor">
      <div className="editor-header">
        <h3>{mode === 'create' ? 'New Prompt' : 'Edit Prompt'}</h3>
        <p className="editor-subtitle">
          {mode === 'create'
            ? 'Create a new prompt for your knowledge base'
            : 'Modify the prompt content and metadata'}
        </p>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label>Label</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g., API Documentation"
            className={errors.label ? 'error' : ''}
          />
          {errors.label && <span className="error-text">{errors.label}</span>}
        </div>

        <div className="form-group">
          <label>ID <span className="label-hint">(used for references)</span></label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="e.g., api-documentation"
            className={errors.id ? 'error' : ''}
            disabled={mode === 'edit'}
          />
          {errors.id && <span className="error-text">{errors.id}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label>Category</label>
              <button
                type="button"
                className="auto-classify-btn"
                onClick={handleAutoClassify}
                disabled={isClassifying || (!formData.label && !formData.content)}
                title="Auto-classify with AI"
              >
                {isClassifying ? <span className="spinner" /> : <Sparkles size={12} />}
                {isClassifying ? 'Classifying...' : 'Auto'}
              </button>
            </div>
            <div className="select-wrapper">
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {categoryOptions.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <div className="form-group">
            <label>Parent</label>
            <div className="select-wrapper">
              <select
                value={formData.parent}
                onChange={(e) => handleChange('parent', e.target.value)}
              >
                {parentOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>
        </div>

        <div className="form-group content-group">
          <label>Content <span className="label-hint">(Markdown supported)</span></label>
          <textarea
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="# Your Prompt Title

Write your prompt content here...

## Instructions
- Use markdown formatting
- Add code blocks with ```
- Create lists and headers"
            className={errors.content ? 'error' : ''}
          />
          {errors.content && <span className="error-text">{errors.content}</span>}
        </div>
      </div>

      <div className="editor-footer">
        <button className="btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : (mode === 'create' ? 'Create Prompt' : 'Save Changes')}
        </button>
      </div>
    </div>
  );
};
