// A one-shot summoning effect on the ground: a glowing seal ring opens, a column of
// light rises from it and sparks drift up, then everything fades. Played golden when a
// soldier (sub-agent) is mustered, jade when one reports back and dissolves.
import * as THREE from 'three';

const DURATION = 1.6; // seconds
const SPARK_COUNT = 36;
const COLUMN_HEIGHT = 3.2;

// Shared, lazily built resources; per-portal materials only (they fade independently).
let shared;
function sharedResources() {
  if (shared) return shared;
  const gradient = (draw) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    draw(canvas.getContext('2d'));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  shared = {
    // Column: opaque at the foot, fading to nothing at the top (v = 1 is the top row).
    columnTexture: gradient((ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }),
    // Spark: soft round dot.
    sparkTexture: gradient((ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }),
    outerRing: new THREE.RingGeometry(0.62, 0.7, 48).rotateX(-Math.PI / 2),
    innerRing: new THREE.RingGeometry(0.36, 0.4, 6).rotateX(-Math.PI / 2), // hexagon: the seal's inner mark
    disc: new THREE.CircleGeometry(0.62, 48).rotateX(-Math.PI / 2),
    column: new THREE.CylinderGeometry(0.42, 0.5, COLUMN_HEIGHT, 24, 1, true).translate(0, COLUMN_HEIGHT / 2, 0),
  };
  return shared;
}

/** The soft round spark sprite, shared with other one-shot effects. */
export const sparkTexture = () => sharedResources().sparkTexture;

const glow = (color, extra = {}) => new THREE.MeshBasicMaterial({
  color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...extra,
});

const easeOut = (x) => 1 - (1 - x) ** 3;

export class SummoningPortal {
  /** @param {THREE.Vector3} position  point on the ground  @param {number} color  hex */
  constructor(scene, position, color) {
    const res = sharedResources();
    this.age = 0;
    this.group = new THREE.Group();
    this.group.position.copy(position).setY(0.04);

    this.ringMaterial = glow(color);
    this.discMaterial = glow(color, { opacity: 0 });
    this.columnMaterial = glow(color, { map: res.columnTexture });
    this.outer = new THREE.Mesh(res.outerRing, this.ringMaterial);
    this.inner = new THREE.Mesh(res.innerRing, this.ringMaterial);
    this.disc = new THREE.Mesh(res.disc, this.discMaterial);
    this.column = new THREE.Mesh(res.column, this.columnMaterial);
    this.group.add(this.disc, this.outer, this.inner, this.column);

    // Sparks start on the seal and spiral upwards.
    this.sparkSeeds = Array.from({ length: SPARK_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.45,
      rise: 1.2 + Math.random() * 2.4,
      swirl: (Math.random() - 0.5) * 3,
      delay: Math.random() * 0.45,
    }));
    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARK_COUNT * 3), 3));
    this.sparkMaterial = new THREE.PointsMaterial({
      color, size: 0.16, map: res.sparkTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.sparks = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.sparks.frustumCulled = false; // positions change every frame
    this.group.add(this.sparks);

    scene.add(this.group);
    this.update(0);
  }

  /** Advance the effect; returns false once it has finished (then call dispose). */
  update(dt) {
    this.age += dt;
    const t = Math.min(this.age / DURATION, 1);
    const fade = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;

    // Seal: snaps open, turns slowly.
    const open = easeOut(Math.min(t / 0.25, 1));
    this.outer.scale.setScalar(0.3 + open * 0.9);
    this.inner.scale.setScalar(0.3 + open * 0.9);
    this.inner.rotation.y = this.age * 1.6;
    this.outer.rotation.y = -this.age * 0.6;
    this.ringMaterial.opacity = fade;
    this.discMaterial.opacity = 0.35 * open * fade;

    // Column: shoots up, then narrows as it fades.
    const rise = easeOut(Math.min(t / 0.3, 1));
    this.column.scale.set(1 - t * 0.6, rise, 1 - t * 0.6);
    this.columnMaterial.opacity = 0.85 * fade;

    const positions = this.sparkGeometry.attributes.position.array;
    this.sparkSeeds.forEach((seed, i) => {
      const life = Math.max(0, this.age - seed.delay);
      const angle = seed.angle + life * seed.swirl;
      const radius = seed.radius * (1 - Math.min(life, 1) * 0.5);
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = life * seed.rise;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    });
    this.sparkGeometry.attributes.position.needsUpdate = true;
    this.sparkMaterial.opacity = fade;

    return t < 1;
  }

  dispose() {
    this.group.removeFromParent();
    this.sparkGeometry.dispose();
    for (const m of [this.ringMaterial, this.discMaterial, this.columnMaterial, this.sparkMaterial]) m.dispose();
  }
}
