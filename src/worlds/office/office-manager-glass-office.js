// The manager's corner office: a raised oak floor at the shared plinth height (0.9 m), a glass
// balustrade along the front so the manager shows from the default camera, glass walls on the
// west and east (the east one has a door gap where four steps lead down: his strolls leave
// there), a carpeted podium with his leather chair at KING_SEAT, and a credenza and a sofa.
// Glass is a few transparent panes (depthWrite off, no shadows). Static: merged.
import * as THREE from 'three';
import { KING_SEAT } from '../../scene/court-layout.js';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { OFFICE } from './office-palette.js';
import { COFFEE_STATION, GLASS_OFFICE as G } from './office-room-plan.js';

const SEAT_LIFT = 0.265; // chair seat above the manager's feet: his seated hip minus his thigh, at his scale
const STEP_RISE = 4; // steps from the floor to the deck, down the east side
const COFFEE_GAP = 1.1; // the glass balustrade stops this far either side of the coffee counter

let glass;
const glassMaterial = () => glass ??= new THREE.MeshStandardMaterial({
  color: 0xbfe0e8, transparent: true, opacity: 0.16, roughness: 0.08, depthWrite: false, flatShading: true,
});

function floorAndSteps(group) {
  const width = G.x1 - G.x0;
  const depth = G.front - G.back;
  const cx = (G.x0 + G.x1) / 2;
  const cz = (G.front + G.back) / 2;
  group.add(box(width, G.top - 0.05, depth, material(OFFICE.concreteDark, 0.9), cx, (G.top - 0.05) / 2, cz));
  group.add(box(width, 0.05, depth, material(OFFICE.oak, 0.6), cx, G.top - 0.025, cz));
  // Steps follow the manager's walk (court-layout HALL_EAST_STAIR): the tread tops sit on the line from deck to floor.
  const run = 1.6;
  const tread = run / STEP_RISE;
  for (let i = 0; i < STEP_RISE - 1; i++) {
    const x = G.x1 - 0.2 + run - tread * (i + 0.5);
    const top = G.top * (1 - (x - (G.x1 - 0.2)) / run);
    group.add(box(tread, top, 1.7, material(OFFICE.oak, 0.6), x, top / 2, G.doorZ));
  }
}

/** One glass pane with a steel frame, from (x0, z0) to (x1, z1), `height` tall above the deck. */
function glassPanel(group, glassGroup, [x0, z0], [x1, z1], height) {
  const length = Math.hypot(x1 - x0, z1 - z0);
  const yaw = Math.atan2(x1 - x0, z1 - z0);
  const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
  const frame = material(OFFICE.steel, 0.5);
  const put = (item) => { item.rotation.y = yaw; return item; };
  const pane = put(box(0.03, height, length, glassMaterial(), cx, G.top + height / 2, cz));
  pane.castShadow = pane.receiveShadow = false;
  glassGroup.add(pane);
  group.add(put(box(0.06, 0.06, length, frame, cx, G.top + height, cz))); // top rail
  for (const [x, z] of [[x0, z0], [x1, z1]]) group.add(box(0.07, height, 0.07, frame, x, G.top + height / 2, z)); // posts
}

function partitions(group, glassGroup) {
  const coffeeX = COFFEE_STATION.x;
  glassPanel(group, glassGroup, [G.x0, G.front], [coffeeX - COFFEE_GAP, G.front], G.rail); // front balustrade, left of the coffee counter
  glassPanel(group, glassGroup, [coffeeX + COFFEE_GAP, G.front], [G.x1, G.front], G.rail); // and right of it
  glassPanel(group, glassGroup, [G.x0, G.back], [G.x0, G.front], G.glassTop); // west wall
  glassPanel(group, glassGroup, [G.x1, G.back], [G.x1, G.doorZ - G.doorHalf], G.glassTop); // east wall, either side of the door
  glassPanel(group, glassGroup, [G.x1, G.doorZ + G.doorHalf], [G.x1, G.front], G.glassTop);
}

/** The podium under the chair (KING_SEAT sits 0.24 above the deck) and the leather executive chair on it. */
function podiumAndChair(group) {
  const leather = material(0x2c3036, 0.6);
  const steel = material(OFFICE.steelLight, 0.4);
  const podium = KING_SEAT.y - G.top;
  group.add(box(2.8, podium, 2.2, material(OFFICE.carpet, 1), KING_SEAT.x, G.top + podium / 2, KING_SEAT.z - 0.1));
  const seatY = KING_SEAT.y + SEAT_LIFT;
  group.add(box(0.6, 0.09, 0.58, leather, KING_SEAT.x, seatY - 0.045, KING_SEAT.z + 0.06)); // seat
  const back = box(0.58, 0.95, 0.09, leather, KING_SEAT.x, seatY + 0.5, KING_SEAT.z - 0.26);
  back.rotation.x = -0.12;
  group.add(back);
  for (const side of [-1, 1]) group.add(box(0.06, 0.05, 0.4, leather, KING_SEAT.x + side * 0.33, seatY + 0.2, KING_SEAT.z + 0.0)); // armrests
  for (const side of [-1, 1]) group.add(box(0.05, 0.2, 0.05, leather, KING_SEAT.x + side * 0.33, seatY + 0.1, KING_SEAT.z - 0.1));
  group.add(box(0.07, SEAT_LIFT - 0.1, 0.07, steel, KING_SEAT.x, KING_SEAT.y + (SEAT_LIFT - 0.1) / 2 + 0.05, KING_SEAT.z + 0.06)); // gas post
  for (let i = 0; i < 5; i++) {
    const spoke = box(0.36, 0.03, 0.05, steel, KING_SEAT.x + Math.cos(i * 1.2566) * 0.18, KING_SEAT.y + 0.05, KING_SEAT.z + 0.06 + Math.sin(i * 1.2566) * 0.18);
    spoke.rotation.y = -i * 1.2566;
    group.add(spoke);
  }
}

/** Furniture that makes it a manager's room: a credenza under the north windows, a sofa by the west glass. */
function furniture(group) {
  group.add(box(3.6, 0.7, 0.5, material(OFFICE.oakDark, 0.6), 0, G.top + 0.35, G.back + 0.45)); // credenza
  group.add(box(3.62, 0.04, 0.54, material(OFFICE.white, 0.5), 0, G.top + 0.72, G.back + 0.45));
  const fabric = material(OFFICE.teal, 0.9);
  group.add(box(0.9, 0.42, 2.2, fabric, G.x0 + 0.8, G.top + 0.21, -10.2)); // sofa
  group.add(box(0.25, 0.5, 2.2, fabric, G.x0 + 0.4, G.top + 0.65, -10.2));
  group.add(box(0.5, 0.3, 0.7, material(OFFICE.white, 0.4), G.x0 + 1.9, G.top + 0.15, -10.2)); // low table
}

/** @returns {THREE.Group} the glass office, merged */
export function buildManagerGlassOffice() {
  const group = new THREE.Group();
  const glassGroup = new THREE.Group();
  floorAndSteps(group);
  partitions(group, glassGroup);
  podiumAndChair(group);
  furniture(group);
  group.add(glassGroup);
  return mergeStatic(group);
}
