// Run with: npm run prepare:race
// The Blender export stays untouched; web and mobile variants are generated.
import { stat, writeFile, rename } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions'
import { cloneDocument, dedup, flatten, join, meshopt, resample, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer/encoder'
import { MeshoptDecoder } from 'meshoptimizer/decoder'
import { MeshoptSimplifier } from 'meshoptimizer/simplifier'
import sharp from 'sharp'
import { Matrix4, Quaternion, Vector3 } from 'three'

const media = new URL('../public/media/race/', import.meta.url)
const input = fileURLToPath(new URL('race.glb', media))
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
})
const document = await io.read(input)
// Report a repeated warning once (tiled UVs intentionally stay unquantized).
const warnings = new Set()
const logger = document.getLogger()
document.setLogger({
  debug: () => {}, info: () => {}, error: (message) => logger.error(message),
  warn: (message) => {
    if (!warnings.has(message)) { warnings.add(message); logger.warn(message) }
  },
})

function groupRigidParts(document) {
  const root = document.getRoot()
  if (root.listSkins().length) throw new Error('This preparation script expects rigid car animation, not a skinned model.')
  const animated = new Set(root.listAnimations().flatMap((animation) =>
    animation.listChannels().map((channel) => channel.getTargetNode())))
  // Put static parts directly under their nearest moving parent. The standard
  // flatten transform leaves all descendants of animated cars nested deeply.
  for (const node of root.listNodes()) {
    if (!node.getMesh() || animated.has(node)) continue
    let parent = node.getParentNode()
    while (parent && !animated.has(parent)) parent = parent.getParentNode()
    if (!parent || parent === node.getParentNode()) continue
    const parentMatrix = new Matrix4().fromArray(parent.getWorldMatrix())
    if (Math.abs(parentMatrix.determinant()) < 1e-12) continue
    const matrix = parentMatrix.invert().multiply(new Matrix4().fromArray(node.getWorldMatrix()))
    const position = new Vector3(), rotation = new Quaternion(), scale = new Vector3()
    matrix.decompose(position, rotation, scale)
    const composed = new Matrix4().compose(position, rotation, scale)
    // A sheared matrix cannot be represented by glTF translation/rotation/scale.
    if (matrix.elements.some((value, i) => !Number.isFinite(composed.elements[i]) || Math.abs(value - composed.elements[i]) > 1e-5)) continue
    parent.addChild(node)
    node.setMatrix(matrix.toArray())
  }
}

function countPrimitives(doc) {
  return doc.getRoot().listNodes().reduce((sum, node) =>
    sum + (node.getMesh()?.listPrimitives().length ?? 0), 0)
}

const before = { bytes: (await stat(input)).size, primitives: countPrimitives(document) }
console.log('Preparing race scene. This can take a few minutes on the first run.')
await document.transform(
  dedup(),
  // Animated parents and their descendants stay in their original hierarchy.
  flatten(),
  groupRigidParts,
  join({ filter: (node) => node.getMesh()?.listPrimitives().every((primitive) => {
    const material = primitive.getMaterial()
    // Keep glass pieces separate so transparent surfaces can still be sorted.
    return material?.getAlphaMode() !== 'BLEND' && !material?.getExtension('KHR_materials_transmission')
  }) ?? false }),
  weld(),
  resample(),
)

for (const profile of ['web', 'mobile']) {
  const variant = cloneDocument(document)
  if (profile === 'mobile') {
    await variant.transform(
      // Preserve boundaries and limit geometric error. This is intentionally lossy.
      simplify({ simplifier: MeshoptSimplifier, ratio: .5, error: .0005, lockBorder: true }),
      textureCompress({ encoder: sharp, resize: [512, 512] }),
    )
  }
  // Lossless WebP can be larger than PNG. Keep whichever is smaller.
  for (const texture of variant.getRoot().listTextures()) {
    const original = texture.getImage()
    if (!original) continue
    const webp = await sharp(original).webp({ lossless: true, effort: 6 }).toBuffer()
    if (webp.byteLength >= original.byteLength) continue
    texture.setImage(webp).setMimeType('image/webp').setURI('')
    variant.createExtension(EXTTextureWebP).setRequired(true)
  }
  // Geometry compression also requires the matching decoder in createRaceViewer.
  await variant.transform(meshopt({
    encoder: MeshoptEncoder, level: 'medium',
    quantizePosition: profile === 'mobile' ? 14 : 16,
    quantizeNormal: profile === 'mobile' ? 10 : 12,
    quantizeTexcoord: profile === 'mobile' ? 12 : 14,
  }))
  const bytes = await io.writeBinary(variant)
  const output = fileURLToPath(new URL(`race-${profile}.glb`, media))
  // Finish the file before replacing a previous generated version.
  await writeFile(`${output}.tmp`, bytes)
  await rename(`${output}.tmp`, output)
  console.log(JSON.stringify({
    profile, before,
    after: { bytes: bytes.byteLength, primitives: countPrimitives(variant) },
    reduction: `${(100 * (1 - bytes.byteLength / before.bytes)).toFixed(1)}%`,
  }, null, 2))
}

for (const name of ['race-poster', 'race-viewport-poster']) {
  await sharp(fileURLToPath(new URL(`${name}.png`, media)))
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(fileURLToPath(new URL(`${name}.webp`, media)))
}
