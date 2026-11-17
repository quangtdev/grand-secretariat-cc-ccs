// The station's stage: the deck and the command bridge, the teleporter pad (the summon point), the
// star-map table, the airlock and the beacon, and the life around them (starfield, planet, status
// lights, floor light strips, a passing shuttle), all held still while a petition waits.
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { buildAmbientLightsAndShuttle } from './space-station-ambient-lights-and-shuttle.js';
import { buildDeckAndBridge } from './space-station-deck-and-bridge.js';
import { buildStarfieldAndPlanet } from './space-station-starfield-and-planet.js';
import { buildStarTableAndAirlock } from './space-station-star-table-and-airlock.js';
import { buildTeleporterPad } from './space-station-teleporter-pad.js';

/** @returns {import('../world-pack-contract.js').WorldStage} */
export function buildStationStage(scene, { onChirp = () => {} } = {}) {
  scene.add(buildDeckAndBridge());
  const pad = buildTeleporterPad();
  const outposts = buildStarTableAndAirlock();
  scene.add(pad.target, outposts.group);
  return {
    summonTarget: pad.target,
    summonAnchor: DRUM_PAVILION.clone().setY(4.6),
    ambient: [buildStarfieldAndPlanet(scene), buildAmbientLightsAndShuttle(scene, onChirp), pad.ambient, outposts.ambient],
  };
}
