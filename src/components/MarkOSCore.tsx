import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

function resetScene(scene: HTMLDivElement | null) {
  if (!scene) return;

  const properties = ["--tilt-x", "--tilt-y", "--light-x", "--light-y"];

  for (const property of properties) {
    scene.style.removeProperty(property);
  }
}

export default function MarkOSCore() {
  const [expanded, setExpanded] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const motionAllowedRef = useRef(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const scene = sceneRef.current;

    function updateMotionPreference() {
      motionAllowedRef.current = !motionQuery.matches;

      if (motionQuery.matches) {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }

        resetScene(scene);
      }
    }

    updateMotionPreference();

    motionQuery.addEventListener("change", updateMotionPreference);

    return () => {
      motionQuery.removeEventListener("change", updateMotionPreference);

      motionAllowedRef.current = false;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      resetScene(scene);
    };
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !motionAllowedRef.current) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }

    // Convert the pointer position into values from 0 to 1.
    pointerRef.current = {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };

    // If a frame is already queued, it will use this latest position.
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;

      const scene = sceneRef.current;
      if (!scene) return;

      const { x, y } = pointerRef.current;

      scene.style.setProperty("--tilt-x", `${(0.5 - y) * 10}deg`);

      scene.style.setProperty("--tilt-y", `${(x - 0.5) * 12}deg`);

      scene.style.setProperty("--light-x", `${30 + x * 40}%`);

      scene.style.setProperty("--light-y", `${30 + y * 40}%`);
    });
  }

  function handlePointerLeave() {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    resetScene(sceneRef.current);
  }

  return (
    <div className="core-study">
      <div
        ref={sceneRef}
        className={`core-scene ${expanded ? "is-expanded" : ""}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        aria-hidden="true"
      >
        <div className="core-stack">
          <div className="core-plane">
            <span className="core-symbol">{"</>"}</span>
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
        {expanded ? "Reassemble the core" : "Explore the core"}

        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
    </div>
  );
}
