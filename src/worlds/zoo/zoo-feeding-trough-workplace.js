// An animal's workplace: a wooden feeding trough of hay on a round straw mat, with treats that
// pile up on top while the animal works (`setSheets(n)` shows n treats, up to six). A trough exists
// only while an animal owns it; two keepers carry it out and away (scene/desk-porter-crew.js).
// The fixed parts are one vertex-coloured mesh and the treats another, drawn in growing numbers
// through the geometry's draw range: two draw calls per trough, like the Huế desk.
import * as THREE from 'three';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { buildFeedBucketGauge } from './zoo-feed-bucket-gauge.js';
import { ZOO } from './zoo-palette.js';

const TROUGH_SCALE = 1.3;
const MAX_TREATS = 6;
const TREAT_Y = 0.385; // on top of the hay
let shared;

/** The treats, in the order they appear: apple, banana, fish, carrot, bamboo, pear. */
function treatMeshes() {
  const flat = (geometry, colour, x, y, z, rotation = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material(colour));
    mesh.position.set(x, y, z);
    mesh.rotation.set(...rotation);
    return mesh;
  };
  const ball = (r) => new THREE.SphereGeometry(r, 8, 6);
  const z = (i) => -0.34 + i * 0.136;
  return [
    flat(ball(0.055), 0xe0443a, 0.05, TREAT_Y, z(0)),
    flat(ball(1).scale(0.035, 0.03, 0.11), 0xf2d04a, -0.06, TREAT_Y, z(1), [0, 0.4, 0]),
    flat(ball(1).scale(0.03, 0.04, 0.1), 0x7aa9d6, 0.06, TREAT_Y, z(2), [0, -0.3, 0]),
    flat(new THREE.ConeGeometry(0.035, 0.14, 6), 0xf08a2c, -0.05, TREAT_Y, z(3), [Math.PI / 2, 0, 0.5]),
    flat(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 6), 0x7fb35a, 0.05, TREAT_Y, z(4), [Math.PI / 2, 0, 0.3]),
    flat(ball(0.05), 0xa6c84a, -0.05, TREAT_Y, z(5)),
  ];
}

export class FeedingTrough {
  /** @param {{desk: THREE.Vector3, west: boolean}} slot  one entry of the desk plan */
  constructor(slot) {
    shared ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true });
    this.restRotation = slot.west ? 0 : Math.PI; // built with the mat on -x; turned so it lands on the outer side
    this.group = new THREE.Group();
    this.group.position.copy(slot.desk);
    this.group.rotation.y = this.restRotation;
    this.group.scale.setScalar(TROUGH_SCALE);

    const wood = material(ZOO.wood, 0.8);
    const dark = material(ZOO.woodDark, 0.8);
    const parts = new THREE.Group();
    parts.add(box(0.5, 0.05, 0.95, dark, 0, 0.1, 0)); // floor
    for (const side of [-1, 1]) {
      parts.add(box(0.05, 0.22, 0.95, wood, side * 0.225, 0.2, 0)); // long sides
      parts.add(box(0.5, 0.22, 0.05, wood, 0, 0.2, side * 0.45)); // ends
      for (const end of [-1, 1]) parts.add(box(0.07, 0.1, 0.07, dark, side * 0.2, 0.05, end * 0.4)); // feet
    }
    const hay = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.05, 0.62, 2.1), material(ZOO.hay, 1));
    hay.position.y = 0.26;
    parts.add(hay);
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.02, 20), material(ZOO.sandDark, 1));
    mat.position.set(-0.52, 0.01, 0);
    parts.add(mat);
    const fixed = mergeAsVertexColours([...parts.children], parts, shared);
    fixed.castShadow = true;
    fixed.receiveShadow = true;
    this.group.add(fixed);

    const pieces = treatMeshes();
    this.counts = pieces.map((mesh) => mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count);
    this.treats = mergeAsVertexColours(pieces, new THREE.Group().add(...pieces), shared);
    this.treats.castShadow = true;
    this.group.add(this.treats);
    this.setSheets(1);
    this.gauge = buildFeedBucketGauge(0.02, slot.west ? 0.68 : -0.68); // the ink gauge: a feed bucket at the trough's south end (the near end for the camera)
    this.group.add(this.gauge.object);
  }

  /** Feed left in the bucket, 0..1 (1 = full). */
  setInk(left) {
    this.gauge.setInk(left);
  }

  /** How many treats lie on the hay (1 = the first of them). */
  setSheets(count) {
    const shown = Math.min(Math.max(Math.round(count), 1), MAX_TREATS);
    this.treats.geometry.setDrawRange(0, this.counts.slice(0, shown).reduce((a, b) => a + b, 0));
  }

  dispose() {
    this.group.removeFromParent();
    this.gauge.dispose();
    for (const mesh of this.group.children) mesh.geometry.dispose(); // both meshes own their geometry; materials are shared
  }
}
