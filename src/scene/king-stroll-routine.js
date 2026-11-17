// Decides what the king does. When the court is quiet he rises, takes one of his
// walks (the hall gallery, the rockery, the lotus pond) and comes back. He hurries
// back the moment a scribe comes to ask for a ruling, and walks back when one
// reports, or when the user starts dictating an order in the dock.
// While a scribe asks for a ruling he stays seated: the petition is what calls. A scribe
// that has only reported back (done) does not keep him in: he walks back to receive the
// report, then goes out again after a short rest.
import { KING_OUTINGS, KING_SEAT, KING_STAND } from './court-layout.js';
import { RulerFigureMotion } from './ruler-figure-motion.js';

const SPEED = { stroll: 1.5, back: 2.6, hurry: 6 };
const FACING_COURT = 0; // the throne faces south, over the yard
const REST_SECONDS = [8, 15]; // seated this long before he may go out again
const GAZE_SECONDS = [4, 8];
const ATTEND_SECONDS = 10; // after the user types, he stays on the throne this long
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const between = ([low, high]) => low + Math.random() * (high - low);

export class KingStrollRoutine {
  /** @param {import('../worlds/world-pack-contract.js').WorldPack} world  dresses the king */
  constructor(scene, world) {
    this.king = new RulerFigureMotion(KING_SEAT, FACING_COURT, world.bodies.ruler());
    scene.add(this.king.group);
    this.state = 'seated'; // seated | out | gazing | returning
    this.restLeft = between(REST_SECONDS);
    this.attendLeft = 0;
    this.gazeLeft = 0;
    this.legs = []; // legs of the current outing still ahead
    this.trail = []; // points reached on the current outing, newest last
    this.petitionWaiting = false;
    this.previous = null; // id -> status at the last feed
    this.leisure = true; // false (power saver): he stays on the throne
  }

  /** Power saver: no walks; one already under way ends with a walk back. */
  setLeisure(on) {
    this.leisure = on;
    if (!on) this.recall(SPEED.back);
  }

  /** Watch the feed: a new petition calls him back at a run, a new report at a walk. */
  observe(sessions) {
    this.petitionWaiting = sessions.some((s) => s.status === 'asking');
    if (this.previous) {
      const newly = (status) => sessions.some((s) => s.status === status && this.previous.has(s.id) && this.previous.get(s.id) !== status);
      if (newly('asking')) this.recall(SPEED.hurry);
      else if (newly('done') || newly('exited')) this.recall(SPEED.back);
    }
    // Out while a scribe asks (e.g. the page opened mid-walk): a petition is worth a run.
    if (this.state !== 'seated' && this.petitionWaiting) this.recall(SPEED.hurry);
    this.previous = new Map(sessions.map((s) => [s.id, s.status]));
  }

  /** The user is dictating: he comes back to the throne and stays a while. */
  attend() {
    this.attendLeft = ATTEND_SECONDS;
    this.recall(SPEED.back);
  }

  /** The user sent an order to a scribe: the king turns and points at it. */
  decree(figure) {
    this.attend();
    this.king.point(figure.group.position);
  }

  /** Begin a named outing now (also handy from the console: court.king.startOuting('pond')). */
  startOuting(name = this.#pickOuting()) {
    if (this.state !== 'seated' || !KING_OUTINGS[name]) return;
    this.state = 'out';
    this.legs = [...KING_OUTINGS[name]];
    this.trail = [];
    this.king.setPose('standing');
    // Step down from the dais, then go on with the first leg.
    this.king.walkTo([KING_STAND], FACING_COURT, { speed: SPEED.stroll, onArrive: () => this.#nextLeg() });
  }

  /** Go back to the throne the way he came. */
  recall(speed) {
    if (this.state === 'seated') return;
    if (this.state === 'returning') {
      if (speed > this.king.speed) this.king.speed = speed; // a walk back turns into a run
      return;
    }
    this.state = 'returning';
    this.king.halt();
    this.king.setPose('standing');
    const way = [...this.trail].reverse();
    // Still stepping down from the dais: just sit back down.
    if (this.trail.length) way.push(KING_STAND);
    way.push(KING_SEAT);
    this.king.walkTo(way, FACING_COURT, { speed, onArrive: () => this.#sitDown() });
  }

  /** @returns {boolean} true while the king is walking or pointing */
  update(dt, time) {
    this.king.update(dt, time);
    this.attendLeft = Math.max(0, this.attendLeft - dt);
    this.#decide(dt);
    return this.king.moving || Boolean(this.king.pointing && this.king.clock < this.king.pointing.until);
  }

  #decide(dt) {
    if (this.state === 'seated') {
      if (!this.leisure || this.petitionWaiting || this.attendLeft > 0 || reducedMotion.matches) return;
      this.restLeft -= dt;
      if (this.restLeft <= 0) this.startOuting();
    } else if (this.state === 'gazing') {
      this.gazeLeft -= dt;
      if (this.gazeLeft <= 0) {
        this.king.setPose('standing');
        this.state = 'out';
        this.#nextLeg();
      }
    }
  }

  #nextLeg() {
    if (this.state !== 'out') return;
    const leg = this.legs.shift();
    if (!leg) { this.recall(SPEED.stroll); return; }
    const facing = leg.gaze ? leg.gaze.facing : FACING_COURT;
    this.king.walkTo([leg.to], facing, {
      speed: SPEED.stroll,
      onArrive: () => {
        this.trail.push(leg.to);
        if (!leg.gaze) { this.#nextLeg(); return; }
        this.state = 'gazing';
        this.gazeLeft = between(GAZE_SECONDS);
        this.king.setPose('gazing');
      },
    });
  }

  #sitDown() {
    this.state = 'seated';
    this.trail = [];
    this.legs = [];
    this.king.setPose('seated');
    this.restLeft = between(REST_SECONDS);
  }

  #pickOuting() {
    // The yard walks are the point of going out; the gallery is a short stretch.
    const weighted = ['riverView', 'riverView', 'pond', 'pond', 'rockery', 'gallery', 'galleryEast', 'galleryWest'];
    return weighted[Math.floor(Math.random() * weighted.length)];
  }
}
