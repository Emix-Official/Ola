import { useState } from 'react'
import { useCoreMotion } from '../hooks/useCoreMotion'
import type { TiltStatus } from '../lib/coreMotion'
import '../styles/core.css'

const tiltMessages: Record<TiltStatus, string> = {
  idle: 'Let the core follow the angle of your device.',
  requesting: 'Waiting for motion permission…',
  calibrating: 'Hold your device comfortably for a moment.',
  active: 'Tilt gently. Recenter whenever you change position.',
  paused: 'Tilt will resume when the core is back in view.',
  denied: 'Motion access was declined. You can still explore the core.',
  unavailable: 'No motion readings arrived. You can retry on a supported device.',
  unsupported: 'Device tilt is unavailable in this browser.',
  insecure: 'Open the HTTPS version to enable device tilt.',
  reduced: 'Device tilt is off because you prefer reduced motion.',
}

export default function MarkOSCore() {
  const [expanded, setExpanded] = useState(false)
  const { sceneRef, status, enableTilt, disableTilt, recenter, onPointerMove, onPointerLeave } = useCoreMotion()
  const enabled = ['active', 'calibrating', 'paused'].includes(status)
  const blocked = ['requesting', 'unsupported', 'insecure', 'reduced'].includes(status)

  return (
    <div className="core-study">
      <div
        ref={sceneRef}
        className={`core-scene ${expanded ? 'is-expanded' : ''}`}
        data-smooth-tilt="true"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        aria-hidden="true"
      >
        <div className="core-stack">
          <div className="core-plane">
            <span className="core-symbol">{'</>'}</span>
            <span className="core-label">Code</span>
          </div>
          <div className="core-plane">
            <span className="core-symbol">3D</span>
            <span className="core-label">Form</span>
          </div>
          <div className="core-plane">
            <span className="core-monogram">M</span>
            <span className="core-label">Motion</span>
          </div>
        </div>
      </div>

      <button
        className="core-button"
        type="button"
        aria-pressed={expanded}
        onClick={() => setExpanded((previous) => !previous)}
      >
        {expanded ? 'Reassemble the core' : 'Explore the core'}
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      <div className="core-tilt-controls">
        <div className="core-tilt-actions">
          <button
            type="button"
            className="core-tilt-button"
            disabled={blocked}
            aria-pressed={enabled}
            aria-describedby="core-tilt-status"
            onClick={enabled ? disableTilt : enableTilt}
          >
            {status === 'requesting' ? 'Waiting…' : enabled ? 'Disable tilt' : 'Enable tilt'}
          </button>
          {enabled && (
            <button type="button" className="core-tilt-button" onClick={recenter}>
              Recenter
            </button>
          )}
        </div>
        <p id="core-tilt-status" className="core-tilt-status" role="status">
          {tiltMessages[status]}
        </p>
      </div>
    </div>
  )
}
