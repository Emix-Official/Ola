import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import {
  AnimationClip, Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial,
  Sphere, Texture, Vector3, VectorKeyframeTrack,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'meshoptimizer/decoder'
import { boundsOfObjects, cameraFrame, createScenePlayback, disposeSceneObjects, selectRaceAnimations, validateGlb } from '../src/lib/raceSceneTools.ts'
import { downloadGlb } from '../src/lib/downloadGlb.ts'

const media = new URL('../public/media/race/', import.meta.url)
const names = ['LOD_A_CHASSIS_mm_chassis', 'Sketchfab_model', 'Sketchfab_model001']

function modelJSON(bytes) {
  return JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)))
}
function triangleCount(json) {
  return json.nodes.reduce((sum, node) => sum + (node.mesh === undefined ? 0 :
    json.meshes[node.mesh].primitives.reduce((count, primitive) => count +
      (primitive.indices === undefined ? json.accessors[primitive.attributes.POSITION].count : json.accessors[primitive.indices].count) / 3, 0)), 0)
}
async function parseGeometry(bytes) {
  // Node has no browser image decoder. Keep the real Meshopt/GLTF geometry and
  // animation loaders; validate actual image files separately with Sharp below.
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).register((parser) => {
    parser.loadTextureImage = async () => new Texture()
    return { name: 'CPU_TEST_TEXTURE', loadTexture: async () => new Texture() }
  })
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
}
function validHeader() {
  const bytes = new Uint8Array(20)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0x46546c67, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, 20, true)
  return bytes
}

test('HTML and incomplete model responses are rejected', () => {
  assert.throws(() => validateGlb(new TextEncoder().encode('<!doctype html><html></html>').buffer), /binary glTF/)
  const bytes = validHeader()
  new DataView(bytes.buffer).setUint32(8, 100, true)
  assert.throws(() => validateGlb(bytes.buffer), /incomplete/)
})

test('animation selection handles combined clips and rejects missing names', () => {
  const clips = [new AnimationClip('Scene', 2, []), new AnimationClip('Camera', 2, [])]
  assert.deepEqual(selectRaceAnimations(clips, []), [clips[0]])
  assert.deepEqual(selectRaceAnimations(clips, ['Camera', 'Camera']), [clips[1]])
  assert.throws(() => selectRaceAnimations(clips, ['missing']), /not found/)
})

test('following bounds track the group size, preserve playback state, and restart from the end', () => {
  const root = new Group()
  const mesh = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial())
  mesh.name = 'car'
  root.add(mesh)
  const clip = new AnimationClip('race', 2, [new VectorKeyframeTrack('car.position', [0, 2], [0, 0, 0, 100, 0, 0])])
  const playback = createScenePlayback(root, [clip])
  playback.play()
  playback.update(1)
  assert.ok(Math.abs(playback.bounds().getSize(new Vector3()).x - 102) < 1e-6)
  assert.ok(Math.abs(playback.bounds([mesh], true).getSize(new Vector3()).x - 2) < 1e-6)
  assert.equal(playback.time, 1)
  assert.equal(playback.playing, true)
  assert.ok(Math.abs(mesh.position.x - 50) < 1e-6)
  playback.update(1)
  assert.equal(playback.playing, false)
  playback.restart()
  assert.equal(playback.time, 0)
  assert.equal(mesh.position.x, 0)
  playback.dispose()
  disposeSceneObjects([root])
})

test('downloads report real progress, handle missing length, and reject cancellation', async (context) => {
  const bytes = validHeader()
  let response
  context.mock.method(globalThis, 'fetch', async () => response)
  const signal = new AbortController().signal
  response = new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } })
  await assert.rejects(downloadGlb(new URL('https://example.test/race.glb'), signal, () => {}), /webpage/)
  response = new Response('', { status: 404 })
  await assert.rejects(downloadGlb(new URL('https://example.test/race.glb'), signal, () => {}), /404/)
  for (const knownLength of [true, false]) {
    response = new Response(new ReadableStream({ start(controller) {
      controller.enqueue(bytes.slice(0, 8))
      controller.enqueue(bytes.slice(8))
      controller.close()
    } }), { headers: knownLength ? { 'Content-Length': '20' } : {} })
    const updates = []
    const result = await downloadGlb(new URL('https://example.test/race.glb'), signal, (next) => updates.push(next))
    assert.equal(result.byteLength, 20)
    assert.equal(updates[0].total, knownLength ? 20 : null)
    assert.deepEqual(updates.at(-1), { loaded: 20, total: 20 })
    assert.ok(updates.every((item, i) => !i || item.loaded >= updates[i - 1].loaded))
  }
  const abort = new AbortController()
  response = new Response(bytes)
  await assert.rejects(downloadGlb(new URL('https://example.test/race.glb'), abort.signal, () => abort.abort()), { name: 'AbortError' })
})

test('web and mobile assets preserve all three car paths and fit the following camera', async () => {
  const sourceBytes = await readFile(new URL('race.glb', media))
  const sourceJSON = modelJSON(sourceBytes)
  const source = await parseGeometry(sourceBytes)
  const originalPlayback = createScenePlayback(source.scene, selectRaceAnimations(source.animations, []))
  const samples = Array.from({ length: 25 }, (_, i) => originalPlayback.duration * i / 24)
  const reference = samples.map((time) => {
    originalPlayback.restart()
    originalPlayback.update(time)
    source.scene.updateMatrixWorld(true)
    return names.map((name) => new Box3().setFromObject(source.scene.getObjectByName(name), true))
  })

  for (const profile of ['web', 'mobile']) {
    const bytes = await readFile(new URL(`race-${profile}.glb`, media))
    const json = modelJSON(bytes)
    const model = await parseGeometry(bytes)
    const playback = createScenePlayback(model.scene, selectRaceAnimations(model.animations, []))
    assert.ok(bytes.length < sourceBytes.length * (profile === 'web' ? .4 : .25))
    assert.equal(playback.duration, originalPlayback.duration)
    assert.equal(json.materials.length, sourceJSON.materials.length)
    assert.equal(json.extensions.KHR_lights_punctual.lights.length, sourceJSON.extensions.KHR_lights_punctual.lights.length)
    assert.equal(json.animations[0].channels.length, sourceJSON.animations[0].channels.length)
    if (profile === 'web') assert.equal(triangleCount(json), triangleCount(sourceJSON))
    else assert.ok(triangleCount(json) < triangleCount(sourceJSON) * .8)
    const objects = names.map((name) => {
      const object = model.scene.getObjectByName(name)
      assert.ok(object, `Missing car: ${name}`)
      return object
    })
    const followingBounds = playback.bounds(objects, true)
    for (let i = 0; i < samples.length; i++) {
      playback.restart()
      playback.update(samples[i])
      model.scene.updateMatrixWorld(true)
      for (let car = 0; car < objects.length; car++) {
        const box = new Box3().setFromObject(objects[car], true)
        assert.ok(box.min.distanceTo(reference[i][car].min) < .02, `${profile}, car ${car}, frame ${i}: minimum moved`)
        assert.ok(box.max.distanceTo(reference[i][car].max) < .02, `${profile}, car ${car}, frame ${i}: maximum moved`)
      }
      const group = boundsOfObjects(objects)
      const center = group.getCenter(new Vector3())
      // Use a sphere fit to guarantee the group fits from any orbit angle.
      const fit = cameraFrame(followingBounds.clone().translate(center), 4 / 3, 40)
      const visibleRadius = fit.distance * Math.sin(20 * Math.PI / 180)
      assert.ok(group.getBoundingSphere(new Sphere()).radius < visibleRadius)
    }
    // Decode every embedded texture. A broken image should fail before delivery.
    const jsonLength = bytes.readUInt32LE(12)
    const binaryStart = 20 + jsonLength + 8
    for (const image of json.images) {
      const view = json.bufferViews[image.bufferView]
      const start = binaryStart + (view.byteOffset ?? 0)
      const data = bytes.subarray(start, start + view.byteLength)
      const { info } = await sharp(data).raw().toBuffer({ resolveWithObject: true })
      assert.ok(info.width > 0 && info.height > 0)
      if (profile === 'mobile') assert.ok(info.width <= 512 && info.height <= 512)
    }
    console.log(`${profile}: ${(bytes.length / 1e6).toFixed(2)} MB, ${triangleCount(json).toLocaleString('en-US')} triangles; 25 animation samples and ${json.images.length} textures verified.`)
    playback.dispose()
    disposeSceneObjects(model.scenes)
  }
  originalPlayback.dispose()
  disposeSceneObjects(source.scenes)
})
