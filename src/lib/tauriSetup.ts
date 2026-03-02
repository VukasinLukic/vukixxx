/**
 * Tauri-specific initialization.
 * Registers global shortcuts and tray navigation callback.
 * Only runs when inside Tauri environment.
 */
export async function initTauri(navigateTo: (tab: string) => void): Promise<void> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return;
  }

  // Set up tray navigation callback
  (window as Record<string, unknown>).__TAURI_NAVIGATE__ = navigateTo;

  try {
    const { register } = await import('@tauri-apps/plugin-global-shortcut');

    // Ctrl+Shift+V = Show app and go to Memory Packs
    await register('CmdOrCtrl+Shift+V', () => {
      navigateTo('packs');
    });

    // Ctrl+Shift+C = Copy last pack (handled in the app)
    await register('CmdOrCtrl+Shift+C', () => {
      window.dispatchEvent(new CustomEvent('tauri:quick-copy'));
    });
  } catch (e) {
    console.warn('Failed to register global shortcuts:', e);
  }
}
