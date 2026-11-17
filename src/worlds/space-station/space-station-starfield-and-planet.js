// The void around the station: a dome of stars (ONE Points draw, no per-frame work but a very slow
// turn), a big planet with a ring far below and behind the bridge, seen through the viewport. Both
// are unfogged: they are the far backdrop. The dome and the planet turn slowly
// except while a petition waits and under reduced motion (the Petition Holds Rule).
import * as THREE from 'three';
import { seeded } from '../../scene/court-surroundings.js';

const DOME_RADIUS = 150;
const STAR_COUNT = 1400;
const PLANET_AT = new THREE.Vector3(-14, -22, -88);
const PLANET_RADIUS = 24;

/** A radial dot, drawn once, so stars are soft round points rather than squares. */
function dotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

function buildStars() {
  const random = seeded(11);
  const positions = new Float32Array(STAR_COUNT * 3);
  const colours = new Float32Array(STAR_COUNT * 3);
  const tint = new THREE.Color();
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = random() * 2 - 1; // uniform on a sphere
    const angle = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - u * u);
    positions.set([Math.cos(angle) * ring * DOME_RADIUS, u * DOME_RADIUS, Math.sin(angle) * ring * DOME_RADIUS], i * 3);
    tint.setHSL(0.55 + random() * 0.15, 0.3 * random(), 0.55 + random() * 0.45).multiplyScalar(0.55 + random() * 0.45);
    colours.set([tint.r, tint.g, tint.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const material = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, map: dotTexture(), transparent: true, depthWrite: false, fog: false });
  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  stars.renderOrder = -2;
  return stars;
}

/** Banded planet: a canvas of soft latitude bands on a sphere, lit by baked shading, plus a tilted ring. */
function buildPlanet() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const random = seeded(4);
  const sky = ctx.createLinearGradient(0, 0, 0, 128);
  ['#2d5a8a', '#4d86b8', '#7bb0cf', '#3f739f', '#27507a'].forEach((stop, i, all) => sky.addColorStop(i / (all.length - 1), stop));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) { // cloud swirls
    ctx.fillStyle = `rgba(235, 245, 255, ${0.06 + random() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(random() * 256, random() * 128, 18 + random() * 40, 2 + random() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  group.position.copy(PLANET_AT);
  const body = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS, 40, 28), new THREE.MeshLambertMaterial({ map, fog: false, emissive: 0x0b1a2c }));
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(PLANET_RADIUS * 1.35, PLANET_RADIUS * 1.9, 64),
    new THREE.MeshBasicMaterial({ color: 0xb9c9d9, transparent: true, opacity: 0.35, side: THREE.DoubleSide, fog: false, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2 - 0.35;
  ring.rotation.y = 0.25;
  group.add(body, ring);
  return { group, body };
}

/** @returns {import('../world-pack-contract.js').AmbientLife} */
export function buildStarfieldAndPlanet(scene) {
  const stars = buildStars();
  const { group, body } = buildPlanet();
  scene.add(stars, group);
  let petition = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return {
    update: (dt) => {
      if (petition || reducedMotion.matches) return;
      stars.rotation.y += dt * 0.004;
      body.rotation.y += dt * 0.02;
    },
    settle: (value) => { petition = value; },
  };
}
