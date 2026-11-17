// The dock's terminal view: a live xterm wired to one agent's PTY.
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { dismissAgent, renameAgent, terminalSocketUrl } from '../api-client.js';
import { words } from '../worlds/world-vocabulary.js';
import { ICONS, escapeHtml, tailOfPath } from '../status-vocabulary.js';
import { dockModeToggleHtml } from './dock-popup-or-docked-presentation.js';
import { DockActivityStrip } from './dock-activity-strip.js';
import { DockAgentTabs } from './dock-agent-tabs.js';
import { enableTerminalTouchScroll } from './terminal-touch-scroll.js';

const ORDER_WINDOW_MS = 8000; // Enter counts as an order only this soon after typing

const THEME = {
  background: '#17110f', foreground: '#ece3d0', cursor: '#e3a72b', cursorAccent: '#17110f',
  selectionBackground: '#6e1d1499', black: '#2a211e', brightBlack: '#75685f',
  red: '#e0604c', green: '#7fc4a4', yellow: '#e3a72b', blue: '#7fa3d6',
  magenta: '#c48fb0', cyan: '#79b8bd', white: '#d6ccb8', brightWhite: '#fbf5e6',
};

export class TerminalPanel {
  /**
   * @param {HTMLElement} dock
   * @param {{onClose: () => void, onSwitch: (id: string) => void, onTyping?: (id: string) => void, onOrder?: (id: string) => void}} handlers
   *   onSwitch: another agent's tab was picked; onTyping: a printable key was typed;
   *   onOrder: a prompt was submitted (Enter after real text)
   */
  constructor(dock, { onClose, onSwitch, onTyping = () => {}, onOrder = () => {} }) {
    this.dock = dock;
    this.onClose = onClose;
    this.onSwitch = onSwitch;
    this.sessions = [];
    setInterval(() => this.strip?.update(this.session), 30_000); // keeps the elapsed time fresh
    this.onTyping = onTyping;
    this.onOrder = onOrder;
    this.typed = 0; // printable characters typed since the last Enter
    this.lastTypedAt = 0; // when the last of them was typed (ms)
    this.session = null;
    this.openCount = 0; // identifies the latest open() across its async font wait
  }

  async open(session, sessions = this.sessions) {
    this.close();
    const opening = ++this.openCount;
    this.session = session;
    this.sessions = sessions;
    this.dock.innerHTML = `
      <div class="dock-tabs" id="dock-tabs"></div>
      <header class="dock-header">
        <div class="dock-title">
          <h2 class="dock-name">
            <button type="button" class="dock-rename" id="dock-rename" title="${escapeHtml(words.renameTitle)}">
              <span id="dock-ticket"></span>${ICONS.pencil}
            </button>
          </h2>
          <p class="dock-meta" id="dock-meta"></p>
        </div>
        <button type="button" class="button button-quiet" id="dock-dismiss">${ICONS.leave}<span>${words.dismiss}</span></button>
        ${dockModeToggleHtml()}
        <button type="button" class="button button-icon" id="dock-close" aria-label="Close panel">${ICONS.close}</button>
      </header>
      <div class="dock-activity" id="dock-activity"></div>
      <div class="terminal-host" id="terminal-host"></div>
      <p class="dock-note" id="dock-note" role="status"></p>`;
    this.note = this.dock.querySelector('#dock-note');
    this.dock.querySelector('#dock-close').addEventListener('click', this.onClose);
    this.#wireDismiss(this.dock.querySelector('#dock-dismiss'));
    this.#wireRename(this.dock.querySelector('#dock-rename'));
    this.tabs = new DockAgentTabs(this.dock.querySelector('#dock-tabs'), { onOpen: this.onSwitch });
    this.strip = new DockActivityStrip(this.dock.querySelector('#dock-activity'));
    this.refresh(session, sessions);

    // Both weights: the WebGL renderer caches glyphs as it first draws them.
    await Promise.all(['13px "JetBrains Mono"', 'bold 13px "JetBrains Mono"'].map((font) => document.fonts.load(font))).catch(() => {});
    if (opening !== this.openCount) return; // closed or switched while the font loaded

    const term = new Terminal({
      fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 13, lineHeight: 1.2,
      theme: THEME, cursorBlink: true, scrollback: 5000, allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    const host = this.dock.querySelector('#terminal-host');
    term.open(host);
    // Draw the terminal on the GPU: far less main-thread work than the DOM renderer while an
    // agent streams output. Falls back to the DOM renderer if WebGL is missing or its context is lost.
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => { webgl.dispose(); try { fit.fit(); } catch { /* host detached */ } });
      term.loadAddon(webgl);
    } catch { /* no WebGL2: xterm keeps its DOM renderer */ }
    fit.fit();

    const socket = new WebSocket(terminalSocketUrl(session.id));
    const send = (message) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); };
    socket.onopen = () => send({ t: 'r', c: term.cols, r: term.rows });
    socket.onmessage = (event) => term.write(event.data);
    socket.onclose = (event) => {
      if (this.term !== term) return;
      this.note.textContent = event.code === 4000 || event.code === 4004
        ? words.sessionEnded
        : 'Connection to the server dropped. Close and reopen this panel to reconnect.';
    };
    term.onData((data) => {
      send({ t: 'i', d: data });
      this.#trackOrder(data);
    });
    term.onResize(({ cols, rows }) => send({ t: 'r', c: cols, r: rows }));

    this.resizeObserver = new ResizeObserver(() => { try { fit.fit(); } catch { /* host detached */ } });
    this.resizeObserver.observe(host);
    this.stopTouchScroll = enableTerminalTouchScroll(host, term); // phones: a finger drag scrolls
    this.term = term;
    this.socket = socket;
    term.focus();
  }

  /**
   * Tells typing apart from submitting an order. Escape sequences (arrows, function keys)
   * are ignored; Enter counts as an order only after at least three typed characters, so
   * picking an option in Claude's menus with Enter does not count.
   */
  #trackOrder(raw) {
    const data = raw.replace(/\x1b\[20[01]~/g, ''); // bracketed paste markers: the pasted text counts
    if (data === '\x1b') { this.typed = 0; return; } // a bare Esc clears the prompt
    if (!this.session || data.startsWith('\x1b')) return; // arrows, function keys, terminal replies
    if (data === '\x7f' || data === '\b') { this.typed = Math.max(0, this.typed - 1); return; }
    if (data === '\n' || data === '\t') return; // Ctrl+J (newline in the prompt), Tab (completion)
    if (data.length === 1 && data < ' ' && data !== '\r') { this.typed = 0; return; } // Esc, Ctrl+C, Ctrl+U...: the line is dropped
    const submits = data.endsWith('\r');
    const printable = [...data].filter((ch) => ch >= ' ' && ch !== '\x7f').length; // a paste counts in full
    if (printable) {
      this.typed += printable;
      this.lastTypedAt = performance.now();
      this.onTyping(this.session.id);
    }
    if (!submits) return;
    // An order is Enter after real text typed just now; single-key menu answers (1, y...) add
    // up slowly and are not followed by Enter, so they rarely pass both tests.
    if (this.typed >= 3 && performance.now() - this.lastTypedAt < ORDER_WINDOW_MS) this.onOrder(this.session.id);
    this.typed = 0;
  }

  /** Click the name to edit it in place: Enter or leaving the field saves, Escape cancels. */
  #wireRename(button) {
    button.addEventListener('click', () => {
      const input = document.createElement('input');
      input.className = 'dock-rename-input';
      input.maxLength = 60;
      const original = this.session.ticket;
      input.value = original;
      input.setAttribute('aria-label', words.renameLabel);
      button.hidden = true;
      button.after(input);
      input.focus();
      input.select();

      let finished = false;
      const id = this.session.id; // the agent being renamed, even if the dock moves on before this finishes
      const finish = async (save) => {
        if (finished) return;
        finished = true;
        const ticket = input.value.trim();
        input.remove();
        button.hidden = false;
        if (button.isConnected) button.focus();
        // Compare with the name the field opened with: saving an unchanged field must never
        // overwrite a name that changed meanwhile.
        const shown = () => this.session?.id === id; // the dock still shows that agent
        if (!save || !ticket || ticket === original || (shown() && ticket === this.session.ticket)) return;
        if (shown()) this.dock.querySelector('#dock-ticket').textContent = ticket; // the feed confirms it a moment later
        try {
          await renameAgent(id, ticket);
        } catch (err) {
          if (!shown()) return;
          this.dock.querySelector('#dock-ticket').textContent = this.session.ticket;
          this.note.textContent = `Could not rename: ${err.message}`;
        }
      };
      input.addEventListener('keydown', (event) => {
        // preventDefault: otherwise the same Enter "clicks" the name button that just got
        // focus, reopening the field with the old name, and its blur later saves that name back.
        if (event.key === 'Enter') { event.preventDefault(); finish(true); }
        if (event.key === 'Escape') { event.stopPropagation(); finish(false); }
      });
      input.addEventListener('blur', () => finish(true));
    });
  }

  /** Two-step dismiss: the first press arms the button, the second ends the session. */
  #wireDismiss(button) {
    let armedUntil = 0;
    button.addEventListener('click', async () => {
      if (Date.now() > armedUntil) {
        armedUntil = Date.now() + 4000;
        button.classList.add('is-armed');
        button.querySelector('span').textContent = words.dismissConfirm;
        setTimeout(() => {
          if (!button.isConnected || Date.now() < armedUntil) return;
          button.classList.remove('is-armed');
          button.querySelector('span').textContent = words.dismiss;
        }, 4100);
        return;
      }
      button.disabled = true;
      try {
        await dismissAgent(this.session.id);
      } catch (err) {
        button.disabled = false;
        this.note.textContent = `Could not dismiss: ${err.message}`;
      }
    });
  }

  /** True while this agent's terminal is open and connected (or still connecting). */
  isLive(id) {
    return this.session?.id === id && (!this.socket || this.socket.readyState <= WebSocket.OPEN);
  }

  /** Keep the tab strip current even when the open agent has left the feed. */
  updateTabs(sessions) {
    this.sessions = sessions;
    this.tabs?.update(sessions, this.session?.id);
  }

  /** Update the header from fresh session data (status changes while the panel is open). */
  refresh(session, sessions = this.sessions) {
    if (!this.session || session.id !== this.session.id) return;
    this.session = session;
    this.sessions = sessions;
    this.tabs?.update(sessions, session.id);
    this.strip?.update(session);
    this.dock.querySelector('#dock-ticket').textContent = session.ticket;
    // The profile is absent when agents run with plain `claude` (no ccs launcher).
    const meta = this.dock.querySelector('#dock-meta');
    meta.textContent = [tailOfPath(session.repo), session.profile].filter(Boolean).join(' · ');
    meta.title = session.repo;
  }

  close() {
    this.resizeObserver?.disconnect();
    this.stopTouchScroll?.();
    this.socket?.close();
    // Give the terminal's GL contexts back at once. A page may hold only about sixteen;
    // left to the garbage collector, switching agents quickly could evict the court's own.
    for (const canvas of this.dock.querySelectorAll('.terminal-host canvas')) {
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext();
    }
    this.term?.dispose();
    this.term = this.socket = this.resizeObserver = this.stopTouchScroll = this.session = this.tabs = this.strip = null;
    this.typed = 0;
    this.openCount++;
  }
}
