// Which transcript files the ink reader may open. The path arrives in a scribe's own hook
// payload; it is accepted only when its real path is a `.jsonl` file inside a Claude Code
// `projects` folder: `$CLAUDE_CONFIG_DIR/projects`, `~/.claude/projects`, or a ccs profile's
// `~/.ccs/instances/<profile>/projects`. Anything else (a stray `.jsonl` elsewhere, a symlink
// pointing out of those folders) is refused.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** True when `child` lies strictly inside `parent` (both absolute, already resolved). */
const isInside = (parent, child) => {
  const rel = path.relative(parent, child);
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/** Real path of a folder, or the folder itself when it does not exist (yet). */
const resolved = async (dir) => fs.promises.realpath(dir).catch(() => path.resolve(dir));

/**
 * Builds the default check. `home` and `configDir` are parameters so tests can point them
 * at a scratch folder. Folder real paths are worked out once and cached.
 */
export function claudeProjectsGuard({ home = os.homedir(), configDir = process.env.CLAUDE_CONFIG_DIR } = {}) {
  let roots = null;
  const rootsOnce = () => (roots ??= Promise.all([
    resolved(path.join(configDir || path.join(home, '.claude'), 'projects')),
    resolved(path.join(home, '.claude', 'projects')),
    resolved(path.join(home, '.ccs', 'instances')),
  ]));
  return async (real) => {
    const [configProjects, homeProjects, ccsInstances] = await rootsOnce();
    if (isInside(configProjects, real) || isInside(homeProjects, real)) return true;
    // ~/.ccs/instances/<profile>/projects/<project>/<session>.jsonl
    if (!isInside(ccsInstances, real)) return false;
    const parts = path.relative(ccsInstances, real).split(path.sep);
    return parts.length >= 4 && parts[1] === 'projects';
  };
}

/**
 * The real path to open for `file`, or null when it may not be read. `isAllowed(real)` decides
 * the folder; the file must be an absolute `.jsonl` path naming a regular file.
 */
export async function allowedTranscriptPath(file, isAllowed) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || !file.endsWith('.jsonl')) return null;
  try {
    const real = await fs.promises.realpath(file);
    if (!real.endsWith('.jsonl') || !(await isAllowed(real))) return null;
    return (await fs.promises.stat(real)).isFile() ? real : null;
  } catch { return null; }
}
