// A crew member's workplace: a console with a glowing key deck and screen, a pod seat on the outer
// side, and holo panels that stack above it while the crew member works (`setSheets(n)` shows n
// panels, up to six). A console exists only while a crew member owns it: two cargo drones lift it in
// and out (scene/desk-porter-crew.js). The solid parts are one vertex-coloured mesh; the glow (keys,
// screen, seat ring) and the panels are another, translucent, drawn in growing numbers through its
// draw range: two draw calls per console, like the Huế desk.
import * as THREE from 'three';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { buildFuelCellGauge } from './space-station-fuel-cell-gauge.js';
import { STATION } from './space-station-palette.js';
import { glow } from './space-station-shape-helpers.js';

const CONSOLE_SCALE = 1.3;
const MAX_PANELS = 6;
const SEAT_X = -0.55; // the pod seat, on the outer side (the console is built with the seat on -x)
let solidMaterial;
let holoMaterial;

/** The solid parts, as plain-coloured meshes to merge. */
function solidParts() {
  const parts = new THREE.Group();
  const grey = (colour) => material(colour, 0.6);
  parts.add(box(0.42, 0.06, 0.95, grey(STATION.panelDark), 0, 0.03, 0)); // plinth
  parts.add(box(0.3, 0.3, 0.82, grey(STATION.panel), 0.02, 0.21, 0)); // pedestal
  const keys = box(0.38, 0.04, 0.8, grey(STATION.panelLight), -0.02, 0.4, 0); // key deck, sloping to the seat
  keys.rotation.z = 0.2;
  const screen = box(0.05, 0.4, 0.74, grey(STATION.panelDark), 0.13, 0.64, 0); // screen frame, leaning back
  screen.rotation.z = -0.2;
  parts.add(keys, screen, box(0.07, 0.24, 0.07, grey(STATION.panel), 0.15, 0.5, 0));
  parts.add(box(0.1, 0.18, 0.1, grey(STATION.panelDark), SEAT_X, 0.09, 0)); // seat stem
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.05, 14), grey(STATION.panelLight));
  pod.position.set(SEAT_X, 0.185, 0);
  parts.add(pod);
  parts.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.02, 14), grey(STATION.panelDark)).translateX(SEAT_X).translateY(0.01)); // seat foot
  return parts;
}

/** The glowing parts that are always shown, then the six holo panels in the order they appear. */
function holoParts() {
  const keyPlane = glow(STATION.holo, new THREE.BoxGeometry(0.3, 0.012, 0.7), -0.02, 0.428, 0);
  keyPlane.rotation.z = 0.2;
  const screenFace = glow(STATION.cyanDim, new THREE.BoxGeometry(0.01, 0.34, 0.68), 0.1, 0.64, 0);
  screenFace.rotation.z = -0.2;
  const ring = glow(STATION.cyan, new THREE.CylinderGeometry(0.31, 0.31, 0.015, 16), SEAT_X, 0.03, 0);
  const fixed = [keyPlane, screenFace, ring];
  const panels = Array.from({ length: MAX_PANELS }, (_, i) => {
    const panel = glow(i % 2 ? STATION.holo : STATION.cyanDim, new THREE.BoxGeometry(0.32, 0.012, 0.5), 0.06, 0.95 + i * 0.075, 0);
    panel.rotation.y = (i - 2.5) * 0.14; // fanned, like documents laid over one another
    return panel;
  });
  return { fixed, panels };
}

const vertexCount = (mesh) => mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count;

export class ConsoleWorkplace {
  /** @param {{desk: THREE.Vector3, west: boolean}} slot  one entry of the desk plan */
  constructor(slot) {
    solidMaterial ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, flatShading: true });
    holoMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
    this.restRotation = slot.west ? 0 : Math.PI; // built with the seat on -x; turned so it lands on the outer side
    this.group = new THREE.Group();
    this.group.position.copy(slot.desk);
    this.group.rotation.y = this.restRotation;
    this.group.scale.setScalar(CONSOLE_SCALE);

    const solid = solidParts();
    this.group.add(mergeAsVertexColours([...solid.children], solid, solidMaterial));
    const { fixed, panels } = holoParts();
    const pieces = [...fixed, ...panels];
    this.counts = pieces.map(vertexCount);
    this.fixedCount = fixed.reduce((sum, piece) => sum + vertexCount(piece), 0);
    this.holo = mergeAsVertexColours(pieces, new THREE.Group().add(...pieces), holoMaterial);
    this.holo.renderOrder = 1;
    this.group.add(this.holo);
    this.setSheets(1);
    this.gauge = buildFuelCellGauge(0.02, slot.west ? 0.62 : -0.62); // the ink gauge: a fuel cell at the console's south end (the near end for the camera)
    this.group.add(this.gauge.object);
  }

  /** Fuel left in the cell, 0..1 (1 = full). */
  setInk(left) {
    this.gauge.setInk(left);
  }

  /** How many holo panels hover above the console (1 = the one being worked on). */
  setSheets(count) {
    const shown = Math.min(Math.max(Math.round(count), 1), MAX_PANELS);
    const panelVertices = this.counts.slice(3, 3 + shown).reduce((a, b) => a + b, 0);
    this.holo.geometry.setDrawRange(0, this.fixedCount + panelVertices);
  }

  dispose() {
    this.group.removeFromParent();
    this.gauge.dispose();
    for (const mesh of this.group.children) mesh.geometry.dispose(); // both meshes own their geometry; materials are shared
  }
}
