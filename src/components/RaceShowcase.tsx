import { useEffect, useRef, useState } from 'react'
import { raceFilm, showRaceFilm } from '../data/raceFilm'
import type { RaceClip } from '../data/raceFilm'
import '../styles/race.css'

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function RacePlayer({ clip }: { clip: RaceClip }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video || failed) return

    function handleVisibilityChange() {
      if (document.hidden) video?.pause()
    }

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.2) video.pause()
      },
      { threshold: [0, 0.2] },
    )
    observer?.observe(video)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      video.pause()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [failed, attempt])

  if (failed) {
    return (
      <div className="race-player-error">
        <p role="status">This clip couldn’t load.</p>
        <button
          type="button"
          onClick={() => {
            setFailed(false)
            setAttempt((previous) => previous + 1)
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <video
      key={attempt}
      ref={videoRef}
      className="race-video"
      src={assetUrl(clip.src)}
      poster={clip.poster ? assetUrl(clip.poster) : undefined}
      controls
      playsInline
      muted
      preload="none"
      aria-label={`${raceFilm.title} — ${clip.label}`}
      aria-describedby="race-description"
      onError={() => setFailed(true)}
      onPlay={(event) => {
        if (document.hidden) event.currentTarget.pause()
      }}
    >
      {clip.captions && (
        <track
          kind="captions"
          src={assetUrl(clip.captions.src)}
          srcLang={clip.captions.language}
          label={clip.captions.label}
          default
        />
      )}
      Your browser does not support this video.
    </video>
  )
}

function RaceFeature({ clips }: { clips: RaceClip[] }) {
  const [selectedId, setSelectedId] = useState(clips[0].id)
  const clip = clips.find((item) => item.id === selectedId) ?? clips[0]

  return (
    <figure className="race-feature">
      <div className="race-toolbar">
        <span className="race-kicker">Blender / Three-car study</span>
        {clips.length > 1 && (
          <div className="race-versions" role="group" aria-label="Choose a view of the racing scene">
            {clips.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === clip.id}
                onClick={() => setSelectedId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="race-screen">
        <RacePlayer key={clip.id} clip={clip} />
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

export default function RaceShowcase() {
  if (!showRaceFilm) return null

  return (
    <section className="race-section container" id="motion" aria-labelledby="race-heading">
      <div className="race-heading">
        <div>
          <p className="race-kicker">Form / Motion</p>
          <h2 id="race-heading">Form in <span className="accent">motion.</span></h2>
        </div>
        <p className="race-summary">{raceFilm.summary}</p>
      </div>
      {raceFilm.clips.length > 0
        ? <RaceFeature clips={raceFilm.clips} />
        : <RacePlaceholder />}
    </section>
  )
}
