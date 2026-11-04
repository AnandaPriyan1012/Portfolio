import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import "./home-cirs-proof.css";

type View = "campus" | "admissions";
type Format = "desktop" | "phone";
type Status = "idle" | "ready" | "failed";
const views = {
  campus: { label: "Campus", title: "Campus overview", address: "cirschool.org", href: "https://cirschool.org", action: "Visit the official CIRS website", source: "atlas-cirs-home", alt: "Actual public CIRS homepage, captured on 4 November 2026" },
  admissions: { label: "Admissions", title: "Admissions Guide", address: "cirschool.org/admissions.html", href: "https://cirschool.org/admissions.html", action: "Visit the CIRS Admissions Guide", source: "atlas-cirs-admissions", alt: "Actual CIRS Admissions Guide introduction with portal and process links, captured on 4 November 2026" },
} as const;
const names: View[] = ["campus", "admissions"];
// One explicit choice survives ordinary SPA case returns; no history or storage.
let rememberedManual: View | null = null;

export default function HomeCirsProof({ onCaseStudy, onImagesUnavailable }: {
  onCaseStudy?: () => void;
  onImagesUnavailable?: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const follow = useRef<HTMLButtonElement>(null);
  const reported = useRef(false);
  const captionId = useId();
  const [metadata, setMetadata] = useState<{ mode: "scroll" | "static"; view: View }>({ mode: "static", view: "admissions" });
  const [format, setFormat] = useState<Format>(() => matchMedia("(max-width: 767px)").matches ? "phone" : "desktop");
  const [forced, setForced] = useState(() => matchMedia("(forced-colors: active)").matches);
  const [manual, setManual] = useState<View | null>(rememberedManual);
  const [focusView, setFocusView] = useState<View | null>(null);
  const [followFocused, setFollowFocused] = useState(false);
  const [followIntent, setFollowIntent] = useState(false);
  const [lastReady, setLastReady] = useState<View | null>(null);
  const [images, setImages] = useState<Record<string, Status>>({});
  const status = (view: View) => images[`${format}:${view}`] ?? "idle";
  const scrollMode = metadata.mode === "scroll" && !forced;
  const requested: View = manual ?? (followIntent ? null : focusView) ?? (scrollMode ? metadata.view : "admissions");
  const other = requested === "campus" ? "admissions" : "campus";
  const effective: View = status(requested) === "ready" ? requested
    : lastReady && status(lastReady) === "ready" ? lastReady
      : status(requested) === "failed" ? other : requested;
  const current = views[effective];
  const bothFailed = names.every(view => status(view) === "failed");
  const following = scrollMode && manual === null && (focusView === null || followIntent);
  const blend = following && names.every(view => status(view) === "ready");

  useLayoutEffect(() => {
    const host = frame.current;
    if (!host) return;
    const phone = matchMedia("(max-width: 767px)"), contrast = matchMedia("(forced-colors: active)");
    const read = () => {
      setMetadata(previous => {
        const next = { mode: host.dataset.proofMode === "scroll" ? "scroll" as const : "static" as const, view: host.dataset.proofView === "campus" ? "campus" as const : "admissions" as const };
        return previous.mode === next.mode && previous.view === next.view ? previous : next;
      });
      setFormat(phone.matches ? "phone" : "desktop");
      setForced(contrast.matches);
    };
    read();
    host.addEventListener("ap:cirs-proof-change", read);
    phone.addEventListener("change", read); contrast.addEventListener("change", read);
    return () => {
      host.removeEventListener("ap:cirs-proof-change", read);
      phone.removeEventListener("change", read); contrast.removeEventListener("change", read);
    };
  }, []);

  useLayoutEffect(() => {
    if (status(effective) === "ready" && lastReady !== effective) setLastReady(effective);
  }, [effective, format, images, lastReady]);

  useEffect(() => {
    if (bothFailed && !reported.current) { reported.current = true; onImagesUnavailable?.(); }
  }, [bothFailed, onImagesUnavailable]);

  function mark(view: View, image: HTMLImageElement, next: Status, source = image.currentSrc) {
    if (!image.isConnected || image.currentSrc !== source) return;
    const imageFormat: Format = source.includes("-mobile.webp") ? "phone" : "desktop";
    setImages(previous => previous[`${imageFormat}:${view}`] === next ? previous : { ...previous, [`${imageFormat}:${view}`]: next });
  }
  function loaded(view: View, image: HTMLImageElement) {
    const source = image.currentSrc;
    void image.decode().then(() => mark(view, image, "ready", source)).catch(() => {
      if (image.complete && image.naturalWidth > 0) mark(view, image, "ready", source);
      else mark(view, image, "failed", source);
    });
  }
  function choose(view: View) {
    if (status(view) === "failed") return;
    rememberedManual = view; setManual(view); setFocusView(view); setFollowIntent(false);
  }
  function focus(event: FocusEvent<HTMLDivElement>) {
    // The case destination is identical for both views. A restored case-link
    // focus must not freeze the pre-restoration view before scroll catches up.
    if ((event.target as HTMLElement).closest(".cirs-scene-case-link")) { setFocusView(null); setFollowIntent(false); return; }
    if ((event.target as HTMLElement) === follow.current) { if (!followIntent) setFocusView(effective); return; }
    setFollowIntent(false); setFocusView(effective);
  }
  function blur(event: FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setFocusView(null); setFollowIntent(false);
  }
  function openCase(event: MouseEvent<HTMLAnchorElement>) {
    if (!onCaseStudy || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onCaseStudy();
  }

  return (
    <div ref={frame} className="cirs-visual-frame home-cirs-proof" data-proof-mode="static" data-proof-view="admissions"
      data-effective-proof={effective} data-proof-owner={manual ? "manual" : focusView && !followIntent ? "focus" : scrollMode ? "scroll" : "static"}
      data-proof-blend={blend || undefined} onFocusCapture={focus} onBlurCapture={blur}>
      <div className="cirs-browser-bar">
        <span className="home-proof-address">{current.address}</span>
        <a className="cirs-scene-case-link" href="/projects/cirs" data-home-origin="cirs-scene" aria-label="Read the CIRS case study" onClick={openCase}>Read case study</a>
      </div>
      <div className="home-proof-controls" role="group" aria-label="Choose a CIRS website view">
        {names.map(view => <button key={view} type="button" aria-label={`Show ${views[view].title}`} aria-pressed={effective === view}
          aria-disabled={status(view) === "failed" || undefined} aria-describedby={captionId} onClick={() => choose(view)}>
          {views[view].label}{status(view) === "failed" && <small>Unavailable</small>}
        </button>)}
        {(scrollMode || followFocused) && <button ref={follow} type="button" className="home-proof-follow" aria-pressed={following}
          aria-disabled={!scrollMode || undefined} onFocus={() => setFollowFocused(true)} onBlur={() => setFollowFocused(false)}
          onClick={() => { if (!scrollMode) return; rememberedManual = null; setManual(null); setFocusView(null); setFollowIntent(true); }}>Follow scroll</button>}
      </div>
      <a className="cirs-browser-body" href={current.href} target="_blank" rel="noopener noreferrer" data-cursor="view" aria-label={current.action}>
        {names.map(view => <picture key={view} className="home-proof-layer" data-proof-layer={view} data-effective={view === effective || undefined} aria-hidden={view !== effective || status(view) === "failed"}>
          <source media="(max-width: 767px)" srcSet={`/media/${views[view].source}-mobile.webp`} width={390} height={1000} />
          <img className={`home-proof-image${view === effective && status(view) !== "failed" ? " cirs-browser-image" : ""}`}
            src={`/media/${views[view].source}-desktop.webp`} alt={view === effective ? views[view].alt : ""} width={1440} height={1000}
            decoding="async" loading="lazy" onLoad={event => loaded(view, event.currentTarget)} onError={event => mark(view, event.currentTarget, "failed")} />
        </picture>)}
        {status(effective) !== "ready" && <div className="home-proof-fallback">
          <strong>{current.title}</strong><p>{bothFailed ? "The captures could not load. Open the school website or read the case study." : status(effective) === "failed" ? "This capture could not load. The source page is still linked here." : "Loading the website capture."}</p>
        </div>}
      </a>
      <p id={captionId} className="home-proof-caption">{bothFailed ? "Website captures unavailable" : `${current.title} · Actual website capture · 4 Nov 2026`}</p>
    </div>
  );
}
