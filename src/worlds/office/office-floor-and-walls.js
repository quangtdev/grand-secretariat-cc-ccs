// The office shell: a warm concrete floor with faint expansion joints and a wood-toned central
// aisle, white spandrels under glass window walls (east, west, north) held by black steel
// mullions, and a low wall in the south so the floor reads from the default camera. No ceiling.
// The glass is a few large panes: transparent, depthWrite off, never casting shadows.
// Static: merged into a handful of meshes (scene/static-scenery-merge.js).
import * as THREE from 'three';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { OFFICE } from './office-palette.js';
import { ROOM } from './office-room-plan.js';

const MULLION_GAP = 2.6;
const LIFT_LOBBY = { z0: -1.4, z1: 2.6 }; // the west wall is solid here: the elevators

let glass;
const glassMaterial = () => glass ??= new THREE.MeshStandardMaterial({
  color: 0xbfe0e8, transparent: true, opacity: 0.16, roughness: 0.08, depthWrite: false, flatShading: true,
});

/** A flat slab that casts no shadow, its top at `top`. */
function slab(group, colour, w, d, x, z, top = 0.01, thickness = 0.03) {
  const piece = box(w, thickness, d, material(colour, 1), x, top - thickness / 2, z);
  piece.castShadow = false;
  group.add(piece);
}

function floor(group) {
  const { x, north, south } = ROOM;
  const depth = south - north;
  const base = box(x * 2 + 0.6, 0.3, depth + 0.6, material(OFFICE.concrete, 1), 0, -0.15, (north + south) / 2);
  base.castShadow = false;
  group.add(base);
  slab(group, OFFICE.oak, 3.2, south + 6.4, 0, (south - 6.4) / 2); // the central aisle, in light wood
  for (let gx = -x + 2.6; gx < x; gx += 2.6) slab(group, OFFICE.concreteDark, 0.03, depth, gx, (north + south) / 2, 0.012, 0.012);
  for (let gz = north + 2.6; gz < south; gz += 2.6) slab(group, OFFICE.concreteDark, x * 2, 0.03, 0, gz, 0.012, 0.012);
}

/** One run of window wall from (x0, z0) to (x1, z1): spandrel, glass, mullions, a top rail. */
function windowWall(group, glassGroup, [x0, z0], [x1, z1], skip = null) {
  const length = Math.hypot(x1 - x0, z1 - z0);
  const yaw = Math.atan2(x1 - x0, z1 - z0); // a run built with its depth along z
  const place = (item, at) => {
    item.position.set(x0 + (x1 - x0) * at, item.position.y, z0 + (z1 - z0) * at);
    item.rotation.y = yaw;
    return item;
  };
  const height = ROOM.windowTop - ROOM.sill;
  group.add(place(box(0.3, ROOM.sill, length, material(OFFICE.wall, 0.9), 0, ROOM.sill / 2, 0), 0.5));
  group.add(place(box(0.14, 0.1, length, material(OFFICE.steel, 0.5), 0, ROOM.windowTop, 0), 0.5));
  const panes = Math.max(1, Math.round(length / MULLION_GAP));
  for (let i = 0; i <= panes; i++) {
    const t = i / panes;
    group.add(place(box(0.12, ROOM.windowTop, 0.12, material(OFFICE.steel, 0.5), 0, ROOM.windowTop / 2, 0), t));
    if (i === panes) continue;
    const centre = (i + 0.5) / panes;
    const z = z0 + (z1 - z0) * centre;
    if (skip && z > skip.z0 && z < skip.z1 && x0 === x1) { // a solid block instead of glass
      group.add(place(box(0.3, height, length / panes, material(OFFICE.wall, 0.9), 0, ROOM.sill + height / 2, 0), centre));
      continue;
    }
    const pane = place(box(0.03, height, length / panes - 0.12, glassMaterial(), 0, ROOM.sill + height / 2, 0), centre);
    pane.castShadow = pane.receiveShadow = false;
    glassGroup.add(pane);
  }
}

/** The low south wall with a steel cap, and a skirting along the other walls. */
function southWallAndSkirting(group) {
  const { x, north, south, southWallHeight: h } = ROOM;
  group.add(box(x * 2 + 0.3, h, 0.2, material(OFFICE.wall, 0.9), 0, h / 2, south));
  group.add(box(x * 2 + 0.3, 0.05, 0.28, material(OFFICE.steel, 0.5), 0, h + 0.025, south));
  for (const side of [-1, 1]) group.add(box(0.05, 0.12, south - north, material(OFFICE.concreteDark, 0.9), side * (x - 0.15), 0.06, (north + south) / 2));
}

/** @returns {THREE.Group} static shell, merged */
export function buildFloorAndWalls() {
  const group = new THREE.Group();
  const glassGroup = new THREE.Group();
  const { x, north, south } = ROOM;
  floor(group);
  southWallAndSkirting(group);
  windowWall(group, glassGroup, [x, north], [x, south]); // east
  windowWall(group, glassGroup, [-x, north], [-x, south], LIFT_LOBBY); // west, with the lift lobby solid
  windowWall(group, glassGroup, [-x, north], [x, north]); // north
  group.add(glassGroup);
  return mergeStatic(group);
}
