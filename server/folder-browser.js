// Lets the summon form browse the machine's folders, so an agent can be started in any
// folder, not only the repositories found under the workspace root.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/** The absolute, normalised path when `raw` names an existing directory, else null. `~` means home. */
export async function resolveFolder(raw) {
  let dir = String(raw || '').trim();
  if (dir === '~' || dir.startsWith('~/')) dir = path.join(os.homedir(), dir.slice(1));
  if (!path.isAbsolute(dir)) return null;
  dir = path.resolve(dir);
  try {
    return (await fs.stat(dir)).isDirectory() ? dir : null;
  } catch {
    return null;
  }
}

/**
 * One level of the folder tree: { path, parent, folders: [{ name, path }] }.
 * Starts at the home folder; hidden folders are left out. Null when `raw` is not a readable folder.
 */
export async function listFolder(raw) {
  const dir = raw ? await resolveFolder(raw) : os.homedir();
  if (!dir) return null;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null; // no permission to read it
  }
  const folders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => ({ name: e.name, path: path.join(dir, e.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const parent = path.dirname(dir);
  return { path: dir, parent: parent === dir ? null : parent, folders };
}
