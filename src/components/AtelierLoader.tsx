import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./atelier-states.css";

const openingDuration = 1600;
const staticDuration = 120;
const pathnameEvent = "ap:pathnamechange";

type Opening = { visible: boolean; animated: boolean; generation: number; path: string };

function pathname() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}
function animationAllowed() {
  if (matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)").matches)
    return false;
  try {
    if (localStorage.getItem("ap-motion") === "off") return false;
  } catch { /* A private browser still gets a bounded opening. */ }
  const device = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  return !device.connection?.saveData &&
    !(device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) &&
    !(device.deviceMemory && device.deviceMemory <= 2);
}

/** A finite black signature stage; page layout, focus and scroll stay live beneath it. */
export default function AtelierLoader() {
  const [state, setState] = useState<Opening>(() => ({
    visible: true, animated: animationAllowed(), generation: 0, path: pathname(),
  }));
  const [logoFailed, setLogoFailed] = useState(false);
  const opening = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const lastPath = useRef(pathname());
  const currentGeneration = useRef(0);
  const beforeSkip = useRef<HTMLElement | null>(null);
  const signatureId = useId().replace(/:/g, "");
  const shapeId = `${signatureId}-shape`;
  const drawingId = `${signatureId}-drawing`;
  const foilId = `${signatureId}-foil`;
  const lightId = `${signatureId}-light`;

  const restoreFocus = useCallback(() => {
    if (!opening.current?.contains(document.activeElement)) return;
    const previous = beforeSkip.current;
    if (previous?.isConnected && !opening.current.contains(previous) && previous !== document.body) {
      previous.focus({ preventScroll: true });
      return;
    }
    const heading = document.querySelector<HTMLElement>("main h1, .notfound-page h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, []);
  const dismiss = useCallback(() => {
    restoreFocus();
    setState((current) => current.visible ? { ...current, visible: false } : current);
  }, [restoreFocus]);

  useEffect(() => {
    const begin = (force = false) => {
      const next = pathname();
      if (!force && next === lastPath.current) return;
      lastPath.current = next;
      const generation = ++currentGeneration.current;
      beforeSkip.current = null;
      setLogoFailed(false);
      setState({ visible: true, animated: animationAllowed(), generation, path: next });
    };
    const changed = () => begin();
    const restored = (event: PageTransitionEvent) => { if (event.persisted) begin(true); };
    window.addEventListener(pathnameEvent, changed);
    window.addEventListener("popstate", changed);
    window.addEventListener("pageshow", restored);
    return () => {
      window.removeEventListener(pathnameEvent, changed);
      window.removeEventListener("popstate", changed);
      window.removeEventListener("pageshow", restored);
    };
  }, []);

  useLayoutEffect(() => {
    if (!state.visible) return;
    document.documentElement.dataset.opening = "active";
    window.dispatchEvent(new CustomEvent("ap:openingchange", { detail: { active: true } }));
    return () => {
      delete document.documentElement.dataset.opening;
      window.dispatchEvent(new CustomEvent("ap:openingchange", { detail: { active: false } }));
    };
  }, [state.visible]);

  useLayoutEffect(() => {
    if (!state.visible) return;
    const generation = state.generation;
    const timeout = window.setTimeout(() => {
      if (currentGeneration.current !== generation) return;
      restoreFocus();
      setState((current) => current.generation === generation ? { ...current, visible: false } : current);
    }, state.animated ? openingDuration : staticDuration);
    const reduced = matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)");
    const respectMotion = () => {
      if (!animationAllowed()) setState((current) => ({ ...current, animated: false }));
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      } else if (event.key === "Tab") {
        // Reveal the page and let native Tab continue from its existing focus
        // target, including Contact→email and a restored case-origin link.
        dismiss();
      } else if (event.target !== skip.current &&
        ["Enter", " ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        dismiss();
      }
    };
    const hidden = () => { if (document.hidden) dismiss(); };
    // Intent dismisses the stage; no body locks, Lenis stops or hidden scrolling.
    const scrollIntent = () => dismiss();
    reduced.addEventListener("change", respectMotion);
    const preference = new MutationObserver(respectMotion);
    preference.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    window.addEventListener("keydown", key, true);
    window.addEventListener("wheel", scrollIntent, { passive: true, capture: true });
    window.addEventListener("touchmove", scrollIntent, { passive: true, capture: true });
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.clearTimeout(timeout);
      reduced.removeEventListener("change", respectMotion);
      preference.disconnect();
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("wheel", scrollIntent, true);
      window.removeEventListener("touchmove", scrollIntent, true);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [state.visible, state.generation, state.animated, dismiss, restoreFocus]);

  if (!state.visible) return null;

  return (
    <div
      ref={opening}
      key={state.generation}
      className="state-opening"
      role="region"
      data-route={state.path}
      data-mode={state.animated ? "animated" : "static"}
      data-generation={state.generation}
      data-cursor="none"
      aria-label="Ananda Priyan opening title"
      data-logo-failed={logoFailed || undefined}
    >
      <div className="state-opening-pane">
        <span className="state-opening-edge" aria-hidden="true" />
        <span className="state-opening-kicker" aria-hidden="true">
          Ananda Priyan
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
        <span className="state-opening-name" aria-hidden="true">Web · Film · Community</span>
        <button
          ref={skip}
          type="button"
          className="state-opening-skip"
          aria-keyshortcuts="Escape"
          onFocus={(event) => {
            if (event.relatedTarget instanceof HTMLElement && !opening.current?.contains(event.relatedTarget))
              beforeSkip.current = event.relatedTarget;
          }}
          onClick={dismiss}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
