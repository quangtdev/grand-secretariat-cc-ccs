import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { allowedTranscriptPath, claudeProjectsGuard } from '../server/transcript-path-guard.js';

test('only .jsonl files inside Claude or ccs profile projects folders are allowed', async () => {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-guard-')));
  const put = (rel) => { const f = path.join(home, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, ''); return f; };
  try {
    const guard = claudeProjectsGuard({ home, configDir: '' });
    const claude = put('.claude/projects/p/s.jsonl');
    const ccs = put('.ccs/instances/demo/projects/p/s.jsonl');
    const stray = put('work/projects/p/s.jsonl');
    const ccsOther = put('.ccs/instances/demo/notes/p/s.jsonl');
    const link = path.join(home, '.claude/projects/p/link.jsonl');
    fs.symlinkSync(stray, link);
    assert.equal(await allowedTranscriptPath(claude, guard), claude);
    assert.equal(await allowedTranscriptPath(ccs, guard), ccs);
    assert.equal(await allowedTranscriptPath(stray, guard), null);
    assert.equal(await allowedTranscriptPath(ccsOther, guard), null);
    assert.equal(await allowedTranscriptPath(link, guard), null); // points out of the projects folder
    assert.equal(await allowedTranscriptPath('relative/projects/p/s.jsonl', guard), null);
    assert.equal(await allowedTranscriptPath(path.join(home, '.claude/projects/p'), guard), null);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
