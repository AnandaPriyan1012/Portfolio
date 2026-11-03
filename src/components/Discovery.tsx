import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { discoveryContent } from "../content";
import type { Project } from "../content";

type DiscoveryActions = {
  onProject: (id: Project["id"]) => void;
  onSwim: () => void;
};

function useTourEnvironment() {
  const [hidden, setHidden] = useState(() => document.hidden);
  const [manual, setManual] = useState(
    () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off",
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () =>
      setManual(
        media.matches || document.documentElement.dataset.motion === "off",
      );
    const updateVisibility = () => setHidden(document.hidden);
    const observer = new MutationObserver(updateMotion);
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);
  return { hidden, manual };
}

export function GuidedTour({
  onClose,
  onProject,
  onSwim,
}: DiscoveryActions & { onClose: () => void }) {
  const copy = discoveryContent.tour;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const { hidden, manual } = useTourEnvironment();
  const titleId = useId();
  const complete = step >= copy.slides.length;
  const slide = copy.slides[Math.min(step, copy.slides.length - 1)];

  useEffect(() => {
    if (!playing || hidden || manual || complete) return;
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
  }, [step, playing, hidden, manual, complete]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]"))
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
    onClose();
    if (slide.project) onProject(slide.project);
    else onSwim();
  };

  return (
    <aside className="tour-panel" role="region" aria-labelledby={titleId}>
      <header className="tour-header">
        <span>
          <Sparkles size={13} aria-hidden="true" />
          {copy.eyebrow}
        </span>
        <button
          type="button"
          className="tour-icon"
          aria-label="Exit guided tour"
          onClick={onClose}
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
        <h3 id={titleId}>{complete ? copy.complete : slide.title}</h3>
        <p>{complete ? copy.completeDescription : slide.description}</p>
        <button
          type="button"
          className="tour-explore"
          onClick={complete ? onClose : explore}
        >
          {complete ? copy.done : slide.action}
          <ArrowUpRight size={15} />
        </button>
      </div>
      <footer className="tour-footer">
        <span className="tour-note">
          {manual
            ? copy.manual
            : complete
              ? copy.note
              : `${Math.max(0, 60 - step * 12 - Math.floor(elapsed / 1000))}s remaining · no audio`}
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
          {!manual && !complete && (
            <button
              type="button"
              className="tour-icon"
              aria-label={playing ? "Pause tour" : "Resume tour"}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
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
