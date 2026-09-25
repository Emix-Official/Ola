import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import { featuredProjects as projects } from "../data/projects";
import ProjectVisual from "./ProjectVisual";
import "../styles/work.css";

const COMPACT_QUERY = "(max-width: 800px)";

function subscribeToLayout(onChange: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

function getCompactLayout() {
  return window.matchMedia(COMPACT_QUERY).matches;
}

export default function SelectedWork() {
  const [activeId, setActiveId] = useState(projects[0].id);

  const isCompact = useSyncExternalStore(subscribeToLayout, getCompactLayout);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCompact) return;

    const strip = stripRef.current;
    const index = projects.findIndex((project) => project.id === activeId);
    const tab = tabRefs.current[index];

    if (!strip || !tab) return;

    const keepTabVisible = () => {
      const stripBounds = strip.getBoundingClientRect();
      const tabBounds = tab.getBoundingClientRect();

      // Scroll the strip without moving the whole page.
      if (tabBounds.left < stripBounds.left) {
        strip.scrollLeft += tabBounds.left - stripBounds.left;
      } else if (tabBounds.right > stripBounds.right) {
        strip.scrollLeft += tabBounds.right - stripBounds.right;
      }
    };

    keepTabVisible();

    const observer = new ResizeObserver(keepTabVisible);
    observer.observe(strip);

    return () => observer.disconnect();
  }, [activeId, isCompact]);

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const nextKey = isCompact ? "ArrowRight" : "ArrowDown";
    const previousKey = isCompact ? "ArrowLeft" : "ArrowUp";

    let nextIndex: number;

    if (event.key === nextKey) {
      nextIndex = (index + 1) % projects.length;
    } else if (event.key === previousKey) {
      nextIndex = (index - 1 + projects.length) % projects.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = projects.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    tabRefs.current[nextIndex]?.focus({
      preventScroll: isCompact,
    });
  }

  return (
    <section
      className="work-section container"
      id="work"
      aria-labelledby="work-title"
      data-compact={isCompact}
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
          aria-orientation={isCompact ? "horizontal" : "vertical"}
          ref={stripRef}
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
                {project.role && <p className="project-role">{project.role}</p>}

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
      <a className="text-link" href="#gallery">
        More work and experiments <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
