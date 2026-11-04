import { useCallback, useEffect, useRef, useState } from "react";
import "./atelier-states.css";

const sessionKey = "ap-atelier-loader-v3";

function shouldShowOpening(enabled: boolean) {
  if (!enabled || matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  const device = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (
    device.connection?.saveData ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) ||
    (device.deviceMemory && device.deviceMemory <= 2)
  )
    return false;
  try {
    return !sessionStorage.getItem(sessionKey);
  } catch {
    // Access to the website must never depend on optional session storage.
    return false;
  }
}

/** A brief title detail over an already usable page, never a loading gate. */
export default function AtelierLoader({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(() => shouldShowOpening(enabled));
  const [logoFailed, setLogoFailed] = useState(false);
  const opening = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => {
    // A timed title must not discard the keyboard user's current focus.
    if (opening.current?.contains(document.activeElement)) {
      document.querySelector<HTMLElement>(".site-header .wordmark")?.focus({
        preventScroll: true,
      });
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      dismiss();
      return;
    }
    if (!visible) return;
    try {
      sessionStorage.setItem(sessionKey, "seen");
    } catch {
      dismiss();
      return;
    }
    const timeout = window.setTimeout(dismiss, 1450);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const respectMotion = () => {
      if (reduced.matches) dismiss();
    };
    reduced.addEventListener("change", respectMotion);
    return () => {
      window.clearTimeout(timeout);
      reduced.removeEventListener("change", respectMotion);
    };
  }, [visible, enabled, dismiss]);

  if (!visible || !enabled) return null;

  return (
    <div
      ref={opening}
      className="state-opening"
      aria-label="Ananda Priyan opening title"
      data-logo-failed={logoFailed || undefined}
    >
      <div className="state-opening-pane">
        <span className="state-opening-edge" aria-hidden="true" />
        <span className="state-opening-kicker" aria-hidden="true">
          A portfolio by
        </span>
        <div className="state-opening-mark" aria-hidden="true">
          {logoFailed ? (
            <span className="state-signature-fallback">Ananda Priyan</span>
          ) : (
            <>
              <img
                src="/media/ap-signature.png"
                alt=""
                width="750"
                height="500"
                decoding="async"
                onError={() => setLogoFailed(true)}
              />
              <span className="state-signature-ink" />
              <span className="state-signature-glint" />
            </>
          )}
        </div>
        <span className="state-opening-name">Ananda Priyan</span>
        <button
          type="button"
          className="state-opening-skip"
          onClick={dismiss}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
