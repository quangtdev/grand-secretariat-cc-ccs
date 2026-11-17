// Brings the scribe whose terminal is open forward in the frame: when an agent is opened
// the view glides to it and a little closer; when the dock closes it glides back to where
// the user had it. Any drag or scroll during a glide cancels it and keeps the user's view.
// A perspective camera also moves closer; an orthographic one (2D worlds) keeps its angle and zooms in.
import * as THREE from 'three';

const SECONDS = 0.6;
const FOCUS_DISTANCE = 17; // no further than this from a focused scribe
const FOCUS_ZOOM = 1.7; // orthographic: at least this close to a focused scribe
const TARGET_HEIGHT = 0.8;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const easeOut = (x) => 1 - (1 - x) ** 3;

export class CameraFocusEase {
  /** @param {THREE.Camera} camera  @param {OrbitControls} controls  @param {{markActive: () => void}} governor */
  constructor(camera, controls, governor) {
    this.camera = camera;
    this.controls = controls;
    this.governor = governor;
    this.home = null; // the user's own view, kept while a scribe is in focus
    this.glide = null; // { fromTarget, fromPosition, toTarget, toPosition, fromZoom, toZoom, t }
    this.offset = new THREE.Vector3();
    // The user takes the view in hand: stop gliding; once they actually move it (a drag or
    // a scroll, not a plain click), their view is the one to keep, so nothing is restored later.
    this.userInput = false;
    controls.addEventListener('start', () => { this.glide = null; this.userInput = true; });
    controls.addEventListener('end', () => { this.userInput = false; });
    controls.addEventListener('change', () => { if (this.userInput) this.home = null; });
  }

  /** Glide to look at a point in the yard (a scribe's place). */
  focusOn(point) {
    // Reopened while still gliding home: home is where that glide was heading, not the midpoint.
    this.home ??= this.glide?.returning ?? { target: this.controls.target.clone(), position: this.camera.position.clone(), zoom: this.camera.zoom };
    const target = new THREE.Vector3(point.x, TARGET_HEIGHT, point.z);
    this.offset.subVectors(this.camera.position, this.controls.target);
    if (this.camera.isOrthographicCamera) {
      const zoom = Math.min(Math.max(this.camera.zoom, FOCUS_ZOOM), this.controls.maxZoom);
      this.#glideTo(target, target.clone().add(this.offset), zoom);
      return;
    }
    const distance = Math.max(Math.min(this.offset.length(), FOCUS_DISTANCE), this.controls.minDistance);
    this.#glideTo(target, target.clone().addScaledVector(this.offset.normalize(), distance));
  }

  /** Glide back to the view the user had before the first focus. */
  release() {
    if (!this.home) return;
    this.#glideTo(this.home.target, this.home.position, this.home.zoom);
    this.glide.returning = this.home;
    this.home = null;
  }

  /** Call once per drawn frame. */
  update(dt) {
    const glide = this.glide;
    if (!glide) return;
    glide.t = reducedMotion.matches ? 1 : Math.min(glide.t + dt / SECONDS, 1);
    const k = easeOut(glide.t);
    this.controls.target.lerpVectors(glide.fromTarget, glide.toTarget, k);
    this.camera.position.lerpVectors(glide.fromPosition, glide.toPosition, k);
    if (glide.toZoom !== glide.fromZoom) {
      this.camera.zoom = glide.fromZoom + (glide.toZoom - glide.fromZoom) * k;
      this.camera.updateProjectionMatrix();
    }
    this.governor.markActive();
    if (glide.t >= 1) this.glide = null;
  }

  #glideTo(toTarget, toPosition, toZoom = this.camera.zoom) {
    this.glide = {
      fromTarget: this.controls.target.clone(), fromPosition: this.camera.position.clone(), toTarget, toPosition,
      fromZoom: this.camera.zoom, toZoom, t: 0,
    };
    this.governor.markActive();
  }
}
