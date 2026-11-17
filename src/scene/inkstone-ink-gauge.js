// The ink gauge of a Huế writing desk: a pale inkstone (nghien muc) with a dark pool of ink on
// it. The pool shrinks towards a dreg as the scribe's context fills (`setInk(left)`, 0..1).
// Built once per desk; an update only rescales the one pool mesh. Neutral stone and black ink:
// no status colour (DESIGN.md, The Same Signal Rule).
import * as THREE from 'three';

const STONE = { x: 0.25, y: 0.045, z: 0.32 };
const POOL_RADIUS = 0.108; // full pool: nearly the whole stone face
const MIN_SCALE = 0.1; // the dregs that never quite vanish, so an empty stone still reads as an inkstone
let stoneMaterial;
let inkMaterial;

/** @param {number} tableTop  height of the desk surface the stone rests on */
export function buildInkstoneGauge(tableTop) {
  stoneMaterial ??= new THREE.MeshStandardMaterial({ color: 0xc4c0b4, roughness: 0.85, flatShading: true });
  inkMaterial ??= new THREE.MeshStandardMaterial({ color: 0x0b0a0e, roughness: 0.25, flatShading: true });
  const group = new THREE.Group();
  const stone = new THREE.Mesh(new THREE.BoxGeometry(STONE.x, STONE.y, STONE.z), stoneMaterial);
  stone.position.y = STONE.y / 2;
  stone.castShadow = true;
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(POOL_RADIUS, POOL_RADIUS, 0.012, 16), inkMaterial);
  pool.position.y = STONE.y + 0.006;
  pool.scale.z = (STONE.z / STONE.x) * 0.95; // an oval well, longer along the stone
  const fullZ = pool.scale.z;
  group.add(stone, pool);
  group.position.set(0.0, tableTop, 0.3);
  return {
    object: group,
    setInk(left) {
      const k = Math.max(left, MIN_SCALE);
      pool.scale.set(k, 1, fullZ * k);
    },
    dispose() {
      group.removeFromParent();
      stone.geometry.dispose();
      pool.geometry.dispose();
    },
  };
}
