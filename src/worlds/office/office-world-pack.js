// The modern office world: a glass-walled head office in 3D. Every agent is an employee at a
// desk with a monitor, sub-agents are contractors with laptops, the manager watches from the
// glass corner office, movers carry the desks, and a paper plane carries an order. Wires the
// world's pieces into the contract (../world-pack-contract.js).
import { OFFICE } from './office-palette.js';
import { buildOfficeEmployeeBody } from './office-employee-body.js';
import { buildOfficeManagerBody } from './office-manager-body.js';
import { buildOfficeContractorBody, buildOfficeMoverBody } from './office-contractor-and-mover-bodies.js';
import { OfficeDeskWorkplace } from './office-desk-workplace.js';
import { buildOfficePaperPlane } from './office-paper-plane.js';
import { buildOfficeStage } from './office-stage.js';
import { officeAudio } from './office-audio-cues.js';
import { officeVocabulary } from './office-vocabulary.js';

/** @type {import('../world-pack-contract.js').WorldPack} */
export const world = {
  id: 'office',
  label: 'Modern office',
  environment: {
    background: OFFICE.sky, // pale haze: the far towers melt into the sky
    fog: [46, 120],
    hemi: { sky: 0xf2f8fc, ground: 0xb8b2a6, intensity: 1.9 },
    sun: { color: 0xfff6e6, intensity: 1.6, position: [-14, 22, 10] },
    rim: { color: 0xeaf3ff, intensity: 0.6, position: [8, 9, -24] },
    shadows: false, // soft daylight, no shadow map: calm and cheap
    camera: { type: 'perspective' },
  },
  palette: { ring: OFFICE.ticket, pool: 0xfff0c8, portalSummon: OFFICE.teal, portalDismiss: OFFICE.report, edictTrail: 0xdfe9f0 },
  audio: officeAudio,
  vocabulary: officeVocabulary,
  buildStage: buildOfficeStage,
  bodies: {
    agent: buildOfficeEmployeeBody,
    ruler: buildOfficeManagerBody,
    helper: () => buildOfficeContractorBody(),
    porter: buildOfficeMoverBody,
    workplace: (slot) => new OfficeDeskWorkplace(slot),
    edictProjectile: buildOfficePaperPlane,
  },
};

export default world;
