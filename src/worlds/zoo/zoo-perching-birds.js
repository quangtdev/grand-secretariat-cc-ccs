// Small colourful birds that hop between perches (the arch, the hut roof, tree tops, fence
// posts) and chirp as they land (`onChirp`). While a petition waits, birds in flight finish
// landing and none takes off; under reduced motion they just sit.
import * as THREE from 'three';
import { COURT_BOUNDS } from '../../scene/court-layout.js';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { blob } from './zoo-animal-parts.js';
import { GATE_BEAM_TOP } from './zoo-entrance-gate-and-booth.js';
import { treeTop, YARD_TREES } from './zoo-trees-and-rocks.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const PERCHES = [
  GATE_BEAM_TOP, new THREE.Vector3(0, 5.4, -11.3), new THREE.Vector3(-2.4, 4.55, -11), new THREE.Vector3(2.4, 4.55, -11),
  ...YARD_TREES.map(treeTop),
  new THREE.Vector3(-COURT_BOUNDS.x, 0.62, -4), new THREE.Vector3(COURT_BOUNDS.x, 0.62, 3), new THREE.Vector3(-COURT_BOUNDS.x, 0.62, 7),
];
const BIRD_COUNT = 4;
const FLIGHT_SECONDS = 2.2;
let material;

function buildBird(colour) {
  material ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true });
  const body = new THREE.Group();
  body.add(blob(colour, [0.09, 0.08, 0.14], 0, 0.08, 0), blob(0xf6e05a, [0.07, 0.05, 0.1], 0, 0.05, 0.03), blob(colour, [0.065, 0.065, 0.065], 0, 0.16, 0.12), blob(0xf29a2e, [0.015, 0.015, 0.04], 0, 0.15, 0.2));
  const mesh = mergeAsVertexColours([...body.children], body, material);
  mesh.scale.setScalar(2.2);
  return mesh;
}

const between = (low, high) => low + Math.random() * (high - low);

export function buildPerchingBirds(scene, { onChirp = () => {} } = {}) {
  let settled = false;
  const free = new Set(PERCHES.map((_, i) => i));
  const birds = Array.from({ length: BIRD_COUNT }, (_, i) => {
    const mesh = buildBird([0x4f9bd9, 0xe45b4c, 0x6cc070, 0xd96bb0][i]);
    const perch = [...free][Math.floor(Math.random() * free.size)];
    free.delete(perch);
    mesh.position.copy(PERCHES[perch]);
    scene.add(mesh);
    return { mesh, perch, flying: false, t: 0, wait: between(4, 18) * (i + 1) * 0.5, from: new THREE.Vector3(), to: 0 };
  });

  function takeOff(bird) {
    const choices = [...free];
    if (!choices.length) { bird.wait = 5; return; }
    bird.to = choices[Math.floor(Math.random() * choices.length)];
    free.delete(bird.to);
    bird.from.copy(bird.mesh.position);
    bird.flying = true;
    bird.t = 0;
  }

  return {
    update(dt) {
      if (reducedMotion.matches) return;
      for (const bird of birds) {
        if (!bird.flying) {
          bird.wait -= dt;
          if (bird.wait <= 0 && !settled) takeOff(bird);
          continue;
        }
        bird.t += dt / FLIGHT_SECONDS;
        const target = PERCHES[bird.to];
        const k = Math.min(bird.t, 1);
        bird.mesh.position.lerpVectors(bird.from, target, k * k * (3 - 2 * k));
        bird.mesh.position.y += Math.sin(k * Math.PI) * 1.3 + Math.sin(bird.t * 40) * 0.03;
        bird.mesh.rotation.y = Math.atan2(target.x - bird.from.x, target.z - bird.from.z);
        if (k >= 1) {
          free.add(bird.perch);
          bird.perch = bird.to;
          bird.flying = false;
          bird.wait = between(12, 30);
          onChirp();
        }
      }
    },
    /** A petition waits: flights end, nothing new takes off (until it is answered). */
    settle(petition) { settled = petition; },
  };
}
