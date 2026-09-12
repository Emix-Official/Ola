import { useEffect, useRef, useState } from "react";
import "../styles/contact.css";

type WindowMode = "open" | "minimized" | "expanded" | "closed";

export default function ContactWindow() {
  const [mode, setMode] = useState<WindowMode>("open");
  const previousMode = useRef<WindowMode>("open");
  const reopenRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mode === "closed") {
      reopenRef.current?.focus({ preventScroll: true });
    } else if (previousMode.current === "closed") {
      closeRef.current?.focus({ preventScroll: true });
    }

    previousMode.current = mode;
  }, [mode]);

  return (
    <section
      className="contact-section container"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="contact-heading">
        <p className="eyebrow">What’s next?</p>
        <h2 id="contact-title">
          Good things start with a hello
          <span className="accent">.</span>
        </h2>
      </div>

      <div className="contact-stage">
        <div
          className="contact-window"
          data-mode={mode}
          hidden={mode === "closed"}
        >
          <div className="contact-titlebar">
            <div
              className="window-controls"
              role="group"
              aria-label="Contact window controls"
            >
              <button
                className="window-control window-control--close"
                type="button"
                ref={closeRef}
                aria-label="Close contact window"
                title="Close contact window"
                onClick={() => setMode("closed")}
              >
                <span aria-hidden="true">×</span>
              </button>

              <button
                className="window-control window-control--minimize"
                type="button"
                aria-label={
                  mode === "minimized"
                    ? "Restore contact window"
                    : "Minimize contact window"
                }
                title={
                  mode === "minimized"
                    ? "Restore contact window"
                    : "Minimize contact window"
                }
                aria-controls="contact-window-body"
                aria-expanded={mode !== "minimized"}
                onClick={() =>
                  setMode((current) =>
                    current === "minimized" ? "open" : "minimized",
                  )
                }
              >
                <span aria-hidden="true">−</span>
              </button>

              <button
                className="window-control window-control--expand"
                type="button"
                aria-label={
                  mode === "expanded"
                    ? "Restore contact window size"
                    : "Expand contact window"
                }
                title={
                  mode === "expanded"
                    ? "Restore contact window size"
                    : "Expand contact window"
                }
                aria-pressed={mode === "expanded"}
                onClick={() =>
                  setMode((current) =>
                    current === "expanded" ? "open" : "expanded",
                  )
                }
              >
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <p className="contact-window-title">MarkOS / Contact</p>
          </div>

          <div
            className="contact-body"
            id="contact-window-body"
            hidden={mode === "minimized"}
          >
            <p className="contact-name">Olaoluwa Abiodun</p>
            <h3>Tell me what you’re thinking.</h3>

            <p className="contact-description">
              A project, a role, or an idea you can’t leave alone. Tell me about
              it.
            </p>

            <div className="contact-actions">
              <a
                className="contact-primary"
                href="https://www.linkedin.com/in/olaoluwa-abiodun-673868368/"
                target="_blank"
                rel="noreferrer"
              >
                Start on LinkedIn
                <span aria-hidden="true">↗</span>
              </a>

              <a
                className="contact-secondary"
                href="https://github.com/Emix-Official"
                target="_blank"
                rel="noreferrer"
              >
                Explore GitHub
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <p className="contact-footnote">No perfect brief required.</p>
          </div>
        </div>

        <div className="contact-reopen" hidden={mode !== "closed"}>
          <p>Window closed. The conversation’s still open.</p>

          <button
            className="contact-primary"
            type="button"
            ref={reopenRef}
            onClick={() => setMode("open")}
          >
            Reopen contact
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}
