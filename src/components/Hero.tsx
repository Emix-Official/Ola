import { useCallback, useEffect, useState } from "react";
import type { AnimationEvent } from "react";
import MarkOSCore from "./MarkOSCore";
import "../styles/hero.css";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function shouldPlayIntro() {
  const startsAtHome =
    !window.location.hash || window.location.hash === "#home";

  return (
    startsAtHome &&
    window.scrollY < 32 &&
    !document.hidden &&
    !window.matchMedia(MOTION_QUERY).matches
  );
}

export default function Hero() {
  const [isEntering, setIsEntering] = useState(shouldPlayIntro);

  const finishIntro = useCallback(() => {
    setIsEntering(false);
  }, []);

  useEffect(() => {
    if (!isEntering) return;

    const motionQuery = window.matchMedia(MOTION_QUERY);

    const inputEvents = [
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
      "scroll",
      "hashchange",
    ] as const;

    function handleMotionChange() {
      if (motionQuery.matches) finishIntro();
    }

    function handleVisibilityChange() {
      if (document.hidden) finishIntro();
    }

    for (const eventName of inputEvents) {
      window.addEventListener(eventName, finishIntro, {
        capture: true,
        passive: true,
      });
    }

    motionQuery.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Recovery in case the animation-end event never arrives.
    const timeout = window.setTimeout(finishIntro, 2000);

    return () => {
      for (const eventName of inputEvents) {
        window.removeEventListener(eventName, finishIntro, true);
      }

      motionQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.clearTimeout(timeout);
    };
  }, [isEntering, finishIntro]);

  function handleFinalWordEnd(event: AnimationEvent<HTMLSpanElement>) {
    if (
      event.target === event.currentTarget &&
      event.animationName === "hero-word-enter"
    ) {
      finishIntro();
    }
  }

  return (
    <section
      className="hero container"
      id="home"
      aria-labelledby="hero-title"
      data-entering={isEntering}
    >
      <div className="hero-copy">
        <p className="eyebrow">Olaoluwa Abiodun</p>

        <h1
          className="hero-title"
          id="hero-title"
          aria-label="Code. Form. Motion."
        >
          <span className="hero-line">
            <span className="hero-word">Code.</span>
          </span>

          <span className="hero-line">
            <span className="hero-word hero-word--form">Form.</span>
          </span>

          <span className="hero-line">
            <span
              className="hero-word hero-word--motion accent"
              onAnimationEnd={handleFinalWordEnd}
            >
              Motion.
            </span>
          </span>
        </h1>
      </div>

      <MarkOSCore />

      <div className="hero-details">
        <p className="hero-description">
          I’m a software engineering student who builds software, models in 3D,
          and brings ideas to life through editing and animation.
        </p>

        <a className="primary-link" href="#work">
          Explore my work <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
