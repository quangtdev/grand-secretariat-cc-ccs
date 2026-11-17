// The "edict" of the zoo: the head zookeeper tosses a treat (an apple or a fish) that arcs
// over the yard to an animal. One flight, one treat: it owns its geometry and frees it through
// `userData.dispose` when the flight ends (scene/royal-edict-flight.js).
import * as THREE from 'three';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { part, toon } from '../../scene/figure-toon-style.js';
import { blob } from './zoo-animal-parts.js';

let treatMaterial;

function apple() {
  const group = new THREE.Group();
  group.add(blob(0xe0443a, [0.13, 0.12, 0.13]), blob(0x5e3b22, [0.015, 0.05, 0.015], 0, 0.13, 0), blob(0x5fb04a, [0.06, 0.02, 0.035], 0.05, 0.14, 0));
  return group;
}

function fish() {
  const group = new THREE.Group();
  group.add(blob(0x7aa9d6, [0.08, 0.1, 0.22]), blob(0xf4f1ea, [0.05, 0.06, 0.15], 0, -0.03, 0.02));
  group.add(part(new THREE.ConeGeometry(0.1, 0.16, 3), toon(0x5d8fc0), 0, 0, -0.26).rotateX(-Math.PI / 2));
  return group;
}

export function buildZooTreat() {
  treatMaterial ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: true });
  const group = Math.random() < 0.5 ? apple() : fish();
  const mesh = mergeAsVertexColours([...group.children], group, treatMaterial);
  mesh.userData.dispose = () => mesh.geometry.dispose();
  return mesh;
}
