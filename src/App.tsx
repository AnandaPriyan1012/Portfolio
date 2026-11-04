import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X, Plus, Sun, Moon } from "lucide-react";
import {
  siteContent as copy,
  projects,
  projectAssets,
  projectStatus,
  creativeMedia,
  resolveCreativeMedia,
  achievements,
  experiments,
  experienceContent,
  interfaceCopy,
  directorsCut,
  scrollStoryCopy,
} from "./content";
import { hasApprovedNativePlayback } from "./media-readiness";
import type { Project } from "./content";
import CaseStudyPage from "./components/CaseStudyPage";
import OSExperience from "./components/OSExperience";
import GlassMaterial from "./components/GlassMaterial";
import NotFound from "./components/NotFound";
import useScrollStory from "./animation/useScrollStory";
import useActiveSection from "./animation/useActiveSection";
import useVisitTrail from "./hooks/useVisitTrail";
import { GuidedTour } from "./components/Discovery";
import AtelierNavigation from "./components/AtelierNavigation";
import ScreeningRoom from "./components/ScreeningRoom";
import HeroFilm from "./components/HeroFilm";
import HomeCirsProof from "./components/HomeCirsProof";
import WorkPage from "./components/WorkPage";
import HomeDirectory from "./components/HomeDirectory";
import AboutIdentity from "./components/AboutIdentity";
import GlassCursor from "./components/GlassCursor";
import IdentityCard from "./components/IdentityCard";
import NativeFilmPlayer from "./components/NativeFilmPlayer";
import DriveFilmPlayer, {
  isApprovedDriveEmbed,
} from "./components/DriveFilmPlayer";

type ModalState =
  | { type: "project"; id: Project["id"] }
  | { type: "media"; id: string; startAt?: number }
  | { type: "contact" }
  | null;

function normalizedPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") {
    const id = window.location.hash.slice(1);
    const workIds = [
      "work",
      "cirs",
      "community",
      "accuflow",
      "airkart",
      "experiments",
    ];
    const aboutIds = ["about", "recognition", "contact"];
    const destination = workIds.includes(id)
      ? "/work"
      : aboutIds.includes(id)
        ? "/about"
        : id === "studio"
          ? "/studio"
          : null;
    if (destination) {
      history.replaceState(
        history.state,
        "",
        `${destination}${window.location.hash}`,
      );
      return destination;
    }
  }
  return path;
}

type HistoryFocus = { href: string; occurrence: number };
type HistoryPosition = { key: string; url: string; top: number; focus?: HistoryFocus };
const historyStateKey = "apPortfolioPosition";
const historyCacheKey = "ap-history-positions-v1";

function historyPosition(): HistoryPosition {
  const url = `${location.pathname}${location.hash}`;
  const saved = history.state?.[historyStateKey] as HistoryPosition | undefined;
  if (saved && typeof saved.key === "string" && saved.url === url && Number.isFinite(saved.top))
    return saved;
  const position = { key: crypto.randomUUID(), url, top: window.scrollY };
  history.replaceState({ ...history.state, [historyStateKey]: position }, "");
  return position;
}

function readHistoryPositions(initial: HistoryPosition) {
  const entries = new Map<string, HistoryPosition>();
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(historyCacheKey) ?? "[]");
    if (Array.isArray(saved)) saved.slice(-64).forEach((item) => {
      if (!item || typeof item.key !== "string" || typeof item.url !== "string" ||
          !item.url.startsWith("/") || !Number.isFinite(item.top)) return;
      const focus = item.focus && typeof item.focus.href === "string" &&
        Number.isInteger(item.focus.occurrence) && item.focus.occurrence >= 0
        ? { href: item.focus.href, occurrence: item.focus.occurrence } : undefined;
      entries.set(item.key, { key: item.key, url: item.url, top: Math.max(0, item.top), focus });
    });
  } catch { /* Optional session history must not prevent navigation. */ }
  if (!entries.has(initial.key)) entries.set(initial.key, initial);
  return entries;
}

function historyFocus(active: Element | null = document.activeElement): HistoryFocus | undefined {
  if (!(active instanceof HTMLAnchorElement) || !document.querySelector("main")?.contains(active)) return;
  const href = active.getAttribute("href");
  if (!href) return;
  const peers = [...document.querySelectorAll<HTMLAnchorElement>("main a[href]")]
    .filter((link) => link.getAttribute("href") === href);
  const occurrence = peers.indexOf(active);
  if (occurrence >= 0) return { href, occurrence };
}

function restoreHistoryFocus(origin?: HistoryFocus) {
  if (!origin) return;
  const target = [...document.querySelectorAll<HTMLAnchorElement>("main a[href]")]
    .filter((link) => link.getAttribute("href") === origin.href)[origin.occurrence];
  const bounds = target?.getBoundingClientRect();
  // Only the exact native origin in the restored viewport can take focus.
  if (target && bounds && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight) {
    target.focus({ preventScroll: true });
    return document.activeElement === target;
  }
}

function readStorage(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function usePreferences() {
  const [theme, setTheme] = useState(() =>
    readStorage("ap-atelier-theme", "dark"),
  );
  const [motion, setMotion] = useState(
    () => readStorage("ap-motion", "on") !== "off",
  );
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = motion && !reduced ? "on" : "off";
    try {
      localStorage.setItem("ap-atelier-theme", theme);
      localStorage.setItem("ap-motion", motion ? "on" : "off");
    } catch {
      /* Preferences are optional. */
    }
  }, [theme, motion, reduced]);
  return { theme, setTheme, motion: motion && !reduced, setMotion, reduced };
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="atelier-dialog"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-body">
        <button
          className="dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={21} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

function ScrollOpening({
  onWork,
  onCaseStudy,
  onImageError,
  onDirector,
  motionEnabled,
}: {
  onWork: () => void;
  onCaseStudy?: () => void;
  onImageError: () => void;
  onDirector: () => void;
  motionEnabled: boolean;
}) {
  const [filmActive, setFilmActive] = useState(false);
  return (
    <section
      className="scroll-opening"
      data-hero-film={filmActive ? "active" : undefined}
      aria-label="Introduction and CIRS project scene"
    >
      <div className="hero-room" aria-hidden="true">
        <picture>
          <source
            media="(max-width:767px)"
            srcSet="/media/atelier-room-portrait.webp"
          />
          <source
            media="(max-width:1023px)"
            srcSet="/media/atelier-room-tablet.webp"
          />
          <img
            src="/media/atelier-room-wide.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <span className="hero-material-light" />
      </div>
      <HeroFilm enabled={motionEnabled} onAvailability={setFilmActive} />
      <div className="hero-optical-pane" aria-hidden="true" />
      <div className="hero-story-copy">
        <p className="hero-eyebrow">Ananda Priyan · Selected work</p>
        <h1 aria-label="Ananda Priyan">
          <span>Ananda</span> <span>Priyan</span>
        </h1>
        <p className="hero-factual-intro">{scrollStoryCopy.introduction}</p>
        <button className="view-work-button" onClick={onWork}>
          View Work
        </button>
        {directorsCut.videoUrl && directorsCut.credits && (
          <button
            className="director-film-link"
            data-cursor="play"
            onClick={onDirector}
          >
            Play Director’s Cut
          </button>
        )}
      </div>
      <div className="opening-edition" aria-hidden="true">
        <span>Web / Film / Community</span>
        <span className="opening-scroll-cue">
          Scroll to enter <i />
        </span>
      </div>
      <div className="cirs-scene-title">
        <span>CIRS Website</span>
        <a href="https://cirschool.org" target="_blank" rel="noreferrer">
          Visit the live website
        </a>
      </div>
      <HomeCirsProof onCaseStudy={onCaseStudy} onImagesUnavailable={onImageError} />
      <div className="cirs-scene-captions">
        {scrollStoryCopy.captions.map((caption) => (
          <p key={caption.label}>
            <span>{caption.label}</span>
            {caption.text}
          </p>
        ))}
      </div>
    </section>
  );
}

function DecisionRoom() {
  const room = experienceContent.decision;
  const [choice, setChoice] = useState<"now" | "batch" | null>(null);
  const [lens, setLens] = useState("technology");
  const [rate, setRate] = useState(4);
  const [batch, setBatch] = useState(2);
  const result = room.options.find((item) => item.id === choice);
  const perspective = room.perspectives.find((item) => item.id === lens)!;
  return (
    <div className="decision-room">
      <h4>One order. Your call.</h4>
      <p>{room.description}</p>
      <div
        className="decision-options"
        role="group"
        aria-label="Choose a drone dispatch strategy"
      >
        {room.options.map((item) => (
          <button
            key={item.id}
            aria-pressed={choice === item.id}
            onClick={() => setChoice(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="decision-result" aria-live="polite" aria-atomic="true">
        {result ? (
          <>
            <div className="decision-metrics">
              <span>
                <strong>{result.wait} min</strong>Batching wait
              </span>
              <span>
                <strong>{result.cost} credits</strong>Illustrative delivery cost
              </span>
            </div>
            <p>{result.result}</p>
          </>
        ) : (
          <p className="decision-invitation">
            Choose a route to see what changes.
          </p>
        )}
      </div>
      <p className="illustrative-note">{room.disclaimer}</p>
      <details className="perspectives">
        <summary>
          One question, three perspectives
          <Plus size={15} />
        </summary>
        <div
          className="perspective-tabs"
          role="group"
          aria-label="Choose a perspective"
        >
          {room.perspectives.map((item) => (
            <button
              key={item.id}
              aria-pressed={lens === item.id}
              onClick={() => setLens(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          <h5>{perspective.title}</h5>
          <p>{perspective.description}</p>
        </div>
      </details>
      <details className="lab">
        <summary>
          {interfaceCopy.lab.title}
          <Plus size={15} />
        </summary>
        <p>{interfaceCopy.lab.description}</p>
        <label htmlFor="arrival-rate">
          Order arrival rate<span>{rate} per 10 minutes</span>
          <input
            id="arrival-rate"
            type="range"
            min="1"
            max="12"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        <label htmlFor="batch-size">
          Orders sharing a journey<span>{batch} orders</span>
          <input
            id="batch-size"
            type="range"
            min="2"
            max="4"
            value={batch}
            onChange={(e) => setBatch(Number(e.target.value))}
          />
        </label>
        <div className="lab-metrics" aria-live="polite">
          <span>
            <strong>{(((batch - 1) * (10 / rate)) / 2).toFixed(1)} min</strong>
            Average batching wait
          </span>
          <span>
            <strong>{(2 + 12 / batch).toFixed(1)}</strong>Demo credits per order
          </span>
        </div>
        <p className="lab-note">{interfaceCopy.lab.note}</p>
      </details>
    </div>
  );
}

function Comparison({ before, after }: { before: string; after: string }) {
  const [position, setPosition] = useState(50);
  return (
    <div className="comparison">
      <div className="comparison-images">
        <img src={after} alt="Finished CIRS page" />
        <img
          src={before}
          alt="Original CIRS wireframe"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
      </div>
      <label>
        Early wireframe to finished page
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Compare original wireframe and finished page"
        />
      </label>
    </div>
  );
}

export default function App() {
  const preferences = usePreferences();
  const [modal, setModal] = useState<ModalState>(null);
  const [osOpen, setOsOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lane, setLane] = useState("builder");
  const [cirsImageFailed, setCirsImageFailed] = useState(false);
  const [cut, setCut] = useState<"quick" | "director">("quick");
  const [question, setQuestion] = useState<string | null>(null);
  const [route, setRoute] = useState(normalizedPath());
  const { visitedPaths, resetVisits } = useVisitTrail(route);
  const [initialNavigation] = useState(() => {
    const entry = historyPosition();
    const positions = readHistoryPositions(entry);
    return { entry: positions.get(entry.key)!, positions };
  });
  const initialHistory = initialNavigation.entry;
  const activeHistory = useRef(initialHistory);
  const historyPositions = useRef(initialNavigation.positions);
  const navigationSequence = useRef(0);
  const historyIntent = useRef<{ sequence: number; cancelled: boolean } | null>(null);

  const caseReturn = useRef<{ path: string; top: number; originHref?: string; originToken?: string; originFocus?: HistoryFocus }>({ path: "/work", top: 0 });
  const currentProject = projects.find(
    (project) => route === `/projects/${project.id}`,
  );
  const mainRoutes = ["/", "/work", "/studio", "/about"];
  const isNotFound = !mainRoutes.includes(route) && !currentProject;
  const mainPage =
    route === "/work"
      ? "work"
      : route === "/studio"
        ? "studio"
        : route === "/about"
          ? "about"
          : "home";
  const section = useActiveSection(
    mainPage === "about" && !currentProject && !isNotFound,
  );
  const activeSection =
    mainPage === "about"
      ? section === "contact"
        ? "contact"
        : "about"
      : mainPage;
  const project =
    modal?.type === "project"
      ? projects.find((item) => item.id === modal.id)
      : undefined;
  const media =
    modal?.type === "media"
      ? modal.id === "directors-cut"
        ? directorsCut
        : resolveCreativeMedia(modal.id)
      : undefined;
  const airkart = projects.find((item) => item.id === "airkart")!;
  const mainRef = useRef<HTMLElement>(null);
  const storyMotion = useScrollStory({
    root: mainRef,
    enabled:
      preferences.motion &&
      Boolean(projectAssets.cirs.previewUrl) &&
      !cirsImageFailed,
    route,
  });
  const contactReady = Boolean(
    copy.contact.email || copy.contact.socials.length,
  );
  function saveHistoryPosition(persist = true, focus = historyFocus()) {
    const position = { ...activeHistory.current, top: window.scrollY, focus };
    historyPositions.current.set(position.key, position);
    // Keep the cache bounded by history entries, rather than by pathname: two
    // visits to Studio can have different positions and native origin links.
    if (historyPositions.current.size > 64)
      historyPositions.current.delete(historyPositions.current.keys().next().value!);
    if (persist && history.state?.[historyStateKey]?.key === position.key)
      history.replaceState({ ...history.state, [historyStateKey]: position }, "");
    try {
      // Preserve newer positions of Forward entries across a reload of an
      // earlier entry. No scroll polling, retry timers or per-frame writes.
      sessionStorage.setItem(historyCacheKey, JSON.stringify([...historyPositions.current.values()]));
    } catch { /* History still works within this document without storage. */ }
  }
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    // A reload can reuse this entry's own position. Fresh hash links retain
    // the existing anchor coordinator and its loading/layout correction.
    if (!location.hash && initialHistory.top > 0)
      storyMotion.restoreTo(initialHistory.top, route);
    const save = () => saveHistoryPosition();
    const cancelRestore = () => {
      if (historyIntent.current) historyIntent.current.cancelled = true;
    };
    window.addEventListener("wheel", cancelRestore, { passive: true });
    window.addEventListener("touchstart", cancelRestore, { passive: true });
    window.addEventListener("pointerdown", cancelRestore, { passive: true });
    window.addEventListener("keydown", cancelRestore);
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    return () => {
      history.scrollRestoration = previous;
      window.removeEventListener("wheel", cancelRestore);
      window.removeEventListener("touchstart", cancelRestore);
      window.removeEventListener("pointerdown", cancelRestore);
      window.removeEventListener("keydown", cancelRestore);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
    };
  }, []);
  useEffect(() => {
    const back = () => {
      // popstate has already selected the destination entry, so preserve the
      // outgoing entry in memory before pin cleanup changes its native Y.
      saveHistoryPosition(false);
      const entry = historyPosition();
      const saved = historyPositions.current.get(entry.key) ?? entry;
      activeHistory.current = saved;
      const sequence = ++navigationSequence.current;
      const intent = { sequence, cancelled: false };
      historyIntent.current = intent;
      const next = normalizedPath();
      if (next !== route) storyMotion.beforeNavigate();
      setRoute(next);
      setModal(null);
      setMenuOpen(false);
      setOsOpen(false);
      setTourOpen(false);
      requestAnimationFrame(() => {
        if (sequence !== navigationSequence.current || activeHistory.current.key !== saved.key || intent.cancelled) return;
        const studioProjectReturn = next === "/studio" && location.hash === "#cirs-website-launch" &&
          saved.focus?.href === "/projects/cirs";
        const workProjectReturn = next === "/work" && route.startsWith("/projects/") &&
          saved.focus?.href === route;
        if (location.hash && !studioProjectReturn && !workProjectReturn) {
          historyIntent.current = null;
          if (next.startsWith("/projects/")) {
            // Keep the reader's native section focus and CSS scroll margin.
            // A late smooth scroll must not overwrite the next reading move.
            try {
              document.getElementById(decodeURIComponent(location.hash.slice(1)))
                ?.scrollIntoView({ behavior: "instant" });
            } catch { /* Invalid fragments retain the current reading position. */ }
          } else {
            storyMotion.scrollTo(location.hash);
            focusDestination();
          }
        } else storyMotion.restoreTo(saved.top, next, () => {
          if (sequence === navigationSequence.current && activeHistory.current.key === saved.key && !intent.cancelled) {
            historyIntent.current = null;
            restoreHistoryFocus(saved.focus);
          }
        }, { preserveHash: studioProjectReturn || workProjectReturn });
      });
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [route, storyMotion.beforeNavigate, storyMotion.restoreTo, storyMotion.scrollTo]);
  useEffect(() => {
    const coverDialogs = (event: Event) => {
      if (!(event as CustomEvent<{ active: boolean }>).detail?.active) return;
      // The persistent opening can commit before App's history update. Close
      // the native top layer in that same layout phase so no film frame leaks.
      document.querySelectorAll<HTMLDialogElement>(".atelier-dialog[open]").forEach((dialog) => {
        dialog.querySelectorAll<HTMLMediaElement>("video, audio").forEach((media) => media.pause());
        dialog.close();
      });
      setModal(null);
    };
    window.addEventListener("ap:openingchange", coverDialogs);
    return () => window.removeEventListener("ap:openingchange", coverDialogs);
  }, []);
  useEffect(() => {
    setCut("quick");
    setQuestion(null);
  }, [modal]);
  useEffect(() => {
    if (isNotFound) return;
    document.title = currentProject
      ? `${currentProject.title} — Ananda Priyan`
      : mainPage === "home"
        ? copy.title
        : `${mainPage === "work" ? "Selected work" : mainPage === "studio" ? "The screening room" : "About & contact"} — Ananda Priyan`;
    if (currentProject) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("has-entered");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [currentProject, isNotFound, mainPage]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setMenuOpen(false);
      document
        .querySelector<HTMLButtonElement>(".atelier-navigation .menu-button")
        ?.focus();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);
  function focusDestination(originHref?: string, originToken?: string, originFocus?: HistoryFocus) {
    const main = document.querySelector("main");
    if (originToken === "tour-launcher") {
      const origin = document.querySelector<HTMLElement>('[data-navigation-origin="tour-launcher"]');
      const bounds = origin?.getBoundingClientRect();
      if (origin && bounds && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight) {
        origin.focus({ preventScroll: true });
        return;
      }
    }
    if (originToken && main?.dataset.page === "home" && !window.location.hash) {
      const origin = [...main.querySelectorAll<HTMLAnchorElement>("a[data-home-origin]")]
        .find((link) => link.dataset.homeOrigin === originToken);
      if (origin && origin.getClientRects().length) {
        origin.focus({ preventScroll: true });
        return;
      }
    }
    if (originFocus && (!window.location.hash || (originToken === "studio-project" || originToken === "work-project")) && restoreHistoryFocus(originFocus)) return;
    // Legacy/programmatic origins retain their existing project-link fallback.
    // A missing exact native origin must not select a different duplicate.
    if (!originFocus && originHref && main && ["about", "work"].includes(main.dataset.page ?? "") && !window.location.hash) {
      const links = main.dataset.page === "about" ? ".about-identity-links a" : ".work-page a[href]";
      const origin = [...main.querySelectorAll<HTMLAnchorElement>(links)]
        .find((link) => link.getAttribute("href") === originHref);
      if (origin) {
        origin.focus({ preventScroll: true });
        return;
      }
    }
    let focusTarget = main?.querySelector<HTMLElement>("h1");
    if (window.location.hash) {
      try {
        const target = document.getElementById(
          decodeURIComponent(window.location.hash.slice(1)),
        );
        if (target && main?.contains(target)) {
          const headings = "h1, h2, h3, h4, h5, h6";
          const closedDisclosure = target instanceof HTMLDetailsElement && !target.open;
          focusTarget = closedDisclosure
            ? target.querySelector<HTMLElement>(":scope > summary") ?? target
            : target.matches(headings)
            ? target
            : target.querySelector<HTMLElement>(headings) ?? target;
        }
      } catch {
        // An invalid fragment retains the page-heading focus fallback.
      }
    }
    if (focusTarget) {
      // A summary already has native focus and Enter/Space behaviour.
      if (!focusTarget.matches("summary")) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
  }
  function navigate(destination: string, {
    restoreTop = 0, originHref, originToken, originFocus, departureFocus,
  }: {
    restoreTop?: number;
    originHref?: string;
    originToken?: string;
    originFocus?: HistoryFocus;
    departureFocus?: HistoryFocus;
  } = {}) {
    const next = destination.split("#")[0].replace(/\/+$/, "") || "/";
    saveHistoryPosition(true, departureFocus);
    historyIntent.current = null;
    const sequence = ++navigationSequence.current;
    if (next !== route) storyMotion.beforeNavigate();
    setMenuOpen(false);
    setModal(null);
    setTourOpen(false);
    setOsOpen(false);
    const position: HistoryPosition = { key: crypto.randomUUID(), url: destination, top: restoreTop };
    history.pushState({ [historyStateKey]: position }, "", destination);
    activeHistory.current = position;
    historyPositions.current.set(position.key, position);
    setRoute(normalizedPath());
    window.dispatchEvent(new Event("ap:pathnamechange"));
    requestAnimationFrame(() => {
      if (sequence !== navigationSequence.current) return;
      // These returns retain film or chapter fragments while restoring the
      // original reading position. Fresh fragment links still reach their anchor.
      const preservingSelection = originToken === "tour-launcher" || originToken === "studio-project" || originToken === "work-project";
      const restoringOrigin = Boolean(originToken || originFocus);
      if (window.location.hash && !preservingSelection) {
        // Selecting another lane changes its height and refreshes the layout.
        // A direct same-page handoff survives that refresh on native scrollers.
        const laneHandoff = next === route && next === "/about" && window.location.hash === "#about";
        storyMotion.scrollTo(window.location.hash, { immediate: laneHandoff });
      } else storyMotion.restoreTo(restoreTop, next, restoringOrigin ? () => {
        if (sequence === navigationSequence.current) focusDestination(originHref, originToken, originFocus);
      } : undefined, { preserveHash: preservingSelection });
      if (!restoringOrigin || (window.location.hash && !preservingSelection)) focusDestination(originHref);
    });
  }
  function navigateSection(id: string) {
    navigate(id === "contact" ? "/about#contact" : `/${id}`);
  }
  function selectStudioFilm(id: string) {
    if (route !== "/studio" || location.pathname.replace(/\/+$/, "") !== "/studio") return;
    const film = creativeMedia.find((item) => item.id === id);
    if (!film || (!hasApprovedNativePlayback(film) && !isApprovedDriveEmbed(film.embedUrl))) return;
    const fragment = `#${encodeURIComponent(film.id)}`;
    const destination = `${location.pathname}${location.search}${fragment}`;
    const position = { ...activeHistory.current, url: `${location.pathname}${fragment}`, top: scrollY, focus: historyFocus() };
    // A deliberate film choice updates this entry without moving the reader
    // or adding a history entry. Preserve other framework metadata and its key.
    history.replaceState({ ...history.state, [historyStateKey]: position }, "", destination);
    activeHistory.current = position;
    saveHistoryPosition(false);
  }
  function page(id: Project["id"], aboutHref?: string, originToken?: string, actualOriginAnchor?: HTMLAnchorElement) {
    const focused = document.activeElement;
    const workHref = route === "/work" && focused instanceof HTMLAnchorElement &&
      focused.closest(".work-page") && focused.getAttribute("href") === `/projects/${id}`
      ? focused.getAttribute("href")! : undefined;
    const originHref = route === "/about" ? aboutHref : workHref;
    const studioProject = route === "/studio" && originToken === "studio-project";
    const nativeOrigin = (["/about", "/work"].includes(route) || studioProject)
      ? historyFocus(actualOriginAnchor ?? focused) : undefined;
    const originFocus = nativeOrigin?.href === `/projects/${id}` ? nativeOrigin : undefined;
    const workProject = route === "/work" && Boolean(originFocus);
    caseReturn.current = { path: originToken === "tour-launcher" || studioProject || workProject ? `${route}${window.location.hash}` : route,
      top: scrollY, ...(originHref ? { originHref } : {}),
      ...(originFocus ? { originFocus } : {}),
      ...((route === "/" && (originToken === "selected-preview" || originToken === "cirs-scene")) ||
        (mainRoutes.includes(route) && originToken === "tour-launcher") || studioProject ? { originToken } : {}),
      ...(workProject ? { originToken: "work-project" } : {}) };
    navigate(`/projects/${id}`, { departureFocus: originFocus });
  }
  function home() {
    const { path, top, originHref, originToken, originFocus } = caseReturn.current;
    navigate(path, { restoreTop: top, originHref, originToken, originFocus });
  }
  function quick(id: Project["id"]) {
    setOsOpen(false);
    setModal({ type: "project", id });
  }
  function swim() {
    setOsOpen(false);
    setLane("swimmer");
    navigate("/about#about");
  }
  if (isNotFound)
    return (
      <>
        <GlassCursor enabled={preferences.motion} />
        <NotFound onHome={() => navigate("/")} />
      </>
    );
  if (currentProject)
    return (
      <>
        <GlassCursor enabled={preferences.motion} />
        <CaseStudyPage
          project={currentProject}
          motionEnabled={preferences.motion}
          onBack={home}
          onContact={() => {
            navigate("/about#contact");
          }}
          onProject={(id) => navigate(`/projects/${id}`)}
          onStudio={(filmId?: string) => navigate(filmId ? `/studio#${encodeURIComponent(filmId)}` : "/studio")}
        />
      </>
    );

  return (
    <>
      <GlassCursor enabled={preferences.motion} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AtelierNavigation
        currentPage={mainPage}
        activeSection={activeSection}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(!menuOpen)}
        onNavigate={navigateSection}
        onHome={() => navigate("/")}
      />
      <main id="main" ref={mainRef} data-page={mainPage}>
        <GlassMaterial />
        {mainPage === "home" && (
          <>
            <ScrollOpening
              motionEnabled={preferences.motion}
              onWork={() => navigate("/work")}
              onCaseStudy={() => page("cirs", undefined, "cirs-scene")}
              onImageError={() => setCirsImageFailed(true)}
              onDirector={() =>
                setModal({ type: "media", id: "directors-cut" })
              }
            />
            <HomeDirectory
              onNavigate={(path, originToken) => {
                const project = projects.find((item) => path === `/projects/${item.id}`);
                if (project) page(project.id, undefined, originToken);
                else navigate(path);
              }}
              motionEnabled={preferences.motion}
              visitedPaths={visitedPaths}
              onResetVisits={resetVisits}
            />
          </>
        )}
        {mainPage === "work" && (
          <>
            <WorkPage
              onQuick={quick}
              onPage={page}
              motionEnabled={preferences.motion}
            />
            <section
              id="experiments"
              className="experiments-section page-width"
            >
              <header className="archive-heading">
                <p className="section-label">The working notebook</p>
                <h2>
                  Smaller ideas. <em>Room to grow.</em>
                </h2>
              </header>
              <details className="archive-experiment" id="airkart">
                <summary>
                  <span className="archive-number">01</span>
                  <span>
                    <strong>AirKart</strong>
                    <small>
                      A student exploration of drone delivery and shared
                      journeys.
                    </small>
                  </span>
                  <span className="archive-status">
                    Explore the experiment <Plus size={18} />
                  </span>
                </summary>
                <div className="airkart-layout">
                  <div>
                    <span className="section-label">
                      Concept study · Illustrative model
                    </span>
                    <p>{airkart.description}</p>
                    <button
                      className="underlined-button"
                      onClick={() => quick("airkart")}
                    >
                      Read the project notes
                    </button>
                  </div>
                  <DecisionRoom />
                </div>
              </details>
              {experiments.map((item, index) => (
                <div className="archive-notebook-entry" key={item.id}>
                  <span className="archive-number">0{index + 2}</span>
                  <h3>{item.title}</h3>
                  <span>{item.status}</span>
                </div>
              ))}
            </section>
            <a
              className="next-room page-width"
              href="/studio"
              aria-label="Next page: Studio"
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                navigate("/studio");
              }}
            >
              <div>
                <span className="section-label">
                  Next room / Creative Studio
                </span>
                <h2>
                  From websites
                  <br />
                  <em>to the screen.</em>
                </h2>
                <span className="next-room-action">
                  Enter Studio <Plus size={17} aria-hidden="true" />
                </span>
              </div>
              <ol aria-hidden="true">
                {creativeMedia.map((film, index) => (
                  <li key={film.id}>
                    <span>0{index + 1}</span>
                    {film.title}
                  </li>
                ))}
              </ol>
            </a>
          </>
        )}
        {mainPage === "studio" && (
          <ScreeningRoom
            films={creativeMedia}
            motionEnabled={preferences.motion}
            asPage
            onContact={() => navigate("/about#contact")}
            onSelectFilm={selectStudioFilm}
            onRelatedProject={(anchor) => page("cirs", undefined, "studio-project", anchor)}
            onPlay={(id, startAt) => setModal({ type: "media", id, startAt })}
          />
        )}
        {mainPage === "about" && (
          <>
            <AboutIdentity
              selected={lane}
              onSelect={setLane}
              motionEnabled={preferences.motion}
              onNavigate={(path, originAnchor?: HTMLAnchorElement) => {
                const target = projects.find((item) => path === `/projects/${item.id}`);
                if (target) page(target.id, path, undefined, originAnchor);
                else navigate(path);
              }}
            />
            <div className="page-width">
              <section className="recognition-section" id="recognition">
                <div>
                  <p className="section-label">Recognition & responsibility</p>
                  <h2>
                    School, sport
                    <br />
                    <em>&amp; study.</em>
                  </h2>
                </div>
                <div className="achievement-list">
                  {achievements.map((item) => (
                    <details className="achievement" key={item.id}>
                      <summary>
                        <span>
                          <h3>{item.title}</h3>
                          <span>{item.distinction}</span>
                        </span>
                        <Plus size={20} />
                      </summary>
                      <div className="achievement-detail">
                        <p>{item.description}</p>
                        {item.verification && (
                          <div className="achievement-verification">
                            <a href={item.verification.url} target="_blank" rel="noreferrer">Verify with ICSC</a>
                            <span>Verification ID: <code>{item.verification.code}</code></span>
                          </div>
                        )}
                        {item.certificate ? (
                          <a
                            href={item.certificate}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View certificate
                          </a>
                        ) : (
                          <span className="achievement-source">
                            {item.record}
                          </span>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            </div>
            <section id="contact" className="contact-section">
              <div className="page-width contact-identity-layout">
                <div className="contact-identity-copy">
                  <p className="section-label">Contact</p>
                  <h2>
                    Your next project.
                    <br />
                    <em>Let’s talk.</em>
                  </h2>
                  <p className="contact-invitation">
                    Websites, stories, or an idea worth exploring.
                  </p>
                  {contactReady ? (
                    copy.contact.email ? (
                      <a
                        className="contact-action"
                        href={`mailto:${copy.contact.email}`}
                      >
                        {copy.contact.email}
                      </a>
                    ) : (
                      <button
                        className="contact-action"
                        onClick={() => setModal({ type: "contact" })}
                      >
                        Let’s connect
                      </button>
                    )
                  ) : (
                    <p>Contact details have not been supplied yet.</p>
                  )}
                </div>
                {contactReady && copy.contact.email && (
                  <IdentityCard
                    email={copy.contact.email}
                    motionEnabled={preferences.motion}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer page-width">
        <div>
          <a
            href="/"
            className="footer-wordmark"
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              navigate("/");
            }}
          >
            Ananda Priyan
          </a>
          <p>{copy.footerCredit}</p>
        </div>
        <nav className="footer-page-links" aria-label="Portfolio pages">
          {[
            ["/", "Home"],
            ["/work", "Work"],
            ["/studio", "Studio"],
            ["/about", "About & contact"],
          ].map(([path, label]) => (
            <a
              key={path}
              href={path}
              aria-current={route === path ? "page" : undefined}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                navigate(path);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="footer-settings">
          <button data-navigation-origin="tour-launcher" onClick={() => setTourOpen(true)}>
            Take the 60-second tour
          </button>
          <button onClick={() => setOsOpen(true)}>AP OS</button>
          <button
            onClick={() =>
              preferences.setTheme(
                preferences.theme === "dark" ? "light" : "dark",
              )
            }
            aria-label={`Switch to ${preferences.theme === "dark" ? "light" : "dark"} theme`}
          >
            {preferences.theme === "dark" ? (
              <Sun size={14} />
            ) : (
              <Moon size={14} />
            )}
            <span>{preferences.theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            onClick={() => preferences.setMotion(!preferences.motion)}
            aria-pressed={preferences.motion}
            disabled={preferences.reduced}
          >
            Motion {preferences.motion ? "on" : "off"}
          </button>
          <a
            href="#"
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              storyMotion.scrollTo(0, { immediate: event.detail === 0 });
              // Home's animated heading may still be hidden at activation;
              // its persistent main landmark gives native Tab a stable origin.
              const destination = mainPage === "home" ? mainRef.current
                : mainRef.current?.querySelector<HTMLElement>("h1") ?? mainRef.current;
              if (destination) {
                destination.tabIndex = -1;
                destination.focus({ preventScroll: true });
              }
            }}
          >
            Back to top
          </a>
        </div>
      </footer>
      {osOpen && (
        <OSExperience
          onClose={() => setOsOpen(false)}
          onOpenProject={page}
          onSwim={swim}
        />
      )}
      {tourOpen && (
        <GuidedTour
          onClose={() => setTourOpen(false)}
          onProject={(id) => page(id, undefined, "tour-launcher")}
          onSwim={swim}
        />
      )}
      {modal && (
        <Dialog
          title={project?.title ?? media?.title ?? copy.contact.heading}
          onClose={() => setModal(null)}
        >
          {project && (
            <>
              <p className="section-label">{projectStatus[project.id]}</p>
              <h2 className="dialog-title">{project.title}</h2>
              <p className="dialog-introduction">{project.subtitle}</p>
              <div
                className="cut-switch"
                role="group"
                aria-label="Case study depth"
              >
                <button
                  aria-pressed={cut === "quick"}
                  onClick={() => setCut("quick")}
                >
                  Quick cut<small>30-second overview</small>
                </button>
                <button
                  aria-pressed={cut === "director"}
                  onClick={() => setCut("director")}
                >
                  Director’s cut<small>The longer story</small>
                </button>
              </div>
              <div className="case-study">
                {Object.entries(project.story)
                  .filter(
                    ([key, value]) =>
                      Boolean(value) &&
                      (cut === "director" ||
                        ["challenge", "role", "outcome"].includes(key)),
                  )
                  .map(([key, value]) => (
                    <section key={key}>
                      <h3>
                        {key === "role"
                          ? "My contribution"
                          : key === "lessons"
                            ? "What I learned"
                            : key === "outcome"
                              ? "Where it stands"
                              : key.charAt(0).toUpperCase() + key.slice(1)}
                      </h3>
                      <p>{value}</p>
                    </section>
                  ))}
              </div>
              {project.id === "cirs" &&
                projectAssets.cirs.beforeUrl &&
                projectAssets.cirs.afterUrl && (
                  <Comparison
                    before={projectAssets.cirs.beforeUrl}
                    after={projectAssets.cirs.afterUrl}
                  />
                )}
              <details className="ask-work">
                <summary>
                  Ask the work
                  <Plus size={16} />
                </summary>
                {interfaceCopy.askWork
                  .filter((item) => project.story[item.key])
                  .map((item) => (
                    <button
                      key={item.key}
                      aria-expanded={question === item.key}
                      onClick={() =>
                        setQuestion(question === item.key ? null : item.key)
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                {question && (
                  <p aria-live="polite">
                    {project.story[question as keyof typeof project.story]}
                  </p>
                )}
              </details>
              <a
                className="case-page-link"
                href={`/projects/${project.id}`}
                onClick={(e) => {
                  if (
                    e.defaultPrevented ||
                    e.button !== 0 ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey
                  )
                    return;
                  e.preventDefault();
                  page(project.id);
                }}
              >
                Explore the full case study
              </a>
              {project.link && (
                <a
                  className="case-evidence-link"
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit {new URL(project.link).hostname}
                </a>
              )}
            </>
          )}
          {media && (
            <>
              <p className="section-label">Creative Studio</p>
              <h2 className="dialog-title">{media.title}</h2>
              {hasApprovedNativePlayback(media) ? (
                <>
                  <NativeFilmPlayer key={modal.type === "media" ? modal.id : media.videoUrl}
                    film={{ ...media, id: modal.type === "media" ? modal.id : "" }}
                    startAt={modal.type === "media" ? modal.startAt : undefined} />
                  <p className="dialog-introduction">{media.caption}</p>
                </>
              ) : "embedUrl" in media &&
                isApprovedDriveEmbed(media.embedUrl) ? (
                <>
                  <DriveFilmPlayer
                    title={media.title}
                    embedUrl={media.embedUrl}
                  />
                  <p className="dialog-introduction">{media.caption}</p>
                </>
              ) : (
                <div className="video-pending">
                  <span>Original film to be added.</span>
                  <p>{media.caption}</p>
                </div>
              )}
              {media.credits && <p className="dialog-introduction">{media.credits}</p>}
            </>
          )}
          {modal.type === "contact" && (
            <>
              <p className="section-label">Let’s connect</p>
              <h2 className="dialog-title">
                A conversation,
                <br />
                <em>starts here.</em>
              </h2>
              <p className="dialog-introduction">{copy.contact.description}</p>
              {copy.contact.email ? (
                <a
                  className="case-page-link"
                  href={`mailto:${copy.contact.email}`}
                >
                  {copy.contact.email}
                </a>
              ) : (
                <p className="contact-pending">
                  Email <span>To be added</span>
                </p>
              )}
              {copy.contact.socials.length ? (
                <div className="social-links">
                  {copy.contact.socials.map((item) => (
                    <a
                      href={item.url}
                      key={item.label}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
