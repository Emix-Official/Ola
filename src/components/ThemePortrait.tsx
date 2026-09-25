import type { Theme } from "../hooks/useTheme";
import { useCoreMotion } from "../hooks/useCoreMotion";
import { assetUrl } from "../data/profile";

export default function ThemePortrait({ theme }: { theme: Theme }) {
  const {
    sceneRef,
    status,
    onPointerMove,
    onPointerLeave,
    enableTilt,
    disableTilt,
    recenter,
  } = useCoreMotion(0.35);
  const enabled = ["calibrating", "active", "paused"].includes(status);
  const unavailable = ["unsupported", "insecure", "reduced"].includes(status);
  const message =
    status === "denied"
      ? "Tilt permission was not granted."
      : status === "unavailable"
        ? "No motion readings arrived. You can try again."
        : status === "insecure"
          ? "Device tilt needs the HTTPS version of this site."
          : status === "reduced"
            ? "Motion is off to match your device preference."
            : status === "unsupported"
              ? "Device tilt is unavailable in this browser."
              : enabled
                ? "Move gently. Recenter whenever you need to."
                : "A little movement, if you want it.";

  return (
    <div className="portrait-column">
      <div
        ref={sceneRef}
        className="portrait-scene"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <span className="portrait-index" aria-hidden="true">
          01 / THE PERSON
        </span>
        <figure className="portrait-frame">
          <div className="portrait-images">
            {(["light", "dark"] as const).map((mode) => (
              <img
                key={mode}
                className={`portrait-image portrait-image--${mode}`}
                data-active={theme === mode}
                src={assetUrl(`portraits/olaoluwa-${mode}-900.webp`)}
                srcSet={`${assetUrl(`portraits/olaoluwa-${mode}-480.webp`)} 480w, ${assetUrl(`portraits/olaoluwa-${mode}-900.webp`)} 900w`}
                sizes="(max-width: 700px) calc(100vw - 64px), 360px"
                width={900}
                height={1600}
                loading="lazy"
                decoding="async"
                alt={
                  theme === mode
                    ? "Olaoluwa Abiodun, the creator behind MarkOS."
                    : ""
                }
                aria-hidden={theme !== mode}
              />
            ))}
          </div>
          <figcaption>
            <span>Olaoluwa Abiodun</span>
            <span className="accent">MarkOS ↗</span>
          </figcaption>
        </figure>
        <span className="portrait-side-note" aria-hidden="true">
          CODE / FORM / MOTION
        </span>
      </div>
      <div className="portrait-tilt-controls">
        {!unavailable && (
          <div className="portrait-tilt-actions">
            <button
              type="button"
              className="text-button"
              disabled={status === "requesting"}
              onClick={enabled ? disableTilt : enableTilt}
              aria-pressed={enabled}
              aria-describedby="portrait-tilt-status"
            >
              {status === "requesting"
                ? "Waiting…"
                : enabled
                  ? "Disable portrait tilt"
                  : "Enable portrait tilt"}
            </button>
            {enabled && (
              <button type="button" className="text-button" onClick={recenter}>
                Recenter
              </button>
            )}
          </div>
        )}
        <p id="portrait-tilt-status" role="status">
          {message}
        </p>
      </div>
    </div>
  );
}
