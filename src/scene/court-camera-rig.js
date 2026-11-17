// The court's camera and the controls that move it. Two rigs, chosen by the world's
// `environment.camera` (see worlds/world-pack-contract.js):
//   perspective  the 3D worlds' camera: left drag turns the view, middle / right drag slides it.
//   orthographic the 2D worlds' camera, `view: 'isometric'`: a fixed yaw and pitch, a frustum that
//                holds the whole yard at zoom 1, pan and zoom only (no turning: sprites are drawn
//                for one view).
// Both keep the point the camera looks at over the court, so panning never loses the yard.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COURT_BOUNDS } from './court-layout.js';
import { enableGroundGrabPanning } from './ground-grab-panning.js';

// How far the view's centre may slide: well inside the walls, so the yard always fills most of the view.
const PAN_LIMIT = { x: COURT_BOUNDS.x * 0.7, north: COURT_BOUNDS.north + 3, south: COURT_BOUNDS.south - 2.5 };
const TARGET_HEIGHT = 0.8;

/** Isometric view: from the south-east, so the throne hall (north) rises at the top of the screen. */
export const ISO_VIEW = { yaw: Math.PI / 4, pitch: Math.PI / 6 }; // 30 degrees: tile diamonds are 2:1
const ISO_TARGET = new THREE.Vector3(0, TARGET_HEIGHT, -1.6);
const ISO_DISTANCE = 70;
const ISO_FIT_MARGIN = 1.02;
const YARD_TOP = 8; // the throne hall's ridge stands this high above the paving
const RIVER_REACH = 3; // the river strip beyond the south wall belongs to the picture

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('../worlds/world-pack-contract.js').WorldEnvironment['camera']} spec
 * @returns {{camera: THREE.Camera, controls: OrbitControls, resize: (width: number, height: number) => void}}
 */
export function createCameraRig(canvas, spec) {
  if (spec.type === 'perspective') return perspectiveRig(canvas);
  if (spec.type === 'orthographic' && spec.view === 'isometric') return isometricRig(canvas, spec);
  throw new Error(`createCourtScene: camera "${spec.type}" / view "${spec.view}" is not supported`);
}

/** Keeps the look-at point over the court; the camera is shifted by the same amount. */
function clampPanning(controls, camera) {
  const offset = new THREE.Vector3();
  controls.addEventListener('change', () => {
    const { target } = controls;
    const x = THREE.MathUtils.clamp(target.x, -PAN_LIMIT.x, PAN_LIMIT.x);
    const z = THREE.MathUtils.clamp(target.z, PAN_LIMIT.north, PAN_LIMIT.south);
    if (x === target.x && z === target.z && target.y === TARGET_HEIGHT) return;
    offset.set(x - target.x, TARGET_HEIGHT - target.y, z - target.z);
    target.add(offset);
    camera.position.add(offset);
  });
}

function perspectiveRig(canvas) {
  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 200);
  camera.position.set(0, 14.2, 26.5);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.8, 0.4);
  // Left drag slides the view across the yard, along the ground; right drag zooms (up/down);
  // middle drag turns the view. The wheel still zooms too.
  // Left drag is handled by the ground grab below (-1: OrbitControls ignores it).
  controls.mouseButtons = { LEFT: -1, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.DOLLY };
  controls.screenSpacePanning = false;
  enableGroundGrabPanning(canvas, camera, controls, [0]);
  canvas.addEventListener('mousedown', (event) => { if (event.button === 1) event.preventDefault(); }); // no autoscroll on middle-drag
  controls.enableDamping = true; // smooths zoom and turning; panning is the ground grab, undamped
  controls.minDistance = 11;
  controls.maxDistance = 40;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.3; // never below the yard
  controls.minAzimuthAngle = -0.75;
  controls.maxAzimuthAngle = 0.75;
  controls.update();
  clampPanning(controls, camera);

  return {
    camera,
    controls,
    resize(width, height) {
      camera.aspect = width / height;
      // Keep the whole yard in view when the stage gets narrow (dock open).
      camera.fov = camera.aspect < 1.25 ? 36 + (1.25 - camera.aspect) * 38 : 36;
      camera.updateProjectionMatrix();
    },
  };
}

/** Half the screen width and height (world units across the view plane) the whole yard needs around `target`. */
function isometricFit(target) {
  const { yaw, pitch } = ISO_VIEW;
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = new THREE.Vector3(-Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), -Math.cos(yaw) * Math.sin(pitch));
  let halfW = 0;
  let halfH = 0;
  const corner = new THREE.Vector3();
  const grow = (point) => {
    corner.copy(point).sub(target);
    halfW = Math.max(halfW, Math.abs(corner.dot(right)));
    halfH = Math.max(halfH, Math.abs(corner.dot(up)));
  };
  for (const x of [-COURT_BOUNDS.x, COURT_BOUNDS.x]) {
    for (const z of [COURT_BOUNDS.north, COURT_BOUNDS.south + RIVER_REACH]) grow(new THREE.Vector3(x, 0, z));
  }
  grow(new THREE.Vector3(0, YARD_TOP, COURT_BOUNDS.north + 3)); // the throne hall's roof is the highest thing
  return { halfW: halfW * ISO_FIT_MARGIN, halfH: halfH * ISO_FIT_MARGIN };
}

function isometricRig(canvas, spec) {
  const { yaw, pitch } = ISO_VIEW;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, ISO_DISTANCE * 3);
  const toCamera = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  camera.position.copy(ISO_TARGET).addScaledVector(toCamera, ISO_DISTANCE);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(ISO_TARGET);
  controls.enableRotate = false; // the sprites are drawn for this one view
  // No turning here: left / middle drag pans (the ground grab below), right drag and the wheel zoom.
  controls.mouseButtons = { LEFT: -1, MIDDLE: -1, RIGHT: THREE.MOUSE.DOLLY };
  controls.screenSpacePanning = false;
  enableGroundGrabPanning(canvas, camera, controls, [0, 1]);
  canvas.addEventListener('mousedown', (event) => { if (event.button === 1) event.preventDefault(); });
  controls.enableDamping = true; // smooths zoom and turning; panning is the ground grab, undamped
  [controls.minZoom, controls.maxZoom] = spec.zoom;
  controls.update();
  clampPanning(controls, camera);

  const fit = isometricFit(ISO_TARGET);
  return {
    camera,
    controls,
    resize(width, height) {
      const aspect = width / height;
      const halfH = Math.max(fit.halfH, fit.halfW / aspect); // the whole yard at zoom 1, whatever the shape
      camera.left = -halfH * aspect;
      camera.right = halfH * aspect;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    },
  };
}
