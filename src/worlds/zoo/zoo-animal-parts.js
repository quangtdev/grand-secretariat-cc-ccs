// Small shape helpers for the zoo's bodies: everything is a rounded blob, a stub or a tube,
// toon-shaded in flat colours (scene/figure-toon-style.js) and baked into very few meshes.
import * as THREE from 'three';
import { part, toon } from '../../scene/figure-toon-style.js';

const unitSphere = new THREE.SphereGeometry(1, 14, 10);

/** An ellipsoid with radii (rx, ry, rz) at (x, y, z). */
export function blob(color, [rx, ry, rz], x = 0, y = 0, z = 0) {
  return part(unitSphere.clone().scale(rx, ry, rz), toon(color), x, y, z);
}

/** A (tapered) cylinder, optionally tilted (`tilt` = [rotationX, rotationZ]). */
export function stub(color, rTop, rBottom, height, x = 0, y = 0, z = 0, tilt = [0, 0]) {
  const mesh = part(new THREE.CylinderGeometry(rTop, rBottom, height, 8), toon(color), x, y, z);
  mesh.rotation.set(tilt[0], 0, tilt[1]);
  return mesh;
}

/** A cone pointing up (`tilt` as for stub): horns, beaks, tusks. */
export function spike(color, radius, height, x = 0, y = 0, z = 0, tilt = [0, 0]) {
  const mesh = part(new THREE.ConeGeometry(radius, height, 8), toon(color), x, y, z);
  mesh.rotation.set(tilt[0], 0, tilt[1]);
  return mesh;
}

/** A tube of constant radius through `points` (tails, trunks), with an optional round tip. */
export function tube(color, points, radius, tipColor = null) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  group.add(part(new THREE.TubeGeometry(curve, 12, radius, 6), toon(color)));
  const end = points.at(-1);
  group.add(part(unitSphere.clone().scale(radius * 1.5, radius * 1.5, radius * 1.5), toon(tipColor ?? color), ...end));
  return group;
}

/** Both of a pair: calls `make(side)` for -1 and +1 and returns the meshes. */
export const pair = (make) => [-1, 1].map(make);
