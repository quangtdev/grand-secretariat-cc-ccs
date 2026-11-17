// A tiny pixel painter: sprites in the pixel Huế court are painted in code on canvases at boot
// (no image files). Everything is whole pixels: `dot`, `rect`, `line` and palette-indexed `rows`.
// A `cell` is a window of the canvas with its own origin, so a figure's frame is drawn at (0, 0).

/** 0xRRGGBB -> '#rrggbb'. */
export const css = (hex) => `#${hex.toString(16).padStart(6, '0')}`;

/** A colour made lighter (factor > 1) or darker (< 1). */
export function shade(hex, factor) {
  const channel = (shift) => Math.max(0, Math.min(255, Math.round(((hex >> shift) & 255) * factor)));
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export function createPixelCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d', { willReadFrequently: true }) };
}

/** A window of `ctx` whose (0, 0) is at (ox, oy); everything is clipped to w x h. */
export function pixelCell(ctx, ox, oy, w, h) {
  const fill = (x, y, rw, rh, color) => {
    const x0 = Math.max(x, 0);
    const y0 = Math.max(y, 0);
    const x1 = Math.min(x + rw, w);
    const y1 = Math.min(y + rh, h);
    if (x1 <= x0 || y1 <= y0) return;
    ctx.fillStyle = css(color);
    ctx.fillRect(ox + x0, oy + y0, x1 - x0, y1 - y0);
  };
  return {
    w, h,
    dot: (x, y, color) => fill(x, y, 1, 1, color),
    rect: fill,
    /** A one-pixel line (Bresenham). */
    line(x0, y0, x1, y1, color) {
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let x = x0, y = y0; ; ) {
        fill(x, y, 1, 1, color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
      }
    },
    /** Rows of characters: each looked up in `palette` ({ char: colour }); anything else is left clear. */
    rows(x, y, palette, lines) {
      lines.forEach((line, row) => [...line].forEach((ch, col) => { if (palette[ch] !== undefined) fill(x + col, y + row, 1, 1, palette[ch]); }));
    },
    /** Rings the painted pixels with `color`: every clear pixel next to a painted one. */
    outline(color) {
      const image = ctx.getImageData(ox, oy, w, h);
      const { data } = image;
      const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 0;
      const ring = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) ring.push([x, y]);
        }
      }
      for (const [x, y] of ring) fill(x, y, 1, 1, color);
    },
  };
}
