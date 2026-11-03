import { useEffect, useRef, useState } from "react";
import "./atelier-states.css";

export default function NotFound({ onHome }: { onHome: () => void }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "404 — Ananda Priyan";
    heading.current?.focus({ preventScroll: true });
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="notfound-page" id="main">
      <a
        className="notfound-signature"
        href="/"
        aria-label="Ananda Priyan — Home"
        onClick={(event) => {
          event.preventDefault();
          onHome();
        }}
      >
        {logoFailed ? (
          <span className="state-signature-fallback" aria-hidden="true">
            AP.
          </span>
        ) : (
          <img
            src="/media/ap-signature.png"
            width="72"
            height="58"
            alt=""
            onError={() => setLogoFailed(true)}
          />
        )}
      </a>
      <section className="notfound-pane" aria-labelledby="notfound-heading">
        <p className="notfound-number" aria-hidden="true">
          404
        </p>
        <h1 id="notfound-heading" ref={heading} tabIndex={-1}>
          This page isn’t in the story.
        </h1>
        <p className="notfound-description">
          The page you requested could not be found. You can return to the
          portfolio below.
        </p>
        <a
          href="/"
          className="notfound-home"
          onClick={(event) => {
            event.preventDefault();
            onHome();
          }}
        >
          Home
        </a>
      </section>
      <p className="notfound-credit">Ananda Priyan</p>
    </main>
  );
}
