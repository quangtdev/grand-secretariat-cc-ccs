// Small ambient touches, too faint to compete with a petition, so they keep going while
// one waits: incense smoke rising from the bronze urns, frangipani petals drifting down
// from the two old garden trees, and a pair of dragonflies darting over the lotus pond.
// All of it is hidden under reduced motion.
import * as THREE from 'three';
import { GARDEN_TREE_SCALE, GARDEN_TREES, PALETTE, POND, URN_RIM_HEIGHT, URNS } from './court-layout.js';
import { sparkTexture } from './summoning-portal-effect.js';

const SMOKE_PER_URN = 8;
const SMOKE_LIFE = 4; // seconds from rim to gone
const PETALS_PER_TREE = 5;
const PETAL_REST = 3; // seconds a petal lies on the paving before it fades
const DRAGONFLIES = 2;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const between = (low, high) => low + Math.random() * (high - low);

/**
 * Smoke: soft grey puffs that rise, swell, sway in a slow draught and fade. All puffs are
 * one draw call: points with their own size and opacity (a few lines of shader).
 */
function createSmoke(group) {
  const count = URNS.length * SMOKE_PER_URN;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { map: { value: sparkTexture() }, colour: { value: new THREE.Color(PALETTE.mist) }, viewHeight: { value: 800 } },
    vertexShader: `
      attribute float aSize; attribute float aAlpha; uniform float viewHeight; varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * projectionMatrix[1][1] * viewHeight * 0.5 / -mv.z; // world size to pixels
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 colour; varying float vAlpha;
      void main() {
        gl_FragColor = vec4(colour, texture2D(map, gl_PointCoord).a * vAlpha);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // positions change every frame
  group.add(points);

  const puffs = URNS.flatMap((urn) => Array.from({ length: SMOKE_PER_URN }, (_, i) => (
    { urn, age: (i / SMOKE_PER_URN) * SMOKE_LIFE, drift: Math.random() * Math.PI * 2 })));
  return (dt, time) => {
    material.uniforms.viewHeight.value = window.innerHeight * Math.min(window.devicePixelRatio, 1.5);
    puffs.forEach((puff, i) => {
      puff.age += dt;
      if (puff.age > SMOKE_LIFE) { puff.age %= SMOKE_LIFE; puff.drift = Math.random() * Math.PI * 2; }
      const t = puff.age / SMOKE_LIFE;
      positions[i * 3] = puff.urn.x + Math.sin(time * 0.4 + puff.drift) * t * 0.5;
      positions[i * 3 + 1] = URN_RIM_HEIGHT + t * 1.7;
      positions[i * 3 + 2] = puff.urn.z + Math.cos(time * 0.3 + puff.drift) * t * 0.3;
      sizes[i] = 0.25 + t * 0.9;
      alphas[i] = 0.32 * Math.sin(Math.PI * t); // fade in from the rim, out at the top
    });
    for (const name of ['position', 'aSize', 'aAlpha']) geometry.attributes[name].needsUpdate = true;
  };
}

/**
 * Petals: small pale planes spiralling down from a crown, resting a moment, then shrinking
 * away. One instanced mesh: every petal in a single draw call.
 */
function createPetals(group) {
  const colors = [PALETTE.paper, 0xf6e7a8]; // frangipani: white with a yellow heart
  const crownHeight = 2.6 * GARDEN_TREE_SCALE; // inside the broadleaf crown (court-surroundings.js: 1.9-2.7 before scaling)
  const count = GARDEN_TREES.length * PETALS_PER_TREE;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.08), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), count);
  mesh.frustumCulled = false; // instances are spread over the yard
  group.add(mesh);
  const pose = new THREE.Object3D(); // scratch: one petal's position, turn and size
  const petals = GARDEN_TREES.flatMap((tree) => Array.from({ length: PETALS_PER_TREE }, (_, i) => {
    const petal = { tree, position: new THREE.Vector3(), rest: 0, spin: between(1, 3), phase: Math.random() * 10 };
    respawn(petal, crownHeight * Math.random()); // spread out so they do not all fall together
    return petal;
  }));
  petals.forEach((_, i) => mesh.setColorAt(i, new THREE.Color(colors[i % 2])));

  function respawn(petal, height = crownHeight) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 1.1; // within the crown, so a petal never pops into view
    petal.position.set(petal.tree.x + Math.cos(angle) * radius, height, petal.tree.z + Math.sin(angle) * radius);
    petal.rest = 0;
  }

  return (dt, time) => {
    petals.forEach((petal, i) => {
      const { position } = petal;
      let size = 1;
      if (position.y > 0.02) {
        position.y = Math.max(0.02, position.y - 0.35 * dt);
        position.x += Math.sin(time * 1.3 + petal.phase) * 0.4 * dt;
        position.z += Math.cos(time * 1.1 + petal.phase) * 0.3 * dt;
        pose.rotation.set(time * petal.spin, time * petal.spin * 0.7, 0);
      } else {
        pose.rotation.set(-Math.PI / 2, 0, petal.phase); // lying flat on the paving
        petal.rest += dt;
        size = petal.rest < PETAL_REST ? 1 : Math.max(0, 1 - (petal.rest - PETAL_REST));
        if (petal.rest > PETAL_REST + 1) respawn(petal);
      }
      pose.position.copy(position);
      pose.scale.setScalar(size);
      pose.updateMatrix();
      mesh.setMatrixAt(i, pose.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
}

/** Dragonflies: hover in place, then dart to a new spot over the pond. */
function createDragonflies(group) {
  const body = new THREE.BoxGeometry(0.03, 0.03, 0.26);
  const wing = new THREE.PlaneGeometry(0.34, 0.05).rotateX(-Math.PI / 2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6f73, roughness: 0.4 });
  const wingMaterial = new THREE.MeshBasicMaterial({ color: 0xe6f0ee, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const halfX = POND.width / 2;
  const halfZ = POND.depth / 2;
  const spot = (target) => target.set(POND.center.x + between(-halfX, halfX), between(0.6, 1.2), POND.center.z + between(-halfZ, halfZ));

  const flies = Array.from({ length: DRAGONFLIES }, () => {
    const fly = new THREE.Group();
    fly.add(new THREE.Mesh(body, bodyMaterial));
    const wings = [0.04, -0.03].map((z) => {
      const w = new THREE.Mesh(wing, wingMaterial);
      w.position.z = z;
      fly.add(w);
      return w;
    });
    group.add(fly);
    spot(fly.position);
    return { fly, wings, from: new THREE.Vector3(), to: fly.position.clone(), hold: between(0.5, 2), dash: 0 };
  });

  return (dt, time) => {
    for (const d of flies) {
      d.wings.forEach((w, i) => { w.rotation.z = Math.sin(time * 60 + i) * 0.35; }); // a blur of wingbeats
      if (d.hold > 0) {
        d.hold -= dt;
        d.fly.position.y = d.to.y + Math.sin(time * 9) * 0.02; // hovering in place (d.to is where it last landed)
        if (d.hold <= 0) { d.from.copy(d.fly.position); spot(d.to); d.dash = 0; }
        continue;
      }
      d.dash = Math.min(1, d.dash + dt / 0.5);
      d.fly.position.lerpVectors(d.from, d.to, 1 - (1 - d.dash) ** 3);
      d.fly.rotation.y = Math.atan2(d.to.x - d.from.x, d.to.z - d.from.z);
      if (d.dash >= 1) d.hold = between(1, 2);
    }
  };
}

/** Adds the effects to the scene; returns the per-frame step. */
export function createAmbientParticles(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const steps = [createSmoke(group), createPetals(group), createDragonflies(group)];
  group.traverse((part) => { part.castShadow = false; });
  return {
    update(dt, time) {
      group.visible = !reducedMotion.matches;
      if (group.visible) for (const step of steps) step(dt, time);
    },
  };
}
