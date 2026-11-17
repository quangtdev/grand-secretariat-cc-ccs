// The zoo's colours. Scenery colours are free to be bright and friendly; the two that carry a
// STATUS stay the shell's (court-layout PALETTE): the petition sign is glaze yellow and the
// report ribbon is jade green, as in every world (DESIGN.md, The Same Signal Rule).
import { PALETTE } from '../../scene/court-layout.js';

export const ZOO = {
  sky: 0xbfe3ee,
  grass: 0x86b95a,
  grassLight: 0x9fcb6a,
  grassDark: 0x6ea04a,
  sand: 0xe8d6a2,
  sandDark: 0xd4bf88,
  wood: 0x8a5a36,
  woodDark: 0x5e3b22,
  woodLight: 0xc89560,
  roof: 0xb8573b,
  leaves: [0x4f9a4c, 0x5eac52, 0x3f8a4a, 0x6dbb5a],
  rock: 0xa6a39a,
  water: 0x5fb4c9,
  hay: 0xe3c565,
  khaki: 0xcdb27a,
  overalls: 0x3f6aa8,
  skin: 0xe0a97c,
  white: 0xf6f1e4,
  balloons: [0xe45b4c, 0xf2b630, 0x4f9bd9, 0x6cc070, 0xd96bb0],
  // The statuses' own colours, borrowed unchanged.
  petitionSign: PALETTE.glaze,
  reportRibbon: PALETTE.jade,
  medalGold: PALETTE.gold,
};
