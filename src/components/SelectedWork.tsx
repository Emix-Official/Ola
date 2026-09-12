import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { projects } from "../data/projects.ts";
import type { Project } from "../data/projects.ts";
import "../styles/work.css";

function BridgePreview() {
  return (
    <div
      className="bridge-art"
      role="img"
      aria-label="Connection concept: an Android phone sends an NFC tag ID to a desktop over USB."
    >
      <div className="bridge-device" aria-hidden="true">
        <div className="bridge-phone">
          <span>NFC</span>
        </div>
        <span>Android</span>
      </div>

      <div className="bridge-wire" aria-hidden="true">
        <span>USB →</span>
      </div>

      <div className="bridge-device" aria-hidden="true">
        <div className="bridge-screen">
          <span>&gt;_</span>
        </div>
        <span>Desktop</span>
      </div>
    </div>
  );
}
function ProjectVisual({ project }: { project: Project }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = project.image;
  const showImage = image && image.src !== failedSrc;

  return (
    <div className="work-visual">
      {showImage ? (
        <img
          className="work-image"
          src={`${import.meta.env.BASE_URL}${image.src.replace(/^\/+/, "")}`}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(image.src)}
        />
      ) : project.preview === "nfc" ? (
        <BridgePreview />
      ) : (
        <p className="work-placeholder">{project.name}</p>
      )}

      <span className="work-visual-caption">
        {showImage
          ? "Interface preview"
          : project.preview === "nfc"
            ? "Connection concept"
            : "Project cover"}
      </span>
    </div>
  );
}
export default function SelectedWork() {
  const [activeId, setActiveId] = useState(projects[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;

    switch (event.key) {
      case "ArrowDown":
        nextIndex = (index + 1) % projects.length;
        break;

      case "ArrowUp":
        nextIndex = (index - 1 + projects.length) % projects.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = projects.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section
      className="work-section container"
      id="work"
      aria-labelledby="work-title"
    >
      <div className="section-heading">
        <h2 id="work-title">
          Selected work<span className="accent">.</span>
        </h2>
        <p>Different tools. A reason behind every build.</p>
      </div>

      <div className="work-layout">
        <div
          className="work-tabs"
          role="tablist"
          aria-label="Choose a project"
          aria-orientation="vertical"
        >
          {projects.map((project, index) => (
            <button
              className="work-tab"
              type="button"
              role="tab"
              key={project.id}
              id={`tab-${project.id}`}
              aria-controls={`panel-${project.id}`}
              aria-selected={activeId === project.id}
              tabIndex={activeId === project.id ? 0 : -1}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              onFocus={() => setActiveId(project.id)}
              onClick={() => setActiveId(project.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              <span className="work-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="work-tab-copy">
                <span className="work-tab-name">{project.name}</span>
                <span className="work-tab-category">{project.category}</span>
              </span>

              <span className="work-tab-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="work-panels">
          {projects.map((project) => (
            <article
              className="work-panel"
              role="tabpanel"
              key={project.id}
              id={`panel-${project.id}`}
              aria-labelledby={`tab-${project.id}`}
              hidden={activeId !== project.id}
              tabIndex={0}
            >
              <ProjectVisual project={project} />

              <div className="work-copy">
                <p className="work-status">{project.status}</p>
                <h3>{project.headline}</h3>
                <p className="work-summary">{project.summary}</p>

                <details className="work-note">
                  <summary>
                    Behind the build
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{project.story}</p>
                </details>

                <a
                  className="work-link"
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.linkLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
