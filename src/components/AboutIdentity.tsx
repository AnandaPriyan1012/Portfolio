import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { aboutLanes, creativeMedia, projectAssets } from "../content";
import { hasApprovedNativePlayback } from "../media-readiness";
import { isApprovedDriveEmbed } from "./DriveFilmPlayer";
import InteractiveSignature from "./InteractiveSignature";

type Source = {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  note: string;
  filmId?: string;
};
type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};

const cck = creativeMedia.find((film) => film.id === "cck-trailer");
const farewell = creativeMedia.find((film) => film.id === "farewell-video");
type SourceChoices = { builder: "cirs" | "vallalar"; storyteller: "cck" | "farewell" };
const sourceStorageKey = "ap-about-evidence-v1";
let sourceMemory: SourceChoices | undefined;

function readSourceChoices(): SourceChoices {
  if (!sourceMemory) {
    sourceMemory = { builder: "cirs", storyteller: "cck" };
    try {
      const value: unknown = JSON.parse(sessionStorage.getItem(sourceStorageKey) ?? "null");
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const saved = value as Record<string, unknown>;
        if (saved.builder === "cirs" || saved.builder === "vallalar") sourceMemory.builder = saved.builder;
        if (saved.storyteller === "cck" || saved.storyteller === "farewell") sourceMemory.storyteller = saved.storyteller;
      }
    } catch { /* Source choices still survive ordinary SPA returns in memory. */ }
  }
  return { ...sourceMemory };
}

function rememberSourceChoice(lane: "builder" | "storyteller", id: string): SourceChoices {
  const next = readSourceChoices();
  if (lane === "builder" && (id === "cirs" || id === "vallalar")) next.builder = id;
  if (lane === "storyteller" && (id === "cck" || id === "farewell")) next.storyteller = id;
  sourceMemory = next;
  try { sessionStorage.setItem(sourceStorageKey, JSON.stringify(next)); }
  catch { /* Optional persistence must not block a source selection. */ }
  return next;
}
const evidence: Record<string, Source[]> = {
  builder: [
    {
      id: "cirs", label: "CIRS", src: projectAssets.cirs.previewUrl ?? "",
      width: 1440, height: 1000,
      alt: "Actual CIRS homepage capture, showing the school website",
      caption: "CIRS · Homepage",
      note: "School website work, including Admissions.",
    },
    {
      id: "vallalar", label: "Vallalar", src: projectAssets.community.previewUrl ?? "",
      width: 1440, height: 500,
      alt: "Actual About-page capture from the Vallalar Sathya Dharmasalai website review preview",
      caption: "Vallalar Sathya Dharmasalai · Review preview",
      note: "Voluntary website work · Public review preview.",
    },
  ],
  storyteller: [
    {
      id: "cck", label: "CCK", src: cck?.posterUrl ?? "",
      width: 640, height: 360,
      alt: "A genuine CCK trailer frame showing hands writing in a notebook",
      caption: "CCK trailer", note: cck?.caption ?? "Trailer",
      filmId: "cck-trailer",
    },
    {
      id: "farewell", label: "Farewell AA", src: farewell?.posterUrl ?? "",
      width: 640, height: 360,
      alt: "A photographic montage in the Farewell AA film",
      caption: "Farewell AA", note: farewell?.caption ?? "Farewell film",
      filmId: "farewell-video",
    },
  ],
  curious: [
    {
      id: "accuflow", label: "AccuFlow · Homepage",
      src: "/media/atlas-accuflow-home-desktop.webp", width: 1440, height: 1000,
      alt: "Actual homepage capture of the AccuFlow student product website",
      caption: "A student concept taking shape.",
      note: "Website and interaction prototype.",
    },
  ],
};
const headings: Record<string, [string, string]> = {
  builder: ["CIRS.", "Vallalar."],
  storyteller: ["CCK.", "Farewell AA."],
  swimmer: ["Freestyle.", "Breaststroke."],
  curious: ["AccuFlow.", "AirKart."],
};
const contexts: Record<string, string> = {
  builder: "School & community",
  storyteller: "Film & editing",
  swimmer: "Beyond the screen",
  curious: "Student experiments",
};

export default function AboutIdentity({
  selected,
  onSelect,
  motionEnabled,
  onNavigate,
}: {
  selected: string;
  onSelect: (id: string) => void;
  motionEnabled: boolean;
  onNavigate?: (path: string) => void;
}) {
  const active = aboutLanes.find((lane) => lane.id === selected) ?? aboutLanes[0];
  const [sources, setSources] = useState(readSourceChoices);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [capable, setCapable] = useState(false);
  const [forcedColors, setForcedColors] = useState(false);
  const scene = useRef<HTMLElement>(null);
  const frame = useRef<HTMLElement>(null);
  const beam = useRef<SVGPathElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const previous = useRef<string | null>(null);
  const options = evidence[active.id] ?? [];
  const chosen = active.id === "builder" ? sources.builder : sources.storyteller;
  const source = options.find((item) => item.id === chosen) ?? options[0];
  const film = source?.filmId ? creativeMedia.find((item) => item.id === source.filmId) : undefined;
  const readyFilm = film && (hasApprovedNativePlayback(film) || isApprovedDriveEmbed(film.embedUrl)) ? film : null;
  const selection = `${active.id}:${source?.id ?? "notes"}`;

  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    const device = navigator as Device;
    const sync = () => {
      const lowPower = device.connection?.saveData ||
        (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
        (device.deviceMemory && device.deviceMemory <= 2);
      setForcedColors(contrast.matches);
      setCapable(Boolean(motionEnabled && fine.matches && !reduced.matches &&
        !contrast.matches && !lowPower));
    };
    sync();
    [fine, reduced, contrast].forEach((query) => query.addEventListener("change", sync));
    device.connection?.addEventListener?.("change", sync);
    return () => {
      [fine, reduced, contrast].forEach((query) => query.removeEventListener("change", sync));
      device.connection?.removeEventListener?.("change", sync);
    };
  }, [motionEnabled]);

  useEffect(() => {
    const host = scene.current;
    if (!host) return;
    const changed = previous.current !== null && previous.current !== selection;
    previous.current = selection;
    let start = 0;
    let end = 0;
    const stop = () => {
      cancelAnimationFrame(start);
      clearTimeout(end);
      host.dataset.transition = capable ? "rest" : "static";
    };
    stop();
    if (changed && capable && frame.current && beam.current) {
      const bounds = host.getBoundingClientRect();
      const tab = buttons.current[aboutLanes.findIndex((lane) => lane.id === active.id)]?.getBoundingClientRect();
      const target = frame.current.getBoundingClientRect();
      if (tab) {
        const x = tab.left + tab.width / 2 - bounds.left;
        const y = tab.bottom - bounds.top;
        const right = target.left + 16 - bounds.left;
        const bottom = target.top - bounds.top;
        beam.current.setAttribute("d", `M ${x},${y} V ${(y + bottom) / 2} H ${right} V ${bottom}`);
        start = requestAnimationFrame(() => {
          host.dataset.transition = "playing";
          end = window.setTimeout(stop, 1000);
        });
      }
    }
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [selection, capable, active.id]);

  function keys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % aboutLanes.length;
    else if (event.key === "ArrowLeft") next = (index + aboutLanes.length - 1) % aboutLanes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = aboutLanes.length - 1;
    else return;
    event.preventDefault();
    onSelect(aboutLanes[next].id);
    buttons.current[next]?.focus({ preventScroll: true });
  }
  function navigate(event: MouseEvent<HTMLAnchorElement>, path: string) {
    if (!onNavigate || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(path);
  }
  function link(path: string, label: string) {
    return <a href={path} onClick={(event) => navigate(event, path)}>{label}</a>;
  }

  return (
    <div className="about-identity page-width">
      <header className="about-identity-intro">
        <div className="about-identity-name">
          <p className="section-label">About / Ananda Priyan</p>
          <h1>Ananda Priyan.</h1>
          <p>I build for school and community, make films, and swim.</p>
        </div>
        <div className="about-identity-signature">
          <InteractiveSignature enabled={motionEnabled && !forcedColors} />
        </div>
      </header>

      <section id="about" className="about-identity-interests" ref={scene} aria-labelledby="about-interests-heading" data-transition="static" data-lane={active.id}>
        <h2 id="about-interests-heading">Code, film &amp; freestyle.</h2>
        <svg className="about-identity-beam" aria-hidden="true"><path ref={beam} pathLength="1" /></svg>
        <div className="about-identity-tabs" role="tablist" aria-label="Explore my different lanes">
          {aboutLanes.map((lane, index) => (
            <button key={lane.id} ref={(node) => { buttons.current[index] = node; }}
              type="button" role="tab" id={`lane-${lane.id}`} aria-selected={active.id === lane.id}
              aria-controls="lane-panel" tabIndex={active.id === lane.id ? 0 : -1}
              onClick={() => onSelect(lane.id)} onKeyDown={(event) => keys(event, index)}>
              <span aria-hidden="true">0{index + 1}</span>{lane.label}
            </button>
          ))}
        </div>

        <div id="lane-panel" className="about-identity-panel" role="tabpanel" aria-labelledby={`lane-${active.id}`} tabIndex={0}>
          <div className="about-identity-copy">
            <p className="section-label">{contexts[active.id]}</p>
            <h3>{headings[active.id].map((line) => <span key={line}>{line}</span>)}</h3>
            <p>{active.description}</p>
            {active.id === "swimmer" && <p className="about-identity-quiet">{active.detail}</p>}
            {active.id === "swimmer" && (
              <details className="about-swim-records">
                <summary>Swimming record</summary>
                <p>My CV also records a relay-team bronze at the Infinity State Level Swimming Competition, Life Spring Swimming Club, Coimbatore, in 2026.</p>
              </details>
            )}
            <div className="about-identity-links">
              {active.id === "builder" && <>{link("/projects/cirs", "Read the CIRS project")}{link("/projects/community", "Explore the Vallalar work")}</>}
              {active.id === "storyteller" && link(
                readyFilm ? `/studio#${readyFilm.id}` : "/studio",
                readyFilm ? `Open ${source.caption} in Studio` : "Explore the film collection",
              )}
              {active.id === "curious" && <>{link("/projects/accuflow", "Explore the AccuFlow prototype")}{link("/work#airkart", "See the AirKart experiment")}</>}
            </div>
          </div>

          {active.id === "swimmer" ? (
            <div className="about-identity-evidence about-identity-swimming" ref={(node) => { frame.current = node; }} aria-label="Swimming details">
              <p className="about-identity-source-heading">Swimming / Personal bests</p>
              <div className="about-identity-swim-notes">
                <dl>
                  <div><dt>50 m breaststroke</dt><dd>41.48 <span>s</span></dd></div>
                  <div><dt>100 m freestyle</dt><dd>1 <span>min</span> 6 <span>s</span></dd></div>
                </dl>
                <p>Personal bests recorded in my CV.</p>
              </div>
              <svg className="about-identity-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M .5,.5 H 99.5 V 99.5 H .5 Z" /></svg>
            </div>
          ) : (
            <figure className="about-identity-evidence" ref={frame}>
              <div className="about-identity-source-bar">
                {options.length > 1 ? <div role="group" aria-label={active.id === "builder" ? "Choose a website capture" : "Choose a film still"}>
                  {options.map((item) => <button key={item.id} type="button" aria-pressed={source.id === item.id}
                    onClick={() => setSources(rememberSourceChoice(active.id as "builder" | "storyteller", item.id))}>{item.label}</button>)}
                </div> : <span>{source.label}</span>}
                <span>{active.id === "storyteller" ? "Actual film stills" : "Actual site capture"}</span>
              </div>
              <div className="about-identity-aperture">
                {source.src && !failedSources.includes(source.id) ? <img key={source.id} src={source.src} width={source.width} height={source.height} alt={source.alt} decoding="async"
                  onError={() => setFailedSources((current) => [...current, source.id])} /> : <p className="about-identity-image-fallback">This capture could not load. Explore the project for context.</p>}
                <svg className="about-identity-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M .5,.5 H 99.5 V 99.5 H .5 Z" /></svg>
              </div>
              <figcaption><span>{source.caption}</span><span>{source.note}</span></figcaption>
            </figure>
          )}
        </div>

        <details className="about-identity-perspectives">
          <summary>Read all four perspectives</summary>
          {aboutLanes.map((lane) => <div key={lane.id}><h4>{lane.label}</h4><p>{lane.description}</p></div>)}
        </details>
      </section>
    </div>
  );
}
