// The Huế court's stage: the throne hall, yard and drum pavilion, the gardens and river, and
// the background life (egrets, koi, smoke, petals, dragonflies, clouds, banners, a sampan).
// Each piece keeps its own update signature; small adapters give them the contract's
// `{ update(dt, time), settle?(petition) }` shape.
import { buildCourt } from '../../scene/court-architecture.js';
import { buildSurroundings } from '../../scene/court-surroundings.js';
import { COURT_BOUNDS, DRUM_PAVILION } from '../../scene/court-layout.js';
import { AmbientBirdFlock } from '../../scene/ambient-bird-flock.js';
import { createAmbientParticles } from '../../scene/ambient-particles.js';
import { buildLotusPond } from '../../scene/lotus-pond-with-koi.js';
import { createRiverLife } from '../../scene/river-water-and-sampan.js';
import { createSky } from '../../scene/sky-dome-and-clouds.js';
import { createGateAndBanners } from '../../scene/south-gate-and-banners.js';

/**
 * @param {import('three').Scene} scene
 * @param {{onChirp?: () => void}} hooks  onChirp: a bird has landed
 * @returns {import('../world-pack-contract.js').WorldStage}
 */
export function buildHueCourtStage(scene, { onChirp = () => {} } = {}) {
  const { drumPavilion } = buildCourt(scene);
  buildSurroundings(scene);
  const flock = new AmbientBirdFlock(scene, { onPerch: onChirp });
  const pond = buildLotusPond(scene);
  const particles = createAmbientParticles(scene); // incense smoke, falling petals, dragonflies
  const sky = createSky(scene); // gradient dome and slow clouds
  const banners = createGateAndBanners(scene); // the south gate, and two banners in the yard
  const river = createRiverLife(scene, { z: COURT_BOUNDS.south + 3.4, west: -30, east: 13 }); // flowing water, one sampan

  return {
    summonTarget: drumPavilion,
    summonAnchor: DRUM_PAVILION.clone().setY(4.5),
    ambient: [
      { update: (dt, time) => flock.update(dt, time), settle: (on) => flock.settle(on) },
      { update: (dt, time) => pond.update(dt, time) },
      { update: (dt, time) => particles.update(dt, time) },
      { update: (dt) => sky.update(dt) },
      { update: (dt, time) => river.update(dt, time), settle: (on) => river.settle(on) },
      { update: (_dt, time) => banners.update(time), settle: (on) => banners.settle(on) },
    ],
  };
}
