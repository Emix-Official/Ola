import type { AnimationEvent } from "react";
import MarkOSCore from "./components/MarkOSCore";
import { useTheme } from "./hooks/useTheme";
import type { Theme, ThemePhase } from "./hooks/useTheme";
import "./styles/motion.css";
import SelectedWork from "./components/SelectedWork";
import ContactWindow from "./components/ContactWindow";

type HeaderProps = {
  theme: Theme;
  phase: ThemePhase;
  onToggleTheme: () => void;
  onLogoAnimationEnd: (event: AnimationEvent<HTMLSpanElement>) => void;
};

function Header({
  theme,
  phase,
  onToggleTheme,
  onLogoAnimationEnd,
}: HeaderProps) {
  return (
    <header className="site-header container">
      <a className="brand" href="#home" aria-label="MarkOS home">
        <span
          className={`brand-word ${phase === "charge" ? "is-charging" : ""}`}
          onAnimationEnd={onLogoAnimationEnd}
        >
          Mark<span className="accent">OS</span>
        </span>
      </a>

      <nav className="navigation" aria-label="Main navigation">
        <a href="#work">Selected work</a>
        <a href="#contact">Contact</a>
      </nav>

      <button
        className="theme-button"
        type="button"
        onClick={onToggleTheme}
        disabled={phase !== "idle"}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </header>
  );
}

export default function App() {
  const {
    theme,
    phase,
    toggleTheme,
    onLogoAnimationEnd,
    onCurtainAnimationEnd,
  } = useTheme();

  return (
    <div className="portfolio" data-theme={theme} data-theme-phase={phase}>
      <div
        className={`theme-curtain theme-curtain--${phase}`}
        onAnimationEnd={onCurtainAnimationEnd}
        aria-hidden="true"
      />

      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Header
        theme={theme}
        phase={phase}
        onToggleTheme={toggleTheme}
        onLogoAnimationEnd={onLogoAnimationEnd}
      />

      <main id="main-content">
        <section
          className="hero container"
          id="home"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy">
            <p className="eyebrow">Olaoluwa Abiodun</p>

            <h1 id="hero-title">
              Code.
              <br />
              Form.
              <br />
              <span className="accent">Motion.</span>
            </h1>

            <p className="hero-description">
              I’m a software engineering student who builds software, models in
              3D, and brings ideas to life through editing and animation.
            </p>

            <a className="primary-link" href="#work">
              Explore my work <span aria-hidden="true">↓</span>
            </a>
          </div>

          <MarkOSCore />
        </section>

        <SelectedWork />

        <ContactWindow />
      </main>

      <footer className="site-footer container">
        <span>© {new Date().getFullYear()} Olaoluwa Abiodun</span>

        <a
          href="https://github.com/Emix-Official"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </footer>
    </div>
  );
}
