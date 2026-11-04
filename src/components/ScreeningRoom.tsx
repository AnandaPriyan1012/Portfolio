import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { creativeMedia } from "../content";
import StudioAtmosphere from "./StudioAtmosphere";

type Film = (typeof creativeMedia)[number];

function isReady(film: Film) {
  return Boolean(film.videoUrl && film.posterUrl && film.credits);
}

export default function ScreeningRoom({
  films,
  onPlay,
  motionEnabled = false,
  asPage = false,
  onContact,
}: {
  films: Film[];
  onPlay: (id: string) => void;
  motionEnabled?: boolean;
  asPage?: boolean;
  onContact?: () => void;
}) {
  const choiceGroup = useId();
  const Heading = asPage ? "h1" : "h2";
  const programmeRef = useRef<HTMLDivElement>(null);
  const projectionRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(films[0]?.id ?? "");
  const [scrollProgramme, setScrollProgramme] = useState(false);
  const selected = films.find((film) => film.id === selectedId) ?? films[0];
  const selectedIndex = films.findIndex((film) => film.id === selected?.id);
  const readyFilms = films.filter(isReady);

  useEffect(() => {
    const desktop = matchMedia(
      "(min-width: 1100px) and (pointer: fine) and (hover: hover)",
    );
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
      deviceMemory?: number;
    };
    const sync = () => {
      const lowPower = Boolean(
        device.connection?.saveData ||
          (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
          (device.deviceMemory && device.deviceMemory <= 2),
      );
      setScrollProgramme(
        motionEnabled && desktop.matches && !reducedMotion.matches && !lowPower,
      );
    };
    sync();
    desktop.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      reducedMotion.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
    };
  }, [motionEnabled]);

  useEffect(() => {
    const programme = programmeRef.current;
    if (!scrollProgramme || !programme) return;
    const rows = Array.from(
      programme.querySelectorAll<HTMLElement>("[data-film-id]"),
    );
    let observer: IntersectionObserver | null = null;
    let resizeFrame = 0;
    let focusFrame = 0;

    const selectAtMidpoint = () => {
      // Radio-keyboard navigation and an already focused Watch action always
      // take precedence over scroll-driven presentation.
      if (
        programme.contains(document.activeElement) ||
        projectionRef.current?.contains(document.activeElement)
      ) return;
      const midpoint = innerHeight / 2;
      const row = rows.find((item) => {
        const bounds = item.getBoundingClientRect();
        return bounds.top <= midpoint && bounds.bottom >= midpoint;
      });
      if (row?.dataset.filmId) setSelectedId(row.dataset.filmId);
    };
    const observe = () => {
      observer?.disconnect();
      // Pixel margins keep a two-pixel band at the viewport midpoint. Percent
      // root margins would instead resolve against the viewport's width.
      const inset = Math.max(0, innerHeight / 2 - 1);
      observer = new IntersectionObserver(selectAtMidpoint, {
        rootMargin: `-${inset}px 0px -${inset}px 0px`,
        threshold: 0,
      });
      rows.forEach((row) => observer!.observe(row));
      selectAtMidpoint();
    };
    const resize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(observe);
    };
    const focusOut = () => {
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(selectAtMidpoint);
    };
    observe();
    window.addEventListener("resize", resize, { passive: true });
    programme.addEventListener("focusout", focusOut);
    projectionRef.current?.addEventListener("focusout", focusOut);
    const projection = projectionRef.current;
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", resize);
      programme.removeEventListener("focusout", focusOut);
      projection?.removeEventListener("focusout", focusOut);
    };
  }, [films, scrollProgramme]);

  return (
    <section
      id="studio"
      className="studio-section screening-room"
      data-scroll-programme={scrollProgramme}
      data-page={asPage ? "studio" : undefined}
      aria-labelledby={`${choiceGroup}-heading`}
    >
      <StudioAtmosphere enabled={motionEnabled} />
      <div className="page-width">
        <header className="section-heading screening-heading">
          <div>
            <p className="section-label">
              {asPage ? "Creative Studio" : "04 / Creative Studio"}
            </p>
            <Heading id={`${choiceGroup}-heading`}>
              The screening <em>room.</em>
            </Heading>
          </div>
          <p className="screening-intro">Trailers, films &amp; event work.</p>
        </header>

        <div className="screening-layout">
          <div className="screening-projection" ref={projectionRef}>
            <div
              className="screening-screen"
              aria-live="polite"
              aria-atomic="true"
              style={{ "--screening-index": selectedIndex } as CSSProperties}
            >
              {selected && isReady(selected) && (
                <img
                  className="screening-still"
                  src={selected.posterUrl!}
                  alt={`${selected.title} — original film still`}
                  loading="lazy"
                />
              )}
              <div className="screening-screen-top">
                <span>AP / Studio</span>
                <span>
                  {selected && isReady(selected)
                    ? "Selected film"
                    : "Collection index"}
                </span>
              </div>
              {selected && (
                <div className="screening-title-card" key={selected.id}>
                  <span className="screening-title-number" aria-hidden="true">
                    {String(selectedIndex + 1).padStart(2, "0")}
                  </span>
                  <p>{selected.type}</p>
                  <h3>{selected.title}</h3>
                  {isReady(selected) && (
                    <button
                      className="screening-play"
                      data-cursor="play"
                      onClick={() => onPlay(selected.id)}
                      aria-label={`Play selected film: ${selected.title}`}
                    >
                      <span aria-hidden="true">↗</span> Watch film
                    </button>
                  )}
                </div>
              )}
              <div className="screening-screen-bottom" aria-hidden="true">
                <span>Ananda Priyan</span>
                <span>Creative collection</span>
              </div>
            </div>
            <div className="screening-sill" aria-hidden="true" />
            <p className="screening-availability">
              {readyFilms.length === films.length && films.length > 0
                ? "Select a title to explore the collection."
                : readyFilms.length === 0
                  ? "Original films and confirmed contribution credits are needed before playback can open here."
                  : "Original films and confirmed contribution credits are needed before the remaining titles can play here."}
            </p>
          </div>

          <div
            className="studio-collection-index screening-programme"
            ref={programmeRef}
          >
            <div className="screening-programme-header">
              <span>The collection</span>
              <span>{String(films.length).padStart(2, "0")} titles</span>
            </div>
            <fieldset>
              <legend className="screening-sr-only">Select a title</legend>
              <ol>
                {films.map((film, index) => (
                  <li
                    key={film.id}
                    data-film-id={film.id}
                    data-selected={film.id === selected?.id}
                  >
                    <label>
                      <input
                        className="screening-choice"
                        type="radio"
                        name={choiceGroup}
                        checked={film.id === selected?.id}
                        onChange={() => setSelectedId(film.id)}
                        aria-label={film.title}
                      />
                      <span className="screening-row">
                        <span
                          className="studio-index-number"
                          aria-hidden="true"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="screening-row-copy">
                          <span>{film.title}</span>
                          <small>{film.type}</small>
                        </span>
                        <span
                          className="screening-selection"
                          aria-hidden="true"
                        />
                      </span>
                    </label>
                  </li>
                ))}
              </ol>
            </fieldset>
          </div>
        </div>

        {readyFilms.length > 0 && (
          <div className="studio-reel-window screening-ready-films">
            <div className="studio-reel">
              {readyFilms.map((film) => (
                <button
                  className="reel-frame"
                  data-cursor="play"
                  key={film.id}
                  onClick={() => onPlay(film.id)}
                  aria-label={`Play ${film.title}`}
                >
                  <img
                    src={film.posterUrl!}
                    alt={`${film.title} — original film still`}
                    loading="lazy"
                  />
                  <span>{film.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {asPage && (
          <footer className="screening-contact">
            <h2>Have a story in mind?</h2>
            <a
              href="/about#contact"
              onClick={(event) => {
                if (onContact) {
                  event.preventDefault();
                  onContact();
                }
              }}
            >
              Let’s talk <span aria-hidden="true">↗</span>
            </a>
          </footer>
        )}
      </div>
    </section>
  );
}
