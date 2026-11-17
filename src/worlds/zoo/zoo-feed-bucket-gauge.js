// The zoo's ink gauge: a wooden feed bucket standing beside the trough, filled with grain. The
// grain sinks as the animal's context fills (`setInk(left)`, 0..1): the animal's "appetite" runs
// down. Built once per trough; an update only rescales the one grain mesh. Wood and hay colours,
// never a status colour (DESIGN.md, The Same Signal Rule).
import * as THREE from 'three';
import { ZOO } from './zoo-palette.js';

const HEIGHT = 0.26;
const GRAIN_HEIGHT = 0.22; // a full bucket: just under the rim
const MIN_SCALE = 0.06; // a last layer on the bottom
let woodMaterial;
let grainMaterial;

/** @param {number} x  @param {number} z  where the bucket stands, in the trough's frame */
export function buildFeedBucketGauge(x, z) {
  // Double-sided so the inside of the open bucket shows its wall; the bottom is the grain's floor.
  woodMaterial ??= new THREE.MeshStandardMaterial({ color: ZOO.woodDark, roughness: 0.8, flatShading: true, side: THREE.DoubleSide });
  grainMaterial ??= new THREE.MeshStandardMaterial({ color: ZOO.hay, roughness: 1, flatShading: true });
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.125, HEIGHT, 14, 1, true).translate(0, HEIGHT / 2, 0), woodMaterial);
  wall.castShadow = true;
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.02, 14).translate(0, 0.01, 0), woodMaterial);
  // Unit-height grain anchored at the bucket floor: scale.y is the level.
  const grain = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.128, GRAIN_HEIGHT, 14).translate(0, GRAIN_HEIGHT / 2 + 0.02, 0), grainMaterial);
  grain.position.y = 0;
  group.add(wall, floor, grain);
  return {
    object: group,
    setInk(left) {
      grain.scale.y = Math.max(left, MIN_SCALE);
    },
    dispose() {
      group.removeFromParent();
      wall.geometry.dispose();
      floor.geometry.dispose();
      grain.geometry.dispose();
    },
  };
}
