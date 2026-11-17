// Renderer, camera, light and the frame loop for the court.
import * as THREE from 'three';
import { createCameraRig } from './court-camera-rig.js';
import { CameraFocusEase } from './camera-focus-ease.js';
import { RenderCostGovernor } from './render-cost-governor.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} stage  the element the canvas fills
 * @param {import('../worlds/world-pack-contract.js').WorldEnvironment} environment  the world's sky, haze, lights, shadows and camera
 */
export function createCourtScene(canvas, stage, environment) {
  const { camera: cameraSpec, shadows } = environment;
  // A 2D world draws at 1/pixelScale of the screen and the canvas is scaled up without smoothing: crisp, chunky pixels.
  const pixelScale = cameraSpec.pixelScale ?? 0;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !pixelScale });
  canvas.classList.toggle('is-pixelated', Boolean(pixelScale));
  const pixelRatio = (saver) => (pixelScale ? 1 / pixelScale : saver ? 1 : Math.min(window.devicePixelRatio, 1.5));
  renderer.setPixelRatio(pixelRatio(false)); // beyond this the extra pixels cost more than they show
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.autoUpdate = false; // redrawn on demand, see RenderCostGovernor
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Keeps the lacquer red and glaze yellow true to the palette; a pixel world's colours are exactly what it painted.
  renderer.toneMapping = pixelScale ? THREE.NoToneMapping : THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(environment.background);
  scene.fog = new THREE.Fog(environment.background, ...environment.fog); // haze: far ground melts into the sky's horizon

  const { camera, controls, resize: fitCamera } = createCameraRig(canvas, cameraSpec);

  const { hemi, sun: sunSpec, rim: rimSpec } = environment;
  scene.add(new THREE.HemisphereLight(hemi.sky, hemi.ground, hemi.intensity));
  const sun = new THREE.DirectionalLight(sunSpec.color, sunSpec.intensity);
  sun.position.set(...sunSpec.position);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  // Rim light from behind the hall, low and warm: picks out the figures' outlines against the paving.
  const rim = new THREE.DirectionalLight(rimSpec.color, rimSpec.intensity);
  rim.position.set(...rimSpec.position);
  scene.add(rim);

  const governor = new RenderCostGovernor(canvas, cameraSpec.fps);
  controls.addEventListener('change', () => governor.markActive()); // dragging, zooming, damping
  const focus = new CameraFocusEase(camera, controls, governor); // glides to the scribe whose terminal is open

  function resize() {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    fitCamera(width, height);
    // Resizing clears the canvas: draw again at once, and keep drawing while the layout settles.
    governor.markActive();
    renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const projected = new THREE.Vector3();
  /** World point -> stage pixel position, or null when behind the camera. */
  function toScreen(world) {
    projected.copy(world).project(camera);
    if (projected.z > 1) return null;
    return { x: (projected.x * 0.5 + 0.5) * stage.clientWidth, y: (-projected.y * 0.5 + 0.5) * stage.clientHeight };
  }

  /** `onFrame(dt, time)` runs once per drawn frame; `dt` is the real time since the last one. */
  function start(onFrame) {
    const timer = new THREE.Timer();
    timer.connect(document); // a hidden tab is not a time step either
    // A lost and restored GL context must be redrawn even if the court is holding still.
    canvas.addEventListener('webglcontextrestored', () => governor.markActive());
    const loop = (now) => { // `now`: the frame's own timestamp, steadier than reading the clock here
      if (governor.tier(now) === 'still') {
        // Nothing to draw: stop the loop altogether (no wake-ups at display rate) until needed.
        renderer.setAnimationLoop(null);
        governor.sleepUntilNeeded(() => {
          timer.reset(); // the sleep is not a time step: motion resumes where it stopped
          renderer.setAnimationLoop(loop);
        });
        return;
      }
      controls.update(); // cheap; lets damping finish and raises 'change' while the view moves
      if (!governor.frameDue(now)) return;
      const began = performance.now();
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.25); // room for a late frame; a sleep counts as one step
      focus.update(dt);
      onFrame(dt, timer.getElapsed());
      if (governor.shadowsDue(now)) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      governor.noteFrameCost(performance.now() - began);
    };
    renderer.setAnimationLoop(loop);
  }

  let saverOn = false;
  let shadowsNow = shadows;
  /**
   * Power saver: no shadows and a plain pixel ratio (fewer pixels to fill), at lower frame
   * rates. Turning shadows on or off recompiles the materials once; a world without shadows
   * never does.
   */
  function setPowerSaver(on) {
    if (on === saverOn) return;
    saverOn = on;
    const shadowsOn = shadows && !on; // a world without shadows never gets them back
    renderer.shadowMap.enabled = shadowsOn;
    sun.castShadow = shadowsOn;
    renderer.setPixelRatio(pixelRatio(on));
    if (shadowsOn !== shadowsNow) {
      shadowsNow = shadowsOn;
      scene.traverse((child) => {
        if (!child.material) return;
        for (const material of [].concat(child.material)) material.needsUpdate = true;
      });
    }
    if (shadowsOn) renderer.shadowMap.needsUpdate = true;
    governor.setSaver(on);
    resize();
  }

  /** What drawing costs right now: for checking the budget from the console. */
  function cost() {
    const { calls, triangles } = renderer.info.render;
    return { tier: governor.tier(), ...governor.measured(), calls, triangles };
  }

  return { scene, camera, controls, renderer, governor, focus, toScreen, start, cost, setPowerSaver };

}
