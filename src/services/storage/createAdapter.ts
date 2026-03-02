import type { StorageAdapter } from './StorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { TauriFileAdapter } from './TauriFileAdapter';

/**
 * Detect if running inside Tauri and return the appropriate storage adapter.
 * - Tauri: Uses file system via Rust commands (prompts as .md files)
 * - Browser: Uses IndexedDB via Dexie.js
 *
 * Note: TauriFileAdapter is always imported but its invoke() calls
 * only execute when actually running in Tauri. The @tauri-apps/api
 * package is installed so the import resolves in all environments.
 */
export function createStorageAdapter(): StorageAdapter {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return new TauriFileAdapter();
  }
  return new IndexedDBAdapter();
}
