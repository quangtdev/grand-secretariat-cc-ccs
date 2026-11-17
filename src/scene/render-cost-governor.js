// Keeps the court cheap to draw. The app stays open for hours beside an editor, so the
// scene is drawn only as often as what is happening needs:
//   active   the user is dragging, zooming or the view is gliding: up to 60 fps
//   moving   a figure, the king, a porter or an edict is travelling: 30 fps
//   ambient  the user is looking at the court; only background life moves: 20 fps
//   petition someone asks for a ruling while the user is elsewhere: 12 fps, so the lifted
//            scroll keeps calling (the Petition Holds Rule)
//   still    the user is typing in the dock with the pointer off the court, or the window
//            has lost focus: nothing is drawn and the frame loop sleeps. The court holds
//            still until the feed changes, something must move, or the pointer comes back.
// The shadow map is redrawn about 15 times a second while something travels, and a few
// times a second otherwise.
// Power saver (rail foot) halves every rate again; the petition still keeps calling.
// A world may bring its own table (environment.camera.fps: a 2D world reads fine at lower
// rates); the power saver then takes the lower of the world's rate and the saver's.
const RATES = {
  normal: {
    fps: { active: 60, moving: 30, ambient: 20, petition: 12, still: 0 },
    shadowMs: { active: 60, moving: 60, ambient: 300, petition: 500, still: 1000 }, // between shadow redraws
  },
  saver: {
    fps: { active: 30, moving: 15, ambient: 8, petition: 6, still: 0 },
    shadowMs: { active: 1000, moving: 1000, ambient: 1000, petition: 1000, still: 1000 }, // shadows are off anyway
  },
};
const AWAY_MS = 4000; // pointer off the court this long, with focus in the dock: the user is working there
const WATCH_MS = 400; // how often a sleeping loop checks whether to wake

/**
 * A tier's rate under the power saver: the lower of the world's and the saver's. A world whose
 * own rate is already at or below the saver's (a 2D world) is halved instead, so the saver
 * still saves; the petition keeps its 6 fps so the lifted scroll still calls.
 */
function saverRate(tier, saverFps, worldFps) {
  if (!worldFps) return 0;
  const lowered = worldFps <= saverFps ? worldFps / 2 : saverFps;
  return Math.round(tier === 'petition' ? Math.max(lowered, 6) : lowered);
}

export class RenderCostGovernor {
  /**
   * @param {HTMLCanvasElement} canvas  the court's canvas (pointer activity over it counts)
   * @param {Partial<Record<'active'|'moving'|'ambient'|'petition', number>>} [worldFps]  the world's own frame rates
   */
  constructor(canvas, worldFps) {
    this.activeUntil = 0;
    this.movingUntil = 0;
    this.petition = false;
    this.owed = false; // a frame is owed since the last wake
    this.pointerOnStage = false;
    this.sleeping = false;
    this.rouse = () => {}; // replaced while the loop sleeps
    this.lastFrameAt = 0;
    this.lastShadowAt = 0;
    this.lastPointerAt = performance.now();
    this.focused = document.hasFocus();
    const world = { ...RATES.normal.fps, ...worldFps };
    this.tables = {
      normal: { ...RATES.normal, fps: world },
      saver: { ...RATES.saver, fps: Object.fromEntries(Object.entries(RATES.saver.fps).map(([tier, fps]) => [tier, saverRate(tier, fps, world[tier])])) },
    };
    this.rates = this.tables.normal;
    this.drawn = 0; // frames drawn since the last cost() reading
    this.spentMs = 0; // main-thread time those frames took
    this.countedFrom = performance.now();
    addEventListener('focus', () => { this.focused = true; this.rouse(); });
    addEventListener('blur', () => { this.focused = false; });
    const stage = canvas.parentElement;
    stage.addEventListener('pointermove', () => { this.lastPointerAt = performance.now(); this.rouse(); });
    stage.addEventListener('pointerenter', () => { this.pointerOnStage = true; this.rouse(); });
    stage.addEventListener('pointerleave', () => { this.pointerOnStage = false; this.lastPointerAt = performance.now(); });
    for (const type of ['pointerdown', 'wheel']) canvas.addEventListener(type, () => this.markActive(1), { passive: true });
  }

  /** The view itself is changing (drag, zoom, glide, resize): draw at full rate for a little while. */
  markActive(seconds = 0.4) {
    this.activeUntil = Math.max(this.activeUntil, performance.now() + seconds * 1000);
    this.owed = true;
    this.rouse();
  }

  /** Something in the court is travelling: smooth enough at half rate. */
  markMoving(seconds = 0.3) {
    this.movingUntil = Math.max(this.movingUntil, performance.now() + seconds * 1000);
    this.owed = true;
    this.rouse();
  }

  tier(now = performance.now()) {
    if (now < this.activeUntil) return 'active';
    // A wake is a debt of one drawn frame, not just a timer: if it was asked for while the tab
    // was hidden (no frames run there), the court still gets its frame when the tab returns,
    // and that frame reports whatever has to travel.
    if (now < this.movingUntil || this.owed) return 'moving';
    const inDock = document.activeElement?.closest?.('.dock');
    // "Elsewhere": the window is not in front, or the user works in the dock with the pointer
    // outside the court (a pointer resting on the court means they are looking at it).
    const elsewhere = !this.focused || (inDock && !this.pointerOnStage && now - this.lastPointerAt > AWAY_MS);
    if (!elsewhere) return 'ambient';
    return this.petition ? 'petition' : 'still';
  }

  /** Power saver on or off: lower frame rates from the next frame. */
  setSaver(on) {
    this.rates = on ? this.tables.saver : this.tables.normal;
    this.markActive(0.1); // show the change at once
  }

  /** While true someone is asking for a ruling: the court never goes fully still. */
  setPetition(waiting) { this.petition = waiting; }

  /**
   * The frame loop hands itself over while the court is still: `sleep` is called once to
   * stop it, and `wake` restarts it as soon as there is something to draw again.
   */
  sleepUntilNeeded(wake) {
    if (this.sleeping) return;
    this.sleeping = true;
    // Roused at once by anything that marks activity; the slow watch catches the rest
    // (focus leaving the dock, a petition arriving).
    this.rouse = () => {
      if (!this.sleeping || this.tier() === 'still') return;
      clearInterval(watch);
      this.sleeping = false;
      wake();
    };
    const watch = setInterval(this.rouse, WATCH_MS);
  }

  /** True when a frame should be drawn now; call once per animation frame. */
  frameDue(now) {
    const fps = this.rates.fps[this.tier(now)];
    if (!fps) return false;
    const interval = 1000 / fps;
    const elapsed = now - this.lastFrameAt;
    if (elapsed < interval - 2) return false;
    // Carry only how late this frame is, so the rate averages out on any display (75, 90,
    // 144 Hz...). A frame let through a little early (within the 2 ms tolerance) carries
    // nothing: taking `elapsed % interval` there would leave almost a whole interval
    // behind, make the very next display frame due as well, and double the rate.
    const late = elapsed - interval;
    this.lastFrameAt = late > interval ? now : now - Math.max(0, late);
    this.drawn++;
    this.owed = false;
    return true;
  }

  /** True when the shadow map should be redrawn with this frame. */
  shadowsDue(now) {
    if (now - this.lastShadowAt < this.rates.shadowMs[this.tier(now)]) return false;
    this.lastShadowAt = now;
    return true;
  }

  /** Main-thread time one drawn frame took (update and render), for the cost readout. */
  noteFrameCost(ms) { this.spentMs += ms; }

  /** Since the last call: frames drawn per second, and main-thread milliseconds per frame. */
  measured(now = performance.now()) {
    const fps = this.drawn / Math.max((now - this.countedFrom) / 1000, 0.001);
    const frameMs = this.drawn ? this.spentMs / this.drawn : 0;
    this.drawn = 0;
    this.spentMs = 0;
    this.countedFrom = now;
    return { fps: Math.round(fps), frameMs: Math.round(frameMs * 10) / 10 };
  }
}
