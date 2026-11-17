// An employee's workplace: an oak desk with steel legs, a monitor, keyboard, mouse and mug. (The chair
// is the employee's own: office-employee-chair.js.) Sticky notes pile up on the monitor's edge while the employee works
// (`setSheets(n)` shows n notes, up to six). It exists only while an employee owns it; two movers
// carry it out and away (scene/desk-porter-crew.js). The fixed parts are one vertex-coloured mesh
// and the notes another, drawn in growing numbers through the geometry's draw range: two draw
// calls per workplace, like the Huế desk.
// Built with the employee's side on -x (the seat of the shared plan is 0.72 from its centre).
import * as THREE from 'three';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { buildOfficeContextGauge } from './office-context-gauge.js';
import { OFFICE } from './office-palette.js';

const MAX_NOTES = 6;
const NOTE_COLOURS = [0x9fd0f0, 0xf3a6b8, 0xa6e0a0, 0xc8b4f0, 0xf6b86a, 0xf6e27a];
const TOP = 0.72; // desk surface height
let shared;

/** Table, steel frame, monitor, keyboard, mouse and mug, as plain boxes to be merged. */
function deskParts() {
  const parts = new THREE.Group();
  const steel = material(OFFICE.steel, 0.5);
  const dark = material(0x23262a, 0.4);
  parts.add(box(0.78, 0.04, 1.3, material(OFFICE.oak, 0.6), -0.08, TOP - 0.02, 0)); // top
  for (const z of [-0.6, 0.6]) {
    parts.add(box(0.05, TOP - 0.04, 0.05, steel, 0.27, (TOP - 0.04) / 2, z)); // far legs
    parts.add(box(0.05, TOP - 0.04, 0.05, steel, -0.43, (TOP - 0.04) / 2, z)); // near legs
  }
  parts.add(box(0.03, 0.3, 1.1, material(OFFICE.oakDark, 0.7), 0.27, TOP - 0.2, 0)); // modesty panel
  const monitor = new THREE.Group(); // screen towards -x, turned a little towards the camera
  monitor.position.set(0.05, TOP, -0.02);
  monitor.rotation.y = -0.18;
  monitor.add(box(0.2, 0.015, 0.2, dark, 0, 0.008, 0), box(0.03, 0.14, 0.04, dark, 0.02, 0.08, 0)); // foot, neck
  monitor.add(box(0.035, 0.34, 0.58, dark, 0, 0.3, 0), box(0.012, 0.3, 0.54, material(OFFICE.screen, 0.3), -0.02, 0.3, 0)); // bezel, screen
  parts.add(monitor);
  parts.add(box(0.15, 0.015, 0.42, dark, -0.28, TOP + 0.008, 0.02)); // keyboard
  parts.add(box(0.06, 0.02, 0.09, dark, -0.28, TOP + 0.01, 0.4)); // mouse
  parts.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 10), material(OFFICE.teal, 0.5)).translateX(-0.1).translateY(TOP + 0.045).translateZ(-0.52)); // mug
  return parts;
}

/** Six sticky notes down the monitor's south edge, in two staggered columns, each a little askew. */
function noteMeshes() {
  return NOTE_COLOURS.map((colour, i) => {
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.008), material(colour, 0.9));
    note.position.set(0.0 + Math.floor(i / 3) * 0.07, TOP + 0.4 - (i % 3) * 0.1, 0.29 + 0.004 + Math.floor(i / 3) * 0.006);
    note.rotation.set(0, -0.18, (i % 2 ? 0.12 : -0.1));
    return note;
  });
}

export class OfficeDeskWorkplace {
  /** @param {{desk: THREE.Vector3, west: boolean}} slot  one entry of the desk plan */
  constructor(slot) {
    shared ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true });
    this.restRotation = slot.west ? 0 : Math.PI; // built with the employee on -x; turned so it lands on the outer side
    this.group = new THREE.Group();
    this.group.position.copy(slot.desk);
    this.group.rotation.y = this.restRotation;

    const parts = deskParts();
    const meshes = [];
    parts.traverse((node) => { if (node.isMesh) meshes.push(node); });
    this.group.add(mergeAsVertexColours(meshes, parts, shared));

    const notes = noteMeshes();
    this.counts = notes.map((mesh) => mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count);
    this.notes = mergeAsVertexColours(notes, new THREE.Group().add(...notes), shared);
    this.group.add(this.notes);
    this.setSheets(1);
    this.gauge = buildOfficeContextGauge(TOP); // the ink gauge: a level strip on the desk top
    this.group.add(this.gauge.object);
  }

  /** Context left, 0..1 (1 = full): the level strip on the desk. */
  setInk(left) {
    this.gauge.setInk(left);
  }

  /** How many sticky notes are on the monitor (1 = the first of them). */
  setSheets(count) {
    const shown = Math.min(Math.max(Math.round(count), 1), MAX_NOTES);
    this.notes.geometry.setDrawRange(0, this.counts.slice(0, shown).reduce((a, b) => a + b, 0));
  }

  dispose() {
    this.group.removeFromParent();
    this.gauge.dispose();
    for (const mesh of this.group.children) mesh.geometry.dispose(); // both meshes own their geometry; materials are shared
  }
}
