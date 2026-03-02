import type { StorageAdapter } from './StorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';

export function createStorageAdapter(): StorageAdapter {
  // Future: detect Tauri environment and return TauriFileAdapter
  // if (window.__TAURI__) {
  //   return new TauriFileAdapter(getPromptsDir());
  // }
  return new IndexedDBAdapter();
}
