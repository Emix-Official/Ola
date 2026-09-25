import { useState } from "react";
import type { Project } from "../data/projects";
import "../styles/work.css";

function DocumentPreview() {
  return (
    <div
      className="document-art"
      role="img"
      aria-label="Document flow concept: different file formats are compiled into one document."
    >
      <div className="document-sources" aria-hidden="true">
        <span className="document-sheet document-sheet--back">DOCX</span>
        <span className="document-sheet document-sheet--middle">XLSX</span>
        <span className="document-sheet document-sheet--front">
          PDF
          <i />
          <i />
          <i />
        </span>
      </div>
      <span className="document-arrow" aria-hidden="true">
        →
      </span>
      <div className="document-result" aria-hidden="true">
        <span>Upright</span>
        <i />
        <i />
        <i />
        <small>ONE DOCUMENT</small>
      </div>
    </div>
  );
}

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

export default function ProjectVisual({ project }: { project: Project }) {
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
      ) : project.preview === "documents" ? (
        <DocumentPreview />
      ) : project.preview === "nfc" ? (
        <BridgePreview />
      ) : (
        <p className="work-placeholder">{project.name}</p>
      )}

      <span className="work-visual-caption">
        {showImage
          ? (project.imageCaption ?? "Interface preview")
          : project.preview === "documents"
            ? "Document flow · concept"
            : project.preview === "nfc"
              ? "Connection concept"
              : "Project cover"}
      </span>
    </div>
  );
}
