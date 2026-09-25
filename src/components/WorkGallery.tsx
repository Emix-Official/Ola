import { useState } from "react";
import { galleryProjects } from "../data/projects";
import type { Discipline } from "../data/projects";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";
import "../styles/gallery.css";

type Filter = "all" | Discipline;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "software", label: "Software" },
  { value: "3d", label: "3D" },
  { value: "motion", label: "Motion" },
];

export default function WorkGallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = galleryProjects.filter(
    (project) => filter === "all" || project.disciplines.includes(filter),
  );

  return (
    <section
      className="gallery-section container"
      id="gallery"
      aria-labelledby="gallery-title"
    >
      <Reveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">The work keeps growing</p>
            <h2 id="gallery-title">
              Further explorations<span className="accent">.</span>
            </h2>
          </div>
          <p>From useful tools to things made out of curiosity.</p>
        </div>
      </Reveal>
      <div className="gallery-toolbar">
        <div
          className="gallery-filters"
          role="group"
          aria-label="Filter projects"
        >
          {filters.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              aria-controls="gallery-results"
              onClick={() => setFilter(value)}
            >
              {label}
              <span aria-hidden="true">
                {
                  galleryProjects.filter(
                    (project) =>
                      value === "all" || project.disciplines.includes(value),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <p className="gallery-count" role="status" aria-live="polite">
          {visible.length} {visible.length === 1 ? "project" : "projects"}
        </p>
      </div>
      <div className="gallery-grid" id="gallery-results">
        {visible.map((project) => (
          <article
            className="gallery-card"
            key={project.id}
            aria-labelledby={`gallery-${project.id}`}
          >
            <ProjectVisual project={project} />
            <div className="gallery-card-copy">
              <p className="work-status">{project.status}</p>
              <h3 id={`gallery-${project.id}`}>{project.name}</h3>
              <p className="gallery-summary">{project.summary}</p>
              {project.role && <p className="project-role">{project.role}</p>}
              {project.tools && (
                <ul className="project-tools" aria-label="Tools used">
                  {project.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              )}
              <details className="work-note">
                <summary>
                  Behind the build<span aria-hidden="true">+</span>
                </summary>
                <p>{project.story}</p>
              </details>
              <a
                className="work-link"
                href={project.url}
                target={project.url.startsWith("#") ? undefined : "_blank"}
                rel={project.url.startsWith("#") ? undefined : "noreferrer"}
              >
                {project.linkLabel}
                <span aria-hidden="true">
                  {project.url.startsWith("#") ? "↑" : "↗"}
                </span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
