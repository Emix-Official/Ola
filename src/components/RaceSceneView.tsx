import { useEffect, useRef, useState } from 'react'
import { raceScene } from '../data/raceScene'
import { raceFilm } from '../data/raceFilm'
import type { createRaceViewer, ViewerState } from '../lib/createRaceViewer'
import '../styles/race-scene.css'

export default function RaceSceneView() {
  const hostRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createRaceViewer>>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ViewerState>({ phase: 'loading', playing: false, hasAnimation: false })

  useEffect(() => {
    const currentHost = hostRef.current
    if (!currentHost) return
    const host: HTMLDivElement = currentHost
    let disposed = false
    let controller: ReturnType<typeof createRaceViewer> = null

    async function start() {
      try {
        // The Three.js code is requested only when this view mounts.
        const module = await import('../lib/createRaceViewer')
        if (disposed) return
        controller = module.createRaceViewer(host, raceScene, setState)
        controllerRef.current = controller
      } catch (error) {
        if (!disposed) {
          console.warn('MarkOS 3D viewer:', error)
          setState({ phase: 'error', playing: false, hasAnimation: false })
        }
      }
    }
    void start()
    return () => {
      disposed = true
      controller?.dispose()
      controllerRef.current = null
    }
  }, [attempt])

  const ready = state.phase === 'ready'

  return (
    <div className="race-scene-view">
      <div className="race-scene-stage">
        <div ref={hostRef} className="race-scene-host" />
        {!ready && (
          <div className="race-scene-message">
            <p role="status">
              {state.phase === 'error' ? 'The 3D scene couldn’t open here.' : 'Opening the 3D scene…'}
            </p>
            {state.phase === 'error' && (
              <>
                {raceFilm.clips.length > 0 && <p>You can still watch the film.</p>}
                <button
                  type="button"
                  onClick={() => {
                    setState({ phase: 'loading', playing: false, hasAnimation: false })
                    setAttempt((value) => value + 1)
                  }}
                >
                  Retry 3D
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="race-scene-controls" role="group" aria-label="3D scene controls">
        {state.hasAnimation && (
          <>
            <button type="button" disabled={!ready} onClick={() => controllerRef.current?.togglePlayback()}>
              {state.playing ? 'Pause race' : 'Play race'}
            </button>
            <button type="button" disabled={!ready} onClick={() => controllerRef.current?.restart()}>
              Restart
            </button>
          </>
        )}
        <button type="button" disabled={!ready} onClick={() => controllerRef.current?.resetView()}>Reset view</button>
        <button type="button" disabled={!ready} onClick={() => controllerRef.current?.rotate(-1)} aria-label="Rotate view left">↶</button>
        <button type="button" disabled={!ready} onClick={() => controllerRef.current?.rotate(1)} aria-label="Rotate view right">↷</button>
        <button type="button" disabled={!ready} onClick={() => controllerRef.current?.zoom(-1)} aria-label="Zoom in">+</button>
        <button type="button" disabled={!ready} onClick={() => controllerRef.current?.zoom(1)} aria-label="Zoom out">−</button>
      </div>
      <p className="race-scene-hint">
        Drag to look around. Pinch or scroll over the scene to zoom. The buttons also work with a keyboard.
      </p>
    </div>
  )
}
