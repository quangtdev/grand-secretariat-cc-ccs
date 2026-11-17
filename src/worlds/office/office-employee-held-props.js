// What an employee holds up: the ticket (a glaze-yellow sticky note with a dark "!" on both
// faces, lifted again and again while a decision is awaited) and the laptop with a jade screen
// shown off when the work is done. Both read from the front and from behind, because the camera
// mostly sees the employees' backs. Each is baked to one mesh. Origin = the bottom edge.
import * as THREE from 'three';
import { bakeRigid } from '../../scene/figure-toon-style.js';
import { OFFICE } from './office-palette.js';
import { slab } from './office-person-parts.js';

export const TICKET_HEIGHT = 0.34;

/** The petition ticket: a note on a thin dark backing, held up by both hands. */
export function buildTicket() {
  const ticket = new THREE.Group();
  const ink = 0x3a2c14;
  ticket.add(slab(OFFICE.oakDark, 0.46, TICKET_HEIGHT + 0.04, 0.012, 0, TICKET_HEIGHT / 2, 0));
  ticket.add(slab(OFFICE.ticket, 0.42, TICKET_HEIGHT, 0.03, 0, TICKET_HEIGHT / 2, 0));
  for (const face of [-1, 1]) { // the same "!" on both faces
    ticket.add(slab(ink, 0.06, 0.16, 0.012, 0, TICKET_HEIGHT / 2 + 0.05, face * 0.017));
    ticket.add(slab(ink, 0.06, 0.055, 0.012, 0, TICKET_HEIGHT / 2 - 0.1, face * 0.017));
  }
  bakeRigid(ticket);
  return ticket;
}

/**
 * An open laptop with the lid standing up behind the base, the screen facing +z. The screen and
 * the lid's back are both jade (`glow`) so a finished job reads from any side; `screen` picks
 * another colour for the contractor's.
 */
export function buildLaptop({ glow = OFFICE.report, backGlow = glow, width = 0.48 } = {}) {
  const laptop = new THREE.Group();
  laptop.add(slab(0xb9c0c6, width, 0.02, 0.24, 0, 0, 0)); // base
  laptop.add(slab(0x2c3036, width - 0.03, 0.012, 0.16, 0, 0.012, 0.03)); // keys
  const lid = new THREE.Group();
  lid.position.set(0, 0.01, -0.12);
  lid.rotation.x = -0.45; // leans back, screen facing +z
  lid.add(slab(0x2c3036, width, 0.32, 0.014, 0, 0.16, 0)); // bezel
  lid.add(slab(glow, width - 0.04, 0.28, 0.008, 0, 0.16, 0.006)); // the screen
  lid.add(slab(backGlow, width - 0.06, 0.24, 0.008, 0, 0.16, -0.006)); // the lid's back
  laptop.add(lid);
  bakeRigid(laptop);
  return laptop;
}
