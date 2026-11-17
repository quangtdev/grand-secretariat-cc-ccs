// The "edict" of the station: the captain's order flies out as a glowing data packet, three bright
// cubes in a row, shrinking towards the tail. The engine (scene/royal-edict-flight.js) tumbles it about
// its long axis and trails cyan sparks behind it. Geometry and material are shared by every flight, so
// there is nothing for a flight to free (no `userData.dispose`).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let geometry;
let material;

export function buildDataPacket() {
  geometry ??= mergeGeometries([[0.3, 0.2], [0.2, -0.06], [0.13, -0.26]].map(([size, x]) => new THREE.BoxGeometry(size, size, size).translate(x, 0, 0).toNonIndexed()));
  material ??= new THREE.MeshBasicMaterial({ color: 0x9ff4ff });
  return new THREE.Mesh(geometry, material);
}
