// Keeps the figures in the yard in step with the live session list:
// who has a desk, who is queueing before the throne, who is arriving or leaving.
import * as THREE from 'three';
import { STATUS } from '../status-vocabulary.js';
import { AgentFigureMotion } from './agent-figure-motion.js';
import { DESKS as DEFAULT_DESKS, DRUM_PAVILION, pathLaneX, petitionSpot } from './court-layout.js';
import { inkLeftSteps } from './ink-left-steps.js';
import { sparkTexture } from './summoning-portal-effect.js';

const ENTRANCE = DRUM_PAVILION.clone().add(new THREE.Vector3(2.6, 0, 0));
const PETITION_LINE_Z = -3.2; // where the central path meets the petition ground
const FACING_THRONE = Math.PI; // -z

const atThrone = (status) => Boolean(STATUS[status]?.atThrone);

export class CourtPopulation {
  /**
   * @param {THREE.Scene} scene
   * @param {DeskPorterCrew} crew  brings each agent's desk out and takes it away
   * @param {import('../worlds/world-pack-contract.js').WorldPack} world  dresses the figures
   */
  constructor(scene, crew, world) {
    this.scene = scene;
    this.world = world;
    this.desks = world.desks ?? DEFAULT_DESKS; // the world's own slots, or the shared plan
    this.crew = crew;
    this.figures = new Map(); // session id -> AgentFigureMotion
    this.deskOf = new Map(); // session id -> desk index
    this.placeOf = new Map(); // session id -> 'desk' | 'throne:<n>'
    this.firstSync = true;
    // A soft pool of warm light on the paving under the scribe whose terminal is open.
    this.spotId = null;
    this.pool = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: sparkTexture(), color: world.palette.pool, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.pool.position.y = 0.025;
    this.pool.visible = false;
    scene.add(this.pool);
  }

  /** The agent whose terminal is open (or null): it gets the pool of light. */
  spotlight(id) { this.spotId = id; }

  sync(sessions) {
    const live = new Set(sessions.map((s) => s.id));

    for (const [id, figure] of this.figures) {
      if (live.has(id) || figure.leaving) continue;
      figure.leaving = true;
      figure.held = false;
      const deskIndex = this.deskOf.get(id);
      this.deskOf.delete(id);
      this.placeOf.delete(id);
      // Dismissed: walk out past the drum pavilion, then vanish; then its desk is carried away,
      // unless another agent has taken that desk meanwhile.
      figure.status = 'idle';
      figure.walkTo([ENTRANCE], 0, {
        onArrive: () => {
          figure.dispose();
          this.figures.delete(id);
          if (deskIndex !== undefined && ![...this.deskOf.values()].includes(deskIndex)) this.crew.take(deskIndex);
        },
      });
    }

    // Petitioners line up in the order they started waiting.
    const queue = sessions.filter((s) => atThrone(s.status)).sort((a, b) => a.statusSince - b.statusSince);

    for (const session of sessions) {
      const deskIndex = this.#deskIndex(session.id);
      const desk = this.desks[deskIndex];
      const queueIndex = queue.indexOf(session);
      const place = queueIndex >= 0 ? `throne:${queueIndex}` : 'desk';
      const target = queueIndex >= 0 ? petitionSpot(queueIndex, this.world.petitionSpacing) : desk.seat;
      const facing = queueIndex >= 0 ? FACING_THRONE : desk.facing;

      let figure = this.figures.get(session.id);
      if (!figure) {
        // Agents already present when the page opens are placed directly; later ones walk in.
        figure = new AgentFigureMotion(session, this.firstSync ? target : ENTRANCE, facing, this.world.bodies.agent(session), this.world.palette);
        this.figures.set(session.id, figure);
        this.scene.add(figure.group);
        if (this.firstSync) {
          this.placeOf.set(session.id, place);
          this.crew.place(deskIndex); // already here when the page opened: the desk simply stands
        } else {
          // A newcomer waits at the entrance until the porters set off with its desk.
          figure.held = true;
          this.crew.bring(deskIndex, () => { figure.held = false; });
        }
      }
      if (queueIndex >= 0) figure.held = false; // called before the throne: it does not wait for a desk
      this.#countSheets(figure, session, deskIndex);
      this.#showInk(figure, session, deskIndex);
      const statusChanged = figure.status !== session.status;
      figure.status = session.status;

      if (this.placeOf.get(session.id) !== place) {
        this.placeOf.set(session.id, place);
        // An agent that needs a ruling runs; reporting back or returning to work is a walk.
        figure.walkTo(this.#route(figure.group.position, target), facing, { run: session.status === 'asking' });
      } else if (statusChanged && !figure.moving) {
        figure.restFacing = facing;
      }
    }
    this.firstSync = false;
  }

  /**
   * Path between yard positions. Trips to or from the throne, or across to the other
   * flank, go out to the central path and along it; short trips on one flank are direct.
   */
  #route(from, to) {
    const involvesThrone = Math.min(from.z, to.z) < PETITION_LINE_Z;
    const changesFlank = from.x * to.x < 0;
    if (!involvesThrone && !changesFlank) return [to];
    const lane = pathLaneX(Math.abs(from.x) > 1 ? from.x : to.x);
    return [
      new THREE.Vector3(lane, 0, Math.max(from.z, PETITION_LINE_Z)),
      new THREE.Vector3(lane, 0, Math.max(to.z, PETITION_LINE_Z)),
      to,
    ];
  }

  #deskIndex(id) {
    if (!this.deskOf.has(id)) {
      const taken = new Set(this.deskOf.values());
      let index = this.desks.findIndex((_, i) => !taken.has(i));
      if (index < 0) index = this.deskOf.size % this.desks.length; // more agents than desks: share
      this.deskOf.set(id, index);
    }
    return this.deskOf.get(id);
  }

  /** The pile on the desk grows by a sheet with every new step, and starts again with a new order. */
  #countSheets(figure, session, deskIndex) {
    if (session.status !== 'working') return;
    if (session.order !== figure.order) figure.sheets = 0;
    if (session.activity !== figure.activity || session.order !== figure.order) figure.sheets = (figure.sheets || 0) + 1;
    figure.order = session.order;
    figure.activity = session.activity;
    this.crew.deskAt(deskIndex)?.setSheets(figure.sheets);
  }

  /**
   * The ink gauge on the desk follows the scribe's context: sent only when the 5 % step changes
   * or a different desk object stands there (a carried-in desk starts full, so it is told again).
   */
  #showInk(figure, session, deskIndex) {
    const desk = this.crew.deskAt(deskIndex);
    if (!desk) return;
    const left = inkLeftSteps(session.ink);
    if (figure.inkDesk === desk && figure.inkLeft === left) return;
    figure.inkDesk = desk;
    figure.inkLeft = left;
    desk.setInk?.(left);
  }

  /** The desk an agent sits at ({ seat, facing }); its soldiers keep their post there. */
  homeDesk(id) {
    return this.deskOf.has(id) ? this.desks[this.deskOf.get(id)] : null;
  }

  /** @returns {boolean} true while any figure is travelling */
  update(dt, time) {
    let travelling = false;
    for (const figure of this.figures.values()) {
      figure.update(dt, time);
      travelling ||= figure.moving || figure.held || figure.bowLeft > 0;
    }
    const lit = this.spotId && this.figures.get(this.spotId);
    this.pool.visible = Boolean(lit);
    if (lit) this.pool.position.set(lit.group.position.x, 0.025, lit.group.position.z);
    return travelling;
  }

  /** Marks which figure shows its ground ring (hovered or selected). */
  highlight(ids) {
    for (const [id, figure] of this.figures) figure.ring.visible = ids.includes(id);
  }
}
