// Works out how agents are started on this machine when nothing is configured:
// plain `claude`, or the `ccs` account switcher (with its account profiles) when it is installed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** True when an executable called `name` is on PATH. */
export function isOnPath(name) {
  return (process.env.PATH || '').split(path.delimiter).filter(Boolean).some((dir) => {
    try {
      fs.accessSync(path.join(dir, name), fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Account names from the `accounts:` section of ~/.ccs/config.yaml, in file order.
 * Reads only the two-space-indented keys under that section, so no YAML parser is needed.
 * Returns [] when ccs is not set up.
 */
export function readCcsProfiles(configFile = path.join(os.homedir(), '.ccs', 'config.yaml')) {
  let text;
  try {
    text = fs.readFileSync(configFile, 'utf8');
  } catch {
    return [];
  }
  const profiles = [];
  let inAccounts = false;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) inAccounts = /^accounts:\s*(#.*)?$/.test(line); // a new top-level key
    else if (inAccounts) {
      const key = /^ {2}(?:"([^"]+)"|'([^']+)'|([^\s#:'"][^:]*?))\s*:/.exec(line);
      if (key) profiles.push(key[1] || key[2] || key[3]);
    }
  }
  return profiles;
}
