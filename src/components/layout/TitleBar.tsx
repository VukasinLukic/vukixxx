import React, { useCallback } from 'react';
import { Minus, Square, X } from 'lucide-react';
import './TitleBar.css';

/**
 * Custom title bar for Tauri frameless window.
 * Only renders when running inside Tauri (decorations: false).
 */
export const TitleBar: React.FC = () => {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  const handleMinimize = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    getCurrentWindow().minimize();
  }, []);

  const handleMaximize = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    const isMaximized = await win.isMaximized();
    if (isMaximized) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }, []);

  const handleClose = useCallback(async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    getCurrentWindow().close();
  }, []);

  if (!isTauri) return null;

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="titlebar-title" data-tauri-drag-region>
        Vukixxx
      </div>
      <div className="titlebar-buttons">
        <button className="titlebar-btn minimize" onClick={handleMinimize} title="Minimize">
          <Minus size={12} />
        </button>
        <button className="titlebar-btn maximize" onClick={handleMaximize} title="Maximize">
          <Square size={10} />
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="Close">
          <X size={12} />
        </button>
      </div>
    </div>
  );
};
