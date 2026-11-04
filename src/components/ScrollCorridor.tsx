import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const desktopQuery =
  "(min-width: 1100px) and (min-height: 760px) and (pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)";
const frameDuration = 1 / 24;

type DeviceNavigator = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean };
};

function canShowCorridor(enabled: boolean) {
  if (!enabled || !matchMedia(desktopQuery).matches) return false;
  const device = navigator as DeviceNavigator;
  return (
    !device.connection?.saveData &&
    !(device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) &&
    !(device.deviceMemory && device.deviceMemory <= 2)
  );
}

/** Conceptual atmosphere; the actual route cards remain the semantic content. */
export default function ScrollCorridor({ enabled }: { enabled: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(() => canShowCorridor(enabled));
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = eligible && !failed;

  useEffect(() => {
    const query = matchMedia(desktopQuery);
    const connection = (navigator as DeviceNavigator).connection;
    const sync = () => setEligible(canShowCorridor(enabled));
    query.addEventListener("change", sync);
    connection?.addEventListener?.("change", sync);
    sync();
    return () => {
      query.removeEventListener("change", sync);
      connection?.removeEventListener?.("change", sync);
    };
  }, [enabled]);

  useEffect(() => {
    if (!active || !root.current) return;
    const section = root.current.closest(".home-directory");
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    const layer = root.current;
    const element = video.current;
    const section = layer?.closest(".home-directory");
    if (!active || !near || !layer || !element || !section) return;

    gsap.registerPlugin(ScrollTrigger);
    let progress = 0;
    let ready = false;
    let disposed = false;
    let inFlight = false;
    let animationFrame = 0;
    let presentationFrame = 0;
    let presentationTimeout = 0;
    let framePresented = false;
    let seekCompleted = false;
    let seeks = 0;

    // Scroll events only replace this latest target. A seek already being decoded
    // is allowed to finish before the latest position is requested.
    const queue = () => {
      if (disposed || animationFrame || inFlight || document.hidden) return;
      animationFrame = requestAnimationFrame(flush);
    };

    const finishFrame = () => {
      if (presentationFrame) {
        element.cancelVideoFrameCallback(presentationFrame);
        presentationFrame = 0;
      }
      window.clearTimeout(presentationTimeout);
      presentationTimeout = 0;
      inFlight = false;
      layer.dataset.currentTime = element.currentTime.toFixed(3);
      queue();
    };

    const flush = () => {
      animationFrame = 0;
      if (
        disposed ||
        !ready ||
        inFlight ||
        element.seeking ||
        document.hidden
      )
        return;
      const lastFrame = Math.max(0, element.duration - frameDuration);
      const target = Math.min(
        lastFrame,
        Math.round((progress * lastFrame) / frameDuration) * frameDuration,
      );
      layer.dataset.targetTime = target.toFixed(3);
      if (Math.abs(element.currentTime - target) < frameDuration / 2) return;
      inFlight = true;
      framePresented = false;
      seekCompleted = false;
      seeks += 1;
      layer.dataset.seeks = String(seeks);
      // Subscribe before seeking so a fast paused-video decode cannot present
      // its frame before the compositor callback has been registered.
      if (typeof element.requestVideoFrameCallback === "function") {
        presentationFrame = element.requestVideoFrameCallback(() => {
          presentationFrame = 0;
          framePresented = true;
          if (seekCompleted) finishFrame();
        });
      }
      element.currentTime = target;
    };

    const onMetadata = () => {
      ready = Number.isFinite(element.duration) && element.duration > 0;
      layer.dataset.metadata = String(ready);
      queue();
    };

    const onSeeked = () => {
      seekCompleted = true;
      // Wait for the decoded frame to reach the compositor before trailing the
      // latest scroll target. Older browsers use the next event-driven frame.
      if (framePresented) {
        finishFrame();
      } else if (typeof element.requestVideoFrameCallback === "function") {
        // A paused seek may already have been presented before `seeked` fires.
        // Its completion is still a decoded frame; do not stall that browser.
        presentationTimeout = window.setTimeout(finishFrame, 80);
      } else {
        animationFrame = requestAnimationFrame(() => {
          animationFrame = 0;
          finishFrame();
        });
      }
    };

    const onVisibility = () => {
      if (!document.hidden) queue();
    };

    element.addEventListener("loadedmetadata", onMetadata);
    element.addEventListener("seeked", onSeeked);
    document.addEventListener("visibilitychange", onVisibility);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progress = self.progress;
        layer.dataset.progress = progress.toFixed(4);
        queue();
      },
      onRefresh: (self) => {
        progress = self.progress;
        layer.dataset.progress = progress.toFixed(4);
        queue();
      },
    });
    progress = trigger.progress;
    layer.dataset.progress = progress.toFixed(4);
    if (element.readyState >= 1) onMetadata();

    return () => {
      disposed = true;
      trigger.kill();
      cancelAnimationFrame(animationFrame);
      if (presentationFrame)
        element.cancelVideoFrameCallback(presentationFrame);
      window.clearTimeout(presentationTimeout);
      element.removeEventListener("loadedmetadata", onMetadata);
      element.removeEventListener("seeked", onSeeked);
      document.removeEventListener("visibilitychange", onVisibility);
      element.pause();
    };
  }, [active, near]);

  if (!active) return null;
  return (
    <div className="scroll-corridor" ref={root} aria-hidden="true">
      <div className="scroll-corridor-viewport">
        {near && (
          <video
            className="scroll-corridor-film"
            ref={video}
            src="/media/scroll-corridor.mp4"
            poster="/media/scroll-corridor-poster.webp"
            preload="auto"
            muted
            playsInline
            tabIndex={-1}
            disablePictureInPicture
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
