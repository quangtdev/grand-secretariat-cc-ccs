// The office's colours: warm concrete floor, oak, white walls, black steel mullions, one teal
// accent, soft daylight. Calm and low in contrast so the figures read first. The two colours
// that carry a STATUS stay the shell's (court-layout PALETTE): the ticket is glaze yellow and
// the laptop screen of a finished job is jade green, as in every world (DESIGN.md, The Same Signal Rule).
import { PALETTE } from '../../scene/court-layout.js';

export const OFFICE = {
  sky: 0xd3e5ee,
  concrete: 0xcfc8bc,
  concreteDark: 0xbfb8ac,
  carpet: 0xa9b6b6,
  oak: 0xc9ae88, // pale oak: floors and tops
  oakMid: 0xb58a5a,
  oakDark: 0x8a6440,
  white: 0xf3f1ec,
  wall: 0xe9e6df,
  steel: 0x2b2f33,
  steelLight: 0x8b9399,
  teal: 0x2f8f8a,
  tealDark: 0x1f6663,
  leaf: 0x4f9a5a,
  leafLight: 0x6dbb6e,
  pot: 0xd8d2c6,
  screen: 0x4f86c6,
  skin: 0xe0b08c,
  // Shirts, one per agent: calm, distinct from each other and from the status colours.
  shirts: [0x4f7cac, 0xa0607a, 0x8c6bb0, 0xd98a6a, 0x5a6fa8, 0x6f7f95, 0xb86a7a],
  hair: [0x2a1d16, 0x5a3a22, 0x1c1c20, 0x8a6a3a, 0x3a2a30],
  // The statuses' own colours, borrowed unchanged.
  ticket: PALETTE.glaze,
  report: PALETTE.jade,
  accentGold: PALETTE.gold,
};
