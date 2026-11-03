import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { X, Plus, Sun, Moon, Menu } from "lucide-react";
import {
  siteContent as copy,
  projects,
  projectAssets,
  projectStatus,
  creativeMedia,
  aboutLanes,
  achievements,
  experienceContent,
  interfaceCopy,
  directorsCut,
  editorialCopy,
  scrollStoryCopy,
  communityStory,
} from "./content";
import type { Project } from "./content";
import CaseStudyPage from "./components/CaseStudyPage";
import OSExperience from "./components/OSExperience";
import GlassCursor from "./components/GlassCursor";
import GlassMaterial from "./components/GlassMaterial";
import AtelierLoader from "./components/AtelierLoader";
import NotFound from "./components/NotFound";
import Signature from "./components/Signature";
import useScrollStory from "./animation/useScrollStory";
import useActiveSection from "./animation/useActiveSection";
import { GuidedTour } from "./components/Discovery";

type ModalState =
  | { type: "project"; id: Project["id"] }
  | { type: "media"; id: string }
  | { type: "contact" }
  | null;

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
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
  useEffect(() => {
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

function ProjectMedia({
  project,
  draft = false,
  hero = false,
}: {
  project: Project;
  draft?: boolean;
  hero?: boolean;
}) {
  const asset = projectAssets[project.id];
  const src = draft ? asset.draftUrl : asset.previewUrl;
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src)
    return (
      <picture className="project-media-picture">
        {!draft && asset.mobilePreviewUrl && (
          <source media="(max-width:767px)" srcSet={asset.mobilePreviewUrl} />
        )}
        <img
          onError={() => setFailed(src)}
          src={src}
          alt={`${project.title} — ${draft ? "original process material" : "actual project visual"}`}
          loading={hero ? "eager" : "lazy"}
          className="real-project-media"
        />
      </picture>
    );
  return (
    <div
      className={`media-reservation reservation-${project.id}${draft ? " reservation-draft" : ""}`}
    >
      <span className="reservation-top">
        {draft ? "Behind the work" : project.title}
      </span>
      <div className="reservation-middle">
        <span className="reservation-title">
          {draft
            ? "The process,\nin its own time."
            : project.id === "cirs"
              ? "A school’s\ndigital home."
              : project.id === "community"
                ? "Vallalar Sathya\nDharmasalai"
                : "AccuFlow"}
        </span>
        <span>
          {src
            ? "The project image could not load."
            : draft
            ? "Genuine drafts and process material to be added."
            : project.id === "community"
              ? "Community photographs have not been supplied."
              : "Project visuals have not been supplied."}
        </span>
      </div>
      <span className="reservation-bottom">
        {src
          ? "Project details remain available."
          : draft
          ? "No process has been recreated or invented."
          : "A labelled space for the real work."}
      </span>
    </div>
  );
}

function ScrollOpening({
  onWork,
  onImageError,
  onDirector,
}: {
  onWork: () => void;
  onImageError: () => void;
  onDirector: () => void;
}) {
  const cirs = projects.find((project) => project.id === "cirs")!;
  const asset = projectAssets.cirs;
  const [failed, setFailed] = useState(false);
  return (
    <section
      className="scroll-opening"
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
      <div className="hero-story-copy">
        <p className="hero-eyebrow">Student. Builder. Storyteller.</p>
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
      <div className="cirs-scene-title">
        <span>CIRS Website</span>
        <a href="https://cirschool.org" target="_blank" rel="noreferrer">
          Visit the live website
        </a>
      </div>
      <div className="cirs-visual-frame" data-cursor="view">
        <div className="cirs-browser-bar">
          <span>cirschool.org</span>
          <span>Official school website</span>
        </div>
        <a
          href="https://cirschool.org"
          target="_blank"
          rel="noreferrer"
          className="cirs-browser-body"
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

function CirsStory({
  onQuick,
  onPage,
}: {
  onQuick: () => void;
  onPage: () => void;
}) {
  return (
    <section
      id="cirs"
      className="cirs-details page-width"
      data-editor-note="Add Ananda’s actual original challenge, design decision and reasoning when supplied. Do not invent an early version."
    >
      <div className="cirs-detail-copy">
        <p className="section-label">01 — CIRS Website</p>
        <h2>
          CIRS
          <br />
          <em>Admissions.</em>
        </h2>
        <p>{scrollStoryCopy.cirsRole}</p>
        <p>{scrollStoryCopy.cirsContext}</p>
        <div className="story-links">
          <button onClick={onQuick}>Quick view</button>
          <a
            href="/projects/cirs"
            onClick={(event) => {
              event.preventDefault();
              onPage();
            }}
          >
            Read the case study
          </a>
          <a
            href="https://cirschool.org/admissions.html"
            target="_blank"
            rel="noreferrer"
          >
            Explore Admissions
          </a>
        </div>
      </div>
      {projectAssets.cirs.admissionsUrl && (
        <figure className="admissions-detail">
          <img
            src={projectAssets.cirs.admissionsUrl}
            alt="The real CIRS Admissions page"
            loading="lazy"
          />
          <figcaption>
            The Admissions page · cirschool.org/admissions.html
          </figcaption>
        </figure>
      )}
    </section>
  );
}

function ProcessMedia({
  project,
  messy,
  onOpen,
}: {
  project: Project;
  messy: boolean;
  onOpen: () => void;
}) {
  const [held, setHeld] = useState(false);
  const [pinned, setPinned] = useState(false);
  const down = useRef(0);
  const suppress = useRef(false);
  const hasDraft = Boolean(projectAssets[project.id].draftUrl);
  const showing = hasDraft && (held || pinned || messy);
  return (
    <div className="process-media">
      <button
        data-cursor="view"
        className={`feature-media ${showing ? "is-process" : ""}`}
        onClick={onOpen}
        aria-label={`Open the ${project.title} case study`}
      >
        <ProjectMedia project={project} draft={showing} />
        {project.id === "community" && (
          <span className="transition-glass" aria-hidden="true" />
        )}
        {project.id === "accuflow" && (
          <svg
            className="flowing-outline"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="accuflow-path"
              d="M0 250H70Q90 250 90 230V70Q90 50 110 50H890Q910 50 910 70V430Q910 450 890 450H110Q90 450 90 430V250"
              fill="none"
              pathLength="1"
            />
          </svg>
        )}
      </button>
      {projectAssets[project.id].previewUrl && projectAssets[project.id].previewCaption && (
        <p className="project-media-caption">{projectAssets[project.id].previewCaption}</p>
      )}
      {hasDraft && (
        <div className="process-controls">
          <span>{showing ? "Original process material" : "Project image"}</span>
          <div>
            <button
              className="process-reveal"
              aria-pressed={pinned || messy}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                down.current = performance.now();
                suppress.current = false;
                setHeld(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerUp={() => {
                suppress.current = performance.now() - down.current > 250;
                setHeld(false);
              }}
              onPointerCancel={() => {
                setHeld(false);
                suppress.current = true;
              }}
              onClick={() => {
                if (!suppress.current) setPinned(!pinned);
                suppress.current = false;
              }}
            >
              See the process
            </button>
            <small>Hold briefly, or click to keep open.</small>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({
  project,
  index,
  messy,
  onQuick,
  onPage,
}: {
  project: Project;
  index: number;
  messy: boolean;
  onQuick: () => void;
  onPage: () => void;
}) {
  return (
    <article
      id={project.id}
      className={`work-feature feature-${project.id}`}
      data-reveal="true"
      style={{ "--project-accent": project.accent } as CSSProperties}
    >
      <div className="feature-heading">
        <span className="feature-number">0{index + 1}</span>
        <div>
          <p className="section-label">
            {project.id === "cirs"
              ? "Website & creative work"
              : project.id === "community"
                ? "Community & digital storytelling"
                : "Featured project"}
          </p>
          <h3 className="material-title">{project.title}</h3>
        </div>
        <p className="feature-description">{project.description}</p>
      </div>
      {project.id === "community" ? (
        <div
          className="community-world"
          data-editor-note={communityStory.editorNote}
        >
          <div className="community-purpose">
            <div className="service-step" data-service-step="purpose">
              <p className="section-label">{communityStory.purposeLabel}</p>
              <h4>{communityStory.purpose}</h4>
            </div>
            <div className="service-step" data-service-step="contribution">
              <p className="section-label">
                {communityStory.contributionLabel}
              </p>
              <h4 className="community-role">{communityStory.role}</h4>
              <p className="community-tenure">{communityStory.tenure}</p>
              <ul>
                {communityStory.contributions.map((contribution) => (
                  <li key={contribution}>{contribution}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="community-image-reservation">
            <ProcessMedia project={project} messy={messy} onOpen={onQuick} />
          </div>
        </div>
      ) : (
        <ProcessMedia project={project} messy={messy} onOpen={onQuick} />
      )}
      {project.id === "accuflow" && (
        <div className="accuflow-stage-info">
          <p data-flow-stage>
            <span>The idea</span>{project.story.challenge}
          </p>
          <p data-flow-stage>
            <span>The interaction</span>{project.story.process}
          </p>
          <p data-flow-stage>
            <span>Current stage</span>{project.story.outcome}
          </p>
        </div>
      )}
      <div className="feature-footer">
        <span>
          {project.id === "community"
            ? "Social Media & Technology Head · voluntarily since 2023"
            : projectStatus[project.id]}
        </span>
        <div>
          <button onClick={onQuick}>Quick view</button>
          <a
            href={`/projects/${project.id}`}
            onClick={(e) => {
              e.preventDefault();
              onPage();
            }}
          >
            {project.id === "accuflow"
              ? "Project notes"
              : "Read the case study"}
          </a>
        </div>
      </div>
    </article>
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

function About({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const active =
    aboutLanes.find((item) => item.id === selected) ?? aboutLanes[0];
  const ref = useRef<HTMLDivElement>(null);
  function keys(event: React.KeyboardEvent, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % 4;
    else if (event.key === "ArrowLeft") next = (index + 3) % 4;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 3;
    else return;
    event.preventDefault();
    onSelect(aboutLanes[next].id);
    (ref.current?.children[next] as HTMLElement)?.focus();
  }
  return (
    <section id="about" className="about-section">
      <div className="about-heading">
        <p className="section-label">The person behind the work</p>
        <h2>
          More than
          <br />
          <em>one lane.</em>
        </h2>
        <p>{editorialCopy.about.description}</p>
      </div>
      <div className="about-content">
        <div
          className="lane-tabs"
          ref={ref}
          role="tablist"
          aria-label="Explore my different lanes"
        >
          {aboutLanes.map((item, i) => (
            <button
              key={item.id}
              role="tab"
              id={`lane-${item.id}`}
              aria-selected={selected === item.id}
              aria-controls="lane-panel"
              tabIndex={selected === item.id ? 0 : -1}
              onClick={() => onSelect(item.id)}
              onKeyDown={(e) => keys(e, i)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          className="lane-panel"
          id="lane-panel"
          role="tabpanel"
          aria-labelledby={`lane-${active.id}`}
          tabIndex={0}
        >
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <span>{active.detail}</span>
        </div>
        <details className="all-lanes">
          <summary>
            Read all four perspectives
            <Plus size={16} />
          </summary>
          {aboutLanes.map((item) => (
            <div key={item.id}>
              <h4>{item.label}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </details>
      </div>
    </section>
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
  const messy = false;
  const [lane, setLane] = useState("builder");
  const [cirsImageFailed, setCirsImageFailed] = useState(false);
  const [cut, setCut] = useState<"quick" | "director">("quick");
  const [question, setQuestion] = useState<string | null>(null);
  const [route, setRoute] = useState(normalizedPath());
  const homeScroll = useRef(0);
  const currentProject = projects.find(
    (project) => route === `/projects/${project.id}`,
  );
  const isNotFound = route !== "/" && !currentProject;
  const activeSection = useActiveSection(!currentProject && !isNotFound);
  const project =
    modal?.type === "project"
      ? projects.find((item) => item.id === modal.id)
      : undefined;
  const media =
    modal?.type === "media"
      ? modal.id === "directors-cut"
        ? directorsCut
        : creativeMedia.find((item) => item.id === modal.id)
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
  const readyFilms = creativeMedia.filter(
    (item) => item.videoUrl && item.posterUrl && item.credits,
  );
  const contactReady = Boolean(
    copy.contact.email || copy.contact.socials.length,
  );
  useEffect(() => {
    const back = () => {
      setRoute(normalizedPath());
      setModal(null);
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => {
    setCut("quick");
    setQuestion(null);
  }, [modal]);
  useEffect(() => {
    if (isNotFound) return;
    document.title = currentProject
      ? `${currentProject.title} — Ananda Priyan`
      : copy.title;
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
  }, [currentProject, isNotFound]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);
  function scrollTo(id: string) {
    setMenuOpen(false);
    storyMotion.scrollTo(`#${id}`);
  }
  function page(id: Project["id"]) {
    homeScroll.current = scrollY;
    setModal(null);
    setTourOpen(false);
    setOsOpen(false);
    history.pushState({}, "", `/projects/${id}`);
    setRoute(`/projects/${id}`);
    window.scrollTo(0, 0);
  }
  function home() {
    history.pushState({}, "", "/");
    setRoute("/");
    requestAnimationFrame(() => window.scrollTo(0, homeScroll.current));
  }
  function quick(id: Project["id"]) {
    setOsOpen(false);
    setModal({ type: "project", id });
  }
  function swim() {
    setOsOpen(false);
    setLane("swimmer");
    scrollTo("about");
  }
  if (isNotFound) return <NotFound onHome={home} />;
  if (currentProject)
    return (
      <CaseStudyPage
        project={currentProject}
        onBack={home}
        onContact={() => {
          home();
          setModal({ type: "contact" });
        }}
      />
    );

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="wordmark"
          href="#"
          aria-label="Ananda Priyan, back to top"
        >
          <Signature />
        </a>
        <nav
          id="site-nav"
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          aria-label="Main navigation"
        >
          {[
            { id: "work", label: "Work" },
            { id: "studio", label: "Studio" },
            { id: "about", label: "About" },
            { id: "contact", label: "Contact" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={activeSection === item.id ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                scrollTo(item.id);
              }}
            >
              <span className="film-nav-node" aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </nav>
        <button
          className="menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      <AtelierLoader enabled={preferences.motion} />
      <GlassCursor enabled={preferences.motion && !modal && !osOpen} />
      <main id="main" ref={mainRef}>
        <GlassMaterial />
        <ScrollOpening
          onWork={() => scrollTo("cirs")}
          onImageError={() => setCirsImageFailed(true)}
          onDirector={() => setModal({ type: "media", id: "directors-cut" })}
        />
        <div id="work">
          <CirsStory
            onQuick={() => quick("cirs")}
            onPage={() => page("cirs")}
          />
        </div>
        <section
          className="story-projects page-width"
          aria-label="Community and featured project stories"
        >
          {(["community", "accuflow"] as const).map((id, index) => (
            <Feature
              key={id}
              project={projects.find((p) => p.id === id)!}
              index={index + 1}
              messy={messy}
              onQuick={() => quick(id)}
              onPage={() => page(id)}
            />
          ))}
        </section>
        {true && (
          <section id="studio" className="studio-section">
            <div className="page-width">
              <header className="section-heading">
                <div>
                  <p className="section-label">Creative Studio</p>
                  <h2>
                    Stories,
                    <br />
                    <em>frame by frame.</em>
                  </h2>
                </div>
              </header>
              {readyFilms.length === 0 ? (
                <div className="studio-collection-index">
                  <p className="studio-draft-note">
                    A selection of trailers, films and event work.
                    The films will open here when the originals and credits are ready.
                  </p>
                  <ol>
                    {creativeMedia.map((film, index) => (
                      <li key={film.id}>
                        <span className="studio-index-number">
                          0{index + 1}
                        </span>
                        <span>{film.title}</span>
                        <small>{film.type}</small>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="studio-reel-window">
                  <div className="studio-reel">
                    {readyFilms.map((item) => (
                      <button
                        className="reel-frame"
                        data-cursor="play"
                        key={item.id}
                        onClick={() => setModal({ type: "media", id: item.id })}
                        aria-label={`Play ${item.title}`}
                      >
                        <img
                          src={item.posterUrl!}
                          alt={`${item.title} — original film still`}
                          loading="lazy"
                        />
                        <span>{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        <section id="experiments" className="experiments-section page-width">
          <header className="section-heading">
            <div>
              <p className="section-label">Projects & experiments</p>
              <h2>
                Room for
                <br />
                <em>“what if?”</em>
              </h2>
            </div>
            <p>{interfaceCopy.secondary.description}</p>
          </header>
          <div className="airkart-layout" id="airkart">
            <div>
              <span className="section-label">A smaller student project</span>
              <h3>AirKart</h3>
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
        </section>
        <div className="page-width">
          <About selected={lane} onSelect={setLane} />
          <section className="recognition-section" id="recognition">
            <div>
              <p className="section-label">A few recognitions</p>
              <h2>
                Small milestones.
                <br />
                <em>Still moving.</em>
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
          <div className="page-width">
            <p className="section-label">Contact</p>
            <h2>Let’s talk.</h2>
            {contactReady ? (
              copy.contact.email ? (
                <a className="contact-action" href={`mailto:${copy.contact.email}`}>
                  {copy.contact.email}
                </a>
              ) : (
                <button className="contact-action" onClick={() => setModal({ type: "contact" })}>
                  Let’s connect
                </button>
              )
            ) : (
              <p>Contact details have not been supplied yet.</p>
            )}
          </div>
        </section>
      </main>
      <footer className="site-footer page-width">
        <div>
          <a href="#" className="footer-wordmark">
            Ananda Priyan
          </a>
          <p>{copy.footerCredit}</p>
        </div>
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
          <a href="#">Back to top</a>
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
                      Boolean(value) && (cut === "director" ||
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
                {interfaceCopy.askWork.filter((item) => project.story[item.key]).map((item) => (
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
              {media.videoUrl ? (
                <video
                  className="actual-video"
                  aria-label={`${media.title} video player`}
                  controls
                  playsInline
                  muted
                  preload="metadata"
                  poster={media.posterUrl ?? undefined}
                >
                  <source src={media.videoUrl} />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="video-pending">
                  <span>Original film to be added.</span>
                  <p>{media.caption}</p>
                </div>
              )}
              <p className="dialog-introduction">{media.credits}</p>
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
