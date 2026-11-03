import { useEffect, useState } from "react";
import "./atelier-states.css";

const sessionKey = "ap-atelier-loader-v2";

function shouldShowOpening(enabled: boolean) {
  if (!enabled || matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (
    connection?.saveData ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2)
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

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    if (!visible) return;
    try {
      sessionStorage.setItem(sessionKey, "seen");
    } catch {
      setVisible(false);
      return;
    }
    const timeout = window.setTimeout(() => setVisible(false), 1450);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const respectMotion = () => {
      if (reduced.matches) setVisible(false);
    };
    reduced.addEventListener("change", respectMotion);
    return () => {
      window.clearTimeout(timeout);
      reduced.removeEventListener("change", respectMotion);
    };
  }, [visible, enabled]);

  if (!visible || !enabled) return null;

  return (
    <div className="state-opening" aria-label="Ananda Priyan opening title">
      <div className="state-opening-pane">
        <span className="state-opening-edge" aria-hidden="true" />
        <div className="state-opening-mark" aria-hidden="true">
          {logoFailed ? (
            <span className="state-signature-fallback">AP.</span>
          ) : (
            <img
              src="/media/ap-signature.png"
              alt=""
              width="120"
              height="96"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>
        <span className="state-opening-name">Ananda Priyan</span>
        <button
          type="button"
          className="state-opening-skip"
          onClick={() => setVisible(false)}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
