// A figure drawn as a sprite: one textured plane that always faces the isometric camera, so a
// whole figure costs one draw call. For worlds with a 2D look (see court-camera-rig.js).
//
// A sprite sheet is one canvas of equal cells. Each clip owns two rows, "front" then "back"
// (the figure drawn walking towards the camera, and away from it), both facing the viewer's left:
// the right-facing views are the same cell mirrored by flipping the plane's UVs. Which row and
// side to show follows the figure's heading against the camera's yaw. The frame inside a clip
// steps by the wall clock at the clip's own rate (8 fps reads well in pixel art), independent of
// how often the court is drawn.
import * as THREE from 'three';
import { ISO_VIEW } from './court-camera-rig.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SQUASH = 1 / Math.cos(ISO_VIEW.pitch); // a standing plane is foreshortened by the pitch; stretch it back so art pixels stay square
const DEAD_ZONE = 0.12; // heading this close to a view's edge keeps the view it had (no flicker on a turn)

/**
 * @typedef {object} SpriteSheet
 * @property {THREE.CanvasTexture} texture
 * @property {number} frameW  cell width in art pixels
 * @property {number} frameH
 * @property {number} width   canvas size in art pixels
 * @property {number} height
 * @property {Record<string, {row: number, frames: number, fps: number}>} clips  `row` is the front view; `row + 1` the back
 * @property {THREE.MeshBasicMaterial} material  shared by every figure of the sheet
 * @property {Uint8Array} [alpha]  alpha of every pixel, filled on first pick
 */

/**
 * @param {HTMLCanvasElement} canvas  cells laid out by `layoutClips`
 * @param {Record<string, {row: number, frames: number, fps: number}>} clips
 * @returns {SpriteSheet}
 */
export function createSpriteSheet(canvas, frameW, frameH, clips) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  // alphaTest, not blending: the sprites keep correct depth against each other and the stage.
  const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide });
  return { texture, frameW, frameH, width: canvas.width, height: canvas.height, clips, material };
}

/** Rows for a list of `[name, frames, fps]`: two rows (front, back) per clip, in order. */
export function layoutClips(list) {
  return Object.fromEntries(list.map(([name, frames, fps], index) => [name, { row: index * 2, frames, fps }]));
}

/** The frame of `clip` showing now; `phase` (seconds) de-syncs neighbours. Held on the first frame under reduced motion. */
export function clipFrame(clip, phase = 0, speed = 1) {
  if (reducedMotion.matches || clip.frames === 1) return 0;
  return Math.floor((performance.now() / 1000 + phase) * clip.fps * speed) % clip.frames;
}

const FACING_CAMERA = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ISO_VIEW.yaw);
const position = new THREE.Vector3();
const scale = new THREE.Vector3();
/** The sheet's alpha channel, read from its canvas once (only when something is picked). */
function sheetAlpha(sheet) {
  if (!sheet.alpha) {
    const canvas = sheet.texture.image;
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    sheet.alpha = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < sheet.alpha.length; i++) sheet.alpha[i] = data[i * 4 + 3];
  }
  return sheet.alpha;
}

const worldYaw = (elements) => Math.atan2(elements[8], elements[10]);

export class SpriteFigure {
  /**
   * @param {SpriteSheet} sheet
   * @param {number} pixel  world units across one art pixel
   * @param {{mirror?: boolean, anchor?: number}} [fixed]  props that do not turn with a heading (a desk, a flying scroll):
   *        `mirror` fixes the side shown; `anchor` (0..1) is how far up the cell the parent's position falls (0: its foot)
   */
  constructor(sheet, pixel, fixed) {
    this.sheet = sheet;
    this.pixel = pixel;
    this.clip = Object.keys(sheet.clips)[0];
    this.frame = 0;
    this.back = false;
    this.fixed = Boolean(fixed);
    this.mirror = fixed?.mirror ?? false;
    this.shown = -1; // the cell last written to the UVs (row, frame, mirror as one number)
    const width = sheet.frameW * pixel;
    const height = sheet.frameH * pixel;
    // Its own geometry: the UVs are this figure's; the texture and material are the sheet's.
    const geometry = new THREE.PlaneGeometry(width, height * SQUASH).translate(0, (0.5 - (fixed?.anchor ?? 0)) * height * SQUASH, 0);
    this.mesh = new THREE.Mesh(geometry, sheet.material);
    this.mesh.frustumCulled = false; // its matrix is set while drawing
    this.mesh.onBeforeRender = () => this.#face();
    this.mesh.raycast = (raycaster, hits) => this.#raycast(raycaster, hits);
    this.#writeUvs();
  }

  /** World height of an art pixel row counted from the feet, for placing chips and hands. */
  heightOf(rows) { return rows * this.pixel * SQUASH; }

  /** Choose what to show; the heading decides front or back, left or right when it is next drawn. */
  play(clip, frame = 0) {
    this.clip = clip;
    this.frame = frame;
  }

  // Billboard: at the parent's position and scale, turned to the camera's yaw whatever the parent
  // (the figure's group) is doing, and the view chosen from the parent's heading.
  #face() {
    const parent = this.mesh.parent;
    if (!parent) return;
    const m = parent.matrixWorld.elements;
    const scaleX = Math.hypot(m[0], m[1], m[2]);
    const scaleY = Math.hypot(m[4], m[5], m[6]);
    if (!this.fixed) {
      const heading = worldYaw(m) - ISO_VIEW.yaw; // 0: walking straight at the camera
      if (Math.abs(Math.cos(heading)) > DEAD_ZONE) this.back = Math.cos(heading) < 0;
      if (Math.abs(Math.sin(heading)) > DEAD_ZONE) this.mirror = Math.sin(heading) > 0; // drawn facing left
    }
    this.#writeUvs();
    this.mesh.matrixWorld.compose(position.set(m[12], m[13], m[14]), FACING_CAMERA, scale.set(scaleX, scaleY, scaleX));
  }

  #writeUvs() {
    const { sheet } = this;
    const clip = sheet.clips[this.clip];
    if (!clip) return;
    const frame = Math.min(this.frame, clip.frames - 1);
    const row = clip.row + (this.back ? 1 : 0);
    const key = (row * 64 + frame) * 2 + (this.mirror ? 1 : 0);
    if (key === this.shown) return;
    this.shown = key;
    const inset = 0.01; // a hair inside the cell: never a neighbour's pixel at the edge
    const u0 = (frame * sheet.frameW + inset) / sheet.width;
    const u1 = ((frame + 1) * sheet.frameW - inset) / sheet.width;
    const v1 = 1 - (row * sheet.frameH + inset) / sheet.height;
    const v0 = 1 - ((row + 1) * sheet.frameH - inset) / sheet.height;
    const left = this.mirror ? u1 : u0;
    const right = this.mirror ? u0 : u1;
    const uv = this.mesh.geometry.attributes.uv;
    const a = uv.array;
    a[0] = left; a[1] = v1; a[2] = right; a[3] = v1; a[4] = left; a[5] = v0; a[6] = right; a[7] = v0;
    uv.needsUpdate = true;
  }

  // Picking: only the painted pixels of the figure count, so the empty part of one cell never
  // steals a click or hover from a figure standing behind it. The hit's UV already lies in the
  // frame being shown (mirror included), so it indexes the sheet directly.
  #raycast(raycaster, hits) {
    const found = [];
    THREE.Mesh.prototype.raycast.call(this.mesh, raycaster, found);
    const { sheet } = this;
    for (const hit of found) {
      if (!hit.uv) continue;
      const x = Math.min(sheet.width - 1, Math.floor(hit.uv.x * sheet.width));
      const y = Math.min(sheet.height - 1, Math.floor((1 - hit.uv.y) * sheet.height));
      if (sheetAlpha(sheet)[y * sheet.width + x] > 0) hits.push(hit);
    }
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose(); // the sheet's texture and material are shared
  }
}
