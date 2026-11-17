// Merges scenery that never moves into a few meshes, so a building or a wood costs a
// handful of draw calls instead of hundreds. Use only on groups that are static
// and are not pointer targets.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const plainMaterials = new Map();
/** One shared vertex-coloured material per finish: glossy (lacquer, glaze, bronze) or matt (stone, wood, leaves). */
function plainMaterial(glossy) {
  if (!plainMaterials.has(glossy)) {
    plainMaterials.set(glossy, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: glossy ? 0.4 : 0.9, flatShading: true }));
  }
  return plainMaterials.get(glossy);
}

/** A plain-coloured standard material: nothing about it but its colour and finish needs keeping. */
function isPlain(m) {
  return m.isMeshStandardMaterial && !m.map && !m.transparent && !m.vertexColors && m.flatShading
    && m.side === THREE.FrontSide && m.metalness === 0 && m.emissive.getHex() === 0;
}

/**
 * Plain-coloured parts are merged across materials: their colours go into the vertices and
 * they share one material per finish, so a whole building is two or three draw calls.
 * Textured, transparent or otherwise special materials are merged per material.
 * @param {THREE.Object3D} group  @returns {THREE.Group} the merged replacement
 */
export function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const batches = new Map(); // key -> { material, castShadow, receiveShadow, renderOrder, geometries }
  const colour = new THREE.Color();
  group.traverse((node) => {
    if (!node.isMesh) return;
    const plain = isPlain(node.material);
    const glossy = node.material.roughness < 0.55;
    const key = `${plain ? `plain:${glossy}` : node.material.uuid}:${node.castShadow}:${node.receiveShadow}:${node.renderOrder}`;
    if (!batches.has(key)) {
      batches.set(key, {
        material: plain ? plainMaterial(glossy) : node.material,
        castShadow: node.castShadow, receiveShadow: node.receiveShadow, renderOrder: node.renderOrder, geometries: [],
      });
    }
    const geometry = (node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone()).applyMatrix4(node.matrixWorld);
    // Merging needs the same attributes everywhere: position and normal, plus colour (plain) or uv (textured).
    const keep = plain ? ['position', 'normal'] : ['position', 'normal', 'uv'];
    for (const name of Object.keys(geometry.attributes)) if (!keep.includes(name)) geometry.deleteAttribute(name);
    if (plain) {
      colour.copy(node.material.color);
      const colours = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0; i < colours.length; i += 3) colours.set([colour.r, colour.g, colour.b], i);
      geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    }
    batches.get(key).geometries.push(geometry);
    node.geometry.dispose();
  });

  const merged = new THREE.Group();
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries);
    if (!geometry) throw new Error('mergeStatic: parts of one material have different attributes');
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    mesh.renderOrder = batch.renderOrder;
    mesh.matrixAutoUpdate = false; // never moves: skip its matrix work every frame
    merged.add(mesh);
    batch.geometries.forEach((g) => g.dispose());
  }
  return merged;
}

/** Transform of `node` relative to its ancestor `root` (works before either is in the scene). */
function matrixRelativeTo(node, root) {
  const matrix = new THREE.Matrix4();
  for (let n = node; n && n !== root; n = n.parent) {
    n.updateMatrix();
    matrix.premultiply(n.matrix);
  }
  return matrix;
}

/**
 * Merges `meshes` (descendants of `root`, plain-coloured) into one mesh in `root`'s space,
 * their colours written into the vertices, drawn with `material` (which must have
 * `vertexColors: true`). The originals are removed and disposed. Returns the merged mesh,
 * not yet added anywhere.
 */
export function mergeAsVertexColours(meshes, root, material) {
  const colour = new THREE.Color();
  const pieces = meshes.map((node) => {
    const geometry = (node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone()).applyMatrix4(matrixRelativeTo(node, root));
    for (const name of Object.keys(geometry.attributes)) if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
    colour.copy(node.material.color);
    const colours = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colours.length; i += 3) colours.set([colour.r, colour.g, colour.b], i);
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    return geometry;
  });
  for (const node of meshes) { node.geometry.dispose(); node.removeFromParent(); }
  const mesh = new THREE.Mesh(mergeGeometries(pieces), material);
  pieces.forEach((g) => g.dispose());
  return mesh;
}
