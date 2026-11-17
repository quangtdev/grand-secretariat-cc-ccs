// The station's quiet life: the floor light strips along the deck edge and the south walk, pulsing
// slowly; blinking status lights on the beacon, the airlock, the bridge wall and the deck corners;
// and a small shuttle that crosses the void behind the bridge now and then (and blips the telemetry, the
// station's "chirp", three times on the way). Everything holds still
// while a petition waits (strips lit, lights on, shuttle where it is) and under reduced motion, which is
// read live (the Petition Holds Rule). No shadows, no per-frame allocation.
import * as THREE from 'three';
import { material } from '../../scene/court-mesh-helpers.js';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { DECK_BOUNDS } from './space-station-deck-and-bridge.js';
import { STATION } from './space-station-palette.js';
import { BEACON } from './space-station-star-table-and-airlock.js';
import { glow, glowMesh } from './space-station-shape-helpers.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const EDGE = 0.4; // strips sit this far inside the deck's edge
const STRIP_WIDTH = 0.07;

/** Light strips lying on the deck: the edge all round and the central path's two sides south of the petition rows. */
function floorStrips() {
  const { x, north, south } = DECK_BOUNDS;
  const flat = (width, depth, px, pz) => glow(STATION.cyan, new THREE.BoxGeometry(width, 0.012, depth), px, 0.008, pz);
  const midZ = (north + south) / 2;
  const length = south - north - EDGE * 2;
  const parts = [
    flat(STRIP_WIDTH, length, -x + EDGE, midZ), flat(STRIP_WIDTH, length, x - EDGE, midZ),
    flat(x * 2 - EDGE * 2, STRIP_WIDTH, 0, south - EDGE), flat(x * 2 - EDGE * 2, STRIP_WIDTH, 0, north + EDGE),
    flat(STRIP_WIDTH, 8, -1.6, 7.6), flat(STRIP_WIDTH, 8, 1.6, 7.6), // the central path out to the south
  ];
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false });
  const mesh = glowMesh(parts, null, material);
  mesh.matrixAutoUpdate = false;
  return { mesh, material };
}

/** Three groups of small lights that blink out of step. Cyan, white and soft red: none is a status colour. */
function statusLights() {
  const light = (colour, x, y, z) => glow(colour, new THREE.BoxGeometry(0.16, 0.16, 0.16), x, y, z);
  const groups = [
    [STATION.cyan, [[BEACON.x, 1.7, BEACON.z], [-14.2, 0.1, -14.8], [14.2, 0.1, 11.3]], 1.3],
    [0xffffff, [[11.9, 3.3, -0.4], [11.9, 3.3, 4.0], [-7.1, 4.3, -12.5], [7.1, 4.3, -12.5]], 1.9],
    [STATION.alert, [[14.2, 0.1, -14.8], [-14.2, 0.1, 11.3]], 2.6],
  ];
  return groups.map(([colour, spots, period]) => ({
    mesh: glowMesh(spots.map(([x, y, z]) => light(colour, x, y, z)), null),
    period,
  }));
}

/** A small shuttle: grey hull, swept wings, a fin, a cyan engine glow and red/white nav lights. */
function buildShuttle() {
  const hull = new THREE.Group();
  const piece = (geometry, colour, x, y, z) => { const m = new THREE.Mesh(geometry, material(colour, 0.5)); m.position.set(x, y, z); return m; };
  const parts = [
    piece(new THREE.SphereGeometry(1, 12, 8).scale(3, 0.7, 0.8), STATION.panelLight, 0, 0, 0),
    piece(new THREE.BoxGeometry(1.6, 0.08, 4.2), STATION.panel, -0.6, 0, 0),
    piece(new THREE.BoxGeometry(0.9, 1.1, 0.08), STATION.panelLight, -2.3, 0.7, 0),
  ];
  const body = mergeAsVertexColours(parts, new THREE.Group().add(...parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }));
  const lights = glowMesh([
    glow(STATION.cyan, new THREE.SphereGeometry(0.3, 8, 6), -3.1, 0, 0),
    glow(STATION.alert, new THREE.SphereGeometry(0.14, 6, 4), -0.6, 0, 2.1),
    glow(0xffffff, new THREE.SphereGeometry(0.14, 6, 4), -0.6, 0, -2.1),
  ], null);
  hull.add(body, lights);
  hull.scale.setScalar(0.8);
  return hull;
}

const SHUTTLE = { y: -4.5, z: -44, speed: 3, from: -58, to: 58, rest: 20, pings: [-28, 0, 28] }; // pings: where it blips the station's telemetry

/** @returns {import('../world-pack-contract.js').AmbientLife} */
export function buildAmbientLightsAndShuttle(scene, onChirp = () => {}) {
  const strips = floorStrips();
  const lights = statusLights();
  const shuttle = buildShuttle();
  shuttle.position.set(16, SHUTTLE.y, SHUTTLE.z);
  scene.add(strips.mesh, ...lights.map((l) => l.mesh), shuttle);
  let petition = false;
  let resting = 0;
  return {
    update: (dt, time) => {
      if (petition || reducedMotion.matches) return;
      strips.material.opacity = 0.4 + Math.sin(time * 0.9) * 0.2;
      for (const { mesh, period } of lights) mesh.visible = (time % period) < period * 0.6;
      if (resting > 0) { resting -= dt; return; }
      const before = shuttle.position.x;
      shuttle.position.x += SHUTTLE.speed * dt;
      for (let i = 0; i < SHUTTLE.pings.length; i++) if (before < SHUTTLE.pings[i] && shuttle.position.x >= SHUTTLE.pings[i]) onChirp();
      if (shuttle.position.x > SHUTTLE.to) { shuttle.position.x = SHUTTLE.from; resting = SHUTTLE.rest; }
    },
    settle: (value) => {
      petition = value;
      if (value) { strips.material.opacity = 0.6; for (const { mesh } of lights) mesh.visible = true; }
    },
  };
}
