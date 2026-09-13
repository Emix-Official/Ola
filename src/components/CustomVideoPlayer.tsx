import { useEffect, useRef, useState, useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { RaceClip } from '../data/raceFilm'
import '../styles/race.css'

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

type CustomVideoPlayerProps = {
  clips: RaceClip[]
  activeClipId: string
  onSelectClip: (id: string) => void
}

export default function CustomVideoPlayer({ clips, activeClipId, onSelectClip }: CustomVideoPlayerProps) {
  const activeClip = clips.find((c) => c.id === activeClipId) ?? clips[0]

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const hideControlsTimer = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(true)
  const [isLooping, setIsLooping] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number>(0)
  const [feedback, setFeedback] = useState<'play' | 'pause' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Auto-hide controls during playback
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimer.current) {
      window.clearTimeout(hideControlsTimer.current)
    }
    if (isPlaying && !isScrubbing) {
      hideControlsTimer.current = window.setTimeout(() => {
        setControlsVisible(false)
      }, 2500)
    }
  }, [isPlaying, isScrubbing])

  useEffect(() => {
    if (!isPlaying || isScrubbing) {
      if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current)
      return
    }
    hideControlsTimer.current = window.setTimeout(() => {
      setControlsVisible(false)
    }, 2500)
    return () => {
      if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current)
    }
  }, [isPlaying, isScrubbing])

  // Fullscreen change listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Auto pause when scrolled out of view
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function handleVisibilityChange() {
      if (document.hidden && !video?.paused) {
        video?.pause()
      }
    }

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
          if (!video.paused) video.pause()
        }
      },
      { threshold: [0, 0.2] },
    )

    observer?.observe(video)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const triggerFeedback = (type: 'play' | 'pause') => {
    setFeedback(type)
    window.setTimeout(() => setFeedback(null), 600)
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused || video.ended) {
      void video.play().then(() => {
        setIsPlaying(true)
        triggerFeedback('play')
      }).catch(() => {
        setIsPlaying(false)
      })
    } else {
      video.pause()
      setIsPlaying(false)
      triggerFeedback('pause')
      setControlsVisible(true)
    }
  }, [])

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !video.muted
    video.muted = nextMuted
    setIsMuted(nextMuted)
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.5
      setVolume(0.5)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    const clamped = Math.max(0, Math.min(1, newVolume))
    video.volume = clamped
    setVolume(clamped)
    if (clamped === 0) {
      video.muted = true
      setIsMuted(true)
    } else if (isMuted) {
      video.muted = false
      setIsMuted(false)
    }
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Fullscreen might be blocked by iframe or browser permissions
    }
  }

  const seekRelative = (seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
    showControlsTemporarily()
  }

  const handleProgressPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current
    const video = videoRef.current
    if (!bar || !video || !duration) return

    const rect = bar.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = pos * duration
    setCurrentTime(pos * duration)
  }

  const onPointerDownProgress = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsScrubbing(true)
    handleProgressPointer(e)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMoveProgress = (e: ReactPointerEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

    setHoverPosition(pos * 100)
    setHoverTime(pos * duration)

    if (isScrubbing) {
      handleProgressPointer(e)
    }
  }

  const onPointerUpProgress = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false)
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // Pointer capture release safety
      }
      showControlsTemporarily()
    }
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (['Space', 'KeyK'].includes(e.code)) {
      e.preventDefault()
      togglePlay()
    } else if (e.code === 'ArrowRight') {
      e.preventDefault()
      seekRelative(5)
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault()
      seekRelative(-5)
    } else if (e.code === 'ArrowUp') {
      e.preventDefault()
      handleVolumeChange(volume + 0.1)
    } else if (e.code === 'ArrowDown') {
      e.preventDefault()
      handleVolumeChange(volume - 0.1)
    } else if (e.code === 'KeyM') {
      e.preventDefault()
      toggleMute()
    } else if (e.code === 'KeyF') {
      e.preventDefault()
      void toggleFullscreen()
    }
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`custom-video-player ${controlsVisible || !isPlaying ? 'controls-visible' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && !isScrubbing && setControlsVisible(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`${activeClip.label} player`}
    >
      {/* Video element without default controls */}
      <video
        ref={videoRef}
        className="player-media"
        src={assetUrl(activeClip.src)}
        poster={activeClip.poster ? assetUrl(activeClip.poster) : undefined}
        loop={isLooping}
        muted={isMuted}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={() => {
          const video = videoRef.current
          if (!video) return
          setCurrentTime(video.currentTime)
          if (video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1))
          }
        }}
        onLoadedMetadata={() => {
          const video = videoRef.current
          if (!video) return
          setDuration(video.duration)
          setIsLoading(false)
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsPlaying(true)
          setIsLoading(false)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setControlsVisible(true)
        }}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="player-loading-spinner" aria-hidden="true">
          <div className="spinner-ring" />
        </div>
      )}

      {/* Center Action Feedback Badge (Play/Pause flash) */}
      {feedback && (
        <div className="player-feedback-badge" aria-hidden="true">
          {feedback === 'play' ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </div>
      )}

      {/* Large Center Play Overlay when paused */}
      {!isPlaying && !isLoading && !error && (
        <button
          type="button"
          className="player-big-play-btn"
          onClick={togglePlay}
          aria-label={`Play ${activeClip.label}`}
        >
          <span className="big-play-glow" />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {/* Error state */}
      {error && (
        <div className="player-error-overlay">
          <p>Failed to load video.</p>
          <button
            type="button"
            className="player-retry-btn"
            onClick={() => {
              setError(false);
              setIsLoading(true);
              videoRef.current?.load();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Header Bar inside Video */}
      <div className="player-top-bar">
        <div className="player-meta-tag">
          <span className="player-kicker-dot" />
          <span className="player-clip-title">{activeClip.label}</span>
        </div>

        {clips.length > 1 && (
          <div className="player-clip-switcher" role="group" aria-label="Select clip">
            {clips.map((clip) => (
              <button
                key={clip.id}
                type="button"
                className={`player-switch-pill ${clip.id === activeClip.id ? 'is-active' : ''}`}
                onClick={() => onSelectClip(clip.id)}
                aria-pressed={clip.id === activeClip.id}
              >
                {clip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Bottom Control Bar */}
      <div className="player-bottom-bar">
        {/* Scrubber Progress Bar */}
        <div
          ref={progressBarRef}
          className={`player-progress-bar ${isScrubbing ? 'is-scrubbing' : ''}`}
          onPointerDown={onPointerDownProgress}
          onPointerMove={onPointerMoveProgress}
          onPointerUp={onPointerUpProgress}
          onPointerLeave={() => setHoverTime(null)}
          role="slider"
          aria-label="Seek time"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        >
          {/* Buffered track */}
          <div className="progress-buffered" style={{ width: `${bufferedPercent}%` }} />
          {/* Played track */}
          <div className="progress-played" style={{ width: `${progressPercent}%` }} />
          {/* Scrubber handle */}
          <div className="progress-handle" style={{ left: `${progressPercent}%` }} />

          {/* Time tooltip on hover */}
          {hoverTime !== null && (
            <div className="progress-tooltip" style={{ left: `${hoverPosition}%` }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="player-controls-row">
          <div className="controls-left">
            {/* Play/Pause Button */}
            <button
              type="button"
              className="ctrl-btn play-pause-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              className="ctrl-btn skip-btn"
              onClick={() => seekRelative(-10)}
              aria-label="Rewind 10 seconds"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <text x="12" y="15" fontSize="6.5" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none">10</text>
              </svg>
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              className="ctrl-btn skip-btn"
              onClick={() => seekRelative(10)}
              aria-label="Fast forward 10 seconds"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <text x="12" y="15" fontSize="6.5" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none">10</text>
              </svg>
            </button>

            {/* Volume Control */}
            <div className="volume-control-group">
              <button
                type="button"
                className="ctrl-btn volume-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>
              <div className="volume-slider-container">
                <input
                  type="range"
                  className="volume-slider"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Volume slider"
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="time-display" aria-live="off">
              <span className="current-time">{formatTime(currentTime)}</span>
              <span className="time-separator">/</span>
              <span className="total-duration">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls-right">
            {/* Loop Toggle */}
            <button
              type="button"
              className={`ctrl-btn loop-btn ${isLooping ? 'is-active' : ''}`}
              onClick={() => setIsLooping(!isLooping)}
              aria-pressed={isLooping}
              aria-label="Toggle loop"
              title={isLooping ? 'Looping enabled' : 'Looping disabled'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {isLooping && <span className="active-dot" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="ctrl-btn fullscreen-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h6m0 0v6m0-6-7 7m17-11h-6m0 0V4m0 6 7-7m-7 17v-6m0 0h6m-6 0 7 7M10 4v6m0 0H4m6 0L3 3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
