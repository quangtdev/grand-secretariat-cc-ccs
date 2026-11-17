// The duck pond at the shared POND spot (east side): a sandy rim, reeds, a few rocks and ducks
// paddling slow loops. Ducks hold still while a petition waits and under reduced motion.
import * as THREE from 'three';
import { POND } from '../../scene/court-layout.js';
import { material, mesh } from '../../scene/court-mesh-helpers.js';
import { seeded } from '../../scene/court-surroundings.js';
import { mergeAsVertexColours, mergeStatic } from '../../scene/static-scenery-merge.js';
import { blob, stub } from './zoo-animal-parts.js';
import { ZOO } from './zoo-palette.js';

const RX = POND.width / 2 - 0.1;
const RZ = POND.depth / 2 - 0.1;
const DUCK_SCALE = 2.1;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let duckMaterial;

function buildBasin() {
  const group = new THREE.Group();
  const { x, z } = POND.center;
  const rim = mesh(new THREE.CylinderGeometry(1, 1, 0.03, 28), material(ZOO.sandDark, 1), x, 0.014, z);
  rim.scale.set(RX + 0.45, 1, RZ + 0.45);
  rim.castShadow = false;
  group.add(rim);
  const water = mesh(new THREE.CylinderGeometry(1, 1, 0.03, 28), new THREE.MeshStandardMaterial({ color: ZOO.water, roughness: 0.15, metalness: 0.1, flatShading: true }), x, 0.03, z);
  water.scale.set(RX, 1, RZ);
  water.castShadow = false;
  group.add(water);
  const random = seeded(9);
  for (let i = 0; i < 9; i++) { // rocks round the edge
    const a = (i / 9) * Math.PI * 2 + random() * 0.4;
    const rock = mesh(new THREE.DodecahedronGeometry(0.2 + random() * 0.14, 0), material(ZOO.rock, 1), x + Math.cos(a) * (RX + 0.3), 0.1, z + Math.sin(a) * (RZ + 0.3));
    rock.scale.y = 0.7;
    group.add(rock);
  }
  for (let i = 0; i < 7; i++) { // reeds with cattail heads on the far side
    const a = Math.PI * 0.55 + random() * 1.5;
    const rx = x + Math.cos(a) * (RX + 0.15);
    const rz = z + Math.sin(a) * (RZ + 0.15);
    group.add(stub(0x5d8f48, 0.015, 0.02, 0.9, rx, 0.45, rz));
    group.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), material(0x6b4a2a, 1), rx, 0.9, rz));
  }
  return mergeStatic(group);
}

/** One duck, one mesh: white body, orange beak; `mallard` has a green head. */
function buildDuck(mallard) {
  duckMaterial ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true });
  const group = new THREE.Group();
  group.add(blob(mallard ? 0xb8a58a : 0xf6f1e4, [0.1, 0.075, 0.15], 0, 0.08, 0));
  group.add(blob(mallard ? 0x2f7d4a : 0xf6f1e4, [0.058, 0.058, 0.058], 0, 0.185, 0.1));
  group.add(blob(0xf29a2e, [0.035, 0.015, 0.05], 0, 0.175, 0.17));
  group.add(blob(mallard ? 0xb8a58a : 0xf6f1e4, [0.045, 0.05, 0.06], 0, 0.13, -0.15));
  const mesh3 = mergeAsVertexColours([...group.children], group, duckMaterial);
  mesh3.scale.setScalar(DUCK_SCALE);
  return mesh3;
}

/** @returns {{update: (dt: number, time: number) => void, settle: (petition: boolean) => void}} */
export function buildDuckPond(scene) {
  scene.add(buildBasin());
  const ducks = [0, 1, 2, 3].map((i) => {
    const duck = buildDuck(i === 1);
    scene.add(duck);
    return { duck, phase: i * 1.7, speed: 0.12 + i * 0.03, ring: 0.45 + (i % 2) * 0.3 };
  });
  let petition = false; // a petition waits: hold still (reduced motion is read live)
  let clock = 0;
  const place = () => { for (const { duck, phase, speed, ring } of ducks) {
    const a = phase + clock * speed;
    duck.position.set(POND.center.x + Math.cos(a) * RX * ring, 0.04 + Math.sin(clock * 2 + phase) * 0.006, POND.center.z + Math.sin(a * 1.0) * RZ * ring);
    duck.rotation.y = Math.atan2(-Math.sin(a) * RX, Math.cos(a) * RZ);
  } };
  place();
  return {
    update(dt) { if (petition || reducedMotion.matches) return; clock += dt; place(); },
    settle(value) { petition = value; },
  };
}
