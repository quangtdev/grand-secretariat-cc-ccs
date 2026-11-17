// The words the shell speaks, per world. A world pack supplies a full vocabulary
// (worlds/world-audio-and-vocabulary-contract.js, WorldVocabulary); main.js installs it once, before any UI is
// built. UI modules import `words` and read its fields when they render, so one live object
// serves every world. index.html keeps the Huế text as its pre-boot default.

/** The live vocabulary: empty until setVocabulary() runs. Never reassigned, only filled. */
export const words = {};

/** Installs a world's vocabulary (replaces the previous one entirely). */
export function setVocabulary(vocabulary) {
  for (const key of Object.keys(words)) delete words[key];
  Object.assign(words, vocabulary);
}

/** A noun with its plural: `{ one: 'scribe', many: 'scribes' }`. */
export const noun = (forms, count) => (count === 1 ? forms.one : forms.many);

/** "1 scribe", "3 scribes". */
export const counted = (forms, count) => `${count} ${noun(forms, count)}`;
