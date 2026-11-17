// The air over the court: a dome that runs from the mist at the horizon (the fog's colour,
// so far ground melts into it) to a pale blue overhead, and a few flat clouds that drift
// very slowly. Backdrop only: two draw calls, no shadows.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE } from './court-layout.js';

const ZENITH = 0x9fbfd6;
const DOME_RADIUS = 150; // inside the camera's far plane (200)
const CLOUDS = [[-40, 34, -70, 1.3], [25, 40, -95, 1.7], [70, 30, -40, 1.1], [-85, 36, -20, 1.5]]; // x, y, z, size
const DRIFT = 0.25; // units per second, eastwards
const SPAN = 120; // a cloud leaving the east edge returns from the west
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function buildDome() {
  const geometry = new THREE.SphereGeometry(DOME_RADIUS, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2 + 0.2);
  const horizon = new THREE.Color(PALETTE.mist);
  const zenith = new THREE.Color(ZENITH);
  const colour = new THREE.Color();
  const position = geometry.attributes.position;
  const colours = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    // Mist up to a low band above the horizon, then easing into blue.
    const height = Math.min(Math.max((position.getY(i) / DOME_RADIUS - 0.06) / 0.5, 0), 1);
    colour.lerpColors(horizon, zenith, height * height * (3 - 2 * height));
    colours.set([colour.r, colour.g, colour.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const dome = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -1; // drawn first, behind everything
  dome.frustumCulled = false;
  return dome;
}

/** All the clouds as one mesh: each a few squashed low-poly lumps. They drift together, as a sheet. */
function buildClouds(material) {
  const lumps = CLOUDS.flatMap(([cx, cy, cz, size]) =>
    [[0, 0, 0, 5], [4.5, -0.3, 0.5, 3.6], [-4.2, -0.2, -0.4, 3.2], [1.5, 1.2, 0, 3]].map(([x, y, z, r]) =>
      new THREE.IcosahedronGeometry(r, 0).scale(1.5, 0.45, 1).translate(x, y, z).scale(size, size, size).translate(cx, cy, cz)));
  const clouds = new THREE.Mesh(mergeGeometries(lumps), material);
  lumps.forEach((g) => g.dispose());
  clouds.frustumCulled = false;
  return clouds;
}

/** Adds the sky to `scene`; returns its per-frame step. */
export function createSky(scene) {
  scene.add(buildDome());
  const clouds = buildClouds(new THREE.MeshBasicMaterial({ color: 0xf7f5ee, transparent: true, opacity: 0.85, fog: false, depthWrite: false }));
  scene.add(clouds);
  return {
    update(dt) {
      if (reducedMotion.matches) return;
      clouds.position.x += DRIFT * dt;
      if (clouds.position.x > SPAN) clouds.position.x -= SPAN * 2; // the sheet returns from the west
    },
  };
}
