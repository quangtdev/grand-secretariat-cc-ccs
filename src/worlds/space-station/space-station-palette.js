// The space station's colours. Scenery is free to be cool and dark, but the figures are light and the
// trims glow, so everything stays readable against the void. The two colours that carry a STATUS stay
// the shell's (court-layout PALETTE): the petition tablet is glaze amber, the data pad is jade green,
// as in every world (DESIGN.md, The Same Signal Rule).
import { PALETTE } from '../../scene/court-layout.js';

export const STATION = {
  void: 0x070b16,
  deck: 0x5c6572,
  deckSeam: 0x363d48,
  hull: 0x1a1e25,
  panel: 0x4a5260,
  panelLight: 0x6b7587,
  panelDark: 0x252a33,
  cyan: 0x43d1e0,
  cyanDim: 0x1f7f90,
  holo: 0x2fa6bd,
  white: 0xe8eef6,
  coat: 0x23407a,
  coatDark: 0x182c55,
  skin: 0xe3b48f,
  gold: PALETTE.gold,
  alert: 0xff6a6a,
  // Light flight suits (one per agent): none of them amber or green, so a petition or a report reads at once.
  suits: [0xe2a9a0, 0x74c7ec, 0xb9a3ff, 0xf08fb0, 0xe6ecf5, 0x9fb3c8],
  // The statuses' own colours, borrowed unchanged.
  petitionHolo: PALETTE.glaze,
  petitionHoloDark: PALETTE.glazeDark,
  reportPad: PALETTE.jade,
};
