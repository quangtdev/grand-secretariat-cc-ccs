// Power saver: a toggle in the rail foot that makes the court cheaper to keep open on a
// laptop. While on, the court draws at lower frame rates, without shadows and at a plain
// pixel ratio, and its background life (birds, koi, smoke, clouds, river, banners, the
// king's walks) holds still. Agents still walk to their places and the petition still calls.
// The choice is remembered per browser and takes effect at once.
import { words } from '../worlds/world-vocabulary.js';
import { ICONS } from '../status-vocabulary.js';

const KEY = 'grand-secretariat:saver';

export function isPowerSaverOn() {
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } // storage blocked: off
}

function remember(on) {
  try { on ? localStorage.setItem(KEY, 'on') : localStorage.removeItem(KEY); } catch { /* storage blocked: this visit only */ }
}

export class PowerSaverToggle {
  /**
   * @param {HTMLElement} container  the group in the rail foot that holds the button
   * @param {(on: boolean) => void} onChange  applies the mode to the court; also called once now
   */
  constructor(container, onChange) {
    this.on = isPowerSaverOn();
    this.onChange = onChange;
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'button button-quiet sound-toggle saver-toggle';
    this.button.setAttribute('aria-label', 'Power saver');
    this.button.innerHTML = ICONS.leaf;
    this.button.addEventListener('click', () => this.set(!this.on));
    container.append(this.button);
    this.#render();
    onChange(this.on);
  }

  set(on) {
    this.on = on;
    remember(on);
    this.#render();
    this.onChange(on);
  }

  #render() {
    this.button.setAttribute('aria-pressed', String(this.on));
    this.button.title = this.on ? words.saverOn : 'Power saver';
  }
}
