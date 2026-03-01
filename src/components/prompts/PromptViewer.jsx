import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, FileText, Edit3, Trash2 } from 'lucide-react';
import { promptToTOON, getTOONStats } from '../../lib/toonConverter';
import './PromptViewer.css';

export const PromptViewer = ({ prompt, onEdit, onDelete, onCopySuccess }) => {
    const [copyFeedback, setCopyFeedback] = useState(null);

    // Handle copy as Markdown
    const handleCopyMarkdown = async () => {
        try {
            await navigator.clipboard.writeText(prompt.content);
            setCopyFeedback('markdown');
            onCopySuccess?.('Copied as Markdown');
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Handle copy as TOON format
    const handleCopyTOON = async () => {
        try {
            const toon = promptToTOON(prompt);
            await navigator.clipboard.writeText(toon);
            setCopyFeedback('toon');
            const stats = getTOONStats(prompt);
            onCopySuccess?.(`Copied as TOON (${stats.savingsPercent}% smaller)`);
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Get content for display (remove frontmatter)
    const displayContent = prompt.content?.replace(/^---[\s\S]*?---\n?/, '') || '';

    return (
        <div className="prompt-viewer">
            {/* Metadata header */}
            <div className="viewer-header">
                <div className="prompt-meta">
                    <span className="meta-category">{prompt.category}</span>
                    <span className="meta-id">{prompt.id}</span>
                </div>
            </div>

            {/* Markdown content */}
            <div className="markdown-body">
                <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>

            {/* Footer with actions */}
            <div className="viewer-footer">
                <div className="copy-buttons">
                    <button
                        className={`action-btn ${copyFeedback === 'markdown' ? 'copied' : ''}`}
                        onClick={handleCopyMarkdown}
                        title="Copy raw markdown"
                    >
                        <Copy size={14} />
                        {copyFeedback === 'markdown' ? 'Copied!' : 'Markdown'}
                    </button>
                    <button
                        className={`action-btn toon ${copyFeedback === 'toon' ? 'copied' : ''}`}
                        onClick={handleCopyTOON}
                        title="Copy as TOON format (60% smaller)"
                    >
                        <FileText size={14} />
                        {copyFeedback === 'toon' ? 'Copied!' : 'TOON'}
                    </button>
                </div>

                <div className="action-buttons">
                    {onEdit && (
                        <button className="action-btn" onClick={onEdit} title="Edit prompt">
                            <Edit3 size={14} />
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button className="action-btn danger" onClick={onDelete} title="Delete prompt">
                            <Trash2 size={14} />
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
