import type { AnimationEvent } from 'react'
import Hero from './components/Hero'
import SelectedWork from './components/SelectedWork'
import RaceShowcase from './components/RaceShowcase'
import { showRaceFilm } from './data/raceFilm'
import ContactWindow from './components/ContactWindow'
import About from './components/About'
import { useTheme } from './hooks/useTheme'
import type { Theme, ThemePhase } from './hooks/useTheme'
import './styles/motion.css'

type HeaderProps = {
  theme: Theme
  phase: ThemePhase
  onToggleTheme: () => void
  onLogoAnimationEnd: (event: AnimationEvent<HTMLSpanElement>) => void
}

function Header({ theme, phase, onToggleTheme, onLogoAnimationEnd }: HeaderProps) {
  return (
    <header className="site-header container">
      <a className="brand" href="#home" aria-label="MarkOS home">
        <span
          className={`brand-word ${phase !== 'idle' ? 'is-charging glitch-text' : ''}`}
          onAnimationEnd={onLogoAnimationEnd}
        >
          Mark<span className="accent">OS</span>
        </span>
      </a>
      <nav className="navigation" aria-label="Main navigation">
        <a href="#work">Selected work</a>
        {showRaceFilm && <a href="#motion">Motion</a>}
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <button
        className="theme-button"
        type="button"
        onClick={onToggleTheme}
        disabled={phase !== 'idle'}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
    </header>
  )
}

export default function App() {
  const { theme, phase, toggleTheme, onLogoAnimationEnd, onCurtainAnimationEnd } = useTheme()

  return (
    <div className="portfolio" data-theme={theme} data-theme-phase={phase}>
      <div
        className={`theme-curtain theme-curtain--${phase}`}
        onAnimationEnd={onCurtainAnimationEnd}
        aria-hidden="true"
      />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header
        theme={theme}
        phase={phase}
        onToggleTheme={toggleTheme}
        onLogoAnimationEnd={onLogoAnimationEnd}
      />

      <main id="main-content">
        <Hero />

        <SelectedWork />

        <RaceShowcase />

        <About />

        <ContactWindow />
      </main>

      <footer className="site-footer container">
        <span>© {new Date().getFullYear()} Olaoluwa Abiodun</span>
        <a href="https://github.com/Emix-Official" target="_blank" rel="noreferrer">GitHub ↗</a>
      </footer>
    </div>
  )
}
