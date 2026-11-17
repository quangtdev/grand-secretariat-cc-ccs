// Builds the final vertical video for one language from the recorded takes:
//   node encode-promo-video.js <vi|en>            -> out/grand-secretariat-promo-<lang>.mp4
//   node encode-promo-video.js <vi|en> sheet A    -> contact sheet of one take (for review)
const fs = require('fs');
const path = require('path');
const L = require('./promo-recording-lib.js');

const lang = process.argv[2] || 'vi';
const OUT = path.join(L.ROOT, 'out', lang);
const FPS = 30;
const WORLD_SHOT = 1.7; // seconds of each world in the montage
const END_CARD = 4.0;

/** One take's frames (irregular times) -> constant 30 fps h264, optionally trimmed. */
function encodeTake(name, { from = 0, length } = {}) {
  const dir = path.join(OUT, `take-${name}`);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const lines = meta.frames.map((f, i) => {
    const next = meta.frames[i + 1]?.t ?? Math.max(meta.endT, f.t + 1 / 60);
    return `file '${f.file}'\nduration ${Math.max(next - f.t, 0.001).toFixed(4)}`;
  });
  lines.push(`file '${meta.frames.at(-1).file}'`);
  fs.writeFileSync(path.join(dir, 'frames.txt'), lines.join('\n'));
  const file = path.join(OUT, `take-${name}.mp4`);
  L.ffmpeg(['-f', 'concat', '-safe', '0', '-i', path.join(dir, 'frames.txt'),
    ...(from ? ['-ss', String(from)] : []), ...(length ? ['-t', String(length)] : []),
    '-vf', `fps=${FPS},scale=1080:1920:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-an', file]);
  return { file, meta, dir };
}

if (process.argv[3] === 'sheet') {
  const name = process.argv[4] || 'A';
  const every = Number(process.argv[5] || 1.5);
  const { file } = encodeTake(name);
  const sheet = path.join(OUT, `sheet-${name}.jpg`);
  L.ffmpeg(['-i', file, '-vf', `fps=1/${every},scale=270:480,tile=6x3`, '-frames:v', '1', '-q:v', '3', sheet]);
  console.log(sheet);
  process.exit(0);
}

const A = encodeTake('A');
const worlds = [1, 2, 3, 4].map((i) => encodeTake(`B${i}`, { from: 0.15, length: WORLD_SHOT }));
const C = encodeTake('C', { length: END_CARD });
const marks = JSON.parse(fs.readFileSync(path.join(A.dir, 'marks.json'), 'utf8')).marks;
const total = marks.end + 0.3 + WORLD_SHOT * 4 + END_CARD;

const parts = [A.file, ...worlds.map((w) => w.file), C.file];
fs.writeFileSync(path.join(OUT, 'parts.txt'), parts.map((p) => `file '${p}'`).join('\n'));
const silent = path.join(OUT, 'picture.mp4');
L.ffmpeg(['-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'parts.txt'), '-c', 'copy', silent]);

// Sound: take A's recording (it kept running under the later takes), aligned to its first frame, faded out at the end.
const final = path.join(L.ROOT, 'out', `grand-secretariat-promo-${lang}.mp4`);
L.ffmpeg(['-i', silent, '-ss', A.meta.audioOffset.toFixed(3), '-i', path.join(A.dir, A.meta.audioFile),
  '-filter_complex', `[1:a]aresample=48000,volume=1.6,afade=t=in:d=0.15,afade=t=out:st=${(total - 1.4).toFixed(2)}:d=1.4[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final]);
console.log(final, `~${total.toFixed(1)}s`);
