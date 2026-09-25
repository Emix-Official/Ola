import { useEffect, useRef, useState } from "react";
import "../styles/contact.css";
import { assetUrl, profile } from "../data/profile";
import Reveal from "./Reveal";

type WindowMode = "open" | "minimized" | "expanded" | "closed";

export default function ContactWindow() {
  const [copyMessage, setCopyMessage] = useState("");
  const [copying, setCopying] = useState(false);
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

  async function copyEmail() {
    setCopying(true);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(profile.email);
      setCopyMessage("Email copied.");
    } catch {
      setCopyMessage(
        "Couldn’t copy automatically. Select the email address above to copy it.",
      );
    } finally {
      setCopying(false);
    }
  }

  return (
    <section
      className="contact-section container"
      id="contact"
      aria-labelledby="contact-title"
    >
      <Reveal>
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
              <p className="contact-name">{profile.name}</p>
              <h3>Tell me what you’re thinking.</h3>

              <p className="contact-description">
                A project, a role, or an idea you can’t leave alone. Tell me
                about it.
              </p>

              <a className="contact-email" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <div className="contact-actions">
                <a
                  className="contact-primary"
                  href={`mailto:${profile.email}?subject=Hello%20Olaoluwa`}
                >
                  Send an email <span aria-hidden="true">↗</span>
                </a>
                <button
                  className="contact-secondary"
                  type="button"
                  onClick={copyEmail}
                  disabled={copying}
                >
                  {copying ? "Copying…" : "Copy email"}
                  <span aria-hidden="true">⧉</span>
                </button>
                <a
                  className="contact-secondary"
                  href={assetUrl(profile.cv)}
                  download="Olaoluwa-Abiodun-CV.pdf"
                >
                  Download CV <span aria-hidden="true">↓</span>
                </a>
              </div>
              <p
                className="contact-copy-status"
                role="status"
                aria-live="polite"
              >
                {copyMessage}
              </p>
              <div className="contact-socials">
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
                <a href={assetUrl(profile.cv)} target="_blank" rel="noreferrer">
                  View CV ↗
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
      </Reveal>
    </section>
  );
}
