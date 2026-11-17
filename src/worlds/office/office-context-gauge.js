// The office's ink gauge: a battery-style level strip lying along the back edge of the desk top,
// where the isometric camera sees it from either side of the room (a monitor screen faces away
// from it). The fill (soft white on a dark track) drains as the employee's context fills
// (`setInk(left)`, 0..1). Built once per desk; an update only rescales the fill mesh. Neutral
// colours, never a status colour (DESIGN.md, The Same Signal Rule).
import * as THREE from 'three';

const LENGTH = 1.1; // along the desk's long side (z)
const WIDTH = 0.085;
const EDGE_X = 0.23; // behind the monitor, at the desk's back edge
let trackMaterial;
let fillMaterial;

/** @param {number} top  desk surface height */
export function buildOfficeContextGauge(top) {
  trackMaterial ??= new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.5 });
  fillMaterial ??= new THREE.MeshBasicMaterial({ color: 0xf3f1ec });
  const group = new THREE.Group();
  group.position.set(EDGE_X, top, 0);
  const track = new THREE.Mesh(new THREE.BoxGeometry(WIDTH + 0.02, 0.014, LENGTH + 0.03), trackMaterial);
  track.position.y = 0.007;
  // Fill anchored at its +z end (the sticky-note side), so it drains towards the far end.
  const fill = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, 0.01, LENGTH).translate(0, 0, -LENGTH / 2), fillMaterial);
  fill.position.set(0, 0.016, LENGTH / 2);
  group.add(track, fill);
  return {
    object: group,
    setInk(left) {
      fill.scale.z = Math.max(left, 0.001); // a zero scale would make the matrix singular
      fill.visible = left > 0.001;
    },
    dispose() {
      group.removeFromParent();
      track.geometry.dispose();
      fill.geometry.dispose();
    },
  };
}
