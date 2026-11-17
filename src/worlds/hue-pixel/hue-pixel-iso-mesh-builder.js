// Builds a pixel world's static scenery into very few meshes. Everything shares one texture
// atlas painted at boot (`packAtlas`), and an `IsoMeshBuilder` merges any number of textured
// blocks and upright sprites into one geometry: one draw call however much is built.
//
// Faces are tiled: a pattern in the atlas covers one world unit; a wall ten units long repeats
// it ten times (one small quad each), so atlas entries stay tiny. Each face has a flat shade
// (south faces light, east faces darker) because nothing in this world is lit: the shading is
// painted into the vertices, as pixel artists shade the three visible sides of a block.
import * as THREE from 'three';
import { ISO_VIEW } from '../../scene/court-camera-rig.js';
import { createPixelCanvas, pixelCell } from './hue-pixel-sprite-painter.js';

const ATLAS_WIDTH = 512;
const SQUASH = 1 / Math.cos(ISO_VIEW.pitch); // as sprite-figure-body.js: upright art keeps square pixels
export const SHADES = { south: 0.82, east: 0.58, top: 1 };
// World units across one art pixel of an upright sprite: at the default view and a typical window, one
// art pixel is one rendered pixel (3 screen pixels), so no sprite is shrunk below its own detail.
export const ART_PIXEL = 1 / 9;

/**
 * @param {{name: string, w: number, h: number, paint: (cell: ReturnType<typeof pixelCell>) => void}[]} items
 * @returns {{texture: THREE.CanvasTexture, rects: Record<string, {x: number, y: number, w: number, h: number}>, width: number, height: number, canvas: HTMLCanvasElement}}
 */
export function packAtlas(items) {
  // Shelf packing: left to right, a new shelf when the row is full. One pixel of margin each side.
  const rects = {};
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const item of items) {
    if (x + item.w + 2 > ATLAS_WIDTH) { x = 0; y += shelf; shelf = 0; }
    rects[item.name] = { x: x + 1, y: y + 1, w: item.w, h: item.h };
    x += item.w + 2;
    shelf = Math.max(shelf, item.h + 2);
  }
  const height = y + shelf;
  const { canvas, ctx } = createPixelCanvas(ATLAS_WIDTH, height);
  for (const item of items) {
    const r = rects[item.name];
    item.paint(pixelCell(ctx, r.x, r.y, r.w, r.h));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return { texture, rects, width: ATLAS_WIDTH, height, canvas };
}

const lerp3 = (a, b, t, out) => out.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
const corner = () => new THREE.Vector3();

export class IsoMeshBuilder {
  /** @param {ReturnType<typeof packAtlas>} atlas */
  constructor(atlas) {
    this.atlas = atlas;
    this.positions = [];
    this.uvs = [];
    this.colors = [];
  }

  /**
   * A quad a-b-c-d (bottom-left, bottom-right, top-right, top-left as the viewer sees it) filled
   * with the atlas entry `name`, repeated `nx` by `ny` times, at brightness `shade`.
   */
  quad(a, b, c, d, name, shade, nx = 1, ny = 1) {
    const r = this.atlas.rects[name];
    if (!r) throw new Error(`hue-pixel atlas has no "${name}"`);
    const u0 = (r.x + 0.01) / this.atlas.width;
    const u1 = (r.x + r.w - 0.01) / this.atlas.width;
    const v1 = 1 - (r.y + 0.01) / this.atlas.height;
    const v0 = 1 - (r.y + r.h - 0.01) / this.atlas.height;
    const p = [0, 1, 2, 3].map(corner);
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const s0 = i / nx; const s1 = (i + 1) / nx; const t0 = j / ny; const t1 = (j + 1) / ny;
        const at = (s, t, out) => lerp3(lerp3(a, b, s, p[0]), lerp3(d, c, s, p[1]), t, out);
        const cells = [at(s0, t0, p[2]).clone(), at(s1, t0, p[2]).clone(), at(s1, t1, p[2]).clone(), at(s0, t1, p[2]).clone()];
        const uv = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
        for (const k of [0, 1, 2, 0, 2, 3]) {
          this.positions.push(cells[k].x, cells[k].y, cells[k].z);
          this.uvs.push(...uv[k]);
          this.colors.push(shade, shade, shade);
        }
      }
    }
  }

  /**
   * A block standing on `y` at (x, z), `w` along x, `d` along z, `h` tall; `top` = [w, d] of its upper
   * edge makes a tapering roof. `faces` names the atlas pattern of the south, east and top sides.
   */
  block({ x, z, y = 0, w, d, h, top = [w, d], south, east, up, shade = SHADES }) {
    const [tw, td] = top;
    const v = (px, py, pz) => new THREE.Vector3(px, py, pz);
    const x0 = x - w / 2; const x1 = x + w / 2; const z0 = z - d / 2; const z1 = z + d / 2;
    const tx0 = x - tw / 2; const tx1 = x + tw / 2; const tz0 = z - td / 2; const tz1 = z + td / 2;
    const count = (length) => Math.max(1, Math.round(length));
    const slope = Math.hypot(h, (d - td) / 2);
    const slopeEast = Math.hypot(h, (w - tw) / 2);
    if (south) this.quad(v(x0, y, z1), v(x1, y, z1), v(tx1, y + h, tz1), v(tx0, y + h, tz1), south, shade.south, count(w), count(slope));
    if (east) this.quad(v(x1, y, z1), v(x1, y, z0), v(tx1, y + h, tz0), v(tx1, y + h, tz1), east, shade.east, count(d), count(slopeEast));
    if (up) this.quad(v(tx0, y + h, tz1), v(tx1, y + h, tz1), v(tx1, y + h, tz0), v(tx0, y + h, tz0), up, shade.top, count(tw), count(td));
  }

  /** An upright sprite standing at (x, y, z), facing the camera. `scale` multiplies the art pixel. */
  sprite(x, y, z, name, scale = 1, shade = 1) {
    const r = this.atlas.rects[name];
    const half = (r.w * ART_PIXEL * scale) / 2;
    const height = r.h * ART_PIXEL * scale * SQUASH;
    const rx = Math.cos(ISO_VIEW.yaw) * half;
    const rz = -Math.sin(ISO_VIEW.yaw) * half;
    const v = (px, py, pz) => new THREE.Vector3(px, py, pz);
    this.quad(v(x - rx, y, z - rz), v(x + rx, y, z + rz), v(x + rx, y + height, z + rz), v(x - rx, y + height, z - rz), name, shade);
  }

  /** The finished mesh. Its material is the atlas's, one per builder. */
  build() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    const material = new THREE.MeshBasicMaterial({ map: this.atlas.texture, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    return new THREE.Mesh(geometry, material);
  }
}
