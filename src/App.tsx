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
import { GuidedTour } from "./components/Discovery";
import AtelierNavigation from "./components/AtelierNavigation";
import ScreeningRoom from "./components/ScreeningRoom";
import HeroFilm from "./components/HeroFilm";
import WorkPage from "./components/WorkPage";
import HomeDirectory from "./components/HomeDirectory";
import AboutIdentity from "./components/AboutIdentity";
import GlassCursor from "./components/GlassCursor";
import IdentityCard from "./components/IdentityCard";
import DriveFilmPlayer, {
  isApprovedDriveEmbed,
} from "./components/DriveFilmPlayer";

type ModalState =
  | { type: "project"; id: Project["id"] }
  | { type: "media"; id: string }
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
  onImageError,
  onDirector,
  motionEnabled,
}: {
  onWork: () => void;
  onImageError: () => void;
  onDirector: () => void;
  motionEnabled: boolean;
}) {
  const cirs = projects.find((project) => project.id === "cirs")!;
  const asset = projectAssets.cirs;
  const [failed, setFailed] = useState(false);
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
      <div className="cirs-visual-frame">
        <div className="cirs-browser-bar">
          <span>cirschool.org</span>
          <span>Official school website</span>
        </div>
        <a
          href="https://cirschool.org"
          target="_blank"
          rel="noreferrer"
          className="cirs-browser-body"
          data-cursor="view"
          aria-label="Visit the official CIRS website"
        >
          {asset.previewUrl && !failed ? (
            <picture>
              {asset.mobilePreviewUrl && (
                <source
                  media="(max-width: 767px)"
                  srcSet={asset.mobilePreviewUrl}
                />
              )}
              <img
                className="cirs-browser-image"
                src={asset.previewUrl}
                alt="Real homepage of Chinmaya International Residential School, captured from cirschool.org"
                fetchPriority="high"
                decoding="async"
                onError={() => {
                  setFailed(true);
                  onImageError();
                }}
              />
            </picture>
          ) : (
            <div className="cirs-image-fallback">
              <strong>{cirs.title}</strong>
              <p>The live website is available at cirschool.org.</p>
              <span>Open the school website</span>
            </div>
          )}
        </a>
      </div>
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
  const caseReturn = useRef<{ path: string; top: number; aboutHref?: string }>({ path: "/work", top: 0 });
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
  useEffect(() => {
    const back = () => {
      const next = normalizedPath();
      if (next !== route) storyMotion.beforeNavigate();
      setRoute(next);
      setModal(null);
      setMenuOpen(false);
      setOsOpen(false);
      setTourOpen(false);
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [route, storyMotion.beforeNavigate]);
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
  function navigate(destination: string, restoreTop = 0, aboutHref?: string) {
    const next = destination.split("#")[0].replace(/\/+$/, "") || "/";
    if (next !== route) storyMotion.beforeNavigate();
    setMenuOpen(false);
    setModal(null);
    setTourOpen(false);
    setOsOpen(false);
    history.pushState({}, "", destination);
    setRoute(normalizedPath());
    window.dispatchEvent(new Event("ap:pathnamechange"));
    requestAnimationFrame(() => {
      if (window.location.hash) storyMotion.scrollTo(window.location.hash);
      else storyMotion.restoreTo(restoreTop, next);
      const main = document.querySelector("main");
      // Only an explicit return from an About evidence link restores that
      // native link. Ordinary page/hash navigation keeps its heading focus.
      if (aboutHref && main?.dataset.page === "about" && !window.location.hash) {
        const origin = [...main.querySelectorAll<HTMLAnchorElement>(".about-identity-links a")]
          .find((link) => link.getAttribute("href") === aboutHref);
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
    });
  }
  function navigateSection(id: string) {
    navigate(id === "contact" ? "/about#contact" : `/${id}`);
  }
  function page(id: Project["id"], aboutHref?: string) {
    caseReturn.current = { path: route, top: scrollY, ...(route === "/about" && aboutHref ? { aboutHref } : {}) };
    navigate(`/projects/${id}`);
  }
  function home() {
    navigate(caseReturn.current.path, caseReturn.current.top, caseReturn.current.aboutHref);
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
              onImageError={() => setCirsImageFailed(true)}
              onDirector={() =>
                setModal({ type: "media", id: "directors-cut" })
              }
            />
            <HomeDirectory
              onNavigate={navigate}
              motionEnabled={preferences.motion}
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
            onPlay={(id) => setModal({ type: "media", id })}
          />
        )}
        {mainPage === "about" && (
          <>
            <AboutIdentity
              selected={lane}
              onSelect={setLane}
              motionEnabled={preferences.motion}
              onNavigate={(path) => {
                const target = projects.find((item) => path === `/projects/${item.id}`);
                if (target) page(target.id, path);
                else navigate(path);
              }}
            />
            <div className="page-width">
              <section className="recognition-section" id="recognition">
                <div>
                  <p className="section-label">Learning & competition</p>
                  <h2>
                    Academic
                    <br />
                    <em>distinctions.</em>
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
                        {item.certificate ? (
                          <a
                            href={item.certificate}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View certificate
                          </a>
                        ) : (
                          <span className="certificate-placeholder">
                            Certificate to be supplied
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
          <button onClick={() => setTourOpen(true)}>
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
              storyMotion.scrollTo(0);
            }}
          >
            Back to top
          </a>
        </div>
      </footer>
      {osOpen && (
        <OSExperience
          onClose={() => setOsOpen(false)}
          onOpenProject={quick}
          onSwim={swim}
        />
      )}
      {tourOpen && (
        <GuidedTour
          onClose={() => setTourOpen(false)}
          onProject={quick}
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
                  <video
                    className="actual-video"
                    aria-label={`${media.title} video player`}
                    controls
                    playsInline
                    tabIndex={0}
                    preload="metadata"
                    poster={media.posterUrl ?? undefined}
                  >
                    <source src={media.videoUrl} />
                    Your browser does not support video playback.
                  </video>
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
