import { useId, useState } from "react";
import "../styles/about.css";

const practices = [
  {
    name: "Code",
    description: "Building software, from web interfaces to desktop tools.",
    detail: "C · C++ · Python · JavaScript · React · Next.js · Supabase",
  },
  {
    name: "Form",
    description: "Exploring ideas through shape, space, and 3D modelling.",
    detail: "3D modelling and visual exploration",
  },
  {
    name: "Motion",
    description: "Shaping a story through editing and animation.",
    detail: "Video editing · After Effects · Animation",
  },
];

export default function About() {
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const originId = useId();

  return (
    <section
      className="about-section container"
      id="about"
      aria-labelledby="about-title"
    >
      <div className="about-layout">
        <div className="about-copy">
          <p className="eyebrow">Behind MarkOS</p>

          <h2 id="about-title">
            Curiosity keeps me building
            <span className="accent">.</span>
          </h2>

          <p className="about-bio">
            I’m Olaoluwa Abiodun, a software engineering student at Babcock
            University. I work across software, 3D modelling, video editing, and
            animation.
          </p>

          <p className="about-bio">
            I’m learning by building, moving between code and visual work as an
            idea needs it.
          </p>
        </div>

        <div className="about-origin" data-open={isOriginOpen}>
          <h3 className="origin-word">
            <span className="origin-mark">Mark</span>
            <span className="origin-os">OS</span>
          </h3>

          <button
            className="origin-button"
            type="button"
            aria-expanded={isOriginOpen}
            aria-controls={originId}
            onClick={() => setIsOriginOpen((current) => !current)}
          >
            {isOriginOpen ? "Hide the story" : "Unpack the name"}
            <span aria-hidden="true">{isOriginOpen ? "−" : "+"}</span>
          </button>

          <div className="origin-story" id={originId} hidden={!isOriginOpen}>
            <p>
              <strong>Mark</strong> comes from Markus, my English name.
            </p>

            <p>
              <strong>OS</strong> comes from my ambition to build an operating
              system. The initials became part of my brand.
            </p>
          </div>
        </div>
      </div>

      <h3 className="about-practices-title">Ways I work</h3>

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
    </section>
  );
}
