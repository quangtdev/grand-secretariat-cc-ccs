// Shared geometry of the court: where things stand, and the palette of the built world.
// Axes: -z is north (the throne hall), +z is south (towards the camera).
import * as THREE from 'three';

export const PALETTE = {
  lacquer: 0xc23a22, // son: vermilion lacquer on columns and walls
  lacquerDark: 0x8a2a1c,
  glaze: 0xe3a72b, // hoang luu ly: imperial yellow roof tiles
  glazeDark: 0xb97f16,
  gold: 0xd9a441,
  stone: 0xb9ad98,
  stonePath: 0xd3c8b2,
  stoneDark: 0x8f8574,
  wood: 0x4a2c1c,
  bronze: 0x7d6b45,
  moss: 0x6f7f5a,
  paper: 0xf1e8d2,
  straw: 0xd9c08a,
  skin: 0xd9a57e,
  jade: 0x7fc4a4,
  mist: 0xcdd2c4,
};

// Robe dyes, picked per agent so neighbours are told apart at a glance.
export const ROBE_DYES = [0x2f4a73, 0x6a4a32, 0x4d6240, 0x5b4a6a, 0x3f5f66, 0x7a3f3a];

export const HALL = { z: -9.5, plinthHeight: 0.9, width: 13, depth: 6 };
export const THRONE_POSITION = new THREE.Vector3(0, HALL.plinthHeight, -9.4);
export const DRUM_PAVILION = new THREE.Vector3(-10.4, 0, 0.6);
export const COURT_BOUNDS = { x: 13, north: -13.5, south: 9.5 };

// Writing desks: two flanks facing the central path, filled from the throne outwards.
const SEAT_TURN = 0.35;
const DESK_COLUMNS = [-3.6, 3.6, -6.2, 6.2];
const DESK_ROWS = [-1.6, 1, 3.6, 6.2];
/** A desk slot at (x, z): the scribe sits on its outer side, facing the path. A world may list its own slots (`WorldPack.desks`). */
export const makeDeskSlot = (x, z) => ({
  desk: new THREE.Vector3(x, 0, z),
  seat: new THREE.Vector3(x + Math.sign(x) * 0.72, 0, z),
  // Facing the path, turned a little south so the face and badge show from the default camera.
  facing: (x < 0 ? 1 : -1) * (Math.PI / 2 - SEAT_TURN),
  west: x < 0, // which flank: the desk itself is square to the path
});
export const DESKS = DESK_ROWS.flatMap((z) => DESK_COLUMNS.map((x) => makeDeskSlot(x, z)));

export const PETITION_SPACING = 1.3;

/**
 * Where the n-th petitioner stands before the throne steps (rows of seven). A world whose figures
 * are wide on screen (the 2D courts) may ask for more room between neighbours.
 */
export function petitionSpot(index, spacing = PETITION_SPACING) {
  const row = Math.floor(index / 7);
  const inRow = index % 7;
  // 0, +1, -1, +2, -2 ...: the first to arrive takes the centre.
  const offset = Math.ceil(inRow / 2) * (inRow % 2 ? 1 : -1);
  return new THREE.Vector3(offset * spacing, 0, -3.9 + row * 1.5);
}

/** Lane on the central path used when crossing the courtyard. */
export const pathLaneX = (fromX) => (fromX < 0 ? -0.7 : 0.7);

// --- The king's walks -------------------------------------------------------------
// The king sits on the throne; when the court is quiet he walks out along the hall,
// down a small stair on the east side of the plinth, and into the yard to look at
// the rockery and the lotus pond. He keeps to the east side so he never crosses the
// petition ground or the central path.
const PLINTH = HALL.plinthHeight;
const DAIS_TOP = PLINTH + 0.24;
export const KING_SEAT = new THREE.Vector3(THRONE_POSITION.x, DAIS_TOP, THRONE_POSITION.z + 0.1);
/** Where he stands up to, just in front of the dais. */
export const KING_STAND = new THREE.Vector3(THRONE_POSITION.x, PLINTH, THRONE_POSITION.z + 1.2);
export const HALL_EAST_STAIR = { x: HALL.width / 2 + 0.8, z: -7.8, run: 1.2, width: 1.6 }; // from the plinth edge outwards

const hallWalk = new THREE.Vector3(4.5, PLINTH, HALL_EAST_STAIR.z);
const stairTop = new THREE.Vector3(HALL_EAST_STAIR.x - 0.2, PLINTH, HALL_EAST_STAIR.z);
const stairFoot = new THREE.Vector3(HALL_EAST_STAIR.x + HALL_EAST_STAIR.run + 0.2, 0, HALL_EAST_STAIR.z);
const EAST_CORRIDOR_X = 8.0; // between the east desks' soldiers and the pond / rockery rims
const FACING_SOUTH = 0;
const FACING_EAST = Math.PI / 2;

/**
 * Outings: legs walked in order from KING_STAND. A leg with `gaze` is a stop where he
 * stands looking towards `gaze.facing` for a while. The way back retraces the legs.
 */
export const KING_OUTINGS = {
  galleryEast: [{ to: new THREE.Vector3(3.1, PLINTH, -7.2), gaze: { facing: FACING_SOUTH } }],
  galleryWest: [{ to: new THREE.Vector3(-3.1, PLINTH, -7.2), gaze: { facing: FACING_SOUTH } }],
  rockery: [
    { to: hallWalk }, { to: stairTop }, { to: stairFoot },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, -7), },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, -5), gaze: { facing: FACING_EAST } },
  ],
  pond: [
    { to: hallWalk }, { to: stairTop }, { to: stairFoot },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, -7) },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, -5), gaze: { facing: FACING_EAST } },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, 1.8), gaze: { facing: FACING_EAST } },
  ],
  // The long walk: rockery, pond, then on down the east side to look south over the river.
  riverView: [
    { to: hallWalk }, { to: stairTop }, { to: stairFoot },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, -7) },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, -5), gaze: { facing: FACING_EAST } },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, 1.8), gaze: { facing: FACING_EAST } },
    { to: new THREE.Vector3(EAST_CORRIDOR_X, 0, 7.4), gaze: { facing: FACING_SOUTH } },
  ],
  // Along the whole gallery, pausing at both ends.
  gallery: [
    { to: new THREE.Vector3(3.1, PLINTH, -7.2), gaze: { facing: FACING_SOUTH } },
    { to: new THREE.Vector3(-3.1, PLINTH, -7.2), gaze: { facing: FACING_SOUTH } },
  ],
};

// --- Wildlife -----------------------------------------------------------------------
/** The lotus pond on the east side of the yard; koi swim in its basin. */
export const POND = { center: new THREE.Vector3(10.3, 0, 2.4), width: 3.4, depth: 5.4, rim: 0.25, waterY: 0.34 };

/** Where birds land: roof ridge ends and eave corners of the hall, the drum pavilion's ridge. */
export const BIRD_PERCHES = [
  new THREE.Vector3(-2.3, 8.5, HALL.z), new THREE.Vector3(0, 8.32, HALL.z), new THREE.Vector3(2.3, 8.5, HALL.z),
  new THREE.Vector3(-8, 5.2, HALL.z + 4.1), new THREE.Vector3(8, 5.2, HALL.z + 4.1),
  DRUM_PAVILION.clone().add(new THREE.Vector3(-0.95, 4.36, 0)), DRUM_PAVILION.clone().add(new THREE.Vector3(0.95, 4.36, 0)),
];

// --- Garden pieces that small effects need to find ---------------------------------
/** Bronze incense urns flanking the throne steps (incense smoke rises from their rims). */
export const URNS = [-1, 1].map((side) => new THREE.Vector3(side * 4.4, 0, HALL.z + HALL.depth / 2 + 1.5));
export const URN_RIM_HEIGHT = 1.47;
/** The two old frangipani trees in the north corners (petals fall from their crowns). */
export const GARDEN_TREES = [new THREE.Vector3(-10.6, 0, -6.4), new THREE.Vector3(10.6, 0, -9.6)];
export const GARDEN_TREE_SCALE = 1.5;
