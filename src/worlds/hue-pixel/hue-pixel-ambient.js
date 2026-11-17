// Background life of the pixel Huế court: egrets that circle the yard and settle on the roof
// ridges, petals drifting from the frangipani, glints and koi on the water. All are tiny sprites
// of one batch (`SpriteBatch`: one mesh, one draw call, every sprite rewritten each frame).
// Each effect holds still while a petition waits (the lifted scroll must be what moves) and
// under reduced motion.
import * as THREE from 'three';
import { ISO_VIEW } from '../../scene/court-camera-rig.js';
import { DRUM_PAVILION, GARDEN_TREES, POND } from '../../scene/court-layout.js';
import { ART_PIXEL } from './hue-pixel-iso-mesh-builder.js';
import { RIVER } from './hue-pixel-ground-painter.js';
import { HALL_RIDGE, PAVILION_RIDGE } from './hue-pixel-hall-and-pavilion.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SQUASH = 1 / Math.cos(ISO_VIEW.pitch);

/** Many small camera-facing sprites in one dynamic mesh. */
class SpriteBatch {
  constructor(atlas, capacity) {
    this.atlas = atlas;
    this.dirty = true;
    this.positions = new Float32Array(capacity * 12);
    this.uvs = new Float32Array(capacity * 8);
    const index = [];
    for (let i = 0; i < capacity; i++) index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setIndex(index);
    this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({ map: atlas.texture, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false;
    for (let i = 0; i < capacity; i++) this.hide(i);
  }

  /** Sprite `slot` shows atlas entry `name`, its foot at (x, y, z). */
  set(slot, name, x, y, z, scale = 1) {
    const { rects, width, height } = this.atlas;
    const r = rects[name];
    const half = (r.w * ART_PIXEL * scale) / 2;
    const tall = r.h * ART_PIXEL * scale * SQUASH;
    const rx = Math.cos(ISO_VIEW.yaw) * half;
    const rz = -Math.sin(ISO_VIEW.yaw) * half;
    const p = this.positions;
    const i = slot * 12;
    if (p[i] === x - rx && p[i + 1] === y && p[i + 2] === z - rz && p[i + 7] === y + tall && this.uvs[slot * 8] === (r.x + 0.01) / width) return; // unchanged: nothing to upload
    p[i] = x - rx; p[i + 1] = y; p[i + 2] = z - rz;
    p[i + 3] = x + rx; p[i + 4] = y; p[i + 5] = z + rz;
    p[i + 6] = x + rx; p[i + 7] = y + tall; p[i + 8] = z + rz;
    p[i + 9] = x - rx; p[i + 10] = y + tall; p[i + 11] = z - rz;
    const u0 = (r.x + 0.01) / width; const u1 = (r.x + r.w - 0.01) / width;
    const v1 = 1 - (r.y + 0.01) / height; const v0 = 1 - (r.y + r.h - 0.01) / height;
    const t = this.uvs;
    const k = slot * 8;
    t[k] = u0; t[k + 1] = v0; t[k + 2] = u1; t[k + 3] = v0; t[k + 4] = u1; t[k + 5] = v1; t[k + 6] = u0; t[k + 7] = v1;
    this.dirty = true;
  }

  hide(slot) { this.positions.fill(0, slot * 12, slot * 12 + 12); this.dirty = true; }

  /** Uploads what changed since the last call (nothing, while every effect is held still). */
  commit() {
    if (!this.dirty) return;
    this.dirty = false;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
  }
}

const rnd = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

function createEgrets(batch, first, { onPerch }) {
  const pavilion = DRUM_PAVILION;
  const perches = [new THREE.Vector3(-2.4, HALL_RIDGE.y, HALL_RIDGE.z), new THREE.Vector3(2.4, HALL_RIDGE.y, HALL_RIDGE.z), new THREE.Vector3(pavilion.x + 0.8, PAVILION_RIDGE + 0.1, pavilion.z)];
  const birds = perches.map((perch, i) => ({ perch, pos: perch.clone(), phase: i * 2.1, perched: reducedMotion.matches, speed: 0.22 + i * 0.05 }));
  let settled = reducedMotion.matches;
  const target = new THREE.Vector3();
  return {
    update(dt, time) {
      birds.forEach((bird, i) => {
        if (settled) target.copy(bird.perch);
        else target.set(Math.cos(time * bird.speed + bird.phase) * 15, 8 + Math.sin(time * 0.7 + i) * 0.8, -1 + Math.sin(time * bird.speed + bird.phase) * 9);
        const gap = target.distanceTo(bird.pos);
        const wasPerched = bird.perched;
        bird.perched = settled && gap < 0.05;
        if (bird.perched && !wasPerched) onPerch();
        if (!bird.perched) bird.pos.addScaledVector(target.sub(bird.pos), Math.min(1, (dt * 6) / Math.max(gap, 0.001)));
        const flapping = !bird.perched && !reducedMotion.matches && Math.floor(time * 6 + i) % 2 === 0;
        batch.set(first + i, flapping ? 'egret0' : 'egret1', bird.pos.x, bird.pos.y, bird.pos.z, 1.1);
      });
    },
    settle(petition) { settled = petition || reducedMotion.matches; },
  };
}

function createPetals(batch, first, count) {
  const fall = Array.from({ length: count }, (_, i) => ({ tree: GARDEN_TREES[i % 2], phase: rnd(i + 1) * 20, rate: 0.35 + rnd(i + 9) * 0.3 }));
  let held = reducedMotion.matches;
  const place = (petal, i, time) => {
    const t = (time * petal.rate + petal.phase) % 6 / 6; // 0 at the crown, 1 on the ground
    const sway = Math.sin(time * 1.3 + petal.phase) * 0.6;
    batch.set(first + i, 'petal', petal.tree.x + sway + (rnd(i) - 0.5) * 5 * t, 4.2 * (1 - t), petal.tree.z + (rnd(i + 3) - 0.5) * 4 * t);
  };
  fall.forEach((petal, i) => place(petal, i, 0));
  return {
    update(dt, time) { if (!held) fall.forEach((petal, i) => place(petal, i, time)); },
    settle(petition) { held = petition || reducedMotion.matches; },
  };
}

function createWaterLife(batch, first, glints) {
  const spots = Array.from({ length: glints }, (_, i) => (i % 2
    ? { x: -28 + rnd(i) * 56, z: RIVER.north + 0.5 + rnd(i + 4) * (RIVER.south - RIVER.north - 1) }
    : { x: POND.center.x + (rnd(i) - 0.5) * (POND.width - 0.6), z: POND.center.z + (rnd(i + 4) - 0.5) * (POND.depth - 0.6) }));
  let held = reducedMotion.matches;
  const show = (time) => {
    spots.forEach((spot, i) => {
      const on = Math.sin(time * 1.6 + i * 2.7) > 0.8;
      if (on) batch.set(first + i, 'glint', spot.x, 0.04, spot.z, 0.8); else batch.hide(first + i);
    });
    for (let k = 0; k < 2; k++) { // two koi circling the pond
      const a = time * 0.35 + k * Math.PI;
      batch.set(first + glints + k, 'koi', POND.center.x + Math.cos(a) * 0.9, 0.04, POND.center.z + Math.sin(a * 0.8) * 1.8, 1);
    }
  };
  show(0);
  return { update(dt, time) { if (!held) show(time); }, settle(petition) { held = petition || reducedMotion.matches; } };
}

/** @returns {{mesh: THREE.Mesh, ambient: import('../world-pack-contract.js').AmbientLife[]}} */
export function buildAmbientLife(atlas, hooks) {
  const batch = new SpriteBatch(atlas, 3 + 14 + 10 + 2);
  const effects = [createEgrets(batch, 0, hooks), createPetals(batch, 3, 14), createWaterLife(batch, 17, 10)];
  batch.commit();
  return {
    mesh: batch.mesh,
    ambient: [...effects, { update: () => batch.commit() }], // last: send what the others wrote
  };
}
