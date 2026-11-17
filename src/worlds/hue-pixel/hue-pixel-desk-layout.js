// The pixel court's own desk slots. In the isometric view a point (x, z) lands at screen x ~ x - z and
// screen height ~ -(x + z), so the shared grid (columns and rows 2.6 apart) puts neighbours on top of one
// another: a step in x and a step in z cancel on screen. A scribe also brings soldiers, who stand behind
// the seat (outwards, away from the path): one unit of scribe, desk and soldiers is ~5 units wide in
// x - z. Taken in order (west, east, west, east ...) each of the first six desks is at least that far
// from every earlier one in x - z, or well above or below it; soldiers neither reach the next desk, the
// drum pavilion nor the pond. The petition rows (z -3.9 and nearer the throne) stay clear.
import { makeDeskSlot } from '../../scene/court-layout.js';

// [x, z] of each desk. Later desks (beyond six scribes) may stand closer; more than eight share desks.
const WEST = [[-3.6, -1.6], [-4.6, 4.4], [-7, 7.4], [-3.6, 7.4]];
const EAST = [[3.6, -1.6], [4.6, 4.4], [8, -2.2], [3.6, 7.4]];

/** Slots filled alternately west and east, the first desks nearest the throne. */
export const HUE_PIXEL_DESKS = WEST.flatMap((west, i) => [makeDeskSlot(...west), makeDeskSlot(...EAST[i])]);
