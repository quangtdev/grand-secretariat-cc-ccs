// The four body interfaces of a world pack (worlds/world-pack-contract.js) over a sprite sheet:
// the engine says what the figure is doing; these pick the clip and frame that shows it.
// Clips a sheet needs (front + back view of each, see sprite-figure-body.js):
//   scribe   walk, walkask (walking with the petition raised), sit (2 frames: brush at rest, brush
//            moving), kneel (2 frames: the petition held, then lifted), stand (jade tablet), bow
//   king     sit, stand, walk, point
//   soldier  stand, walk, thrust, bow          porter   walk (arms out to carry), bow
import { SpriteFigure, clipFrame } from './sprite-figure-body.js';

/**
 * @param {import('./sprite-figure-body.js').SpriteSheet} sheet
 * @param {{pixel: number, chip: {asking: number, upright: number, low: number}}} look
 *        chip: art rows from the feet to the top of the figure, per posture
 * @returns {import('../worlds/world-pack-contract.js').AgentBody}
 */
export function spriteAgentBody(sheet, { pixel, chip }) {
  const sprite = new SpriteFigure(sheet, pixel);
  let showing = 'sit'; // the clip playing: the chip follows the figure's actual height, not its status
  const low = (clip) => clip === 'sit' || clip === 'kneel';
  return {
    root: sprite.mesh,
    scale: 1, // the art is drawn at its world size
    chipHeight: (status) => sprite.heightOf(status === 'asking' ? chip.asking : low(showing) ? chip.low : chip.upright),
    animate(state) {
      const { clips } = sheet;
      let clip = 'sit';
      if (state.bow > 0.3) clip = 'bow';
      else if (state.moving) clip = state.status === 'asking' ? 'walkask' : 'walk';
      else if (state.pose === 'kneeling') clip = 'kneel';
      else if (state.pose === 'standing') clip = 'stand';
      // Brush moves only while working; the petition keeps lifting until it is answered.
      showing = clip;
      const resting = clip === 'sit' && !state.working;
      sprite.play(clip, resting ? 0 : clipFrame(clips[clip], 0, state.running ? 1.5 : 1));
    },
    dispose: () => sprite.dispose(),
  };
}

/** @returns {import('../worlds/world-pack-contract.js').RulerBody} */
export function spriteRulerBody(sheet, { pixel, handRows }) {
  const sprite = new SpriteFigure(sheet, pixel);
  return {
    root: sprite.mesh,
    scale: 1, // art pixels are the same size on everyone: no figure is drawn larger
    setPose() {}, // the pose arrives with every animate()
    animate(state) {
      const shown = state.pointing ? 'point' : state.pose === 'walking' ? 'walk' : state.pose === 'seated' ? 'sit' : 'stand';
      sprite.play(shown, clipFrame(sheet.clips[shown], 0, state.running ? 1.5 : 1));
    },
    // The raised hand: an edict leaves from there.
    handPosition: (out) => sprite.mesh.parent.localToWorld(out.set(0, sprite.heightOf(handRows), 0)),
    dispose: () => sprite.dispose(),
  };
}

/** @returns {import('../worlds/world-pack-contract.js').HelperBody} */
export function spriteHelperBody(sheet, { pixel }) {
  const sprite = new SpriteFigure(sheet, pixel);
  const phase = Math.random() * 4;
  return {
    root: sprite.mesh,
    scale: 1, // art pixels are the same size on everyone: no figure is drawn larger
    animate({ thrust, bow, bob }) {
      const clip = bow > 0.2 ? 'bow' : thrust > 0.3 ? 'thrust' : bob > 0 ? 'walk' : 'stand';
      sprite.play(clip, clip === 'walk' ? clipFrame(sheet.clips.walk, phase) : 0);
    },
    dispose: () => sprite.dispose(),
  };
}

/** @returns {import('../worlds/world-pack-contract.js').PorterBody} */
export function spritePorterBody(sheet, { pixel }) {
  const sprite = new SpriteFigure(sheet, pixel);
  return {
    root: sprite.mesh,
    scale: 1, // art pixels are the same size on everyone: no figure is drawn larger
    animate({ bow, bob }) {
      sprite.play(bow > 0.2 ? 'bow' : 'walk', bob > 0 && bow <= 0.2 ? clipFrame(sheet.clips.walk) : 0);
    },
  };
}
