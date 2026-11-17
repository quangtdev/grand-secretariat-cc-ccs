// The "edict" of the office: the manager folds an order into a paper plane that glides over the
// floor to an employee. One flight, one plane: it owns its geometry and frees it through
// `userData.dispose` when the flight ends (scene/royal-edict-flight.js). The nose points to -x,
// which the engine turns along the flight path; the engine spins it about x, so the plane
// rolls round its own flight axis ('YXZ' makes that x the turned one).
import * as THREE from 'three';

const LENGTH = 0.62;
let planeMaterial;

/** Triangles (a, b, c, colour) of a folded dart: two wings meeting at a keel. */
function planeGeometry() {
  const n = -LENGTH / 2; // nose
  const t = LENGTH / 2; // tail
  const wing = LENGTH * 0.3;
  const triangles = [
    [[n, 0, 0], [t, 0.04, 0], [t, 0.08, -wing], 0xffffff], // right wing, upper
    [[n, 0, 0], [t, 0.04, 0], [t, 0.08, wing], 0xe4ebf0], // left wing, upper
    [[n, 0, 0], [t, 0.04, 0], [t * 0.9, -0.12, 0], 0xb7c4cf], // keel
  ];
  const positions = [];
  const colours = [];
  const colour = new THREE.Color();
  for (const [a, b, c, hex] of triangles) {
    positions.push(...a, ...b, ...c);
    colour.set(hex);
    for (let i = 0; i < 3; i++) colours.push(colour.r, colour.g, colour.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function buildOfficePaperPlane() {
  planeMaterial ??= new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, flatShading: true });
  const plane = new THREE.Mesh(planeGeometry(), planeMaterial);
  plane.rotation.order = 'YXZ';
  plane.userData.dispose = () => plane.geometry.dispose();
  return plane;
}
