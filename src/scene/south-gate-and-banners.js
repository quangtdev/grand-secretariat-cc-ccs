// South of the river: a three-bay gate in the manner of Ngọ Môn at the far bridge head,
// and inside the yard two tall banners that stir in the wind. The gate stands beyond the
// bridge so it never hides the yard from the default view.
import * as THREE from 'three';
import { COURT_BOUNDS, PALETTE } from './court-layout.js';
import { box, column, hipRoof, material } from './court-mesh-helpers.js';
import { mergeStatic } from './static-scenery-merge.js';

const GATE_Z = COURT_BOUNDS.south + 11; // on the road well past the bridge: below the default view, seen when zoomed out
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function buildGate() {
  const gate = new THREE.Group();
  const stone = material(PALETTE.stone, 0.95);
  const lacquer = material(PALETTE.lacquer, 0.35);
  const baseHeight = 2.3;
  // Four piers leave three passages: the middle one, on the road, is the widest.
  for (const [x, w] of [[-4.6, 1.6], [-2.05, 1.1], [2.05, 1.1], [4.6, 1.6]]) gate.add(box(w, baseHeight, 2.4, stone, x, baseHeight / 2, GATE_Z));
  gate.add(box(10.8, 0.5, 2.4, stone, 0, baseHeight + 0.25, GATE_Z)); // the deck over the passages
  gate.add(box(11.2, 0.12, 2.8, material(PALETTE.stoneDark, 0.95), 0, baseHeight + 0.56, GATE_Z));
  // The pavilion on top: lacquer columns under a glazed roof.
  const deck = baseHeight + 0.62;
  for (const x of [-3.9, -1.5, 1.5, 3.9]) {
    for (const dz of [-0.75, 0.75]) gate.add(column(0.13, 1.5, lacquer, x, deck, GATE_Z + dz));
  }
  gate.add(box(8.4, 0.18, 2, lacquer, 0, deck + 1.59, GATE_Z));
  const roof = hipRoof(9.8, 3.4, 1.0);
  roof.position.set(0, deck + 1.68, GATE_Z);
  gate.add(roof);
  // Wall stubs to either side, capped in glaze like the court's walls.
  for (const side of [-1, 1]) {
    gate.add(box(5, 1.5, 0.4, material(PALETTE.lacquerDark, 0.7), side * 7.9, 0.75, GATE_Z));
    gate.add(box(5.2, 0.14, 0.6, material(PALETTE.glaze, 0.4), side * 7.9, 1.57, GATE_Z));
  }
  return gate;
}

/** Adds the gate and the banners; returns the banners' per-frame step. */
export function createGateAndBanners(scene) {
  scene.add(mergeStatic(buildGate()));

  const poles = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: PALETTE.lacquer, roughness: 0.8, side: THREE.DoubleSide });
  const banners = [-1, 1].map((side) => {
    const x = side * 8.6;
    const z = COURT_BOUNDS.south - 1.2;
    poles.add(column(0.05, 5.2, material(PALETTE.wood, 0.7), x, 0, z));
    poles.add(box(0.5, 0.2, 0.5, material(PALETTE.stoneDark, 0.95), x, 0.1, z));
    // The banner hangs from the top of the pole and pivots there.
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.6).translate(0.4, -1.3, 0), cloth);
    banner.position.set(x, 5.1, z);
    scene.add(banner);
    return banner;
  });
  scene.add(mergeStatic(poles));

  let still = false;
  return {
    /** While true (a petition waits) the banners hang still. */
    settle(on) { still = on; },
    update(time) {
      const calm = still || reducedMotion.matches;
      banners.forEach((banner, i) => {
        const sway = calm ? 0 : Math.sin(time * 0.9 + i * 1.7) * 0.25 + Math.sin(time * 2.3 + i) * 0.06;
        banner.rotation.y += (sway - banner.rotation.y) * 0.1;
      });
    },
  };
}
