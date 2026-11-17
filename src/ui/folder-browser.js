// A small folder browser shown inside the summon form: walk the machine's folders
// (or type a path) and choose any of them as the working folder.
import { fetchFolder } from '../api-client.js';
import { escapeHtml } from '../status-vocabulary.js';

/**
 * Fills `host` with the browser, opened at `startPath` (home when empty).
 * `onChoose(path)` is called when the user picks the folder being shown.
 */
export function mountFolderBrowser(host, startPath, onChoose) {
  host.innerHTML = `
    <div class="folder-path">
      <button type="button" class="button button-quiet" data-up aria-label="Go to the parent folder">Up</button>
      <input type="text" data-path spellcheck="false" autocomplete="off" aria-label="Folder path" placeholder="/path/to/folder">
    </div>
    <ul class="folder-list" data-list aria-label="Folders inside"></ul>
    <p class="form-error" data-error role="alert" hidden></p>
    <button type="button" class="button button-quiet" data-choose>Use this folder</button>`;
  const input = host.querySelector('[data-path]');
  const list = host.querySelector('[data-list]');
  const error = host.querySelector('[data-error]');
  const up = host.querySelector('[data-up]');
  let current = null; // the folder being shown

  const show = async (target) => {
    try {
      current = await fetchFolder(target);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      return;
    }
    error.hidden = true;
    input.value = current.path;
    up.disabled = !current.parent;
    list.innerHTML = current.folders.length
      ? current.folders.map((f) => `<li><button type="button" data-folder="${escapeHtml(f.path)}">${escapeHtml(f.name)}</button></li>`).join('')
      : '<li class="folder-empty">No folders inside.</li>';
    list.scrollTop = 0;
  };

  up.addEventListener('click', () => current?.parent && show(current.parent));
  list.addEventListener('click', (event) => {
    const folder = event.target.closest('[data-folder]');
    if (folder) show(folder.dataset.folder);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault(); // do not submit the summon form
    show(input.value);
  });
  host.querySelector('[data-choose]').addEventListener('click', async () => {
    if (input.value.trim() !== current?.path) await show(input.value); // a typed path not opened yet
    if (error.hidden && current) onChoose(current.path);
  });
  show(startPath || '');
}
