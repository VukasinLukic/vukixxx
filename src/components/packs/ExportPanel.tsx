import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { usePackStore } from '@/stores/packStore';
import { usePromptStore } from '@/stores/promptStore';
import { useRoleStore } from '@/stores/roleStore';
import type { MemoryPack } from '@/types';

interface ExportPanelProps {
  pack: MemoryPack;
  onCopySuccess: (message: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ pack, onCopySuccess }) => {
  const [copied, setCopied] = useState(false);
  const prompts = usePromptStore(s => s.prompts);
  const exportPack = usePackStore(s => s.exportPack);
  const setExportFormat = usePackStore(s => s.setExportFormat);
  const roles = useRoleStore(s => s.roles);

  const roleContent = pack.systemRoleId
    ? roles.get(pack.systemRoleId)?.content
    : undefined;

  const result = useMemo(
    () => exportPack(pack.id, prompts, roleContent),
    [exportPack, pack.id, pack.promptIds, pack.exportFormat, pack.systemRoleId, prompts, roleContent]
  );

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      onCopySuccess(`Pack "${pack.name}" copied to clipboard (${result.tokenCount} tokens)`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = result.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      onCopySuccess(`Pack "${pack.name}" copied`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formats: { value: MemoryPack['exportFormat']; label: string }[] = [
    { value: 'toon', label: 'TOON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'both', label: 'Both' },
  ];

  return (
    <div className="export-panel">
      <div className="export-format-tabs">
        {formats.map(f => (
          <button
            key={f.value}
            className={`export-format-tab ${pack.exportFormat === f.value ? 'active' : ''}`}
            onClick={() => setExportFormat(pack.id, f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="export-preview">
        {result
          ? result.content.slice(0, 800) + (result.content.length > 800 ? '\n...' : '')
          : 'No prompts in pack'}
      </div>

      <div className="export-actions">
        <button
          className={`copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={!result}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : `Copy to Clipboard${result ? ` (${result.tokenCount} tokens)` : ''}`}
        </button>
      </div>
    </div>
  );
};
