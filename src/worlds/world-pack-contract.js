// The contract between the engine (motion, layout, frame loop, UI) and a world pack: the
// look of one court. A pack supplies everything that is *dressing* (lighting, colours,
// buildings, bodies of the figures); the engine owns everything that is *behaviour*
// (walking, queueing, bowing, desks carried out, the king's walks) and talks to bodies only
// through the interfaces below. Shared stage geometry (DESKS, petitionSpot, KING_* ...)
// stays in scene/court-layout.js: every world draws the same plan.

import { checkAudioAndVocabulary } from './world-audio-and-vocabulary-contract.js';

/**
 * @typedef {object} WorldEnvironment
 * @property {number|string} background       clear colour / sky colour
 * @property {[number, number]} fog           [near, far] of the linear fog (fog colour = background)
 * @property {{sky: number, ground: number, intensity: number}} hemi
 * @property {{color: number, intensity: number, position: [number, number, number]}} sun
 * @property {{color: number, intensity: number, position: [number, number, number]}} rim
 * @property {boolean} shadows                false: shadow map stays off, even after power saver is switched off
 * @property {PerspectiveCameraSpec|IsometricCameraSpec} camera   passed to createCourtScene untouched (scene/court-camera-rig.js)
 */

/** The 3D worlds' camera: orbit, pan and dolly. @typedef {{type: 'perspective'}} PerspectiveCameraSpec */

/**
 * The 2D worlds' camera: a fixed isometric view that holds the whole yard at zoom 1; pan and zoom only.
 * @typedef {object} IsometricCameraSpec
 * @property {'orthographic'} type
 * @property {'isometric'} view
 * @property {[number, number]} zoom  [min, max] of camera.zoom
 * @property {number} pixelScale      integer: render at 1/pixelScale of the screen, scaled up without smoothing
 * @property {{active?: number, moving?: number, ambient?: number, petition?: number}} [fps]  the world's frame rates (the power saver takes the lower)
 */

/**
 * Colours the engine itself draws (never the dressing's own).
 * @typedef {object} WorldPalette
 * @property {number} ring           ground ring under the hovered / selected figure
 * @property {number} pool           spotlight pool under the scribe whose terminal is open
 * @property {number} portalSummon   seal of light a soldier rises out of
 * @property {number} portalDismiss  seal a soldier sinks into
 * @property {number} edictTrail     sparks behind a flying edict
 */

/**
 * Something that lives in the background and is stepped every drawn frame.
 * @typedef {object} AmbientLife
 * @property {(dt: number, time: number) => void} update
 * @property {(petition: boolean) => void} [settle]  true while a petition waits: birds land, boats rest
 */

/**
 * @typedef {object} WorldStage
 * @property {import('three').Object3D} summonTarget  clickable; has userData.pick = { kind: 'summon' }
 * @property {import('three').Vector3} summonAnchor    where the "summon" chip floats
 * @property {AmbientLife[]} ambient                   stepped in order, skipped under power saver
 */

/**
 * Body of a scribe. The engine (scene/agent-figure-motion.js) owns the group, the walking and
 * the choice of pose, and calls `animate` once per update after it has moved the group.
 * @typedef {object} AgentBody
 * @property {import('three').Object3D} root  added to the figure's group
 * @property {number} [scale]                  figure scale (default 1.5)
 * @property {(status: string) => number} chipHeight  local height (unscaled) of the name chip above the feet
 * @property {(state: AgentAnimationState) => void} animate
 * @property {() => void} dispose
 */

/**
 * @typedef {object} AgentAnimationState
 * @property {'walking'|'kneeling'|'standing'|'seated'} pose
 * @property {boolean} moving
 * @property {boolean} running
 * @property {boolean} working   status === 'working'
 * @property {string} status
 * @property {number} bow        0..1, eased amount of a bow in progress
 * @property {number} bob        walking bounce in local units (0 when still)
 * @property {number} t          time + the figure's phase (de-syncs neighbours)
 * @property {number} dt
 * @property {number} ease       1 - exp(-dt * 9): one frame's smoothing factor
 * @property {boolean} still     prefers-reduced-motion
 */

/**
 * Body of the king (scene/ruler-figure-motion.js drives it).
 * @typedef {object} RulerBody
 * @property {import('three').Object3D} root
 * @property {(pose: 'seated'|'standing'|'gazing') => void} setPose
 * @property {(state: RulerAnimationState) => void} animate
 * @property {(out: import('three').Vector3) => import('three').Vector3} handPosition  world position of the pointing hand
 * @property {() => void} dispose
 */

/**
 * @typedef {object} RulerAnimationState
 * @property {'seated'|'standing'|'gazing'|'walking'} pose
 * @property {boolean} moving
 * @property {boolean} running
 * @property {boolean} pointing
 * @property {number} time  the frame loop's clock (not per figure)
 * @property {number} ease  1 - exp(-dt * 7)
 * @property {boolean} still
 * @property {number} bob   walking bounce in local units
 */

/**
 * Body of a sub-agent (soldier). The engine owns rising, sinking, formation and bow timing.
 * @typedef {object} HelperBody
 * @property {import('three').Object3D} root
 * @property {(state: {thrust: number, bow: number, bob: number, ease: number}) => void} animate
 *           thrust: 0..0.9 drill thrust, bow: 0..0.55, bob: walking bounce
 * @property {() => void} dispose
 */

/**
 * Body of a desk porter. `animate` is called every frame while the porters are out.
 * @typedef {object} PorterBody
 * @property {import('three').Object3D} root
 * @property {(state: {bow: number, bob: number}) => void} animate
 */

/**
 * A scribe's desk. The engine sets `group.position`, `group.rotation.y` while carrying,
 * and returns to `restRotation` when set down.
 * @typedef {object} Workplace
 * @property {import('three').Object3D} group
 * @property {number} restRotation  rotation.y at rest for this slot
 * @property {(count: number) => void} setSheets  finished work piles up
 * @property {(left: number) => void} [setInk]  a separate gauge of the scribe's context: ink LEFT, 0..1 in 5 % steps, 1 = full (the default of a new desk). Called only when the step changes; change one mesh's scale/position or a sprite frame, never allocate. Neutral materials, never a status colour
 * @property {() => void} dispose
 */

/**
 * @typedef {object} WorldBodies
 * @property {(session: object) => AgentBody} agent
 * @property {() => RulerBody} ruler
 * @property {(soldier: object, masterId: string) => HelperBody} helper
 * @property {() => PorterBody} porter
 * @property {(slot: {desk: import('three').Vector3, west: boolean}) => Workplace} workplace
 * @property {() => import('three').Object3D} edictProjectile  the flying order; the engine moves it. One per flight: if it owns geometry, set `userData.dispose` and the engine calls it when the flight ends
 */

/**
 * What main.js drives, whatever draws the stage: the court (scene/court-stage-driver.js) or a
 * DOM board (board/order-rail-board.js). main.js owns the dock, the rail and the feed; the driver
 * owns the stage and its pointer.
 * @typedef {object} StageDriver
 * @property {(sessions: object[]) => void} sync      every feed, at once (figures move, cards fly)
 * @property {(sessions: object[]) => void} render    the throttled shell render (text that changes often)
 * @property {(ids: string[], selectedId: string|null) => void} highlight  hovered and selected agents
 * @property {() => void} hovered                     the hovered agent changed
 * @property {(id: string) => void} focus             its terminal opened: bring it into view
 * @property {() => void} release                     nothing is open any more
 * @property {(on: boolean) => void} setPowerSaver
 * @property {() => void} dictate                     the user types an order in the dock
 * @property {(id: string) => void} edict             an order was sent to this agent
 * @property {object} debug                           exposed on window.court
 */

/**
 * A board world (kind 'board') draws no scene: it brings only words, sound and its driver.
 * @typedef {object} BoardWorldPack
 * @property {'board'} kind
 * @property {string} id
 * @property {string} label
 * @property {import('./world-audio-and-vocabulary-contract.js').WorldAudio} audio
 * @property {import('./world-audio-and-vocabulary-contract.js').WorldVocabulary} vocabulary
 * @property {Record<string, string>} board  the board's own words: station names, their empty notes, 'oldest', 'order' (BOARD_WORDS)
 */

/**
 * @typedef {object} WorldPack
 * @property {'scene'} [kind]  default; 'board' packs follow BoardWorldPack instead
 * @property {string} id
 * @property {string} label
 * @property {WorldEnvironment} environment
 * @property {import('./world-audio-and-vocabulary-contract.js').WorldAudio} audio
 * @property {import('./world-audio-and-vocabulary-contract.js').WorldVocabulary} vocabulary
 * @property {WorldPalette} palette
 * @property {(scene: import('three').Scene, hooks?: {onChirp?: () => void}) => WorldStage} buildStage
 * @property {WorldBodies} bodies
 * @property {{desk: import('three').Vector3, seat: import('three').Vector3, facing: number, west: boolean}[]} [desks]  own desk slots, filled in order (default: DESKS of court-layout.js; build with makeDeskSlot)
 * @property {number} [petitionSpacing]  world units between neighbouring petitioners (default 1.3, see petitionSpot)
 */

// The board's own words (board/order-rail-board.js reads each one).
const BOARD_WORDS = ['stationPass', 'stationLine', 'stationReady', 'passEmpty', 'lineEmpty', 'readyEmpty', 'oldest', 'order'];
const BODY_FACTORIES = ['agent', 'ruler', 'helper', 'porter', 'workplace', 'edictProjectile'];
const PALETTE_KEYS = ['ring', 'pool', 'portalSummon', 'portalDismiss', 'edictTrail'];
const LIGHTS = ['hemi', 'sun', 'rim'];

/** Dev-time check: throws one error naming every missing or mistyped member. */
export function assertWorldPack(pack) {
  const problems = [];
  const need = (ok, what) => { if (!ok) problems.push(what); };
  need(pack && typeof pack === 'object', 'pack is not an object');
  if (pack && typeof pack === 'object') {
    need(typeof pack.id === 'string' && pack.id, 'id');
    need(typeof pack.label === 'string' && pack.label, 'label');
    need(pack.kind === undefined || pack.kind === 'scene' || pack.kind === 'board', `kind (unknown "${pack.kind}")`);
    if (pack.kind === 'board') {
      checkAudioAndVocabulary(pack, need); // a board draws no scene: no environment, palette or bodies
      for (const key of BOARD_WORDS) need(typeof pack.board?.[key] === 'string' && pack.board[key], `board.${key}`);
      if (problems.length) throw new Error(`World pack "${pack.id ?? '?'}" is incomplete: ${problems.join(', ')}`);
      return pack;
    }
    const env = pack.environment;
    need(env && typeof env === 'object', 'environment');
    if (env) {
      need(env.background !== undefined, 'environment.background');
      need(Array.isArray(env.fog) && env.fog.length === 2, 'environment.fog [near, far]');
      for (const light of LIGHTS) need(env[light] && typeof env[light].intensity === 'number', `environment.${light}`);
      need(typeof env.shadows === 'boolean', 'environment.shadows (boolean)');
      need(env.camera && typeof env.camera.type === 'string', 'environment.camera.type');
      if (env.camera?.type === 'orthographic') {
        need(Array.isArray(env.camera.zoom) && env.camera.zoom.length === 2, 'environment.camera.zoom [min, max]');
        need(Number.isInteger(env.camera.pixelScale) && env.camera.pixelScale >= 1, 'environment.camera.pixelScale (integer)');
      }
    }
    for (const key of PALETTE_KEYS) need(typeof pack.palette?.[key] === 'number', `palette.${key}`);
    need(typeof pack.buildStage === 'function', 'buildStage(scene, hooks)');
    checkAudioAndVocabulary(pack, need);
    for (const name of BODY_FACTORIES) need(typeof pack.bodies?.[name] === 'function', `bodies.${name}()`);
  }
  if (problems.length) throw new Error(`World pack "${pack?.id ?? '?'}" is incomplete: ${problems.join(', ')}`);
  return pack;
}

/** Checks what buildStage returned; the engine calls this once at start-up. */
export function assertWorldStage(stage, worldId) {
  const ok = stage?.summonTarget?.userData?.pick?.kind === 'summon'
    && stage.summonAnchor?.isVector3 && Array.isArray(stage.ambient);
  if (!ok) throw new Error(`World "${worldId}": buildStage must return { summonTarget (userData.pick.kind = 'summon'), summonAnchor: Vector3, ambient: [] }`);
  return stage;
}
