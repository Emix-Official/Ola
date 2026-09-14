import { useEffect, useRef, useState } from 'react'
import { raceScene } from '../data/raceScene'
import { raceFilm } from '../data/raceFilm'
import type { createRaceViewer, ViewerState } from '../lib/createRaceViewer'
import '../styles/race-scene.css'

const initialState: ViewerState = {
  phase: 'loading', playing: false, hasAnimation: false, progress: null,
  view: 'cars', canFocusCars: false, touch: false, interacting: false,
}

export default function RaceSceneView({ onReturnToFilm }: { onReturnToFilm?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<ReturnType<typeof createRaceViewer>>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ViewerState>(initialState)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let controller: ReturnType<typeof createRaceViewer> = null

    async function start() {
      try {
        // Neither Three.js nor the model is requested until Explore in 3D is selected.
        const module = await import('../lib/createRaceViewer')
        if (disposed || !host) return
        controller = module.createRaceViewer(host, raceScene, (next) => {
          if (!disposed) setState(next)
        })
        controllerRef.current = controller
      } catch (error) {
        if (!disposed) {
          console.warn('MarkOS 3D viewer:', error)
          setState({ ...initialState, phase: 'error' })
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
  const failed = state.phase === 'error'
  const total = state.progress?.total
  const percent = total ? Math.min(100, Math.floor((state.progress?.loaded ?? 0) / total * 100)) : undefined
  const poster = raceFilm.clips[0]?.poster
  const status = failed ? 'The 3D scene couldn’t open here.'
    : state.phase === 'preparing' ? 'Preparing the cars and materials…'
    : state.phase === 'downloading' ? 'Loading the race…' : 'Opening the 3D viewer…'

  return (
    <div className="race-scene-view">
      <div className="race-scene-stage" aria-busy={!ready && !failed}>
        {!ready && poster && (
          <img className="race-scene-poster" src={`${import.meta.env.BASE_URL}${poster}`} alt="" />
        )}
        <div ref={hostRef} className="race-scene-host" />
        {!ready && (
          <div className="race-scene-message">
            <p className="race-load-title" role="status">{status}</p>
            {state.phase === 'downloading' && (
              <div className="race-download">
                <progress max={100} value={percent} aria-label="Downloading the 3D scene" />
                <span>
                  {percent !== undefined ? `${percent}%` : `${((state.progress?.loaded ?? 0) / 1_000_000).toFixed(1)} MB received`}
                </span>
              </div>
            )}
            {failed && <p>Try again, or watch the rendered version.</p>}
            <div className="race-load-actions">
              {failed && (
                <button type="button" onClick={() => {
                  setState(initialState)
                  setAttempt((value) => value + 1)
                }}>Retry 3D</button>
              )}
              {onReturnToFilm && (
                <button type="button" onClick={onReturnToFilm}>
                  {failed ? 'Watch the film' : 'Back to the film'}
                </button>
              )}
            </div>
          </div>
        )}
        {ready && state.touch && (
          <button type="button" className="race-touch-toggle" aria-pressed={state.interacting}
            onClick={() => controllerRef.current?.toggleInteraction()}>
            {state.interacting ? 'Done rotating · scroll page' : 'Touch to rotate'}
          </button>
        )}
      </div>

      {ready && (
        <>
          <div className="race-scene-controls" role="group" aria-label="3D scene controls">
            {state.hasAnimation && (
              <>
                <button className="race-play-button" type="button" onClick={() => controllerRef.current?.togglePlayback()}>
                  {state.playing ? 'Pause race' : 'Play race'}
                </button>
                <button type="button" onClick={() => controllerRef.current?.restart()}>Restart</button>
              </>
            )}
            {state.canFocusCars && (
              <button type="button" onClick={() => controllerRef.current?.setView(state.view === 'cars' ? 'scene' : 'cars')}>
                {state.view === 'cars' ? 'See whole scene' : 'Follow the cars'}
              </button>
            )}
            <button type="button" onClick={() => controllerRef.current?.resetView()}>Reset view</button>
            <button type="button" onClick={() => controllerRef.current?.rotate(-1)} aria-label="Rotate view left">↶</button>
            <button type="button" onClick={() => controllerRef.current?.rotate(1)} aria-label="Rotate view right">↷</button>
            <button type="button" onClick={() => controllerRef.current?.zoom(-1)} aria-label="Zoom in">+</button>
            <button type="button" onClick={() => controllerRef.current?.zoom(1)} aria-label="Zoom out">−</button>
          </div>
          <p className="race-scene-hint">
            {state.touch
              ? state.interacting
                ? 'Drag to look around. Pinch to zoom. Tap “Done rotating” to scroll the page again.'
                : 'Scroll normally, or tap “Touch to rotate” to explore. The buttons work at any time.'
              : 'Drag to look around. Scroll over the scene to zoom. The buttons also work with a keyboard.'}
          </p>
        </>
      )}
    </div>
  )
}
