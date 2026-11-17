// Hover and click on things in the court (figures, the drum pavilion).
// Any object whose ancestor carries `userData.pick` is a target.
import * as THREE from 'three';

const DRAG_TOLERANCE = 5; // px: beyond this a press is a camera drag, not a click

export function attachPointerPicking(canvas, camera, getTargets, { onHover, onPick }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pressedAt = null;
  let hovered = null;

  function pickAt(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(getTargets(), true)[0];
    for (let node = hit?.object; node; node = node.parent) {
      if (node.userData.pick) return node.userData.pick;
    }
    return null;
  }

  function setHover(pick) {
    if (pick?.kind === hovered?.kind && pick?.id === hovered?.id) return;
    hovered = pick;
    canvas.style.cursor = pick ? 'pointer' : '';
    onHover(pick);
  }

  canvas.addEventListener('pointermove', (event) => { if (!pressedAt) setHover(pickAt(event)); });
  canvas.addEventListener('pointerleave', () => setHover(null));
  // Only a primary (left) press can pick: right drag zooms and middle drag turns the view.
  canvas.addEventListener('pointerdown', (event) => { pressedAt = event.button === 0 ? { x: event.clientX, y: event.clientY } : null; });
  canvas.addEventListener('pointerup', (event) => {
    if (!pressedAt) return;
    const moved = Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y);
    pressedAt = null;
    if (moved > DRAG_TOLERANCE) return;
    const pick = pickAt(event);
    if (pick) onPick(pick);
  });
}
