// The office's stage: a concrete floor under glass window walls, the manager's corner office on
// the dais with steps down on the east side, the reception desk and elevator doors (the summon
// point), a coffee counter, a lounge and a water cooler, plants and fans, and a city and sky
// beyond the glass; the ambient parts hold still while a petition waits.
import * as THREE from 'three';
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { buildBubblesMotesAndPings } from './office-cooler-bubbles-and-motes.js';
import { buildFixtures } from './office-fixtures-coffee-lounge-cooler.js';
import { buildFloorAndWalls } from './office-floor-and-walls.js';
import { buildManagerGlassOffice } from './office-manager-glass-office.js';
import { buildPlantsAndFansAmbient } from './office-plants-and-fans.js';
import { buildReceptionAndElevator } from './office-reception-and-elevator.js';
import { buildClouds, buildSkyline } from './office-window-skyline.js';

/** @returns {import('../world-pack-contract.js').WorldStage} */
export function buildOfficeStage(scene, { onChirp = () => {} } = {}) {
  scene.add(buildFloorAndWalls(), buildManagerGlassOffice(), buildFixtures(), buildSkyline());
  const { target } = buildReceptionAndElevator();
  scene.add(target);
  return {
    summonTarget: target,
    summonAnchor: new THREE.Vector3(DRUM_PAVILION.x, 3.4, DRUM_PAVILION.z),
    ambient: [buildClouds(scene), buildPlantsAndFansAmbient(scene), buildBubblesMotesAndPings(scene, { onChirp })],
  };
}
