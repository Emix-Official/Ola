import { readOrientation, relativeTilt, smoothTilt, TILT_SETTINGS } from './tiltMath'
import type { Quaternion, Tilt } from './tiltMath'

export type TiltStatus =
  | 'idle' | 'requesting' | 'calibrating' | 'active' | 'paused'
  | 'denied' | 'unavailable' | 'unsupported' | 'insecure' | 'reduced'

type OrientationAPI = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

function getScreenAngle() {
  const legacy = (window as Window & { orientation?: number }).orientation
  return window.screen.orientation?.angle ?? legacy ?? 0
}

export function createCoreMotion(
  scene: HTMLDivElement,
  onStatus: (status: TiltStatus) => void,
) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let disposed = false
  let deviceEnabled = false
  let inView = true
  let listening = false
  let requestVersion = 0
  let neutral: Quaternion | null = null
  let current: Tilt = { x: 0, y: 0 }
  let target: Tilt = { x: 0, y: 0 }
  let frame: number | null = null
  let lastFrame: number | null = null
  let sensorTimeout: number | undefined

  function availableStatus(): TiltStatus {
    if (reducedMotion.matches) return 'reduced'
    if (!window.isSecureContext) return 'insecure'
    if (typeof window.DeviceOrientationEvent === 'undefined') return 'unsupported'
    return 'idle'
  }

  function canMove() {
    return !disposed && !reducedMotion.matches && inView && !document.hidden
  }

  function resetMotion() {
    if (frame !== null) window.cancelAnimationFrame(frame)
    frame = null
    lastFrame = null
    current = { x: 0, y: 0 }
    target = { x: 0, y: 0 }
    for (const property of ['--tilt-x', '--tilt-y', '--light-x', '--light-y']) {
      scene.style.removeProperty(property)
    }
  }

  function draw(now: number) {
    frame = null
    if (!canMove()) return
    const elapsed = lastFrame === null ? 1000 / 60 : Math.min(64, now - lastFrame)
    lastFrame = now
    current = smoothTilt(current, target, elapsed)
    const settled = Math.abs(current.x - target.x) + Math.abs(current.y - target.y) < 0.01
    if (settled) current = { ...target }
    scene.style.setProperty('--tilt-x', `${current.x.toFixed(3)}deg`)
    scene.style.setProperty('--tilt-y', `${current.y.toFixed(3)}deg`)
    scene.style.setProperty('--light-x', `${50 + current.y / TILT_SETTINGS.maxAngle * 18}%`)
    scene.style.setProperty('--light-y', `${50 - current.x / TILT_SETTINGS.maxAngle * 18}%`)
    if (!settled) frame = window.requestAnimationFrame(draw)
    else lastFrame = null
  }

  function moveTo(next: Tilt) {
    target = next
    if (frame === null && canMove()) frame = window.requestAnimationFrame(draw)
  }

  function stopSensor() {
    window.removeEventListener('deviceorientation', handleOrientation)
    window.clearTimeout(sensorTimeout)
    sensorTimeout = undefined
    listening = false
    neutral = null
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    if (!deviceEnabled || !canMove()) return
    const reading = readOrientation(event.alpha, event.beta, event.gamma, getScreenAngle())
    if (!reading) return
    if (!neutral) {
      neutral = reading
      window.clearTimeout(sensorTimeout)
      sensorTimeout = undefined
      onStatus('active')
    }
    moveTo(relativeTilt(neutral, reading))
  }

  function syncSensor() {
    if (!deviceEnabled || !canMove()) {
      stopSensor()
      resetMotion()
      if (deviceEnabled) onStatus('paused')
      return
    }
    if (listening) return
    listening = true
    onStatus('calibrating')
    window.addEventListener('deviceorientation', handleOrientation, { passive: true })
    // An exposed API does not guarantee that usable sensor readings will arrive.
    sensorTimeout = window.setTimeout(() => {
      deviceEnabled = false
      stopSensor()
      resetMotion()
      onStatus('unavailable')
    }, 4500)
  }

  async function enableDeviceTilt() {
    if (disposed) return
    const availability = availableStatus()
    if (availability !== 'idle') {
      onStatus(availability)
      return
    }
    const version = ++requestVersion
    onStatus('requesting')
    try {
      const api = window.DeviceOrientationEvent as OrientationAPI
      // Called by a click handler, before any unrelated await loses user activation.
      const permission = api.requestPermission ? await api.requestPermission() : 'granted'
      if (disposed || version !== requestVersion || reducedMotion.matches) return
      if (permission !== 'granted') {
        onStatus('denied')
        return
      }
      deviceEnabled = true
      syncSensor()
    } catch {
      if (!disposed && version === requestVersion) onStatus('denied')
    }
  }

  function disableDeviceTilt() {
    requestVersion += 1
    deviceEnabled = false
    stopSensor()
    moveTo({ x: 0, y: 0 })
    onStatus(availableStatus())
  }

  function recenter() {
    if (!deviceEnabled) return
    stopSensor()
    moveTo({ x: 0, y: 0 })
    syncSensor()
  }

  function handlePreferenceChange() {
    requestVersion += 1
    deviceEnabled = false
    stopSensor()
    resetMotion()
    onStatus(availableStatus())
  }

  function handleVisibilityChange() { syncSensor() }
  function handleScreenChange() { if (deviceEnabled) recenter() }

  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(
    ([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.1
      if (visible === inView) return
      inView = visible
      syncSensor()
    },
    { threshold: [0, 0.1] },
  )
  observer?.observe(scene)
  reducedMotion.addEventListener('change', handlePreferenceChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  if (window.screen.orientation) {
    window.screen.orientation.addEventListener('change', handleScreenChange)
  } else {
    window.addEventListener('orientationchange', handleScreenChange)
  }
  onStatus(availableStatus())

  return {
    enableDeviceTilt,
    disableDeviceTilt,
    recenter,
    pointerMove(clientX: number, clientY: number, pointerType: string) {
      if (pointerType !== 'mouse' || deviceEnabled || !canMove()) return
      const bounds = scene.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const x = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width))
      const y = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height))
      moveTo({ x: (0.5 - y) * 10, y: (x - 0.5) * 12 })
    },
    pointerLeave(pointerType: string) {
      if (pointerType === 'mouse' && !deviceEnabled) moveTo({ x: 0, y: 0 })
    },
    dispose() {
      disposed = true
      requestVersion += 1
      deviceEnabled = false
      stopSensor()
      resetMotion()
      observer?.disconnect()
      reducedMotion.removeEventListener('change', handlePreferenceChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.screen.orientation?.removeEventListener('change', handleScreenChange)
      window.removeEventListener('orientationchange', handleScreenChange)
    },
  }
}
