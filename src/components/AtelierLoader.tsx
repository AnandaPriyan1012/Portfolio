import { useCallback, useEffect, useId, useRef, useState } from "react";
import "./atelier-states.css";

const sessionKey = "ap-atelier-loader-v4";
const openingDuration = 2400;

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

/** A bounded signature film over an already usable page, never a loading gate. */
export default function AtelierLoader({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(() => shouldShowOpening(enabled));
  const [logoFailed, setLogoFailed] = useState(false);
  const opening = useRef<HTMLDivElement>(null);
  const signatureId = useId().replace(/:/g, "");
  const shapeId = `${signatureId}-shape`;
  const drawingId = `${signatureId}-drawing`;
  const foilId = `${signatureId}-foil`;
  const lightId = `${signatureId}-light`;
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
    const timeout = window.setTimeout(dismiss, openingDuration);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const respectMotion = () => {
      if (reduced.matches) dismiss();
    };
    const skipOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    reduced.addEventListener("change", respectMotion);
    window.addEventListener("keydown", skipOnEscape);
    return () => {
      window.clearTimeout(timeout);
      reduced.removeEventListener("change", respectMotion);
      window.removeEventListener("keydown", skipOnEscape);
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
            <svg
              className="state-signature-drawing"
              viewBox="0 0 768 512"
              width="768"
              height="512"
              focusable="false"
            >
              <defs>
                {/* The supplied PNG alpha is the only visible letter shape.
                    The broad guide strokes below reveal it; they never render. */}
                <mask
                  id={shapeId}
                  x="0"
                  y="0"
                  width="768"
                  height="512"
                  maskUnits="userSpaceOnUse"
                  style={{ maskType: "alpha" }}
                >
                  <image
                    href="/media/ap-signature.png"
                    width="768"
                    height="512"
                    onError={() => setLogoFailed(true)}
                  />
                </mask>
                <mask
                  id={drawingId}
                  x="0"
                  y="0"
                  width="768"
                  height="512"
                  maskUnits="userSpaceOnUse"
                  style={{ maskType: "luminance" }}
                >
                  <g
                    fill="none"
                    stroke="white"
                    strokeWidth="44"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      className="state-signature-stroke state-signature-ascender"
                      pathLength="1"
                      d="M 130,371 C 218,363 272,232 350,127 C 396,66 438,28 451,32 C 464,35 405,169 386,240 C 369,304 387,336 411,294 L 487,154"
                    />
                    <path
                      className="state-signature-stroke state-signature-crossbar"
                      pathLength="1"
                      d="M 156,287 C 116,318 99,352 126,372 C 164,404 237,306 293,251 C 359,206 449,175 514,164 C 571,156 561,197 522,235 C 465,290 382,326 330,335 C 309,340 341,304 398,266"
                    />
                    <path
                      className="state-signature-stroke state-signature-downstroke"
                      pathLength="1"
                      d="M 487,154 C 459,214 408,340 379,438 C 365,478 370,486 400,480"
                    />
                    <path
                      className="state-signature-stroke state-signature-flourish"
                      pathLength="1"
                      d="M 308,210 C 378,149 488,91 573,101 C 649,106 683,140 628,204 C 567,272 461,310 364,329"
                    />
                  </g>
                </mask>
                <linearGradient id={foilId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f9eed1" />
                  <stop offset=".38" stopColor="#b79a63" />
                  <stop offset=".58" stopColor="#f4e2b5" />
                  <stop offset="1" stopColor="#a88a59" />
                </linearGradient>
                <linearGradient id={lightId}>
                  <stop offset="0" stopColor="#fff6da" stopOpacity="0" />
                  <stop offset=".5" stopColor="#fff9e8" stopOpacity=".9" />
                  <stop offset="1" stopColor="#fff6da" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g mask={`url(#${shapeId})`}>
                <rect
                  width="768"
                  height="512"
                  fill={`url(#${foilId})`}
                  mask={`url(#${drawingId})`}
                />
                <rect
                  className="state-signature-settle"
                  width="768"
                  height="512"
                  fill={`url(#${foilId})`}
                />
                <rect
                  className="state-signature-glint"
                  x="-320"
                  width="320"
                  height="512"
                  fill={`url(#${lightId})`}
                />
              </g>
            </svg>
          )}
        </div>
        <span className="state-opening-name">Ananda Priyan</span>
        <button
          type="button"
          className="state-opening-skip"
          aria-keyshortcuts="Escape"
          onClick={dismiss}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
