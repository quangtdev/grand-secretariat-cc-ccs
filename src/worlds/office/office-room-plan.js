// Where the office's big pieces stand, in the shared stage plan's coordinates (-z is north, the
// manager's glass office; +z is south, towards the camera). Kept in one place because several
// files must agree: the walls, the glass office, the fixtures the manager strolls to, the ambient life.
import * as THREE from 'three';
import { HALL, HALL_EAST_STAIR } from '../../scene/court-layout.js';

/** The outer shell: window walls east, west and north; a low wall in the south so the floor reads from the camera. */
export const ROOM = { x: 13.4, north: -13.9, south: 9.9, windowTop: 3.5, sill: 0.9, southWallHeight: 0.7 };

/** The manager's glass office: a raised floor at the shared plinth height, steps down on the east side. */
export const GLASS_OFFICE = {
  x0: -HALL_EAST_STAIR.x, x1: HALL_EAST_STAIR.x, front: HALL.z + HALL.depth / 2, back: ROOM.north, top: HALL.plinthHeight,
  doorZ: HALL_EAST_STAIR.z, doorHalf: HALL_EAST_STAIR.width / 2 + 0.1, glassTop: 2.7, rail: 0.8,
};

/** Fixtures the manager walks to; each stands where his outing (scene/court-layout.js KING_OUTINGS) gazes. */
export const COFFEE_STATION = new THREE.Vector3(3.1, GLASS_OFFICE.top, GLASS_OFFICE.front - 0.4); // galleryEast: facing south
export const PLANT_NOOK_WEST = new THREE.Vector3(-3.1, GLASS_OFFICE.top, GLASS_OFFICE.front - 0.5); // galleryWest
export const PLANT_CORNER = new THREE.Vector3(10.6, 0, -5.2); // rockery: east, past the steps
export const WINDOW_LOUNGE = new THREE.Vector3(11.7, 0, 1.8); // pond: east, at the window wall
export const WATER_COOLER = new THREE.Vector3(8.2, 0, 8.7); // riverView: south, at the end of the east corridor
