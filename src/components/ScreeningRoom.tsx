import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent } from "react";
import { ArrowRight, Play } from "lucide-react";
import type { creativeMedia } from "../content";
import { isApprovedDriveEmbed } from "./DriveFilmPlayer";
import { hasApprovedNativePlayback } from "../media-readiness";
import FilmMoments from "./FilmMoments";
import { findFilmMoment } from "../film-moments";

type Film = (typeof creativeMedia)[number];

function isReady(film: Film) {
  return Boolean(
    hasApprovedNativePlayback(film) ||
    isApprovedDriveEmbed(film.embedUrl),
  );
}

function linkedFilmId(films: Film[]) {
  try {
    const id = decodeURIComponent(window.location.hash.slice(1));
    return films.find((film) => film.id === id && isReady(film))?.id ?? null;
  } catch {
    return null;
  }
}

export default function ScreeningRoom({
  films,
  onPlay,
  motionEnabled = false,
  asPage = false,
  onContact,
  onSelectFilm,
  onRelatedProject,
}: {
  films: Film[];
  onPlay: (id: string, startAt?: number) => void;
  motionEnabled?: boolean;
  asPage?: boolean;
  onContact?: () => void;
  onSelectFilm?: (id: string) => void;
  onRelatedProject?: (anchor: HTMLAnchorElement) => void;
}) {
  const choiceGroup = useId();
  const Heading = asPage ? "h1" : "h2";
  const programmeRef = useRef<HTMLDivElement>(null);
  const projectionRef = useRef<HTMLDivElement>(null);
  const selectedContextRef = useRef<HTMLDivElement>(null);
  const reelPointerDown = useRef(false);
  const reelFocusFrame = useRef(0);
  const [selectedId, setSelectedId] = useState(() =>
    (asPage && linkedFilmId(films)) || films.find(isReady)?.id || "",
  );
  const linkedFocus = useRef(asPage ? linkedFilmId(films) : null);
  const [linkedArrival, setLinkedArrival] = useState(0);
  const [scrollProgramme, setScrollProgramme] = useState(false);
  const readyFilms = films.filter(isReady);
  const selected = readyFilms.find((film) => film.id === selectedId) ?? readyFilms[0];
  const selectedIndex = films.findIndex((film) => film.id === selected?.id);

  useEffect(() => {
    if (!asPage) return;
    const selectLinkedFilm = () => {
      const id = linkedFilmId(films);
      if (!id) return;
      linkedFocus.current = id;
      setSelectedId(id);
      setLinkedArrival((arrival) => arrival + 1);
    };
    window.addEventListener("hashchange", selectLinkedFilm);
    window.addEventListener("ap:pathnamechange", selectLinkedFilm);
    return () => {
      window.removeEventListener("hashchange", selectLinkedFilm);
      window.removeEventListener("ap:pathnamechange", selectLinkedFilm);
    };
  }, [asPage, films]);

  useLayoutEffect(() => {
    if (!linkedFocus.current || linkedFocus.current !== selected?.id) return;
    // Give the linked film a native reading/focus destination. The programme's
    // existing focus guard then keeps scroll staging from replacing it on arrival.
    projectionRef.current?.querySelector<HTMLElement>(".screening-title-card h3")
      ?.focus({ preventScroll: true });
    linkedFocus.current = null;
  }, [selected?.id, linkedArrival]);

  useEffect(() => {
    const releasePointer = () => { reelPointerDown.current = false; };
    window.addEventListener("pointerup", releasePointer, true);
    window.addEventListener("pointercancel", releasePointer, true);
    window.addEventListener("blur", releasePointer);
    return () => {
      cancelAnimationFrame(reelFocusFrame.current);
      window.removeEventListener("pointerup", releasePointer, true);
      window.removeEventListener("pointercancel", releasePointer, true);
      window.removeEventListener("blur", releasePointer);
    };
  }, []);

  function revealReadyFilm(event: FocusEvent<HTMLDivElement>) {
    if (reelPointerDown.current) return;
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(".reel-frame");
    if (!target) return;
    const host = event.currentTarget;
    host.dataset.keyboardReveal = "true";
    cancelAnimationFrame(reelFocusFrame.current);
    reelFocusFrame.current = requestAnimationFrame(() => {
      if (host.isConnected && document.activeElement === target)
        target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    });
  }

  function restoreReelScroll(event: FocusEvent<HTMLDivElement>) {
    const host = event.currentTarget;
    if (event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return;
    cancelAnimationFrame(reelFocusFrame.current);
    host.scrollLeft = 0;
    delete host.dataset.keyboardReveal;
    reelPointerDown.current = false;
  }
  const selectedPoster = selected && isReady(selected) ? selected.posterUrl : null;

  function selectFilm(film: Film) {
    if (!isReady(film)) return;
    setSelectedId(film.id);
    if (asPage) onSelectFilm?.(film.id);
  }

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
      // Keep the inert programme unchanged during playback so its Watch
      // opener remains mounted for the dialog's focus restoration.
      // Focused programme controls also take precedence over scrolling.
      if (
        document.documentElement.dataset.opening === "active" ||
        document.querySelector("dialog[open]") ||
        programme.contains(document.activeElement) ||
        projectionRef.current?.contains(document.activeElement) ||
        selectedContextRef.current?.contains(document.activeElement)
      ) return;
      const midpoint = innerHeight / 2;
      const row = rows.find((item) => {
        if (item.dataset.ready !== "true") return false;
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
    window.addEventListener("ap:openingchange", focusOut);
    programme.addEventListener("focusout", focusOut);
    projectionRef.current?.addEventListener("focusout", focusOut);
    selectedContextRef.current?.addEventListener("focusout", focusOut);
    const projection = projectionRef.current;
    const selectedContext = selectedContextRef.current;
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("ap:openingchange", focusOut);
      programme.removeEventListener("focusout", focusOut);
      projection?.removeEventListener("focusout", focusOut);
      selectedContext?.removeEventListener("focusout", focusOut);
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
          <p className="screening-intro">Trailers. Auditions. A website launch.</p>
        </header>


        <div className="screening-layout">
          <div className="screening-projection" ref={projectionRef} id={selected?.id}>
            <div
              className="screening-screen"
              data-has-still={Boolean(selectedPoster)}
              aria-live="polite"
              aria-atomic="true"
              style={{ "--screening-index": selectedIndex } as CSSProperties}
            >
              {selected && selectedPoster && (
                <div className="screening-still-window" key={`still-${selected.id}`}>
                  <img
                    className="screening-still"
                    src={selectedPoster}
                    alt={selected.id === "cck-trailer"
                      ? "CCK trailer — an open notebook, desk and hands"
                      : selected.id === "farewell-video"
                        ? "Farewell video — a montage of classroom and social photographs"
                        : `${selected.title} — poster`}
                    width={640}
                    height={360}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
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
                  <h3 tabIndex={-1}>{selected.title}</h3>
                  {isReady(selected) && (
                    <button
                      className="screening-play"
                      data-cursor="play"
                      onClick={() => onPlay(selected.id)}
                      aria-label={`Play selected film: ${selected.title}`}
                    >
                      <Play size={14} aria-hidden="true" /> Watch film
                    </button>
                  )}
                </div>
              )}
              {!selected && (
                <div className="screening-empty" role="status">
                  <h3>No films available yet.</h3>
                  <p>The collection titles remain listed below.</p>
                </div>
              )}
              <div className="screening-screen-bottom" aria-hidden="true">
                <span>Ananda Priyan</span>
                <span>Creative collection</span>
              </div>
            </div>
            <div className="screening-sill" aria-hidden="true" />
            <p className="screening-film-note">
              {selected?.caption}
            </p>
            <p className="screening-availability">
              {readyFilms.length} films. Choose a title.
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
                    data-ready={isReady(film)}
                    data-selected={film.id === selected?.id}
                  >
                    <label>
                      <input
                        className="screening-choice"
                        type="radio"
                        name={choiceGroup}
                        checked={film.id === selected?.id}
                        disabled={!isReady(film)}
                        onChange={() => selectFilm(film)}
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
                          {film.alternateTitle && <small>{film.alternateTitle}</small>}
                          <small>{isReady(film) ? `${film.type} · Available to watch` : "Not available"}</small>
                        </span>
                        <span
                          className="screening-selection"
                          aria-hidden="true"
                        />
                      </span>
                    </label>
                    {isReady(film) && (
                      <button type="button" className="screening-programme-watch" data-cursor="play"
                        aria-label={`Watch ${film.title}`}
                        onClick={() => { selectFilm(film); onPlay(film.id); }}>
                        <Play size={12} aria-hidden="true" /> Watch
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </fieldset>
          </div>
        </div>

        <div className="screening-selected-context" ref={selectedContextRef}>
          {selected && <FilmMoments key={selected.id} film={selected}
            relatedWork={selected.id === "cirs-website-launch" && findFilmMoment(selected, 26) ? (
              <div className="film-moments-related">
                <p>The film shows an Admissions Guide view at 00:26. The related case covers my website work with the school’s team.</p>
                <a href="/projects/cirs" onClick={(event) => {
                  if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
                    event.ctrlKey || event.shiftKey || event.altKey) return;
                  selectFilm(selected);
                  if (!onRelatedProject) return;
                  event.preventDefault();
                  onRelatedProject(event.currentTarget);
                }}>
                  Read the CIRS website case study <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            ) : undefined}
            onOpen={(seconds) => { selectFilm(selected); onPlay(selected.id, seconds); }} />}
        </div>

        {readyFilms.length > 0 && (
          <div
            className="studio-reel-window screening-ready-films"
            onFocusCapture={revealReadyFilm}
            onBlurCapture={restoreReelScroll}
            onPointerDownCapture={() => { reelPointerDown.current = true; }}
          >
            <div className="studio-reel">
              {readyFilms.map((film) => (
                <button
                  className="reel-frame"
                  data-has-still={Boolean(film.posterUrl)}
                  data-cursor="play"
                  key={film.id}
                  onClick={() => onPlay(film.id)}
                  aria-label={`Play ${film.title}`}
                >
                  {film.posterUrl ? (
                    <img
                      src={film.posterUrl}
                      srcSet={film.thumbnailSrcSet}
                      sizes="(max-width: 767px) calc(88vw - 2px), 568px"
                      alt={hasApprovedNativePlayback(film) ? `${film.title} — poster` : `${film.title} — original film still`}
                      width={640}
                      height={360}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="screening-reel-title" aria-hidden="true">
                      <Play size={22} />
                      <small>{film.type} / Google Drive</small>
                    </span>
                  )}
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
                if (!onContact || event.defaultPrevented || event.button !== 0 ||
                  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onContact();
              }}
            >
              Let’s talk <ArrowRight size={16} aria-hidden="true" />
            </a>
          </footer>
        )}
      </div>
    </section>
  );
}
