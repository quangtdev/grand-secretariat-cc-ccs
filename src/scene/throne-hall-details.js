// The finer parts of the throne hall and the throne, in the vocabulary of Hue palaces:
// stone column bases, a name board over the central bay, hanging lanterns, a sun disc
// and finials on the ridge, a stone balustrade along the plinth, and on the dais
// armrests, a footstool, a canopy and two ceremonial fans. All static: they are merged
// with the rest of the hall (static-scenery-merge.js).
import * as THREE from 'three';
import { HALL, PALETTE, THRONE_POSITION } from './court-layout.js';
import { box, material, mesh } from './court-mesh-helpers.js';

const COLUMN_XS = [-6, -3.6, -1.5, 1.5, 3.6, 6];
const COLUMN_HEIGHT = 3.7;

let nameBoard;
/**
 * Hoành phi: a dark lacquer board with gilt characters and a gilt frame. It names the hall
 * after Cần Chánh điện (勤政殿) of the Hue Imperial City, where the Nguyễn emperors held their
 * regular audiences, with the English meaning beneath.
 */
function nameBoardMaterial() {
  if (nameBoard) return nameBoard;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(0, 0, 512, 192);
  ctx.fillStyle = '#231a2e';
  ctx.fillRect(12, 12, 488, 168);
  ctx.fillStyle = '#e8bd5a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 68px serif';
  ctx.fillText('CẦN CHÁNH ĐIỆN', 256, 76, 456);
  ctx.font = '500 34px serif';
  ctx.fillText('Hall of Diligent Governance', 256, 140, 456);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  nameBoard = new THREE.MeshStandardMaterial({ map, roughness: 0.5 });
  return nameBoard;
}

/** Adds the details to the hall group built in court-architecture.js. */
export function addHallDetails(hall) {
  const { z, plinthHeight: ph, width, depth } = HALL;
  const front = z + depth / 2;
  const back = z - depth / 2;
  const stone = material(PALETTE.stonePath, 0.9);
  const stoneDark = material(PALETTE.stoneDark, 0.95);
  const gold = material(PALETTE.gold, 0.3);
  const lacquer = material(PALETTE.lacquer, 0.35);

  // Column bases and gilt capitals.
  for (const x of COLUMN_XS) {
    for (const cz of [front - 0.5, back + 0.5]) {
      hall.add(box(0.62, 0.16, 0.62, stoneDark, x, ph + 0.08, cz));
      hall.add(box(0.52, 0.12, 0.52, gold, x, ph + COLUMN_HEIGHT - 0.06, cz));
    }
  }

  // Name board over the central bay; lanterns in the four bays beside it.
  const board = mesh(new THREE.BoxGeometry(2.8, 1.05, 0.1), nameBoardMaterial(), 0, ph + COLUMN_HEIGHT - 0.62, front - 0.42);
  board.rotation.x = 0.12; // tilted down towards the yard
  hall.add(board);
  const lanternPaper = new THREE.MeshStandardMaterial({ color: PALETTE.lacquer, emissive: 0xc2401f, emissiveIntensity: 0.45, roughness: 0.6 });
  for (const x of [-4.8, -2.55, 2.55, 4.8]) {
    hall.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), gold, x, ph + COLUMN_HEIGHT - 0.25, front - 0.5));
    hall.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 8), lanternPaper, x, ph + COLUMN_HEIGHT - 0.7, front - 0.5));
    for (const end of [-1, 1]) hall.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 8), gold, x, ph + COLUMN_HEIGHT - 0.7 + end * 0.24, front - 0.5));
  }

  // Ridge of the upper roof: a sun disc between two rising finials.
  const ridgeY = ph + COLUMN_HEIGHT + 2.1 + 1.45 + 0.2;
  const disc = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 16), gold, 0, ridgeY + 0.3, z);
  disc.rotation.x = Math.PI / 2;
  hall.add(disc);
  for (const side of [-1, 1]) {
    const finial = mesh(new THREE.ConeGeometry(0.16, 0.9, 5), material(PALETTE.glazeDark, 0.4), side * 1.15, ridgeY + 0.25, z);
    finial.rotation.z = side * 0.9; // curling in towards the disc
    hall.add(finial);
  }

  // Stone balustrade along the front of the plinth, either side of the steps.
  const railZ = front + 0.48;
  for (const side of [-1, 1]) {
    for (let x = 2.9; x <= width / 2 + 0.6; x += 1.1) hall.add(box(0.16, 0.56, 0.16, stone, side * x, ph + 0.28, railZ));
    hall.add(box(width / 2 - 2.2, 0.1, 0.12, stone, side * (2.9 + (width / 2 - 2.3) / 2), ph + 0.46, railZ));
  }

  // The throne: armrests, a footstool, a canopy on four slim posts, and two fans behind.
  const t = THRONE_POSITION;
  for (const side of [-1, 1]) {
    hall.add(box(0.14, 0.42, 1.0, gold, t.x + side * 0.86, ph + 1.02, t.z));
    hall.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6), gold, t.x + side * 1.25, ph + 1.25, t.z + 0.75));
    // Ceremonial fan (quạt lông) on a tall pole.
    hall.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.9, 6), lacquer, t.x + side * 1.95, ph + 1.45, t.z - 0.6));
    const fan = mesh(new THREE.CircleGeometry(0.42, 12), gold, t.x + side * 1.95, ph + 3.1, t.z - 0.6);
    fan.material = material(PALETTE.gold, 0.31); // own cache entry: drawn double-sided
    fan.material.side = THREE.DoubleSide;
    hall.add(fan);
  }
  hall.add(box(0.9, 0.14, 0.5, lacquer, t.x, ph + 0.31, t.z + 0.95)); // footstool
  hall.add(box(2.9, 0.1, 1.9, lacquer, t.x, ph + 2.55, t.z + 0.05)); // canopy
  hall.add(box(3.0, 0.16, 0.06, gold, t.x, ph + 2.47, t.z + 1.0)); // its gilt fringe
}
