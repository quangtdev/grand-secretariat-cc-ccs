// The dock's summon form: pick a repository (and an account profile, when the launcher has them), name the ticket,
// optionally give the first order. Replaces "open a terminal, cd, claude".
import { fetchSummonOptions, summonAgent } from '../api-client.js';
import { words } from '../worlds/world-vocabulary.js';
import { ICONS, escapeHtml } from '../status-vocabulary.js';
import { dockModeToggleHtml } from './dock-popup-or-docked-presentation.js';
import { mountFolderBrowser } from './folder-browser.js';

const LAST_CHOICE_KEY = 'grand-secretariat:last-summon';

export class SummonPanel {
  /** @param {HTMLElement} dock  @param {{onClose: () => void, onSummoned: (id: string) => void}} handlers */
  constructor(dock, { onClose, onSummoned }) {
    this.dock = dock;
    this.onClose = onClose;
    this.onSummoned = onSummoned;
  }

  async open() {
    this.dock.innerHTML = `
      <header class="dock-header">
        <div class="dock-title">
          <h2>${words.summonAction}</h2>
          <p class="dock-meta">${escapeHtml(words.summonLead)}</p>
        </div>
        ${dockModeToggleHtml()}
        <button type="button" class="button button-icon" id="dock-close" aria-label="Close panel">${ICONS.close}</button>
      </header>
      <form class="summon-form" id="summon-form" novalidate>
        <p class="form-skeleton" id="summon-loading">Reading your repositories.</p>
      </form>`;
    this.dock.querySelector('#dock-close').addEventListener('click', this.onClose);
    const form = this.dock.querySelector('#summon-form');

    let options;
    try {
      options = await fetchSummonOptions();
    } catch (err) {
      form.innerHTML = `<p class="form-error" role="alert">Could not read your repositories: ${escapeHtml(err.message)}. Check that the server is running, then reopen this panel.</p>`;
      return;
    }
    if (!form.isConnected) return; // panel was closed while loading
    this.#renderForm(form, options);
  }

  #renderForm(form, { repos, profiles }) {
    const last = JSON.parse(localStorage.getItem(LAST_CHOICE_KEY) || '{}');
    // The folder used last time may be one chosen with the browser, outside the scanned repositories.
    const known = new Set(repos.map((r) => r.path));
    const chosen = last.repo && !known.has(last.repo) ? [{ path: last.repo, name: last.repo, group: 'chosen folder' }] : [];
    const groups = Map.groupBy([...chosen, ...repos], (r) => r.group || 'workspaces');
    const repoOptions = [...groups].map(([group, list]) => `
      <optgroup label="${escapeHtml(group)}">
        ${list.map((r) => `<option value="${escapeHtml(r.path)}"${r.path === last.repo ? ' selected' : ''}>${escapeHtml(r.name)}</option>`).join('')}
      </optgroup>`).join('');
    const defaultProfile = profiles.includes(last.profile) ? last.profile : profiles[0];
    const profileOptions = profiles.map((p) => `
      <label class="segment"><input type="radio" name="profile" value="${escapeHtml(p)}"${p === defaultProfile ? ' checked' : ''}><span>${escapeHtml(p)}</span></label>`).join('');

    form.innerHTML = `
      <label class="field"><span class="field-label">Working folder</span>
        <span class="folder-pick">
          <select name="repo" required>${repoOptions || '<option value="">No repositories found: browse for a folder</option>'}</select>
          <button type="button" class="button button-quiet" id="folder-browse" aria-expanded="false" aria-controls="folder-browser">Browse</button>
        </span>
      </label>
      <div class="folder-browser" id="folder-browser" hidden></div>
      ${profiles.length ? `<fieldset class="field"><legend class="field-label">Profile</legend>
        <div class="segments">${profileOptions}</div>
      </fieldset>` : ''}
      <fieldset class="field"><legend class="field-label">Session</legend>
        <div class="segments">
          <label class="segment"><input type="radio" name="mode" value="new" checked><span>New</span></label>
          <label class="segment"><input type="radio" name="mode" value="continue"><span>Continue last</span></label>
          <label class="segment"><input type="radio" name="mode" value="resume"><span>Pick an old one</span></label>
        </div>
        <span class="field-hint" id="mode-hint"></span>
      </fieldset>
      <label class="field"><span class="field-label">Ticket</span>
        <input name="ticket" type="text" maxlength="60" autocomplete="off" placeholder="GS-736 fix report export">
        <span class="field-hint">${escapeHtml(words.ticketHint)}</span>
      </label>
      <label class="field" id="prompt-field"><span class="field-label">First order</span>
        <textarea name="prompt" rows="6" maxlength="8000" placeholder="What should it start on? Leave empty to give the order in its terminal."></textarea>
      </label>
      <p class="form-error" id="summon-error" role="alert" hidden></p>
      <button type="submit" class="button button-primary" id="summon-submit">${ICONS.plus}<span>${words.summonSubmit}</span></button>`;

    // Explain each session choice in the user's own terms, and hide what does not apply.
    const hints = {
      new: 'A fresh conversation, like typing claude.',
      continue: 'Carries on the most recent conversation in this repository, like claude --continue.',
      resume: 'Opens Claude\'s list of past conversations in the terminal so you can choose, like claude --resume.',
    };
    const syncMode = () => {
      const mode = form.elements.mode.value;
      form.querySelector('#mode-hint').textContent = hints[mode];
      form.querySelector('#prompt-field').hidden = mode === 'resume';
    };
    form.addEventListener('change', syncMode);
    syncMode();

    // Browse: choose any folder on this machine; it joins the list as the selected option.
    const select = form.elements.repo;
    const browse = form.querySelector('#folder-browse');
    const browser = form.querySelector('#folder-browser');
    const closeBrowser = () => { browser.hidden = true; browser.innerHTML = ''; browse.setAttribute('aria-expanded', 'false'); };
    browse.addEventListener('click', () => {
      if (!browser.hidden) return closeBrowser();
      browser.hidden = false;
      browse.setAttribute('aria-expanded', 'true');
      mountFolderBrowser(browser, select.value, (folder) => {
        if (![...select.options].some((o) => o.value === folder)) select.prepend(new Option(folder, folder));
        select.value = folder;
        closeBrowser();
        browse.focus();
      });
    });

    const error = form.querySelector('#summon-error');
    const submit = form.querySelector('#summon-submit');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const order = Object.fromEntries(new FormData(form));
      submit.disabled = true;
      submit.querySelector('span').textContent = words.summonBusy;
      error.hidden = true;
      try {
        const { id } = await summonAgent(order);
        localStorage.setItem(LAST_CHOICE_KEY, JSON.stringify({ repo: order.repo, profile: order.profile }));
        this.onSummoned(id);
      } catch (err) {
        error.textContent = words.summonFailed(err.message);
        error.hidden = false;
        submit.disabled = false;
        submit.querySelector('span').textContent = words.summonSubmit;
      }
    });
    form.querySelector('[name="ticket"]').focus();
  }
}
