import type { Theme } from "../hooks/useTheme";
import { assetUrl, profile } from "../data/profile";
import ThemePortrait from "./ThemePortrait";
import Reveal from "./Reveal";
import "../styles/about.css";

const practices = [
  {
    name: "Code",
    description:
      "Useful tools, curious experiments, and the systems underneath.",
    detail: "JavaScript · TypeScript · React · Python · C / C++",
  },
  {
    name: "Form",
    description: "An idea explored through shape, space, and light.",
    detail: "Blender · 3D modelling · Scene composition",
  },
  {
    name: "Motion",
    description: "Finding the rhythm that makes an idea feel alive.",
    detail: "After Effects · Video editing · Animation",
  },
];

export default function About({ theme }: { theme: Theme }) {
  return (
    <section
      className="about-section container"
      id="about"
      aria-labelledby="about-title"
    >
      <Reveal className="about-layout">
        <ThemePortrait theme={theme} />
        <div className="about-copy">
          <p className="eyebrow">The person behind the projects</p>
          <h2 id="about-title">
            Curiosity keeps me building<span className="accent">.</span>
          </h2>
          <p className="about-introduction">
            I’m {profile.name}.{" "}
            <span className="accent">You can call me MarkOS.</span>
          </p>
          {profile.bio.map((paragraph) => (
            <p className="about-bio" key={paragraph}>
              {paragraph}
            </p>
          ))}
          <dl className="about-facts">
            <div>
              <dt>Based in</dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt>Studying</dt>
              <dd>{profile.education}</dd>
            </div>
          </dl>
          <div className="about-actions">
            <a
              className="contact-primary"
              href={assetUrl(profile.cv)}
              download="Olaoluwa-Abiodun-CV.pdf"
            >
              Download CV <span aria-hidden="true">↓</span>
            </a>
            <a className="text-button" href="#contact">
              Let’s talk <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </Reveal>
      <Reveal>
        <details className="about-origin">
          <summary>
            <span className="origin-word">
              <span className="origin-mark">Mark</span>
              <span className="origin-os">OS</span>
            </span>
            <span className="origin-prompt">
              There’s a story in the name.
              <span className="origin-plus" aria-hidden="true">
                +
              </span>
            </span>
          </summary>
          <div className="origin-story">
            <p>
              <strong>Mark</strong> comes from Markus, my English name.{" "}
              <strong>OS</strong> comes from my ambition to build an operating
              system. The initials stuck, and became the name I put on the
              things I make.
            </p>
          </div>
        </details>
      </Reveal>
      <Reveal>
        <h3 className="about-practices-title">
          Different tools. The same curiosity.
        </h3>
        <dl className="about-practices">
          {practices.map((practice, index) => (
            <div className="about-practice" key={practice.name}>
              <dt>
                <span className="practice-number" aria-hidden="true">
                  0{index + 1}
                </span>
                {practice.name}
              </dt>
              <dd className="practice-description">{practice.description}</dd>
              <dd className="practice-detail">{practice.detail}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
