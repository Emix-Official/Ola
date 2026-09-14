import { useState } from 'react'
import { raceFilm } from '../data/raceFilm'
import type { RaceClip } from '../data/raceFilm'
import { raceScene, showRaceShowcase } from '../data/raceScene'
import RaceSceneView from './RaceSceneView'
import CustomVideoPlayer from './CustomVideoPlayer'
import '../styles/race.css'

function RaceFeature({ clip, onSelectClip }: { clip: RaceClip; onSelectClip: (id: string) => void }) {
  return (
    <figure className="race-feature">
      <div className="race-screen">
        <CustomVideoPlayer
          key={clip.id}
          clips={[clip]}
          activeClipId={clip.id}
          onSelectClip={onSelectClip}
        />
      </div>

      <figcaption className="race-caption">
        <div>
          <h3>{raceFilm.title}</h3>
          <p id="race-description">{clip.description}</p>
          {raceFilm.credits && <p className="race-credits">{raceFilm.credits}</p>}
        </div>
        <a className="race-contact" href="#contact">
          Have something in mind? <span aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
  )
}

function RacePlaceholder() {
  return (
    <div className="race-placeholder">
      <span className="race-kicker">Blender / Scene preview</span>
      <div className="race-placeholder-lanes" aria-hidden="true">
        <span>01</span><span>02</span><span>03</span>
      </div>
      <div className="race-placeholder-copy">
        <h3>{raceFilm.title}</h3>
        <p>The race goes here once your render is connected.</p>
      </div>
    </div>
  )
}

function RaceExperience() {
  const [mode, setMode] = useState(raceFilm.clips[0]?.id ?? 'film')
  const clip = raceFilm.clips.find((item) => item.id === mode) ?? raceFilm.clips[0]

  return (
    <>
      <div className="race-mode-controls" role="group" aria-label="Choose how to explore the race">
        {raceFilm.clips.map((item) => (
          <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
            {item.label}
          </button>
        ))}
        {(raceScene.enabled || import.meta.env.DEV) && (
          <button type="button" aria-pressed={mode === 'scene'} onClick={() => setMode('scene')}>
            Explore in 3D
          </button>
        )}
      </div>

      {mode !== 'scene' ? (
        clip ? <RaceFeature clip={clip} onSelectClip={setMode} /> : import.meta.env.DEV ? (
          <RacePlaceholder />
        ) : (
          <div className="race-scene-placeholder"><p>{raceScene.description}</p></div>
        )
      ) : raceScene.enabled ? (
        <>
          <RaceSceneView onReturnToFilm={raceFilm.clips.length > 0 ? () => setMode(raceFilm.clips[0].id) : undefined} />
          <div className="race-caption">
            <div>
              <h3>{raceFilm.title}</h3>
              <p>{raceScene.description}</p>
              {raceFilm.credits && <p className="race-credits">{raceFilm.credits}</p>}
            </div>
            <a className="race-contact" href="#contact">
              Have something in mind? <span aria-hidden="true">↗</span>
            </a>
          </div>
        </>
      ) : (
        <div className="race-scene-placeholder">
          <p>The interactive scene is ready to connect to your Blender export.</p>
        </div>
      )}
    </>
  )
}

export default function RaceShowcase() {
  if (!showRaceShowcase) return null

  return (
    <section className="race-section container" id="motion" aria-labelledby="race-heading">
      <div className="race-heading">
        <div>
          <p className="race-kicker">Form / Motion</p>
          <h2 id="race-heading">Form in <span className="accent">motion.</span></h2>
        </div>
        <p className="race-summary">{raceFilm.summary}</p>
      </div>
      <RaceExperience />
    </section>
  )
}
