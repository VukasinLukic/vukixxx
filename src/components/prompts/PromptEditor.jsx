import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './PromptEditor.css';

const CATEGORIES = [
    { value: 'core', label: 'Core' },
    { value: 'design', label: 'Design' },
    { value: 'backend', label: 'Backend' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' }
];

export const PromptEditor = ({
    initialData = null,
    existingPrompts = [],
    onSave,
    onCancel,
    mode = 'create' // 'create' or 'edit'
}) => {
    const [formData, setFormData] = useState({
        id: '',
        label: '',
        category: 'other',
        parent: 'master',
        content: ''
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Parse existing prompt content
            const idMatch = initialData.content?.match(/id:\s*(.*)/);
            const labelMatch = initialData.content?.match(/label:\s*(.*)/);
            const categoryMatch = initialData.content?.match(/category:\s*(.*)/);
            const parentMatch = initialData.content?.match(/parent:\s*(.*)/);

            // Extract markdown content (after frontmatter)
            const contentMatch = initialData.content?.match(/---[\s\S]*?---\n([\s\S]*)/);

            setFormData({
                id: idMatch ? idMatch[1].trim() : initialData.id || '',
                label: labelMatch ? labelMatch[1].trim() : initialData.label || '',
                category: categoryMatch ? categoryMatch[1].trim() : 'other',
                parent: parentMatch ? parentMatch[1].trim() : 'master',
                content: contentMatch ? contentMatch[1].trim() : ''
            });
        }
    }, [initialData]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const generateId = (label) => {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30);
    };

    const handleLabelChange = (value) => {
        handleChange('label', value);
        // Auto-generate ID from label if creating new
        if (mode === 'create' && !formData.id) {
            handleChange('id', generateId(value));
        }
    };

    const validate = () => {
        const newErrors = {};

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

        // Generate markdown with frontmatter
        const markdown = `---
id: ${formData.id}
label: ${formData.label}
parent: ${formData.parent}
category: ${formData.category}
---

${formData.content}`;

        try {
            if (onSave) {
                await onSave({
                    id: formData.id,
                    label: formData.label,
                    category: formData.category,
                    parent: formData.parent,
                    content: markdown,
                    rawContent: formData.content
                });
            }
        } catch (error) {
            console.error('Failed to save prompt:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Get available parent options (existing prompts + master)
    const parentOptions = [
        { value: 'master', label: 'Master (Root)' },
        ...existingPrompts
            .filter(p => p.id !== formData.id)
            .map(p => ({ value: p.id, label: p.label }))
    ];

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
                {/* Label */}
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

                {/* ID */}
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

                {/* Category & Parent Row */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Category</label>
                        <div className="select-wrapper">
                            <select
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                            >
                                {CATEGORIES.map(cat => (
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

                {/* Content */}
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
                <button
                    className="btn-secondary"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : (mode === 'create' ? 'Create Prompt' : 'Save Changes')}
                </button>
            </div>
        </div>
    );
};
