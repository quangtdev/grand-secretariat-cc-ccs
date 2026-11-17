// One scribe's writing desk: a low table with an ink stone, a sitting mat, and a pile of
// finished sheets that grows while its scribe works. A desk exists only while an agent
// owns it; soldiers carry it out when the agent is summoned (desk-porter-crew.js).
// The fixed parts are one vertex-coloured mesh, so a desk costs two draw calls.
import * as THREE from 'three';
import { PALETTE } from './court-layout.js';
import { box, material } from './court-mesh-helpers.js';
import { buildInkstoneGauge } from './inkstone-ink-gauge.js';
import { mergeAsVertexColours } from './static-scenery-merge.js';

const DESK_SCALE = 1.3;
const SHEET = 0.012; // thickness of one sheet
const MAX_SHEETS = 6;

let deskMaterial;
let sheetGeometry;

export class WritingDesk {
  /** @param {{desk: THREE.Vector3, west: boolean}} slot  one entry of DESKS */
  constructor(slot) {
    deskMaterial ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true });
    sheetGeometry ??= new THREE.BoxGeometry(0.3, SHEET, 0.42).translate(0, SHEET / 2, 0);
    this.slot = slot;
    // Built along x with the mat on -x; turned so the mat lands on the outer side.
    this.restRotation = slot.west ? 0 : Math.PI;
    this.group = new THREE.Group();
    this.group.position.copy(slot.desk);
    this.group.rotation.y = this.restRotation;
    this.group.scale.setScalar(DESK_SCALE);

    const parts = new THREE.Group();
    const wood = material(PALETTE.wood, 0.5);
    parts.add(box(0.5, 0.06, 0.95, wood, 0, 0.3, 0)); // low table top
    for (const side of [-1, 1]) parts.add(box(0.4, 0.28, 0.06, wood, 0, 0.14, side * 0.4));
    parts.add(box(0.8, 0.02, 0.8, material(PALETTE.straw, 1), -0.55, 0.012, 0)); // sitting mat
    const fixed = mergeAsVertexColours([...parts.children], parts, deskMaterial);
    fixed.castShadow = fixed.receiveShadow = true;
    this.group.add(fixed);

    // The pile of written sheets: one box, scaled to the number of sheets.
    this.pile = new THREE.Mesh(sheetGeometry, material(PALETTE.paper, 0.9));
    this.pile.position.set(0, 0.33, -0.08);
    this.group.add(this.pile);
    this.setSheets(1);

    // The inkstone is the ink gauge: its pool of ink drains as the scribe's context fills.
    this.gauge = buildInkstoneGauge(0.33);
    this.group.add(this.gauge.object);
  }

  /** Ink left in the well, 0..1 (1 = full). */
  setInk(left) {
    this.gauge.setInk(left);
  }

  /** How many sheets lie on the desk (1 = the sheet being written). */
  setSheets(count) {
    this.pile.scale.y = Math.min(Math.max(count, 1), MAX_SHEETS);
  }

  dispose() {
    this.group.removeFromParent();
    this.gauge.dispose();
    this.group.children[0].geometry.dispose(); // the merged body; the pile's geometry and materials are shared
  }
}
