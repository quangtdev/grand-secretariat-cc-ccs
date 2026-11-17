// The two great buildings of the pixel Huế court, as textured blocks: the throne hall at the
// north (a cutaway: the king on his throne is seen in the open, framed by four pillars and a canopy),
// and the drum pavilion in the west yard. Blocks, not sprites, so figures walk in front of and
// behind them with true depth.
import { HALL, DRUM_PAVILION, HALL_EAST_STAIR } from '../../scene/court-layout.js';

// The hall is a cutaway: a low platform, the back wall and a single canopy set to the north, held up by
// four pillars that stand behind the throne's front edge. Nothing stands between the camera and the king,
// so the hall frames the throne instead of covering a third of the picture.
const BODY_HEIGHT = 5.4;
const CANOPY_DEPTH = 4;
const ROOF_HEIGHT = 1.5;
/** Where the hall's ridge is: the egrets' perches. */
export const HALL_RIDGE = { y: HALL.plinthHeight + BODY_HEIGHT + ROOF_HEIGHT + 0.1, z: HALL.z - HALL.depth / 2 + CANOPY_DEPTH / 2 + 0.2 };

/** Columns: lacquer posts; the south face is lit, the east face in shade. */
const column = (b, x, z, h, y = 0) => b.block({ x, z, y, w: 0.5, d: 0.5, h, south: 'red', east: 'redDark', up: 'redDark' });

/** A single-tier hip roof centred on (x, z), eaves at `y`; returns the height of its ridge. */
function roof(b, x, z, y, w, d, h) {
  b.block({ x, z, y, w, d, h, top: [w * 0.6, d * 0.3], south: 'roof', east: 'roof', up: 'roof' });
  return y + h;
}

export function buildHall(b) {
  const z = HALL.z;
  const front = z + HALL.depth / 2;
  const back = z - HALL.depth / 2;
  const plinth = HALL.plinthHeight;
  // Plinth, front steps and the king's stair down the east end.
  b.block({ x: 0, z: z + 0.1, w: 14.8, d: HALL.depth + 0.8, h: plinth, south: 'stone', east: 'stone', up: 'floor' });
  b.block({ x: 0, z: front + 0.9, w: 4.4, d: 0.9, h: 0.55, south: 'stone', east: 'stone', up: 'floor' });
  const stairX = HALL_EAST_STAIR.x;
  b.block({ x: stairX + 0.5, z: HALL_EAST_STAIR.z, w: 1, d: HALL_EAST_STAIR.width, h: 0.6, south: 'stone', east: 'stone', up: 'floor' });
  b.block({ x: stairX + 1.1, z: HALL_EAST_STAIR.z, w: 0.5, d: HALL_EAST_STAIR.width, h: 0.3, south: 'stone', east: 'stone', up: 'floor' });
  // Behind the throne: the back wall, a dark gilded panel, the dais, seat and high back.
  b.block({ x: 0, z: back + 0.2, y: plinth, w: 13, d: 0.3, h: BODY_HEIGHT, south: 'redDark', east: 'redDark', up: 'redDark' });
  b.block({ x: 0, z: back + 0.45, y: plinth + 0.5, w: 5, d: 0.2, h: 3.4, south: 'dark', east: 'dark', up: 'dark' });
  b.block({ x: 0, z: z - 0.6, y: plinth, w: 3.6, d: 2.2, h: 0.24, south: 'red', east: 'redDark', up: 'redDark' });
  b.block({ x: 0, z: z - 0.9, y: plinth + 0.24, w: 1.8, d: 0.5, h: 0.6, south: 'red', east: 'redDark', up: 'red' });
  b.block({ x: 0, z: z - 1.4, y: plinth + 0.24, w: 2.2, d: 0.25, h: 2.6, south: 'red', east: 'redDark', up: 'red' });
  // The canopy: four pillars at its front edge and one roof, which starts behind the king.
  const canopyZ = back + CANOPY_DEPTH / 2 + 0.2;
  const canopyFront = canopyZ + CANOPY_DEPTH / 2 - 0.5;
  for (const x of [-6.2, -2.8, 2.8, 6.2]) column(b, x, canopyFront, BODY_HEIGHT, plinth);
  const eaves = plinth + BODY_HEIGHT;
  b.block({ x: 0, z: canopyFront, y: eaves - 0.4, w: 13.4, d: 0.6, h: 0.4, south: 'gold', east: 'gold', up: 'gold' });
  roof(b, 0, canopyZ, eaves, 14.6, CANOPY_DEPTH + 0.4, ROOF_HEIGHT);
}

/** Height of the pavilion's ridge: where the egret lands and the summon chip floats. */
export const PAVILION_RIDGE = 4.6;

/** The drum pavilion: a low open roof on four short posts; the drum stands under it. */
export function buildPavilion(b) {
  const { x, z } = DRUM_PAVILION;
  b.block({ x, z, w: 3.6, d: 3.6, h: 0.3, south: 'stone', east: 'stone', up: 'floor' });
  for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) column(b, x + dx, z + dz, 2.6, 0.3);
  b.block({ x, z, y: 2.9, w: 3.8, d: 3.8, h: 0.3, south: 'gold', east: 'gold', up: 'gold' });
  roof(b, x, z, 3.2, 4.8, 4.8, PAVILION_RIDGE - 3.2);
  b.sprite(x, 0.3, z, 'drum', 1.1);
}
