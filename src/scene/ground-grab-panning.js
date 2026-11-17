// Drag-to-pan that grabs the ground: the patch of paving under the cursor when the button
// goes down stays under the cursor for the whole drag, at any tilt and with either camera,
// and the view stops the moment the mouse stops (no easing, no coasting).
// OrbitControls' own pan is screen-scaled and damped, so on a tilted view it drifts from the cursor.
import * as THREE from 'three';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // the paving, y = 0

/**
 * @param {HTMLCanvasElement} canvas
 * @param {THREE.Camera} camera
 * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} controls  its own pan must be off for `buttons`
 * @param {number[]} buttons  mouse buttons (event.button) that pan
 */
export function enableGroundGrabPanning(canvas, camera, controls, buttons) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const grabbed = new THREE.Vector3(); // the ground point held by the cursor
  const under = new THREE.Vector3();
  let pointerId = null;

  /** The ground point under the pointer, or null when the pointer is above the horizon. */
  function groundAt(event, out) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    camera.updateMatrixWorld(); // several moves may arrive between two drawn frames
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(GROUND, out);
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (pointerId !== null || event.pointerType !== 'mouse' || !buttons.includes(event.button) || !controls.enabled) return;
    if (!groundAt(event, grabbed)) return;
    pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId);
    controls.dispatchEvent({ type: 'start' }); // cancels a focus glide, like any other drag
  });

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId || !groundAt(event, under)) return;
    // Slide camera and target together by the step that puts the grabbed point back under the cursor.
    under.subVectors(grabbed, under).setY(0);
    controls.target.add(under);
    camera.position.add(under);
    controls.update(); // raises 'change': keeps the view over the court and wakes the renderer
  });

  const release = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    controls.dispatchEvent({ type: 'end' });
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}
