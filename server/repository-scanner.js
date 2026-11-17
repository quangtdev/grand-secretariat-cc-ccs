// Finds git repositories under the workspace root for the summon form,
// plus the configured plain working folders (GRAND_SECRETARIAT_FOLDERS), listed first.
import fs from 'node:fs/promises';
import path from 'node:path';
import { WORKSPACE_ROOT, WORKING_FOLDERS } from './config.js';

const MAX_DEPTH = 4;
const SKIP = new Set(['node_modules', 'target', 'dist', 'build', 'vendor', 'venv']);
const CACHE_MS = 30_000;

let cache = { at: 0, repos: [] };

async function walk(dir, depth, found) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // unreadable folder: skip it
  }
  if (entries.some((e) => e.name === '.git')) {
    const rel = path.relative(WORKSPACE_ROOT, dir);
    found.push({ path: dir, name: path.basename(dir), group: path.dirname(rel) === '.' ? '' : path.dirname(rel) });
  }
  if (depth >= MAX_DEPTH) return;
  await Promise.all(entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !SKIP.has(e.name))
    .map((e) => walk(path.join(dir, e.name), depth + 1, found)));
}

/** Configured working folders that exist and are directories, in the configured order. */
async function listWorkingFolders() {
  const folders = await Promise.all(WORKING_FOLDERS.map(async (dir) => {
    try {
      return (await fs.stat(dir)).isDirectory() ? { path: dir, name: path.basename(dir), group: 'folders' } : null;
    } catch {
      return null; // missing folder: leave it out
    }
  }));
  return folders.filter(Boolean);
}

/** Returns [{ path, name, group }]: working folders first, then repositories sorted by group then name. */
export async function listRepositories() {
  if (Date.now() - cache.at < CACHE_MS) return cache.repos;
  const found = [];
  await walk(WORKSPACE_ROOT, 0, found);
  found.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  const repos = [...await listWorkingFolders(), ...found];
  cache = { at: Date.now(), repos };
  return repos;
}
