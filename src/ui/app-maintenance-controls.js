// Rail-foot controls for the installed app: Pull & update, Update, Restart.
// Hidden unless the server runs as the systemd service. Each action asks for an inline
// confirmation (it stops every agent), then polls the server: a new boot id means the
// restart happened, so the page reloads onto the new build; a failed update shows its log.
import { fetchAppInfo, runAppAction } from '../api-client.js';
import { words } from '../worlds/world-vocabulary.js';
import { ICONS, escapeHtml } from '../status-vocabulary.js';

const POLL_MS = 2000;
const GIVE_UP_MS = 10 * 60_000;

const ACTIONS = {
  pull: { label: 'Pull & update', verb: 'Pull, rebuild and restart', progress: 'Pulling and building. The app restarts when done.' },
  update: { label: 'Update', verb: 'Rebuild and restart', progress: 'Building. The app restarts when done.' },
  restart: { label: 'Restart', verb: 'Restart', progress: 'Restarting.' },
};

export class AppMaintenanceControls {
  /** @param {HTMLElement} container  @param {{busyCount: () => number}} options */
  constructor(container, { busyCount }) {
    this.el = container;
    this.busyCount = busyCount;
    this.bootId = null;
    this.open = false; // the three actions are shown
    this.timer = null;
    this.el.addEventListener('click', (event) => this.#onClick(event));
    this.#init();
  }

  async #init() {
    let info;
    try { info = await fetchAppInfo(); } catch { return; } // stays hidden
    if (!info.managed) return;
    this.bootId = info.bootId;
    this.el.hidden = false;
    // Page opened (or reloaded) while an update is still building: keep watching it.
    if (info.update.state === 'running') this.#watch('update');
    else this.#renderIdle();
  }

  /** Collapsed, the controls are one quiet "App" button; opened, the three actions. */
  #renderIdle(message = '', log = '') {
    const open = this.open || Boolean(message);
    this.el.classList.toggle('is-open', open);
    if (!open) {
      this.el.innerHTML = `<button type="button" class="button button-quiet app-toggle" data-toggle aria-expanded="false" title="Update or restart the app">${ICONS.app}<span>App</span></button>`;
      return;
    }
    this.el.innerHTML = `
      <div class="app-actions">
        <button type="button" class="button button-quiet app-action" data-toggle aria-expanded="true" aria-label="Close app actions">${ICONS.close}</button>
        ${Object.entries(ACTIONS).map(([key, a]) =>
          `<button type="button" class="button button-quiet app-action" data-action="${key}">${a.label}</button>`).join('')}
      </div>
      ${message ? `<p class="app-status form-error" role="alert">${escapeHtml(message)}</p>` : ''}
      ${log ? `<details class="app-log"><summary>Update log</summary><pre>${escapeHtml(log)}</pre></details>` : ''}`;
  }

  #renderConfirm(action) {
    const busy = this.busyCount();
    const cut = busy ? words.restartWarn(busy) : '';
    this.el.classList.add('is-open');
    this.el.innerHTML = `
      <p class="app-status">${ACTIONS[action].verb} the app? ${cut}${escapeHtml(words.restartNote)}</p>
      <div class="app-actions">
        <button type="button" class="button button-quiet is-armed app-action" data-confirm="${action}">${ACTIONS[action].label}</button>
        <button type="button" class="button button-quiet app-action" data-cancel>Cancel</button>
      </div>`;
    this.el.querySelector('[data-confirm]').focus();
  }

  async #onClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if ('toggle' in button.dataset) { this.open = !this.open; this.#renderIdle(); }
    else if (button.dataset.action) this.#renderConfirm(button.dataset.action);
    else if ('cancel' in button.dataset) this.#renderIdle();
    else if (button.dataset.confirm) {
      const action = button.dataset.confirm;
      button.disabled = true;
      try {
        await runAppAction(action);
        this.#watch(action);
      } catch (err) {
        this.#renderIdle(`Could not start: ${err.message}`);
      }
    }
  }

  /** Polls until the server comes back with a new boot id (reload) or the update fails. */
  #watch(action) {
    clearInterval(this.timer);
    const startedAt = Date.now();
    let serverWentDown = false;
    this.el.classList.add('is-open');
    this.el.innerHTML = `<p class="app-status" role="status">${ACTIONS[action].progress}</p>`;
    const status = this.el.querySelector('.app-status');

    this.timer = setInterval(async () => {
      if (Date.now() - startedAt > GIVE_UP_MS) {
        clearInterval(this.timer);
        this.#renderIdle('No answer from the server for 10 minutes. Check: journalctl --user -u grand-secretariat');
        return;
      }
      let info;
      try {
        info = await fetchAppInfo();
      } catch {
        if (!serverWentDown) status.textContent = 'Restarting the server.';
        serverWentDown = true;
        return;
      }
      if (info.bootId !== this.bootId) {
        clearInterval(this.timer);
        location.reload(); // new server, new build
      } else if (action !== 'restart' && info.update?.state === 'failed') {
        clearInterval(this.timer);
        this.#renderIdle('Update failed. The app was not restarted.', info.update.log);
      }
    }, POLL_MS);
  }
}
