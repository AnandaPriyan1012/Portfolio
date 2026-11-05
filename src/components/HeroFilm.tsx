import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const desktopQuery =
  "(min-width: 1100px) and (min-height: 760px) and (pointer: fine) and (hover: hover) and (forced-colors: none) and (prefers-reduced-motion: no-preference)";

function canShowFilm(enabled: boolean) {
  if (!enabled || !matchMedia(desktopQuery).matches) return false;
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: EventTarget & { saveData?: boolean };
  };
  return (
    !device.connection?.saveData &&
    !(device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) &&
    !(device.deviceMemory && device.deviceMemory <= 2)
  );
}

/** A decorative film, kept outside the cropped/scaled still-image scroll layer. */
export default function HeroFilm({
  enabled,
  onAvailability,
}: {
  enabled: boolean;
  onAvailability: (available: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(() => canShowFilm(enabled));
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [sceneVisible, setSceneVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(
    () => !document.hidden,
  );
  const active = eligible && !failed;

  useEffect(() => {
    const query = matchMedia(desktopQuery);
    const device = navigator as Navigator & { connection?: EventTarget };
    const sync = () => setEligible(canShowFilm(enabled));
    query.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    sync();
    return () => {
      query.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
    };
  }, [enabled]);

  useLayoutEffect(() => {
    onAvailability(active);
    return () => onAvailability(false);
  }, [active, onAvailability]);

  useEffect(() => {
    if (!active || !video.current) return;
    const element = video.current;
    const scene = element.closest(".scroll-opening");
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    if (scene) observer.observe(scene);
    const progress = () =>
      setSceneVisible(
        Number((scene as HTMLElement | null)?.dataset.progress ?? 0) < 0.8,
      );
    const progressObserver = new MutationObserver(progress);
    if (scene)
      progressObserver.observe(scene, {
        attributes: true,
        attributeFilter: ["data-progress"],
      });
    progress();
    const visibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      progressObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      element.pause();
    };
  }, [active]);

  useEffect(() => {
    const element = video.current;
    if (!active || !element) return;
    let cancelled = false;
    if (paused || !inView || !sceneVisible || !documentVisible) {
      element.pause();
    } else {
      element.muted = true;
      element.playbackRate = 0.75;
      void element.play().catch((error: DOMException) => {
        if (!cancelled && error.name !== "AbortError") setPaused(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [active, paused, inView, sceneVisible, documentVisible]);

  if (!active) return null;
  return (
    <>
      <div className="hero-film-stage" aria-hidden="true">
        <video
          ref={video}
          className="hero-ambient-film"
          src="/media/amber-architecture-loop.mp4"
          poster="/media/amber-architecture-poster.webp"
          muted
          loop
          playsInline
          autoPlay={!paused}
          preload="metadata"
          tabIndex={-1}
          onError={() => setFailed(true)}
        />
      </div>
      <button
        type="button"
        className="hero-film-toggle"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        <span className="hero-film-state" aria-hidden="true">
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </span>
        {paused ? "Play ambient film" : "Pause ambient film"}
      </button>
    </>
  );
}
