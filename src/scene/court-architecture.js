// Builds the static court: paved yard, throne hall and throne,
// and the drum pavilion where new agents are summoned.
import * as THREE from 'three';
import { COURT_BOUNDS, DRUM_PAVILION, HALL, HALL_EAST_STAIR, PALETTE, THRONE_POSITION, URN_RIM_HEIGHT, URNS } from './court-layout.js';
import { box, column, hipRoof, material, mesh, pavingTexture } from './court-mesh-helpers.js';
import { mergeStatic } from './static-scenery-merge.js';
import { addHallDetails } from './throne-hall-details.js';

function buildGround() {
  const group = new THREE.Group();
  const { x, north, south } = COURT_BOUNDS;
  const depth = south - north;
  const centerZ = (south + north) / 2;

  const land = mesh(new THREE.CircleGeometry(90, 48), material(PALETTE.moss, 1), 0, -0.06, 0);
  land.rotation.x = -Math.PI / 2;
  land.castShadow = false;
  group.add(land);

  const yard = new THREE.Mesh(
    new THREE.BoxGeometry(x * 2, 0.1, depth),
    new THREE.MeshStandardMaterial({ map: pavingTexture(PALETTE.stone, PALETTE.stoneDark, 9), roughness: 0.95 }),
  );
  yard.position.set(0, -0.05, centerZ);
  yard.receiveShadow = true;
  group.add(yard);

  // The central path from the yard's south edge to the throne steps.
  const path = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.04, south + 5.2),
    new THREE.MeshStandardMaterial({ map: pavingTexture(PALETTE.stonePath, PALETTE.stone, 3), roughness: 0.9 }),
  );
  path.position.set(0, 0.012, (south - 5.2) / 2);
  path.receiveShadow = true;
  group.add(path);

  // Low perimeter wall with a glazed cap; left open on the south so the view is clear.
  const wall = material(PALETTE.lacquerDark, 0.7);
  const cap = material(PALETTE.glaze, 0.4);
  const runs = [
    [x * 2, 0.3, 0, north], // north
    [0.3, depth, -x, centerZ], // west
    [0.3, depth, x, centerZ], // east
  ];
  for (const [w, d, px, pz] of runs) {
    group.add(box(w, 1.1, d, wall, px, 0.55, pz));
    group.add(box(w + 0.2, 0.14, d + 0.2, cap, px, 1.17, pz));
  }
  return group;
}

function buildThroneHall() {
  const hall = new THREE.Group();
  const { z, plinthHeight: ph, width, depth } = HALL;
  const stone = material(PALETTE.stonePath, 0.9);
  const lacquer = material(PALETTE.lacquer, 0.35);
  const gold = material(PALETTE.gold, 0.3);
  const front = z + depth / 2;

  hall.add(box(width + 1.6, ph, depth + 1.2, stone, 0, ph / 2, z));
  for (let step = 0; step < 3; step++) { // steps down to the petition ground
    hall.add(box(5.2, ph / 3, 0.42, stone, 0, ph - (step + 0.5) * ph / 3, front + 0.75 + step * 0.4));
  }

  const columnHeight = 3.7;
  for (const cx of [-6, -3.6, -1.5, 1.5, 3.6, 6]) {
    hall.add(column(0.22, columnHeight, lacquer, cx, ph, front - 0.5));
    hall.add(column(0.22, columnHeight, lacquer, cx, ph, z - depth / 2 + 0.5));
  }
  hall.add(box(width, columnHeight, 0.3, material(PALETTE.lacquerDark, 0.6), 0, ph + columnHeight / 2, z - depth / 2 + 0.2));
  hall.add(box(width + 0.4, 0.32, depth + 0.2, lacquer, 0, ph + columnHeight + 0.16, z)); // beam

  const lowerRoof = hipRoof(width + 3, depth + 2.2, 1.25);
  lowerRoof.position.set(0, ph + columnHeight + 0.3, z);
  hall.add(lowerRoof);
  hall.add(box(width * 0.66, 0.7, depth * 0.55, lacquer, 0, ph + columnHeight + 1.75, z)); // clerestory between the two eaves
  const upperRoof = hipRoof(width * 0.66 + 2.4, depth * 0.55 + 2, 1.45);
  upperRoof.position.set(0, ph + columnHeight + 2.1, z);
  hall.add(upperRoof);

  // Throne: gilded screen and seat.
  const t = THRONE_POSITION;
  hall.add(box(3.4, 3, 0.16, gold, t.x, ph + 1.5, t.z - 0.95));
  hall.add(box(3, 2.6, 0.2, material(PALETTE.lacquerDark, 0.5), t.x, ph + 1.5, t.z - 0.93)); // dark screen so the king reads against it
  hall.add(box(2.2, 0.24, 1.4, lacquer, t.x, ph + 0.12, t.z)); // dais
  hall.add(box(1.7, 0.6, 1.1, gold, t.x, ph + 0.54, t.z));
  hall.add(box(1.7, 1.7, 0.16, lacquer, t.x, ph + 1.4, t.z - 0.55));
  hall.add(box(1.9, 0.14, 0.2, gold, t.x, ph + 2.3, t.z - 0.55)); // gilded top rail
  // The king himself is a moving figure (ruler-figure-motion.js), seated here by king-stroll-routine.js.

  addHallDetails(hall); // bases, name board, lanterns, ridge, balustrade, throne furniture

  // A small stair down the east side of the plinth: the king's way into the yard.
  const stair = HALL_EAST_STAIR;
  const stepRun = stair.run / 3;
  for (let step = 0; step < 3; step++) {
    const rise = ph * (3 - step) / 4; // three steps below the plinth edge
    hall.add(box(stepRun, rise, stair.width, stone, stair.x + (step + 0.5) * stepRun, rise / 2, stair.z));
  }

  // Bronze urns flanking the steps.
  for (const position of URNS) {
    const bronze = material(PALETTE.bronze, 0.4);
    const urn = new THREE.Group();
    urn.add(mesh(new THREE.SphereGeometry(0.5, 14, 10), bronze, 0, 0.95, 0));
    urn.add(mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.14, 14), bronze, 0, URN_RIM_HEIGHT - 0.07, 0)); // rim; smoke rises from its top
    for (let leg = 0; leg < 3; leg++) {
      const angle = (leg / 3) * Math.PI * 2;
      urn.add(mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.55, 6), bronze, Math.cos(angle) * 0.3, 0.42, Math.sin(angle) * 0.3));
    }
    for (const handle of [-1, 1]) urn.add(box(0.08, 0.3, 0.2, bronze, handle * 0.47, 1.56, 0));
    urn.add(box(1, 0.2, 1, material(PALETTE.stoneDark), 0, 0.1, 0));
    urn.position.copy(position);
    hall.add(urn);
  }
  return hall;
}

/** The summoning place: an open pavilion housing the court drum. Clicking it opens the summon form. */
function buildDrumPavilion() {
  const pavilion = new THREE.Group();
  const lacquer = material(PALETTE.lacquer, 0.35);
  pavilion.add(box(3.6, 0.3, 3.6, material(PALETTE.stonePath, 0.9), 0, 0.15, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pavilion.add(column(0.14, 2.3, lacquer, sx * 1.35, 0.3, sz * 1.35));
  pavilion.add(box(3.2, 0.2, 3.2, lacquer, 0, 2.7, 0));
  const roof = hipRoof(4.6, 4.6, 1.2);
  roof.position.y = 2.8;
  pavilion.add(roof);

  const drum = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 20), material(PALETTE.lacquer, 0.3), 0, 1.3, 0);
  drum.rotation.z = Math.PI / 2;
  drum.rotation.y = Math.PI / 4; // drum head turned towards the yard
  const skin = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.72, 20), material(PALETTE.paper, 0.8), 0, 0, 0);
  drum.add(skin);
  pavilion.add(drum);
  for (const side of [-1, 1]) pavilion.add(box(0.1, 1, 0.9, material(PALETTE.wood, 0.5), side * 0.3, 0.8, side * 0.3));
  pavilion.position.copy(DRUM_PAVILION);
  pavilion.userData.pick = { kind: 'summon' };
  return pavilion;
}

/** Adds the whole static court to the scene and returns the clickable drum pavilion. */
export function buildCourt(scene) {
  // The pavilion is a pointer target, so it stays its own (merged) group.
  const pavilion = buildDrumPavilion();
  const drumPavilion = mergeStatic(pavilion);
  drumPavilion.userData.pick = pavilion.userData.pick;
  // Everything but the pavilion (a pointer target) is static: one mesh per material.
  const fixed = new THREE.Group();
  fixed.add(buildGround(), buildThroneHall()); // desks are carried out on demand: desk-porter-crew.js
  scene.add(mergeStatic(fixed), drumPavilion);
  return { drumPavilion };
}
