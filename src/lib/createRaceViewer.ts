import {
  ACESFilmicToneMapping, Box3, Color, PerspectiveCamera, PMREMGenerator,
  Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import type { Object3D, WebGLRenderTarget } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { RaceSceneConfig } from '../data/raceScene'
import {
  cameraFrame, createScenePlayback, disposeSceneObjects,
  selectRaceAnimations, validateGlb,
} from './raceSceneTools'

export type ViewerState = {
  phase: 'loading' | 'ready' | 'error'
  playing: boolean
  hasAnimation: boolean
}

export function createRaceViewer(
  host: HTMLDivElement,
  config: RaceSceneConfig,
  onState: (state: ViewerState) => void,
) {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
  } catch {
    onState({ phase: 'error', playing: false, hasAnimation: false })
    return null
  }

  const canvas = renderer.domElement
  canvas.className = 'race-scene-canvas'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', config.description)
  host.append(canvas)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.max(1, config.maxPixelRatio)))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping

  const scene = new Scene()
  scene.background = new Color('#080808')
  const camera = new PerspectiveCamera(40, 1, .01, 1000)
  const controls = new OrbitControls(camera, canvas)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  controls.enableDamping = !reducedMotion.matches
  controls.dampingFactor = .1
  controls.enablePan = false
  controls.minPolarAngle = .08
  controls.maxPolarAngle = Math.PI - .08
  controls.enabled = false

  let disposed = false
  let failed = false
  let ready = false
  let inView = true
  let drawing = false
  let frame: number | null = null
  let lastTime: number | null = null
  let modelScenes: Object3D[] = []
  let playback: ReturnType<typeof createScenePlayback> | undefined
  let bounds = new Box3()
  let environment: WebGLRenderTarget | undefined
  const abort = new AbortController()

  function publish() {
    if (disposed) return
    onState({
      phase: failed ? 'error' : ready ? 'ready' : 'loading',
      playing: playback?.playing ?? false,
      hasAnimation: (playback?.duration ?? 0) > 0,
    })
  }

  function canDraw() { return !disposed && !failed && inView && !document.hidden }

  function cancelFrame() {
    if (frame !== null) window.cancelAnimationFrame(frame)
    frame = null
    lastTime = null
  }

  function requestDraw() {
    if (!drawing && frame === null && canDraw()) frame = window.requestAnimationFrame(draw)
  }

  function draw(now: number) {
    frame = null
    if (!canDraw()) return
    drawing = true
    const delta = lastTime === null ? 0 : Math.min(.05, (now - lastTime) / 1000)
    lastTime = now
    const wasPlaying = playback?.playing ?? false
    playback?.update(delta)
    const changed = controls.update()
    renderer.render(scene, camera)
    drawing = false
    if (wasPlaying !== (playback?.playing ?? false)) publish()
    if (playback?.playing || changed) requestDraw()
    else lastTime = null
  }

  function resetView() {
    if (bounds.isEmpty() || disposed) return
    const fit = cameraFrame(bounds, camera.aspect, camera.fov)
    // Flush leftover damping before restoring the camera.
    const damping = controls.enableDamping
    controls.enableDamping = false
    controls.update()
    camera.position.copy(fit.position)
    camera.near = fit.near
    camera.far = fit.far
    camera.updateProjectionMatrix()
    controls.target.copy(fit.center)
    controls.minDistance = fit.distance * .08
    controls.maxDistance = fit.distance * 5
    controls.update()
    controls.enableDamping = damping
    requestDraw()
  }

  function resize() {
    if (disposed) return
    const width = Math.max(1, host.clientWidth)
    const height = Math.max(1, host.clientHeight)
    camera.aspect = width / height
    renderer.setSize(width, height, false)
    camera.updateProjectionMatrix()
    if (ready) resetView()
    requestDraw()
  }

  function suspend() {
    playback?.pause()
    cancelFrame()
    publish()
  }

  function handleVisibility() {
    if (document.hidden) suspend()
    else requestDraw()
  }

  function handleMotionPreference() {
    controls.enableDamping = !reducedMotion.matches
    if (reducedMotion.matches) suspend()
    requestDraw()
  }

  function handleContextLoss(event: Event) {
    event.preventDefault()
    failed = true
    abort.abort()
    controls.enabled = false
    suspend()
  }

  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= .1
      if (!inView) suspend()
      else requestDraw()
    },
    { threshold: [0, .1] },
  )
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
  observer?.observe(host)
  resizeObserver?.observe(host)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', handleVisibility)
  reducedMotion.addEventListener('change', handleMotionPreference)
  canvas.addEventListener('webglcontextlost', handleContextLoss)
  controls.addEventListener('change', requestDraw)
  resize()
  publish()

  async function loadScene() {
    try {
      const relative = `${import.meta.env.BASE_URL}${config.src.replace(/^\/+/, '')}`
      const url = new URL(relative, window.location.href)
      const response = await fetch(url, { signal: abort.signal })
      if (!response.ok) throw new Error(`GLB request failed (${response.status}).`)
      const bytes = await response.arrayBuffer()
      validateGlb(bytes)
      if (disposed) return

      // The first version expects a GLB with embedded, uncompressed assets.
      const gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', url).href)
      if (disposed || failed) {
        disposeSceneObjects(gltf.scenes)
        return
      }
      modelScenes = gltf.scenes
      scene.add(gltf.scene)
      playback = createScenePlayback(gltf.scene, selectRaceAnimations(gltf.animations, config.animationNames))
      bounds = playback.bounds()

      // A small studio environment gives reflective car materials something to reflect.
      const room = new RoomEnvironment()
      const pmrem = new PMREMGenerator(renderer)
      try { environment = pmrem.fromScene(room) }
      finally { room.dispose(); pmrem.dispose() }
      scene.environment = environment.texture
      scene.environmentIntensity = .8
      ready = true
      controls.enabled = true
      resetView()
      publish()
      requestDraw()
    } catch (error) {
      if (disposed) return
      console.warn('MarkOS race scene:', error)
      failed = true
      controls.enabled = false
      suspend()
    }
  }
  void loadScene()

  return {
    togglePlayback() {
      if (!ready || !canDraw() || !playback) return
      if (playback.playing) playback.pause()
      else playback.play()
      publish()
      requestDraw()
    },
    restart() {
      if (!ready || !canDraw() || !playback) return
      playback.restart()
      publish()
      requestDraw()
    },
    resetView,
    rotate(direction: -1 | 1) {
      if (!ready || !canDraw()) return
      const offset = camera.position.clone().sub(controls.target)
      offset.applyAxisAngle(new Vector3(0, 1, 0), direction * Math.PI / 12)
      camera.position.copy(controls.target).add(offset)
      controls.update()
      requestDraw()
    },
    zoom(direction: -1 | 1) {
      if (!ready || !canDraw()) return
      const offset = camera.position.clone().sub(controls.target)
      const distance = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * (direction < 0 ? .8 : 1.25)))
      offset.setLength(distance)
      camera.position.copy(controls.target).add(offset)
      controls.update()
      requestDraw()
    },
    dispose() {
      disposed = true
      abort.abort()
      cancelFrame()
      observer?.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      reducedMotion.removeEventListener('change', handleMotionPreference)
      canvas.removeEventListener('webglcontextlost', handleContextLoss)
      controls.removeEventListener('change', requestDraw)
      controls.dispose()
      playback?.dispose()
      disposeSceneObjects(modelScenes)
      environment?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
