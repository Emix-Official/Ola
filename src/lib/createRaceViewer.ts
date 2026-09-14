import {
  ACESFilmicToneMapping, Box3, Color, PerspectiveCamera, PMREMGenerator,
  Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import type { Object3D, WebGLRenderTarget } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'meshoptimizer/decoder'
import type { RaceSceneConfig } from '../data/raceScene'
import { downloadGlb } from './downloadGlb'
import type { DownloadProgress } from './downloadGlb'
import {
  boundsOfObjects, cameraFrame, createScenePlayback, disposeSceneObjects,
  selectRaceAnimations,
} from './raceSceneTools'

export type ViewerState = {
  phase: 'loading' | 'downloading' | 'preparing' | 'ready' | 'error'
  playing: boolean
  hasAnimation: boolean
  progress: DownloadProgress | null
  view: 'cars' | 'scene'
  canFocusCars: boolean
  touch: boolean
  interacting: boolean
}

export function createRaceViewer(
  host: HTMLDivElement,
  config: RaceSceneConfig,
  onState: (state: ViewerState) => void,
) {
  const touch = window.matchMedia('(pointer: coarse)').matches
  let phase: ViewerState['phase'] = 'loading'
  let progress: DownloadProgress | null = null
  let view: ViewerState['view'] = 'cars'
  let interacting = !touch
  let disposed = false
  let playback: ReturnType<typeof createScenePlayback> | undefined
  let focusObjects: Object3D[] = []

  function publish() {
    if (disposed) return
    onState({
      phase, progress, view, touch, interacting,
      canFocusCars: focusObjects.length === config.focusNodeNames.length && focusObjects.length > 0,
      playing: playback?.playing ?? false,
      hasAnimation: (playback?.duration ?? 0) > 0,
    })
  }

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ antialias: !touch, powerPreference: 'low-power' })
  } catch {
    phase = 'error'
    publish()
    return null
  }

  const canvas = renderer.domElement
  canvas.className = 'race-scene-canvas'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', config.description)
  host.append(canvas)
  const pixelRatio = touch ? config.mobilePixelRatio : config.maxPixelRatio
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.max(1, pixelRatio)))
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
  canvas.style.touchAction = 'pan-y'

  let inView = true
  let drawing = false
  let frame: number | null = null
  let lastTime: number | null = null
  let modelScenes: Object3D[] = []
  let sceneBounds = new Box3()
  let followingBounds = new Box3()
  const focusBounds = new Box3()
  const focusCenter = new Vector3()
  const previousCenter = new Vector3()
  const followOffset = new Vector3()
  let environment: WebGLRenderTarget | undefined
  const abort = new AbortController()

  function updateInteraction() {
    controls.enabled = phase === 'ready' && interacting
    canvas.style.touchAction = controls.enabled ? 'none' : 'pan-y'
    canvas.classList.toggle('is-interactive', controls.enabled)
  }

  function canDraw() { return !disposed && phase === 'ready' && inView && !document.hidden }

  function cancelFrame() {
    if (frame !== null) window.cancelAnimationFrame(frame)
    frame = null
    lastTime = null
  }

  function requestDraw() {
    if (!drawing && frame === null && canDraw()) frame = window.requestAnimationFrame(draw)
  }

  function followCars() {
    if (view !== 'cars') return
    boundsOfObjects(focusObjects, focusBounds).getCenter(focusCenter)
    followOffset.copy(focusCenter).sub(previousCenter)
    // Move the target and camera together, preserving the visitor's orbit/zoom.
    camera.position.add(followOffset)
    controls.target.add(followOffset)
    previousCenter.copy(focusCenter)
  }

  function draw(now: number) {
    frame = null
    if (!canDraw()) return
    drawing = true
    const delta = lastTime === null ? 0 : Math.min(.1, (now - lastTime) / 1000)
    lastTime = now
    const wasPlaying = playback?.playing ?? false
    playback?.update(delta)
    if (wasPlaying) followCars()
    const changed = controls.update()
    renderer.render(scene, camera)
    drawing = false
    if (wasPlaying !== (playback?.playing ?? false)) publish()
    if (playback?.playing || changed) requestDraw()
    else lastTime = null
  }

  function resetView() {
    if (phase !== 'ready' || disposed) return
    const center = boundsOfObjects(focusObjects, focusBounds).getCenter(focusCenter)
    const bounds = view === 'cars' ? followingBounds.clone().translate(center) : sceneBounds
    if (bounds.isEmpty()) return
    const fit = cameraFrame(bounds, camera.aspect, camera.fov)
    // Flush leftover damping before restoring the camera.
    const damping = controls.enableDamping
    controls.enableDamping = false
    controls.update()
    camera.position.copy(fit.position)
    camera.near = fit.near
    camera.far = Math.max(fit.far, sceneBounds.getSize(new Vector3()).length() * 4)
    camera.updateProjectionMatrix()
    controls.target.copy(fit.center)
    previousCenter.copy(fit.center)
    controls.minDistance = fit.distance * .15
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
    // Mobile browser toolbars resize the viewport. Keep the chosen camera view.
    requestDraw()
  }

  function suspend() {
    playback?.pause()
    if (touch) interacting = false
    updateInteraction()
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
    phase = 'error'
    abort.abort()
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
      const source = touch ? config.mobileSrc : config.src
      const relative = `${import.meta.env.BASE_URL}${source.replace(/^\/+/, '')}`
      const url = new URL(relative, window.location.href)
      phase = 'downloading'
      publish()
      let lastProgress = -Infinity
      const bytes = await downloadGlb(url, abort.signal, (next) => {
        progress = next
        if (performance.now() - lastProgress >= 150 || next.loaded === next.total) {
          publish()
          lastProgress = performance.now()
        }
      })
      if (disposed || abort.signal.aborted) return
      phase = 'preparing'
      publish()
      // Let React paint the preparing state before geometry decoding starts.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
      if (disposed || abort.signal.aborted) return

      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      const gltf = await loader.parseAsync(bytes, new URL('.', url).href)
      if (disposed || abort.signal.aborted) {
        disposeSceneObjects(gltf.scenes)
        return
      }
      modelScenes = gltf.scenes
      scene.add(gltf.scene)
      playback = createScenePlayback(gltf.scene, selectRaceAnimations(gltf.animations, config.animationNames))
      sceneBounds = playback.bounds()
      focusObjects = config.focusNodeNames.flatMap((name) => {
        const object = gltf.scene.getObjectByName(name)
        return object ? [object] : []
      })
      if (focusObjects.length !== config.focusNodeNames.length || !focusObjects.length) view = 'scene'
      else followingBounds = playback.bounds(focusObjects, true)

      const room = new RoomEnvironment()
      const pmrem = new PMREMGenerator(renderer)
      try { environment = pmrem.fromScene(room) }
      finally { room.dispose(); pmrem.dispose() }
      scene.environment = environment.texture
      scene.environmentIntensity = .8
      // Upload and compile before removing the poster. No automatic race playback.
      await renderer.compileAsync(scene, camera)
      if (disposed || abort.signal.aborted) return
      phase = 'ready'
      updateInteraction()
      resetView()
      renderer.render(scene, camera)
      publish()
      requestDraw()
    } catch (error) {
      if (disposed) return
      console.warn('MarkOS race scene:', error)
      phase = 'error'
      suspend()
    }
  }
  void loadScene()

  return {
    togglePlayback() {
      if (!canDraw() || !playback) return
      if (playback.playing) playback.pause()
      else playback.play()
      followCars()
      publish()
      requestDraw()
    },
    restart() {
      if (!canDraw() || !playback) return
      playback.restart()
      followCars()
      publish()
      requestDraw()
    },
    setView(next: ViewerState['view']) {
      if (!canDraw() || (next === 'cars' && focusObjects.length !== config.focusNodeNames.length)) return
      view = next
      resetView()
      publish()
    },
    toggleInteraction() {
      if (!canDraw()) return
      interacting = !interacting
      updateInteraction()
      publish()
    },
    resetView,
    rotate(direction: -1 | 1) {
      if (!canDraw()) return
      const offset = camera.position.clone().sub(controls.target)
      offset.applyAxisAngle(new Vector3(0, 1, 0), direction * Math.PI / 12)
      camera.position.copy(controls.target).add(offset)
      controls.update()
      requestDraw()
    },
    zoom(direction: -1 | 1) {
      if (!canDraw()) return
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
