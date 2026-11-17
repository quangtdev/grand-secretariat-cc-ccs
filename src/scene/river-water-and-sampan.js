// The river's surface and the one boat on it. The water is a single material whose small
// canvas texture of pale streaks scrolls slowly (no shader, no reflection pass). A sampan
// drifts along the southern reach and turns back at either end; it rests while a petition waits.
import * as THREE from 'three';
import { PALETTE } from './court-layout.js';
import { box, material } from './court-mesh-helpers.js';
import { mergeAsVertexColours } from './static-scenery-merge.js';

const FLOW = 0.012; // texture repeats per second
const SAMPAN_SPEED = 0.35;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let water;
/** The shared river material: jade-grey water with soft pale streaks. */
export function riverWaterMaterial() {
  if (water) return water;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5f9c97';
  ctx.fillRect(0, 0, 128, 128);
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) { // streaks of light, some darker troughs
    const y = (i * 37) % 128;
    const x = (i * 53) % 128;
    ctx.strokeStyle = i % 3 ? 'rgba(214, 236, 228, 0.22)' : 'rgba(40, 84, 84, 0.2)';
    ctx.lineWidth = 1.5 + (i % 4) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 14, y - 3, x + 30 + (i % 5) * 4, y);
    ctx.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 14);
  map.colorSpace = THREE.SRGBColorSpace;
  water = new THREE.MeshStandardMaterial({ map, roughness: 0.12, metalness: 0.15 });
  return water;
}

function buildSampan() {
  const parts = new THREE.Group();
  const hull = material(PALETTE.wood, 0.8);
  parts.add(box(0.7, 0.16, 2.6, hull, 0, 0.08, 0));
  for (const end of [-1, 1]) { // raised, narrowed bow and stern
    const tip = box(0.45, 0.14, 0.7, hull, 0, 0.2, end * 1.45);
    tip.rotation.x = -end * 0.35;
    parts.add(tip);
  }
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), material(PALETTE.straw, 1));
  cover.position.set(0, 0.16, -0.1);
  parts.add(cover);
  const boat = mergeAsVertexColours([...parts.children], parts, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true }));
  boat.castShadow = false;
  return boat;
}

/**
 * @param {THREE.Scene} scene
 * @param {{z: number, west: number, east: number}} reach  the stretch of river the boat keeps to
 */
export function createRiverLife(scene, reach) {
  const boat = buildSampan();
  boat.position.set(reach.west + 6, 0, reach.z);
  boat.rotation.y = Math.PI / 2; // lengthwise along the river
  scene.add(boat);
  let direction = 1;
  let resting = false;
  return {
    /** While true (a petition waits) the boat lies still. */
    settle(on) { resting = on; },
    update(dt, time) {
      if (reducedMotion.matches) return;
      riverWaterMaterial().map.offset.x -= FLOW * dt;
      if (!resting) {
        boat.position.x += SAMPAN_SPEED * direction * dt;
        if (boat.position.x > reach.east || boat.position.x < reach.west) direction = -direction;
      }
      boat.position.y = Math.sin(time * 0.9) * 0.015; // riding the water
    },
  };
}
