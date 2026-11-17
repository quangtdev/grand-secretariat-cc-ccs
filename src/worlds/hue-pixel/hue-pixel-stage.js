// The pixel Huế court's stage: the painted ground, one merged mesh of walls, the throne hall, bridge
// and garden props, the drum pavilion (its own mesh: it is what a click summons from), and the
// background life. Four draw calls in all.
import * as THREE from 'three';
import { COURT_BOUNDS, DRUM_PAVILION, GARDEN_TREES, POND } from '../../scene/court-layout.js';
import { buildAmbientLife } from './hue-pixel-ambient.js';
import { buildGround, RIVER } from './hue-pixel-ground-painter.js';
import { buildHall, buildPavilion, PAVILION_RIDGE } from './hue-pixel-hall-and-pavilion.js';
import { IsoMeshBuilder } from './hue-pixel-iso-mesh-builder.js';
import { buildStageAtlas } from './hue-pixel-stage-textures.js';

const WALL_HEIGHT = 0.8;
const wall = (b, x, z, w, d) => b.block({ x, z, w, d, h: WALL_HEIGHT, south: 'redDark', east: 'redDark', up: 'stone' });

/** The enclosing wall: low, so it never hides the yard behind it; open at the south gate. */
function buildWalls(b) {
  const { x, north, south } = COURT_BOUNDS;
  const depth = south - north;
  wall(b, -x - 0.2, (north + south) / 2, 0.4, depth);
  wall(b, x + 0.2, (north + south) / 2, 0.4, depth);
  wall(b, 0, north - 0.2, 2 * x + 0.8, 0.4);
  const gate = 2.2;
  wall(b, (-x - gate) / 2 - 0.2, south + 0.2, x - gate + 0.4, 0.4);
  wall(b, (x + gate) / 2 + 0.2, south + 0.2, x - gate + 0.4, 0.4);
  for (const side of [-1, 1]) { // gate posts with a gilded cap
    b.block({ x: side * gate, z: south + 0.2, w: 0.7, d: 0.7, h: 2.4, south: 'red', east: 'redDark', up: 'redDark' });
    b.block({ x: side * gate, z: south + 0.2, y: 2.4, w: 1.1, d: 1.1, h: 0.5, top: [0.6, 0.6], south: 'roof', east: 'roof', up: 'roof' });
  }
}

/** The bridge across the river at the end of the central path, with its red rails. */
function buildBridge(b) {
  const z = (COURT_BOUNDS.south + RIVER.south) / 2 + 0.3;
  const length = RIVER.south - COURT_BOUNDS.south + 0.6;
  b.block({ x: 0, z, w: 3.6, d: length, h: 0.12, south: 'plank', east: 'plank', up: 'plank' });
  for (const side of [-1, 1]) b.block({ x: side * 1.75, z, y: 0.12, w: 0.25, d: length, h: 0.7, south: 'red', east: 'redDark', up: 'red' });
}

/**
 * Trees, two small lamps at the gate (no urns: the incense is a 3D-world detail), the rockery and the lotus pond's rim.
 * Few and kept to the edges: nothing stands in the yard where scribes work and kneel.
 */
function buildGarden(b) {
  const trees = [[-16.5, -9], [16.5, -10], [-16.5, 2], [16.8, 0.5], [-9.5, -15], [9.5, -15.5], [-16.5, 10], [16.5, 9]];
  trees.forEach(([x, z], i) => b.sprite(x, 0, z, i % 4 === 3 ? 'pine' : 'tree', i % 2 ? 0.8 : 0.9));
  for (const tree of GARDEN_TREES) b.sprite(tree.x, 0, tree.z, 'frangipani', 0.95);
  for (const side of [-1, 1]) b.sprite(side * 2.6, 0, 8.2, 'lamp', 0.8); // the gate: the only lamps
  b.sprite(11.6, 0, -5.4, 'rock', 1.1);
  const { center, width, depth, rim } = POND;
  const edge = (x, z, w, d) => b.block({ x, z, w, d, h: rim, south: 'stone', east: 'stone', up: 'floor' });
  edge(center.x, center.z - depth / 2 - 0.12, width + 0.5, 0.25);
  edge(center.x, center.z + depth / 2 + 0.12, width + 0.5, 0.25);
  edge(center.x - width / 2 - 0.12, center.z, 0.25, depth);
  edge(center.x + width / 2 + 0.12, center.z, 0.25, depth);
}

/**
 * @param {THREE.Scene} scene
 * @param {{onChirp?: () => void}} hooks  onChirp: an egret has landed
 * @returns {import('../world-pack-contract.js').WorldStage}
 */
export function buildHuePixelStage(scene, { onChirp = () => {} } = {}) {
  const atlas = buildStageAtlas();
  scene.add(buildGround());

  const scenery = new IsoMeshBuilder(atlas);
  buildWalls(scenery);
  buildBridge(scenery);
  buildHall(scenery);
  buildGarden(scenery);
  scene.add(scenery.build());

  const pavilion = new IsoMeshBuilder(atlas);
  buildPavilion(pavilion);
  const summonTarget = pavilion.build();
  summonTarget.userData.pick = { kind: 'summon' };
  scene.add(summonTarget);

  const life = buildAmbientLife(atlas, { onPerch: onChirp });
  scene.add(life.mesh);

  return { summonTarget, summonAnchor: DRUM_PAVILION.clone().setY(PAVILION_RIDGE), ambient: life.ambient };
}
