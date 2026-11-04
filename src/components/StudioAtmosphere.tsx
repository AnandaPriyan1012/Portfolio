import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const desktopQuery =
  "(min-width: 1100px) and (min-height: 760px) and (pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference) and (forced-colors: none)";

function canShowAtmosphere(enabled: boolean) {
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

/** A conceptual room atmosphere, separate from the actual film collection. */
export default function StudioAtmosphere({ enabled }: { enabled: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(() => canShowAtmosphere(enabled));
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const active = eligible && !failed;

  useEffect(() => {
    const query = matchMedia(desktopQuery);
    const device = navigator as Navigator & { connection?: EventTarget };
    const sync = () => setEligible(canShowAtmosphere(enabled));
    query.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    sync();
    return () => {
      query.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
    };
  }, [enabled]);

  useEffect(() => {
    if (!active || !video.current) return;
    const element = video.current;
    const stage = element.closest(".studio-atmosphere-stage");
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    if (stage) observer.observe(stage);
    const visibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      element.pause();
    };
  }, [active]);

  useEffect(() => {
    const element = video.current;
    if (!active || !element) return;
    let cancelled = false;
    if (paused || !inView || !documentVisible) {
      element.pause();
    } else {
      element.muted = true;
      void element.play().catch((error: DOMException) => {
        if (!cancelled && error.name !== "AbortError") setPaused(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [active, paused, inView, documentVisible]);

  if (!active) return null;
  return (
    <div className="studio-atmosphere">
      <div className="studio-atmosphere-stage">
        <video
          ref={video}
          className="studio-atmosphere-film"
          src="/media/studio-atmosphere-loop.mp4"
          poster="/media/studio-atmosphere-poster.png"
          aria-hidden="true"
          tabIndex={-1}
          muted
          loop
          playsInline
          autoPlay={!paused}
          preload="metadata"
          onError={() => setFailed(true)}
        />
      </div>
      <div className="studio-atmosphere-control-frame">
        <div className="studio-atmosphere-controls">
          <span>Conceptual room</span>
          <button
            type="button"
            className="studio-atmosphere-toggle"
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
            {paused ? "Play room atmosphere" : "Pause room atmosphere"}
          </button>
        </div>
      </div>
    </div>
  );
}
