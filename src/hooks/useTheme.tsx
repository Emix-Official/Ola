import { useEffect, useReducer } from "react";
import type { AnimationEvent } from "react";

export type Theme = "dark" | "light";
export type ThemePhase = "idle" | "charge" | "cover" | "reveal";

type ThemeState = {
  theme: Theme;
  phase: ThemePhase;
};

type ThemeAction =
  | { type: "TOGGLE"; animate: boolean }
  | { type: "CHARGED" }
  | { type: "COVERED" }
  | { type: "REVEALED" }
  | { type: "FINISH" };

function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

function getInitialState(): ThemeState {
  try {
    return {
      theme:
        localStorage.getItem("markos-theme") === "light" ? "light" : "dark",
      phase: "idle",
    };
  } catch {
    return { theme: "dark", phase: "idle" };
  }
}

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case "TOGGLE":
      if (state.phase !== "idle") return state;

      return action.animate
        ? { ...state, phase: "charge" }
        : { theme: oppositeTheme(state.theme), phase: "idle" };

    case "CHARGED":
      return state.phase === "charge" ? { ...state, phase: "cover" } : state;

    case "COVERED":
      return state.phase === "cover"
        ? { theme: oppositeTheme(state.theme), phase: "reveal" }
        : state;

    case "REVEALED":
      return state.phase === "reveal" ? { ...state, phase: "idle" } : state;

    case "FINISH":
      if (state.phase === "idle") return state;

      return {
        theme:
          state.phase === "reveal" ? state.theme : oppositeTheme(state.theme),
        phase: "idle",
      };
  }
}

export function useTheme() {
  const [{ theme, phase }, dispatch] = useReducer(
    themeReducer,
    undefined,
    getInitialState,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("markos-theme", theme);
    } catch {
      // The theme still works when browser storage is unavailable.
    }
  }, [theme]);

  // Recover if the browser never sends an animation-end event.
  useEffect(() => {
    if (phase === "idle") return;

    const timeout = window.setTimeout(() => {
      dispatch({ type: "FINISH" });
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleMotionChange() {
      if (motionQuery.matches) {
        dispatch({ type: "FINISH" });
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        dispatch({ type: "FINISH" });
      }
    }

    motionQuery.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function toggleTheme() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    dispatch({
      type: "TOGGLE",
      animate: !reduceMotion && !document.hidden,
    });
  }

  function onLogoAnimationEnd(event: AnimationEvent<HTMLSpanElement>) {
    if (
      event.target !== event.currentTarget ||
      event.animationName !== "markos-charge"
    ) {
      return;
    }

    dispatch({ type: "CHARGED" });
  }

  function onCurtainAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;

    if (event.animationName === "markos-cover") {
      dispatch({ type: "COVERED" });
    }

    if (event.animationName === "markos-reveal") {
      dispatch({ type: "REVEALED" });
    }
  }

  return {
    theme,
    phase,
    toggleTheme,
    onLogoAnimationEnd,
    onCurtainAnimationEnd,
  };
}
