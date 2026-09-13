import {
  AnimationMixer, Box3, BufferGeometry, InstancedMesh, LoopOnce,
  Material, Mesh, Skeleton, SkinnedMesh, Sphere, Texture, Vector3,
} from 'three'
import type { AnimationClip, Object3D } from 'three'

export function validateGlb(buffer: ArrayBuffer) {
  if (buffer.byteLength < 20) throw new Error('The model file is empty or incomplete.')
  const header = new DataView(buffer)
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2) {
    throw new Error('Expected a binary glTF 2.0 file. Check the GLB export and its path.')
  }
  if (header.getUint32(8, true) !== buffer.byteLength) {
    throw new Error('The GLB download is incomplete.')
  }
}

export function selectRaceAnimations(clips: AnimationClip[], names: string[]) {
  if (names.length === 0) return clips.slice(0, 1)
  return [...new Set(names)].map((name) => {
    const clip = clips.find((item) => item.name === name)
    if (!clip) throw new Error(`Animation "${name}" was not found in the GLB.`)
    return clip
  })
}

export function createScenePlayback(root: Object3D, clips: AnimationClip[]) {
  const mixer = new AnimationMixer(root)
  const duration = Math.max(0, ...clips.map((clip) => clip.duration))
  const actions = clips.map((clip) => {
    const action = mixer.clipAction(clip)
    action.setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    return action.play()
  })
  let time = 0
  let playing = false

  function seek(seconds: number) {
    time = Math.max(0, Math.min(duration, seconds))
    // Reset releases actions that were clamped at the end of an earlier play.
    for (const action of actions) action.reset().play()
    mixer.setTime(time)
    root.updateMatrixWorld(true)
  }
  seek(0)

  return {
    duration,
    get time() { return time },
    get playing() { return playing },
    play() {
      if (duration <= 0) return
      if (time >= duration) seek(0)
      playing = true
    },
    pause() { playing = false },
    restart() { seek(0); playing = duration > 0 },
    update(seconds: number) {
      if (!playing) return
      const step = Math.min(Math.max(0, seconds), duration - time)
      mixer.update(step)
      time += step
      if (time >= duration) playing = false
    },
    bounds() {
      const box = new Box3()
      const savedTime = time
      // Sample the path so the opening camera includes moving cars as well as their start.
      for (let index = 0; index <= (duration > 0 ? 12 : 0); index++) {
        seek(duration > 0 ? duration * index / 12 : 0)
        box.union(new Box3().setFromObject(root, true))
      }
      seek(savedTime)
      return box
    },
    dispose() {
      playing = false
      mixer.stopAllAction()
      mixer.uncacheRoot(root)
    },
  }
}

export function cameraFrame(bounds: Box3, aspect: number, verticalFov: number) {
  const sphere = bounds.getBoundingSphere(new Sphere())
  if (bounds.isEmpty() || !Number.isFinite(sphere.radius) || sphere.radius <= 0) {
    throw new Error('No visible mesh bounds were found in this scene.')
  }
  const verticalHalf = verticalFov * Math.PI / 360
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * Math.max(.1, aspect))
  const distance = sphere.radius / Math.sin(Math.min(verticalHalf, horizontalHalf)) * 1.15
  const direction = new Vector3(1, .65, 1).normalize()
  return {
    center: sphere.center,
    position: sphere.center.clone().addScaledVector(direction, distance),
    distance,
    near: Math.max(.0001, sphere.radius / 1000),
    far: Math.max(100, distance * 100),
  }
}

// GLTF scenes may share GPU resources. Dispose each resource and bitmap once.
export function disposeSceneObjects(roots: Object3D[]) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const skeletons = new Set<Skeleton>()
  const instances = new Set<InstancedMesh>()
  const images = new Set<ImageBitmap>()

  for (const root of roots) root.traverse((object) => {
    if (object instanceof Mesh) {
      geometries.add(object.geometry)
      const list = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of list) materials.add(material)
    }
    if (object instanceof SkinnedMesh) skeletons.add(object.skeleton)
    if (object instanceof InstancedMesh) instances.add(object)
  })
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof Texture) textures.add(value)
    }
  }
  for (const texture of textures) {
    const data: unknown = texture.source.data
    if (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) images.add(data)
    texture.dispose()
  }
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  for (const skeleton of skeletons) skeleton.dispose()
  for (const instance of instances) instance.dispose()
  for (const bitmap of images) bitmap.close()
}
