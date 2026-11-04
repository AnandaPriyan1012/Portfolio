import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  FileImage,
  Layers,
  List,
  Play,
} from "lucide-react";
import {
  accuflowStages,
  projectAssets,
  projects,
  siteContent,
  type Project,
} from "../content";
import "./case-study.css";
import Signature from "./Signature";

type Props = {
  project: Project;
  motionEnabled?: boolean;
  onBack: () => void;
  onContact: () => void;
  onProject?: (id: Project["id"]) => void;
};
const stateLabel: Record<string, string> = {
  cirs: "Live website",
  airkart: "Concept exploration",
  accuflow: "Product & interaction prototype",
  creative: "Creative collection",
  community: "Volunteer work · since 2023",
};

export function AccuFlowVisual() {
  return (
    <div
      className="accuflow-product-visual"
      role="img"
      aria-label="AccuFlow product and interaction prototype"
    >
      <span className="accuflow-frame-label">Product & interaction design</span>
      <div className="accuflow-frame-content">
        <span className="accuflow-wordmark">AccuFlow</span>
        <strong>An interaction prototype.</strong>
        <span>Explore the project through the prototype link below.</span>
      </div>
      <span className="accuflow-frame-caption">
        AccuFlow / Website prototype
      </span>
    </div>
  );
}

export default function CaseStudyPage({
  project,
  motionEnabled = false,
  onBack,
  onContact,
  onProject,
}: Props) {
  const [cut, setCut] = useState<"quick" | "director">("director");
  const [active, setActive] = useState("");
  const [mediaFailed, setMediaFailed] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLProgressElement>(null);
  const progressLabelRef = useRef<HTMLSpanElement>(null);
  const isAccuFlow = project.id === "accuflow";
  const index = projects.findIndex((item) => item.id === project.id);
  const sequence = projects.filter((item) =>
    ["cirs", "community", "accuflow"].includes(item.id),
  );
  const nextProject =
    sequence[
      (sequence.findIndex((item) => item.id === project.id) + 1) %
        sequence.length
    ];
  const assets = projectAssets[project.id];
  const hasAdmissions = project.id === "cirs" && !!assets.admissionsUrl;
  const hasContact =
    !!siteContent.contact.email || siteContent.contact.socials.length > 0;
  const chapterTitles =
    project.id === "cirs"
      ? {
          context: "Helping families find the next step",
          role: "Web development & creative work",
          process: "From application access to enquiries",
          outcome: "A live school website",
        }
      : project.id === "community"
        ? {
            context: "Digital support for community service",
            role: "A voluntary role, since 2023",
            process: "One commitment, several channels",
            outcome: "Ongoing work, public preview",
          }
        : {
            context: "The idea",
            role: "My contribution",
            process: "The work",
            outcome: "Where it stands",
          };
  const detailed = isAccuFlow
    ? accuflowStages
    : [
        {
          id: "challenge",
          title: chapterTitles.context,
          body: project.story.challenge,
        },
        { id: "role", title: chapterTitles.role, body: project.story.role },
        {
          id: "process",
          title: chapterTitles.process,
          body: project.story.process,
        },
        {
          id: "outcome",
          title: chapterTitles.outcome,
          body: project.story.outcome,
        },
        { id: "lessons", title: "What I learned", body: project.story.lessons },
      ];
  const sections = (
    cut === "director"
      ? detailed
      : [
          {
            id: "mission",
            title: chapterTitles.context,
            body: project.story.challenge,
          },
          { id: "role", title: chapterTitles.role, body: project.story.role },
          {
            id: "outcome",
            title: chapterTitles.outcome,
            body: project.story.outcome,
          },
        ]
  ).filter((section) => section.body.trim());
  const anchor = (id: string) => `case-${project.id}-${id}`;

  useEffect(() => {
    setMediaFailed(false);
    const previous = document.title;
    document.title = `${project.title} — Ananda Priyan`;
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => {
      document.title = previous;
    };
  }, [project.id, project.title]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    // One measured reading line drives the existing index, the glass edges and
    // the native progress element. Scroll only schedules work; nothing ticks at rest.
    const chapters = Array.from(
      page.querySelectorAll<HTMLElement>("[data-reader-chapter]"),
    );
    const media = Array.from(
      page.querySelectorAll<HTMLElement>("[data-reader-media]"),
    );
    const depthPreference = window.matchMedia(
      "(min-width: 1000px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const constrained =
      device.connection?.saveData ||
      (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4);
    let depthEnabled = motionEnabled && depthPreference.matches && !constrained;
    let geometry: { element: HTMLElement; top: number; height: number }[] = [];
    let mediaGeometry: typeof geometry = [];
    let frame = 0;
    let needsMeasure = true;
    let disposed = false;
    let previousActive = "";
    let previousPercent = -1;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const measure = (elements: HTMLElement[]) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, top: rect.top + window.scrollY, height: rect.height };
      });

    const update = () => {
      frame = 0;
      if (disposed) return;
      if (needsMeasure) {
        geometry = measure(chapters);
        mediaGeometry = measure(media);
        needsMeasure = false;
      }
      const viewport = window.innerHeight;
      const readingLine = window.scrollY + Math.max(120, viewport * 0.32);
      const first = geometry[0];
      const last = geometry.at(-1);
      if (first && last) {
        const progress = clamp(
          (readingLine - first.top) / (last.top + last.height - first.top),
        );
        page.style.setProperty("--story-progress", String(progress));
        const percent = Math.round(progress * 100);
        if (percent !== previousPercent) {
          if (progressRef.current) progressRef.current.value = percent;
          if (progressLabelRef.current)
            progressLabelRef.current.textContent = `${String(percent).padStart(2, "0")}%`;
          previousPercent = percent;
        }
        let current = "";
        geometry.forEach(({ element, top, height }) => {
          const progress = clamp((readingLine - top) / height);
          element.style.setProperty("--chapter-progress", String(progress));
          if (readingLine >= top - 1) current = element.id;
        });
        if (current !== previousActive) {
          chapters.forEach((chapter) => {
            chapter.toggleAttribute("data-reading", chapter.id === current);
          });
          setActive(current);
          previousActive = current;
        }
      }
      if (depthEnabled) {
        mediaGeometry.forEach(({ element, top, height }) => {
          const arrival = clamp(
            (window.scrollY + viewport * 0.87 - top) /
              Math.min(height * 0.5, viewport * 0.65),
          );
          element.style.setProperty("--media-arrival", String(arrival));
        });
      }
    };
    const schedule = () => {
      if (!frame && !disposed) frame = window.requestAnimationFrame(update);
    };
    const remeasure = () => {
      needsMeasure = true;
      schedule();
    };
    const setDepthPreference = () => {
      depthEnabled = motionEnabled && depthPreference.matches && !constrained;
      page.toggleAttribute("data-reader-depth", depthEnabled);
      remeasure();
    };
    const resizeObserver = new ResizeObserver(remeasure);
    const story = page.querySelector(".case-story-column");
    if (story) resizeObserver.observe(story);
    media.forEach((surface) => resizeObserver.observe(surface));
    page.addEventListener("load", remeasure, true);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    depthPreference.addEventListener("change", setDepthPreference);
    document.fonts.ready.then(() => {
      if (!disposed) remeasure();
    });
    setDepthPreference();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      page.removeEventListener("load", remeasure, true);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      depthPreference.removeEventListener("change", setDepthPreference);
      page.removeAttribute("data-reader-depth");
      page.style.removeProperty("--story-progress");
      chapters.forEach((chapter) => {
        chapter.removeAttribute("data-reading");
        chapter.style.removeProperty("--chapter-progress");
      });
      media.forEach((surface) => surface.style.removeProperty("--media-arrival"));
    };
  }, [project.id, cut, hasAdmissions, mediaFailed, motionEnabled]);

  return (
    <div
      ref={pageRef}
      className={`case-page${isAccuFlow ? " case-accuflow" : ""}`}
      data-project={project.id}
      data-reader-motion={motionEnabled ? "on" : "off"}
      style={{ "--case-accent": project.accent } as CSSProperties}
    >
      <a className="case-skip" href="#case-body">
        Skip to case study
      </a>
      <div className="case-atmosphere" aria-hidden="true" />
      <header className="case-topbar">
        <span className="case-topbar-progress" aria-hidden="true" />
        <button className="case-back" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to portfolio</span>
        </button>
        <a
          className="case-wordmark"
          href="#case-top"
          aria-label="Back to case-study beginning"
        >
          <Signature />
        </a>
        <span className="case-topbar-caption">
          Ananda Priyan <span>/ Selected work</span>
        </span>
      </header>
      <main id="case-top">
        <section className="case-hero">
          <div className="case-eyebrow">
            Selected project{" "}
            <span className="case-eyebrow-index">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(projects.length).padStart(2, "0")}
            </span>
          </div>
          <div className="case-hero-grid">
            <div>
              <h1>
                {project.title}
                <span className="case-title-dot">.</span>
              </h1>
              <p className="case-subtitle">{project.subtitle}</p>
            </div>
            <div className="case-hero-note">
              <span className="case-status">
                {stateLabel[project.id] ?? "Details to be confirmed"}
              </span>
              <p>{project.description}</p>
              <a className="case-read-link" href="#case-body">
                Follow the story <ArrowDown size={14} />
              </a>
            </div>
          </div>
          <div className="case-passport-strip">
            <div>
              <span>Discipline</span>
              <strong>{project.category}</strong>
            </div>
            <div>
              <span>Focus</span>
              <strong>{project.tags.join(" / ")}</strong>
            </div>
            <div>
              <span>Project status</span>
              <strong>
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {isAccuFlow ? "Open the prototype" : "Visit the website"}{" "}
                    <ArrowRight size={12} />
                  </a>
                ) : (
                  stateLabel[project.id]
                )}
              </strong>
            </div>
          </div>
        </section>
        <section className="case-media" aria-label="Project media">
          {assets?.previewUrl && !mediaFailed ? (
            <figure>
              <picture data-reader-media>
                {assets.mobilePreviewUrl && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={assets.mobilePreviewUrl}
                  />
                )}
                <img
                  src={assets.previewUrl}
                  alt={
                    project.id === "cirs"
                      ? "CIRS homepage — screenshot of the public school website"
                      : project.id === "community"
                        ? "Vallalar website review preview — About page"
                        : project.id === "accuflow"
                          ? "AccuFlow website prototype — guide interface"
                          : `${project.title} — project visual`
                  }
                  fetchPriority="high"
                  onError={() => setMediaFailed(true)}
                />
              </picture>
              <figcaption>
                {project.id === "cirs" ? (
                  <>
                    Screenshot captured from the public CIRS website.{" "}
                    <a
                      href="https://cirschool.org"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View the live site <ArrowRight size={13} />
                    </a>
                  </>
                ) : (
                  <>
                    {assets.previewCaption ??
                      `Project website · ${project.title}`}
                  </>
                )}
              </figcaption>
            </figure>
          ) : isAccuFlow ? (
            <AccuFlowVisual />
          ) : (
            <div className="case-media-pending">
              <FileImage size={28} strokeWidth={1} />
              <span className="case-media-title">The work, in focus.</span>
              <strong>Verified project visuals pending.</strong>
              <p>{project.mediaStatus}</p>
              <span className="case-media-index">
                {project.title} / Original media to be added
              </span>
            </div>
          )}
        </section>
        <div id="case-body" className="case-body" tabIndex={-1}>
          <aside className="case-sidebar">
            <span className="case-micro">
              <List size={12} /> In this story
            </span>
            <div className="case-reading-progress">
              <span>
                Story progress <span ref={progressLabelRef}>00%</span>
              </span>
              <progress
                ref={progressRef}
                value={0}
                max={100}
                aria-label="Case study reading progress"
              />
            </div>
            <nav aria-label="Case study chapters">
              {sections.map((section, i) => (
                <a
                  key={section.id}
                  href={`#${anchor(section.id)}`}
                  className={active === anchor(section.id) ? "active" : ""}
                  aria-current={
                    active === anchor(section.id) ? "location" : undefined
                  }
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              ))}
              {hasAdmissions && (
                <a
                  href="#case-cirs-admissions"
                  className={active === "case-cirs-admissions" ? "active" : ""}
                  aria-current={
                    active === "case-cirs-admissions" ? "location" : undefined
                  }
                >
                  <span aria-hidden="true">
                    <ArrowRight size={12} />
                  </span>
                  The Admissions page
                </a>
              )}
            </nav>
            <span className="case-sidebar-bottom">
              Ananda Priyan
              <br />The work, in context.
            </span>
          </aside>
          <div className="case-story-column">
            <div className="case-cut-controls">
              <div>
                <span className="case-micro">Reading length</span>
                <p>Read the essentials, or follow each part.</p>
              </div>
              <div
                className="case-cut-toggle"
                role="group"
                aria-label="Case study reading mode"
              >
                <button
                  aria-pressed={cut === "quick"}
                  onClick={() => {
                    setCut("quick");
                    setActive("");
                  }}
                >
                  <Play size={12} />
                  Quick cut
                </button>
                <button
                  aria-pressed={cut === "director"}
                  onClick={() => {
                    setCut("director");
                    setActive("");
                  }}
                >
                  <Layers size={12} />
                  Director’s cut
                </button>
              </div>
            </div>
            <div className="case-stages">
              {sections.map((section, i) => (
                <section
                  id={anchor(section.id)}
                  key={`${cut}-${section.id}`}
                  className="case-stage"
                  data-reader-chapter
                  aria-labelledby={`${anchor(section.id)}-title`}
                  tabIndex={-1}
                >
                  <span className="case-stage-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 id={`${anchor(section.id)}-title`}>{section.title}</h2>
                    <p>{section.body}</p>
                  </div>
                </section>
              ))}
            </div>
            {hasAdmissions && (
              <section
                id="case-cirs-admissions"
                className="case-admissions"
                data-reader-chapter
                aria-labelledby="case-admissions-title"
                tabIndex={-1}
              >
                <span className="case-micro">The Admissions page</span>
                <h2 id="case-admissions-title">The route into Admissions.</h2>
                <p>
                  The Admissions Guide groups three practical questions:
                  entry-class availability, access to the application portal,
                  and dates or assessment arrangements. The page directs current
                  enquiries to the Admissions Office, while keeping the
                  registered portal and the process guide close to the
                  introduction.
                </p>
                <figure>
                  <div className="case-image-surface" data-reader-media>
                    <img
                      src={assets.admissionsUrl!}
                      alt="Admissions page — screenshot captured from the public CIRS website"
                      loading="lazy"
                    />
                  </div>
                  <figcaption>
                    Screenshot captured from the public Admissions page at
                    cirschool.org.
                  </figcaption>
                </figure>
                <a
                  href="https://cirschool.org/admissions.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit the Admissions Guide <ArrowRight size={16} />
                </a>
              </section>
            )}
            {project.link && (
              <a
                className="case-live-link"
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div>
                  <span className="case-micro">
                    {isAccuFlow
                      ? "The website prototype"
                      : "The project website"}
                  </span>
                  <strong>
                    {isAccuFlow
                      ? "Explore the interface."
                      : "See it in the world."}
                  </strong>
                </div>
                <span>
                  {new URL(project.link).hostname}
                  <ArrowRight size={24} />
                </span>
              </a>
            )}
          </div>
        </div>
        <a
          className="case-next-story"
          href={`/projects/${nextProject.id}`}
          onClick={(event) => {
            if (
              !onProject ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            onProject(nextProject.id);
          }}
        >
          <div>
            <span className="section-label">Next project</span>
            <h2>{nextProject.title}</h2>
            <p>{nextProject.subtitle}</p>
            <span className="case-next-action">
              Open the story <ArrowRight size={18} aria-hidden="true" />
            </span>
          </div>
          {projectAssets[nextProject.id].previewUrl && (
            <img
              src={projectAssets[nextProject.id].previewUrl!}
              alt={`${nextProject.title} — actual website interface`}
              loading="lazy"
            />
          )}
        </a>
        <section className="case-closing">
          {hasContact ? (
            <>
              <span className="case-micro">
                Every project starts a conversation
              </span>
              <h2>
                What could we
                <br />
                build <em>together?</em>
              </h2>
              <button onClick={onContact}>
                Let’s connect <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <span className="case-micro">Follow another thread</span>
              <h2>
                There’s more
                <br />
                to <em>explore.</em>
              </h2>
              <button onClick={onBack}>
                Back to selected work <ArrowRight size={18} />
              </button>
            </>
          )}
        </section>
      </main>
      <footer className="case-footer">
        <button onClick={onBack}>
          <ArrowLeft size={14} />
          Back to selected work
        </button>
        <span>
          Designed around curiosity.
          <br />
          <small>Built with AI assistance for Ananda Priyan.</small>
        </span>
        <a href="#case-top" aria-label="Back to top of case study">
          <ArrowRight size={16} />
        </a>
      </footer>
    </div>
  );
}
