// The space station world: a dark deck floating above a planet, a command bridge on the north dais,
// every agent a crew member in a flight suit at a console, sub-agents as hover drones, cargo drones
// that lift the consoles, a teleporter pad as the summon point and a captain on the bridge. Wires the
// world's pieces into the contract (../world-pack-contract.js).
import { buildCaptainBody } from './space-station-captain-body.js';
import { ConsoleWorkplace } from './space-station-console-workplace.js';
import { buildCrewBody } from './space-station-crew-body.js';
import { buildDataPacket } from './space-station-data-packet.js';
import { buildCargoDroneBody, buildDroneHelperBody } from './space-station-drone-bodies.js';
import { spaceStationAudio } from './space-station-audio-cues.js';
import { STATION } from './space-station-palette.js';
import { buildStationStage } from './space-station-stage.js';
import { spaceStationVocabulary } from './space-station-vocabulary.js';
import { PALETTE } from '../../scene/court-layout.js';

/** @type {import('../world-pack-contract.js').WorldPack} */
export const world = {
  id: 'space-station',
  label: 'Space station',
  environment: {
    background: STATION.void,
    fog: [90, 230],
    // Dim cool light, a strong cyan rim from behind the bridge: the light suits and glowing trims stay readable on the dark deck.
    hemi: { sky: 0xe2e6ee, ground: 0x555a62, intensity: 1.2 },
    sun: { color: 0xf0f3fa, intensity: 1.7, position: [-14, 22, 10] },
    rim: { color: 0x9fe6ff, intensity: 1.2, position: [8, 9, -24] },
    shadows: false,
    camera: { type: 'perspective' },
  },
  palette: { ring: STATION.cyan, pool: 0x7fe9ff, portalSummon: STATION.cyan, portalDismiss: PALETTE.jade, edictTrail: 0x7ff0ff },
  audio: spaceStationAudio,
  vocabulary: spaceStationVocabulary,
  buildStage: buildStationStage,
  bodies: {
    agent: buildCrewBody,
    ruler: buildCaptainBody,
    helper: buildDroneHelperBody,
    porter: buildCargoDroneBody,
    workplace: (slot) => new ConsoleWorkplace(slot),
    edictProjectile: buildDataPacket,
  },
};

export default world;
