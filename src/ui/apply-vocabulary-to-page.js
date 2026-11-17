// The text index.html carries before the app boots (the Huế court's words, so a slow load
// still reads sensibly) is replaced here with the active world's words. Elements that the UI
// modules render themselves read `words` directly; this covers only the static markup.
import { words } from '../worlds/world-vocabulary.js';

/** @param {boolean} flat  true for a 2D world: its camera slides and zooms but cannot turn */
export function applyVocabularyToPage(flat) {
  document.title = words.appName;
  document.querySelector('.rail-title').textContent = words.appName;
  document.querySelector('.rail').setAttribute('aria-label', words.railLabel);
  document.getElementById('court').setAttribute('aria-label', words.stageLabel);
  document.getElementById('stage-hint').textContent = flat ? words.hintFlat : words.hintOrbit;
}
