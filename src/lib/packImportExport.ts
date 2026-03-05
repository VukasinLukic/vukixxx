import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import type { MemoryPack, Prompt, SystemRole } from '@/types';

/**
 * Pack export format for sharing packs between users or backing up
 */
export interface PackExportFormat {
  version: '1.0';
  pack: MemoryPack;
  prompts: Prompt[];
  systemRole?: SystemRole;
  exportedAt: string;
}

/**
 * Export a memory pack to a JSON file
 * Includes all pack metadata, prompts, and optional system role
 */
export async function exportPackToFile(
  pack: MemoryPack,
  prompts: Map<string, Prompt>,
  role?: SystemRole
): Promise<void> {
  const exportData: PackExportFormat = {
    version: '1.0',
    pack,
    prompts: pack.promptIds.map(id => prompts.get(id)!).filter(Boolean),
    systemRole: role,
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(exportData, null, 2);

  // Open save dialog
  const filePath = await save({
    filters: [{
      name: 'Vukixxx Pack',
      extensions: ['vukixxx-pack.json', 'json']
    }],
    defaultPath: `${sanitizeFilename(pack.name)}.vukixxx-pack.json`,
  });

  if (filePath) {
    await writeTextFile(filePath, json);
  }
}

/**
 * Import a memory pack from a JSON file
 * Returns the parsed pack data for processing by the store
 */
export async function importPackFromFile(): Promise<PackExportFormat | null> {
  // Open file picker
  const filePath = await open({
    filters: [{
      name: 'Vukixxx Pack',
      extensions: ['vukixxx-pack.json', 'json']
    }],
    multiple: false,
  });

  if (!filePath) return null;

  // Read and parse file
  const content = await readTextFile(filePath as string);
  const data = JSON.parse(content) as PackExportFormat;

  // Validate structure
  if (!data.version || data.version !== '1.0') {
    throw new Error('Unsupported pack format version');
  }

  if (!data.pack || !data.prompts) {
    throw new Error('Invalid pack format: missing required fields');
  }

  return data;
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '-')           // Replace spaces with dash
    .replace(/^\./, '_')            // Replace leading dot
    .substring(0, 200);             // Limit length
}
