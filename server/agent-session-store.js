// Owns every agent: its PTY, its status, its scrollback, and the metadata file
// that lets agents be reopened with `--resume` after the server restarts.
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pty from 'node-pty';
import { AGENT_FLAGS, LAUNCHER_BIN, SCROLLBACK_BYTES, STATE_DIR } from './config.js';
import { hookTokenFor } from './claude-hooks-settings.js';
import { applySubagentHook, publicSoldiers } from './subagent-soldier-tracker.js';
import { DismissedScribeHistory } from './dismissed-scribe-history.js';

const STATE_FILE = path.join(STATE_DIR, 'sessions.json');
// An agent that exits this soon after starting failed to start; keep it visible with its output.
const EARLY_EXIT_MS = 15_000;
const SAVED_FIELDS = ['id', 'ticket', 'repo', 'profile', 'mode', 'createdAt', 'hasConversation', 'claudeSessionId'];
// Statuses that keep a scribe before the throne; they survive a server restart (see `throne`).
const THRONE_STATUSES = new Set(['asking', 'done']);
/** The saved throne state, if valid: {status, since, question}. */
const savedThrone = (t) => (t && THRONE_STATUSES.has(t.status) && Number.isFinite(t.since)
  ? { status: t.status, since: t.since, question: typeof t.question === 'string' ? t.question : null } : null);

// `profile` is '' when the launcher takes none (plain `claude`).
const isSavedSession = (m) => m && ['id', 'ticket', 'repo'].every((k) => typeof m[k] === 'string' && m[k]) && typeof m.profile === 'string';

export class AgentSessionStore extends EventEmitter {
  constructor(hooksSettingsFile, accessToken) {
    super();
    this.hooksSettingsFile = hooksSettingsFile;
    this.accessToken = accessToken;
    this.sessions = new Map(); // id -> session
    this.history = new DismissedScribeHistory(); // scribes that left, recallable
    this.shuttingDown = false;
  }

  /** Public view of all agents, oldest first. */
  list() {
    return [...this.sessions.values()].map(({ id, ticket, repo, profile, status, createdAt, statusSince, activity, activityTask, order, orderedAt, question, soldiers, extras }) => ({
      id, ticket, repo, repoName: path.basename(repo), profile, status, createdAt, statusSince,
      orderedAt: orderedAt || 0, // when the user last submitted a prompt (ms), from the UserPromptSubmit hook
      // `activity` only means something while the agent is working.
      activity: status === 'working' ? activity || 'Thinking' : null,
      // A delegation step also carries its task, so the client words it per world (`activity` stays the Huế text).
      ...(status === 'working' && activity && activityTask != null && { activityKind: 'delegate', activityTask }),
      order: status === 'working' ? order || null : null, // the prompt it is carrying out
      question: status === 'asking' ? question || null : null, // what it asks of the user
      soldiers: publicSoldiers(soldiers),
      ...extras, // observer data (see annotate), e.g. `ink`
    }));
  }

  /** Observers (transcript reader) attach public data to an agent; `change` fires only when a value really changed. */
  annotate(id, patch) {
    const extras = this.sessions.get(id)?.extras;
    if (!extras || Object.entries(patch).every(([k, v]) => JSON.stringify(extras[k]) === JSON.stringify(v))) return;
    Object.assign(extras, patch); this.emit('change');
  }
  statusOf(id) { return this.sessions.get(id)?.status; }
  /** How many of this agent's sub-agents (soldiers) are still out. */
  soldiersOutOf(id) { return this.sessions.get(id)?.soldiers?.length ?? 0; }

  /** `mode`: 'new', 'continue' (`--continue`) or 'resume' (`--resume`, opens Claude's picker). */
  create({ repo, profile, ticket, prompt, mode = 'new' }) {
    const meta = { id: randomUUID(), ticket, repo, profile, mode, createdAt: Date.now(), hasConversation: false };
    this.#spawn(meta, prompt);
    this.#persist();
    return meta.id;
  }

  /** Reopen the agents recorded by a previous server run. */
  restore() {
    let saved = [];
    try {
      saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (err) {
      // A damaged file is set aside, not overwritten, so it can be recovered by hand.
      if (err.code !== 'ENOENT') fs.renameSync(STATE_FILE, `${STATE_FILE}.bad`);
    }
    if (!Array.isArray(saved)) saved = [];
    for (const meta of saved.filter(isSavedSession)) {
      try {
        if (fs.existsSync(meta.repo)) this.#spawn(meta, null);
      } catch (err) {
        console.error(`[store] could not restore "${meta.ticket}":`, err.message);
      }
    }
    this.#persist();
  }

  #spawn(meta, prompt) {
    // A fresh agent gets our id as its Claude session id; a restart resumes whatever
    // session id the agent last reported (it changes after /clear).
    let sessionArgs = ['--session-id', meta.id];
    if (meta.hasConversation && (meta.claudeSessionId || meta.mode === 'new' || !meta.mode)) {
      sessionArgs = ['--resume', meta.claudeSessionId || meta.id];
    } else if (meta.mode === 'continue') {
      sessionArgs = ['--continue']; // the repository's most recent conversation
    } else if (meta.mode === 'resume') {
      sessionArgs = ['--resume']; // Claude shows its own session picker in the terminal
      prompt = null; // a trailing argument would be read as the session to resume
    }
    const args = [...(meta.profile ? [meta.profile] : []), ...AGENT_FLAGS, '--settings', this.hooksSettingsFile, ...sessionArgs, '--name', meta.ticket];
    // A leading space keeps an order like "- fix x" from being parsed as a CLI option.
    if (prompt) args.push(prompt.startsWith('-') ? ` ${prompt}` : prompt);

    // Drop variables of a parent Claude session so the agent starts clean.
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CLAUDE')));
    Object.assign(env, {
      GRAND_SECRETARIAT_ID: meta.id, GRAND_SECRETARIAT_TOKEN: hookTokenFor(this.accessToken, meta.id), TERM: 'xterm-256color', COLORTERM: 'truecolor',
    });

    const proc = pty.spawn(LAUNCHER_BIN, args, { name: 'xterm-256color', cols: 120, rows: 36, cwd: meta.repo, env });
    const startedAt = Date.now();
    // A scribe that was before the throne when the server stopped goes straight back there:
    // the petition or report still waits on the user. Its resume's SessionStart ("idle") is
    // ignored once (holdsThrone); any real event after that moves it on as usual.
    const throne = savedThrone(meta.throne);
    const session = {
      ...meta, proc, status: throne?.status ?? 'starting', statusSince: throne?.since ?? startedAt,
      question: throne?.question ?? null, holdsThrone: Boolean(throne), soldiers: [], extras: {},
      scrollback: [], scrollbackBytes: 0, listeners: new Set(),
    };
    delete session.throne;
    this.sessions.set(meta.id, session);

    proc.onData((data) => {
      session.scrollback.push(data);
      session.scrollbackBytes += data.length;
      while (session.scrollbackBytes > SCROLLBACK_BYTES && session.scrollback.length > 1) {
        session.scrollbackBytes -= session.scrollback.shift().length;
      }
      for (const listener of session.listeners) listener(data);
    });
    proc.onExit(() => {
      session.proc = null;
      if (this.shuttingDown) return; // keep it in the state file so it resumes next start
      if (!session.dismissed && Date.now() - startedAt < EARLY_EXIT_MS) {
        // Failed to start (bad profile, launcher missing, resume refused): stay in the court,
        // flagged, with the error still readable in the terminal, until dismissed.
        session.status = 'exited';
        session.statusSince = Date.now();
      } else {
        for (const listener of session.listeners) listener(null); // null = the agent is gone
        this.sessions.delete(meta.id);
        this.history.record(session);
      }
      this.#persist();
      this.emit('change');
      if (!this.sessions.has(meta.id)) this.emit('left', session); // last: a listener cannot skip the save
    });
    this.emit('change');
  }

  /** Record what a hook event tells us about resuming this agent later. */
  noteHookEvent(id, event) {
    const session = this.sessions.get(id);
    if (!session) return;
    const startsConversation = ['UserPromptSubmit', 'PostToolUse', 'Stop'].includes(event.hook_event_name)
      || (event.hook_event_name === 'SessionStart' && event.source === 'resume');
    const sessionId = typeof event.session_id === 'string' ? event.session_id : session.claudeSessionId;
    if ((startsConversation && !session.hasConversation) || sessionId !== session.claudeSessionId) {
      session.hasConversation ||= startsConversation;
      session.claudeSessionId = sessionId;
      this.#persist();
    }
  }

  /**
   * Current step and order for the toast (see hook-activity-description.js).
   * `undefined` for either keeps what is there.
   */
  setActivity(id, activity, order, activityTask) {
    const session = this.sessions.get(id);
    if (!session) return;
    const next = { activity: activity === undefined ? session.activity : activity, order: order === undefined ? session.order : order,
      activityTask: activityTask === undefined ? session.activityTask : activityTask };
    if (next.activity === session.activity && next.order === session.order && next.activityTask === session.activityTask) return;
    Object.assign(session, next);
    this.emit('change');
  }

  /** The user submitted a prompt to this agent (UserPromptSubmit hook): the client hides a popup dock on it. */
  noteOrderSubmitted(id) {
    const session = this.sessions.get(id);
    if (!session) return;
    session.orderedAt = Date.now();
    this.emit('change');
  }

  /** Sub-agents mustered or dismissed by this hook event (see subagent-soldier-tracker.js). */
  applySoldierHook(id, event) {
    const session = this.sessions.get(id);
    if (!session) return;
    const soldiers = applySubagentHook(session.soldiers, event);
    if (soldiers === session.soldiers) return;
    session.soldiers = soldiers;
    this.emit('change');
  }

  setStatus(id, status) {
    const session = this.sessions.get(id);
    if (!session || !session.proc) return;
    if (session.holdsThrone) {
      session.holdsThrone = false;
      if (status === 'idle') return; // the resume itself: it is still before the throne
    }
    if (session.status === status) return;
    const throneChanged = THRONE_STATUSES.has(status) || THRONE_STATUSES.has(session.status);
    session.status = status;
    session.statusSince = Date.now();
    if (status !== 'asking') session.question = null; // answered
    if (throneChanged) this.#persist();
    this.emit('change');
  }

  /** What the agent asks of the user (see questionFromHookEvent); shown while it is asking. */
  setQuestion(id, question, { keepExisting = false } = {}) {
    const session = this.sessions.get(id);
    if (!session || session.question === question || (keepExisting && session.question)) return;
    session.question = question;
    this.emit('change');
  }

  /** New name for an agent; kept in the state file, so it also resumes under that name. */
  rename(id, ticket) {
    const session = this.sessions.get(id);
    if (!session) return false;
    if (session.ticket !== ticket) {
      session.ticket = ticket;
      this.#persist();
      this.emit('change');
    }
    return true;
  }

  /** Dismiss an agent: ends its process (the exit handler removes it), or clears a failed one. */
  remove(id) {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.dismissed = true;
    if (session.proc) {
      session.proc.kill();
    } else {
      for (const listener of session.listeners) listener(null);
      this.sessions.delete(id);
      this.history.record(session); // a failed resume may still have a conversation to go back to
      this.emit('change');
      this.emit('left', session);
    }
    return true;
  }

  /** Bring a scribe back from the history: same id, name and repository, resuming its conversation. */
  recall(id) {
    const entry = this.history.get(id);
    if (!entry) return { error: 'That scribe is no longer in the history.', code: 404 };
    if (this.sessions.has(id)) return { error: 'That scribe is already in the court.', code: 409 };
    if (!fs.existsSync(entry.repo)) return { error: `Its repository is gone: ${entry.repo}`, code: 400 };
    const meta = Object.fromEntries(SAVED_FIELDS.map((k) => [k, entry[k]]));
    this.#spawn(meta, null);
    this.history.remove(id);
    this.#persist();
    return { id };
  }

  /**
   * Connect a terminal panel. `onData` gets raw output, or null when the agent is gone.
   * Returns the replay buffer plus write/resize/detach handles, or null if unknown.
   */
  attach(id, onData) {
    const session = this.sessions.get(id);
    if (!session) return null;
    session.listeners.add(onData);
    const guarded = (action) => { try { action(); } catch { /* process already exited */ } };
    return {
      replay: session.scrollback.join(''),
      write: (data) => guarded(() => session.proc?.write(data)),
      resize: (cols, rows) => guarded(() => session.proc?.resize(cols, rows)),
      detach: () => session.listeners.delete(onData),
    };
  }

  shutdown() {
    this.shuttingDown = true;
    this.#persist();
    for (const session of this.sessions.values()) session.proc?.kill();
  }

  /** Atomic write (temp file + rename) so a crash mid-write cannot truncate the state. */
  #persist() {
    const saved = [...this.sessions.values()]
      .filter((s) => s.status !== 'exited')
      .map((s) => ({
        ...Object.fromEntries(SAVED_FIELDS.map((k) => [k, s[k]])),
        ...(THRONE_STATUSES.has(s.status) && { throne: { status: s.status, since: s.statusSince, question: s.question ?? null } }),
      }));
    fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
    const temp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(saved, null, 2), { mode: 0o600 });
    fs.renameSync(temp, STATE_FILE);
  }
}
