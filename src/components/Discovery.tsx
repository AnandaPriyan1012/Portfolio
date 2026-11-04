import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { aboutLanes, discoveryContent, projects } from "../content";
import "./guided-tour.css";
import type { Project } from "../content";

type DiscoveryActions = {
  onProject: (id: Project["id"]) => void;
  onSwim: () => void;
};

function tourObscured() {
  const openMenu = document.querySelector<HTMLElement>('.atelier-navigation .menu-button[aria-expanded="true"]');
  return document.documentElement.dataset.opening === "active" ||
    Boolean(document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) ||
    Boolean(openMenu?.getClientRects().length);
}

function useTourEnvironment() {
  const [hidden, setHidden] = useState(() => document.hidden);
  const [obscured, setObscured] = useState(tourObscured);
  const [manual, setManual] = useState(
    () =>
      matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)").matches ||
      document.documentElement.dataset.motion === "off",
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)");
    const updateMotion = () =>
      setManual(
        media.matches || document.documentElement.dataset.motion === "off",
      );
    const updateVisibility = () => setHidden(document.hidden);
    const updateOverlay = () => setObscured(tourObscured());
    const observer = new MutationObserver(updateMotion);
    const overlays = new MutationObserver(updateOverlay);
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("ap:openingchange", updateOverlay);
    window.addEventListener("resize", updateOverlay);
    overlays.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "aria-modal", "aria-expanded"] });
    overlays.observe(document.documentElement, { attributes: true, attributeFilter: ["data-opening"] });
    updateOverlay();
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
      overlays.disconnect();
      window.removeEventListener("ap:openingchange", updateOverlay);
      window.removeEventListener("resize", updateOverlay);
    };
  }, []);
  return { hidden, manual, obscured };
}

export function GuidedTour({
  onClose,
  onProject,
  onSwim,
}: DiscoveryActions & { onClose: () => void }) {
  const copy = discoveryContent.tour;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const playback = useRef<HTMLButtonElement>(null);
  const hovering = useRef(false);
  const restoreOnClose = useRef(false);
  const [opening] = useState(() => {
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body
      ? active : document.querySelector<HTMLElement>('[data-navigation-origin="tour-launcher"]');
    return { opener, keyboard: Boolean(opener?.matches(":focus-visible")), location: location.pathname + location.search + location.hash };
  });
  const elapsedRef = useRef(0);
  const { hidden, manual, obscured } = useTourEnvironment();
  const titleId = useId();
  const complete = step >= copy.slides.length;
  const slide = copy.slides[Math.min(step, copy.slides.length - 1)];
  const activePlayback = playing && !interactionPaused && !hidden && !manual && !obscured && !complete;
  const project = projects.find((item) => item.id === slide.project);
  const storyTitle: Record<string, string> = {
    cirs: "CIRS: the route into Admissions.",
    community: "From meal service to a digital space.",
    accuflow: "From product introduction to guide.",
    creative: "Trailers, auditions and a launch.",
    swimming: "Freestyle. Breaststroke. Another lane.",
  };
  const description = slide.id === "cirs" ? project?.story.role
    : slide.id === "community" ? project?.story.challenge
    : slide.id === "accuflow" ? project?.story.process
    : slide.id === "creative" ? project?.story.outcome
    : aboutLanes.find((lane) => lane.id === "swimmer")?.description;
  const artwork: { src: string; alt: string; caption: string } | undefined = {
    cirs: { src: "/media/cirs-admissions.webp", alt: "Actual CIRS Admissions Guide capture", caption: "CIRS / Admissions Guide" },
    community: { src: "/media/vallalar-language-en-desktop.webp", alt: "English About page from the Vallalar website review preview", caption: "Vallalar / Website review preview" },
    accuflow: { src: "/media/atlas-accuflow-home-desktop.webp", alt: "Actual AccuFlow website prototype homepage", caption: "AccuFlow / Website prototype" },
    creative: { src: "/media/vantara-masquerade-poster.jpg", alt: "Supplied Vantara and Masquerade trailer poster", caption: "Vantara / Masquerade trailer" },
  }[slide.id as "cirs" | "community" | "accuflow" | "creative"];

  useLayoutEffect(() => {
    if (opening.keyboard) {
      setInteractionPaused(true);
      heading.current?.focus({ preventScroll: true });
    }
    return () => {
      if (restoreOnClose.current && opening.opener?.isConnected &&
          location.pathname + location.search + location.hash === opening.location && !tourObscured())
        opening.opener.focus({ preventScroll: true });
    };
  }, [opening]);

  const close = (restore = true) => {
    restoreOnClose.current = restore;
    onClose();
  };

  useEffect(() => {
    if (!activePlayback) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsedRef.current = Math.min(
        12_000,
        elapsedRef.current + now - previous,
      );
      previous = now;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= 12_000) {
        window.clearInterval(timer);
        elapsedRef.current = 0;
        setElapsed(0);
        setStep((current) => current + 1);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [step, activePlayback]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || tourObscured()) return;
      const owned = panel.current?.contains(document.activeElement) || document.activeElement === document.body;
      event.preventDefault();
      restoreOnClose.current = Boolean(owned);
      onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const changeStep = (next: number) => {
    elapsedRef.current = 0;
    setElapsed(0);
    setStep(Math.max(0, Math.min(copy.slides.length, next)));
  };
  const explore = () => {
    close(false);
    if (slide.project) onProject(slide.project);
    else onSwim();
  };

  return (
    <aside
      ref={panel}
      className="tour-panel"
      role="region"
      aria-labelledby={titleId}
      data-manual={manual}
      data-playing={activePlayback}
      data-lenis-prevent
      onFocusCapture={(event) => {
        if (!playback.current?.contains(event.target)) setInteractionPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !hovering.current)
          setInteractionPaused(false);
      }}
      onPointerEnter={() => { hovering.current = true; }}
      onPointerOverCapture={(event) => {
        if (!playback.current?.contains(event.target as Node)) setInteractionPaused(true);
      }}
      onPointerLeave={() => {
        hovering.current = false;
        if (!panel.current?.contains(document.activeElement)) setInteractionPaused(false);
      }}
    >
      <header className="tour-header">
        <span>
          <Sparkles size={13} aria-hidden="true" />
          {copy.eyebrow}
        </span>
        <button
          type="button"
          className="tour-icon"
          aria-label="Exit guided tour"
          onClick={() => close()}
        >
          <X size={17} />
        </button>
      </header>
      <div className="tour-progress" aria-hidden="true">
        {copy.slides.map((item, index) => (
          <span key={item.id}>
            <i
              style={{
                transform: `scaleX(${index < step ? 1 : index === step ? elapsed / 12_000 : 0})`,
              }}
            />
          </span>
        ))}
      </div>
      <div className="tour-content" aria-live="polite" aria-atomic="true">
        <span className="tour-chapter">
          {complete
            ? "05 / 05"
            : `${String(step + 1).padStart(2, "0")} / 05 · ${slide.label}`}
        </span>
        <h3 ref={heading} id={titleId} tabIndex={-1}>{complete ? copy.complete : storyTitle[slide.id] ?? slide.title}</h3>
        {!complete && (artwork ? (
          <figure className="tour-artwork" key={slide.id}>
            <img src={artwork.src} alt={artwork.alt} decoding="async" />
            <figcaption>{artwork.caption}</figcaption>
          </figure>
        ) : (
          <div className="tour-swimming-record"><span>Beyond the screen</span><strong>Freestyle / Breaststroke</strong><span>CIRS swimming team · CV record</span></div>
        ))}
        <p>{complete ? copy.completeDescription : description || slide.description}</p>
        <button
          type="button"
          className="tour-explore"
          onClick={complete ? () => close() : explore}
        >
          {complete ? copy.done : slide.action}
          <ArrowRight size={15} />
        </button>
      </div>
      <footer className="tour-footer">
        <span className="tour-note">
          {manual
            ? copy.manual
            : complete
              ? copy.note
              : `${Math.max(0, 60 - step * 12 - Math.floor(elapsed / 1000))}s remaining · ${obscured ? "paused behind another view" : interactionPaused ? "paused while you interact" : playing ? "no audio" : "paused"}`}
        </span>
        <div className="tour-controls" role="group" aria-label="Tour playback">
          <button
            type="button"
            className="tour-icon"
            aria-label="Previous tour chapter"
            disabled={step === 0}
            onClick={() => changeStep(step - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          {!manual && (
            <button
              ref={playback}
              type="button"
              className="tour-icon"
              aria-label={complete ? "Replay timed tour" : activePlayback ? "Pause tour" : "Resume tour"}
              onClick={() => {
                if (complete) changeStep(0);
                setPlaying(complete || !activePlayback);
                setInteractionPaused(false);
              }}
            >
              {activePlayback ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          <button
            type="button"
            className="tour-icon"
            aria-label="Next tour chapter"
            disabled={complete}
            onClick={() => changeStep(step + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </aside>
  );
}
