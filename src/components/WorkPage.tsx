import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  projects,
  projectAssets,
  projectStatus,
} from "../content";
import type { Project } from "../content";
import InterfaceAtlas from "./InterfaceAtlas";
import CirsConceptStudy from "./CirsConceptStudy";
import CirsAdmissionsTour from "./CirsAdmissionsTour";
import CommunityLanguageStudy from "./CommunityLanguageStudy";
import AccuFlowRouteDeck from "./AccuFlowRouteDeck";
import WorkChapterRail from "./WorkChapterRail";
import CommunityNarrative from "./CommunityNarrative";
import "./work-evidence-drawers.css";

type WorkPageProps = {
  onQuick: (id: Project["id"]) => void;
  onPage: (id: Project["id"]) => void;
  motionEnabled?: boolean;
  navigationOpen?: boolean;
  onCaptureNavigate?: (target: HTMLButtonElement) => void;
};

const evidenceProjects = ["cirs", "community", "accuflow"] as const;
type EvidenceProject = (typeof evidenceProjects)[number];
type EvidencePreference = { open: boolean; view: string };
const evidenceDefaults: Record<EvidenceProject, string> = {
  cirs: "home", community: "en", accuflow: "home",
};
const evidenceViews: Record<EvidenceProject, readonly string[]> = {
  cirs: ["home", "admissions", "process", "questions"],
  community: ["en", "ta"],
  accuflow: ["home", "product", "workflow", "guide"],
};
const evidenceStorageKey = "ap-work-evidence-v1";
let evidenceMemory: Map<EvidenceProject, EvidencePreference> | undefined;

function readEvidence(project: EvidenceProject): EvidencePreference {
  if (!evidenceMemory) {
    evidenceMemory = new Map(evidenceProjects.map((id) => [id, { open: false, view: evidenceDefaults[id] }]));
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(evidenceStorageKey) ?? "null");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        const record = saved as Record<string, unknown>;
        evidenceProjects.forEach((id) => {
          const value = record[id];
          if (!value || typeof value !== "object" || Array.isArray(value)) return;
          const preference = value as Record<string, unknown>;
          evidenceMemory!.set(id, {
            open: preference.open === true,
            view: typeof preference.view === "string" && evidenceViews[id].includes(preference.view)
              ? preference.view : evidenceDefaults[id],
          });
        });
      }
    } catch { /* Work remains usable with per-tab memory when storage is denied. */ }
  }
  return evidenceMemory.get(project)!;
}

function saveEvidence(project: EvidenceProject, change: Partial<EvidencePreference>) {
  const previous = readEvidence(project);
  const next = { ...previous, ...change };
  if (previous.open === next.open && previous.view === next.view) return previous;
  evidenceMemory!.set(project, next);
  try {
    sessionStorage.setItem(evidenceStorageKey, JSON.stringify(Object.fromEntries(evidenceMemory!)));
  } catch { /* The bounded in-memory preferences survive ordinary SPA returns. */ }
  return next;
}

const projectBriefs = {
  cirs: [
    [
      "Problem",
      "Future students and parents needed a clearer picture of campus life and an easier way to find Admissions information.",
    ],
    [
      "Role",
      "Page design and web development with the school’s team, including Admissions and phone layouts.",
    ],
    ["Outcome", "The official school website is live, with a dedicated Admissions Guide."],
  ],
  community: [
    [
      "Problem",
      "After helping prepare and distribute meals, I asked how else I could help, and the organisers described limited online reach.",
    ],
    ["Role", "Voluntary Social Media & Technology Head since 2023: digital storytelling, social media and website work."],
    [
      "Outcome",
      "Website work is available as a public review preview, alongside ongoing digital storytelling and social-media work.",
    ],
  ],
  accuflow: [
    [
      "Purpose",
      "Explore how a product website can lead into a conversational guide for pressure-point information.",
    ],
    [
      "Scope",
      "A six-page product website and conversational-interface prototype.",
    ],
    [
      "Outcome",
      "The publicly viewable prototype is shown through four captured routes, including the initial guide interface.",
    ],
  ],
} as const;

function ProjectBrief({ project }: { project: keyof typeof projectBriefs }) {
  return (
    <dl
      className="project-brief"
      aria-label={`${project === "community" ? "Vallalar" : project === "cirs" ? "CIRS" : "AccuFlow"} project introduction`}
    >
      {projectBriefs[project].map(([label, description]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkEvidenceDrawer({
  project,
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  project: EvidenceProject;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  children: (view: string, onChange: (view: string) => void) => ReactNode;
}) {
  const [preference, setPreference] = useState(() => readEvidence(project));
  const [mounted, setMounted] = useState(preference.open);

  useLayoutEffect(() => {
    if (mounted) ScrollTrigger.refresh();
  }, [preference.open, preference.view, mounted]);

  return (
    <details
      id={`${project}-evidence`}
      className="work-evidence-drawer"
      data-project={project}
      open={preference.open}
      onToggle={(event) => {
        const open = event.currentTarget.open;
        if (open) setMounted(true);
        setPreference(saveEvidence(project, { open }));
      }}
    >
      <summary className="page-width">
        <span className="work-evidence-copy">
          <span className="section-label">{eyebrow}</span>
          <strong>{title}</strong>
          <span className="work-evidence-description">{description}</span>
        </span>
        <span className="work-evidence-action">
          {action}<Plus size={18} aria-hidden="true" />
        </span>
      </summary>
      {mounted && (
        <div className="work-evidence-content">
          {children(preference.view, (view) => {
            if (evidenceViews[project].includes(view))
              setPreference(saveEvidence(project, { view }));
          })}
        </div>
      )}
    </details>
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

function CirsStory({
  onQuick,
  onPage,
  motionEnabled,
}: {
  onQuick: () => void;
  onPage: () => void;
  motionEnabled: boolean;
}) {
  return (
    <section id="cirs" className="cirs-details page-width">
      <div className="chapter-reflection" aria-hidden="true" />
      <div className="cirs-detail-copy">
        <p className="section-label">01 — CIRS Website</p>
        <h2>
          CIRS website.
          <br />
          <em>Admissions in focus.</em>
        </h2>
        <ProjectBrief project="cirs" />
        <div className="story-links">
          <button onClick={onQuick}>Quick view</button>
          <a
            href="/projects/cirs"
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
      <div className="cirs-interface-study">
        <div className="interface-study-label">
          <span>Admissions / interface study</span>
          <span>Live website</span>
        </div>
        {projectAssets.cirs.admissionsUrl && (
          <CirsAdmissionsTour src={projectAssets.cirs.admissionsUrl} motionEnabled={motionEnabled} presentation="work" />
        )}
      </div>
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
        aria-label={`Quick view: ${project.title}`}
        aria-haspopup="dialog"
      >
        <ProjectMedia project={project} draft={showing} />
        {project.id === "community" && (
          <span className="transition-glass" aria-hidden="true" />
        )}
        <span className="media-glass-edge" aria-hidden="true" />
      </button>
      {projectAssets[project.id].previewUrl &&
        projectAssets[project.id].previewCaption && (
          <p className="project-media-caption">
            {projectAssets[project.id].previewCaption}
          </p>
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
  motionEnabled,
  onCaptureNavigate,
}: {
  project: Project;
  index: number;
  messy: boolean;
  onQuick: () => void;
  onPage: () => void;
  motionEnabled: boolean;
  onCaptureNavigate?: (target: HTMLButtonElement) => void;
}) {
  return (
    <article
      id={project.id}
      className={`work-feature feature-${project.id}`}
      data-reveal="true"
      style={{ "--project-accent": project.accent } as CSSProperties}
    >
      <div className="chapter-reflection" aria-hidden="true" />
      <div className="chapter-glass-depth" aria-hidden="true" />
      <div className="chapter-shell page-width">
        <div className="chapter-index">
          <span>
            0{index + 1} /{" "}
            {project.id === "community" ? "Community" : "Interaction"}
          </span>
          <span>
            {project.id === "community"
              ? "An ongoing commitment · Since 2023"
              : "From product story to conversation"}
          </span>
        </div>
        <div className="feature-heading">
          <div>
            <p className="section-label">
              {project.id === "community"
                ? "Community & digital storytelling"
                : "Product & interaction prototype"}
            </p>
            <h2 className="material-title">
              {project.id === "community" ? (
                <>
                  Vallalar Sathya
                  <br />
                  <em>Dharmasalai.</em>
                </>
              ) : (
                <>AccuFlow.</>
              )}
            </h2>
          </div>
          <ProjectBrief
            project={project.id === "community" ? "community" : "accuflow"}
          />
        </div>
        {project.id === "community" ? (
          <div className="community-scroll-runway">
            <div className="community-world">
              <div className="community-image-reservation">
                <div className="project-window-label">
                  <span>Vallalar / The website</span>
                  <span>Review preview</span>
                </div>
                <ProcessMedia
                  project={project}
                  messy={messy}
                  onOpen={onQuick}
                />
                <span className="community-scroll-meter" aria-hidden="true" />
                <p className="chapter-motion-caption" aria-hidden="true">
                  Service <span>→</span> The question <span>→</span> Digital work
                </p>
              </div>
              <details className="project-process-notes"><summary>Service and digital work</summary><CommunityNarrative /></details>
            </div>
          </div>
        ) : (
          <AccuFlowRouteDeck motionEnabled={motionEnabled} onCaptureNavigate={onCaptureNavigate} />
        )}
        {project.id === "accuflow" && (
          <details className="project-process-notes"><summary>Prototype context</summary><div className="accuflow-stage-info">
            <p data-flow-stage>
              <span>The interaction</span>
              {project.story.process}
            </p>
            <p data-flow-stage>
              <span>Current stage</span>
              {project.story.outcome}
            </p>
          </div></details>
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
                onPage();
              }}
            >
              {project.id === "accuflow"
                ? "Project notes"
                : "Read the case study"}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

const selectedProjects = [
  {
    id: "cirs",
    title: "CIRS",
    discipline: "Campus life → Admissions",
    note: "Official school website · Live",
    label: "School website",
    roleLabel: "My part",
    role: "Page design and web development with the school’s team, including Admissions and phone layouts.",
    anchor: "cirs",
  },
  {
    id: "community",
    title: "Vallalar",
    discipline: "Service → Digital storytelling",
    note: "Voluntary since 2023 · Website review preview",
    label: "Community work",
    roleLabel: "My part",
    role: "Voluntary Social Media & Technology Head: digital storytelling, social media and website work.",
    anchor: "community",
  },
  {
    id: "accuflow",
    title: "AccuFlow",
    discipline: "Product story → Conversational guide",
    note: "Exploratory prototype",
    label: "Interface prototype",
    roleLabel: "The scope",
    role: "A six-page product website and conversational-interface prototype for pressure-point information.",
    anchor: "accuflow",
  },
] as const;

function WorkFileCapture({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const [failed, setFailed] = useState(false);
  return <div className="work-file-capture" style={{ aspectRatio: `${width}/${height}` }}>
    {failed ? <p className="work-file-unavailable">Capture unavailable. The project chapter is still available below.</p> :
      <img src={src} alt={alt} width={width} height={height} decoding="async" onError={() => setFailed(true)} />}
  </div>;
}

function WorkFileArtifact({ project }: { project: typeof selectedProjects[number]["id"] }) {
  return <figure className={`work-file-artifact work-file-artifact-${project}`}>
    <div className="work-file-sources">
      {project === "cirs" ? <>
        <div className="work-file-browser" aria-hidden="true"><i /><i /><i /><span>CIRS / Admissions Guide</span></div>
        <WorkFileCapture src="/media/atlas-cirs-admissions-desktop.webp" width={1440} height={1000} alt="Actual CIRS Admissions Guide, showing its portal login, application process and enquiry information." />
      </> : project === "community" ? <>
        <div className="work-file-language-sheet"><span lang="en">English</span><WorkFileCapture src="/media/vallalar-language-en-desktop.webp" width={1440} height={500} alt="Complete English About-page opening from the Vallalar website review preview." /></div>
        <div className="work-file-language-sheet"><span lang="ta">தமிழ்</span><WorkFileCapture src="/media/vallalar-language-ta-desktop.webp" width={1440} height={400} alt="Complete Tamil About-page opening from the same Vallalar website review preview." /></div>
      </> : <>
        <div className="work-file-route-strip" aria-hidden="true"><span>Home</span><span>Product</span><span>How it works</span><span>Guide <i /></span></div>
        <WorkFileCapture src="/media/atlas-accuflow-guide-desktop.webp" width={1440} height={1000} alt="Actual initial AccuFlow conversational guide interface, including its original prototype notice." />
      </>}
    </div>
    <figcaption>{project === "cirs" ? "From the live school website" : project === "community" ? "Two languages. The same community." : "The initial guide, before any message"}</figcaption>
  </figure>;
}

function WorkProjectIndex() {
  return (
    <nav className="work-project-index work-project-files" aria-label="Explore selected projects">
      {selectedProjects.map((item, index) => (
        <a key={item.id} className={`work-index-entry work-index-${item.id} work-file-link`} href={`#${item.anchor}`}>
          <span className="work-file-tab"><span>FILE / 0{index + 1}</span><span>{item.label}</span></span>
          <WorkFileArtifact project={item.id} />
          <div className="work-file-account">
            <span className="work-file-discipline">{item.discipline}</span>
            <h2>{item.title}</h2>
            <p className="work-file-status"><span aria-hidden="true" />{item.note}</p>
            <dl className="work-file-role"><dt>{item.roleLabel}</dt><dd>{item.role}</dd></dl>
          </div>
          <span className="work-file-open">Open the project chapter <ArrowRight size={17} aria-hidden="true" /></span>
        </a>
      ))}
    </nav>
  );
}

export default function WorkPage({
  onQuick,
  onPage,
  motionEnabled = true,
  navigationOpen = false,
  onCaptureNavigate,
}: WorkPageProps) {
  const community = projects.find((project) => project.id === "community")!;
  const accuflow = projects.find((project) => project.id === "accuflow")!;

  return (
    <div className="work-page">
      <header className="work-page-opening work-files-opening page-width">
        <div className="work-page-edition">
          <p className="section-label">Selected work / The project files</p>
          <span>01—03 · Actual project captures</span>
        </div>
        <div className="work-files-heading">
          <h1>Open the <em>project files.</em></h1>
          <p>The school pages, bilingual stories and guide interface. A closer look at the work, the contributions and where each project stands.</p>
        </div>
        <WorkProjectIndex />
        <div className="work-page-scroll-note" aria-hidden="true">
          <span>Follow the work</span>
          <span>↓</span>
        </div>
      </header>
      <WorkChapterRail navigationOpen={navigationOpen} motionEnabled={motionEnabled} />
      <div id="work">
        <CirsStory
          onQuick={() => onQuick("cirs")}
          onPage={() => onPage("cirs")}
          motionEnabled={motionEnabled}
        />
        <WorkEvidenceDrawer
          project="cirs"
          eyebrow="CIRS / Website details"
          title="From the homepage to parent questions."
          description="Homepage, Admissions, process and parent questions from the live school website."
          action="4 interface views"
        >
          {(view, onChange) => <InterfaceAtlas project="cirs" initialView={view} onViewChange={onChange} />}
        </WorkEvidenceDrawer>
        <details
          className="work-process-drawer"
          onToggle={() => ScrollTrigger.refresh()}
        >
          <summary className="page-width">
            <span>
              <span className="section-label">
                CIRS / Portfolio interpretation
              </span>
              <strong>Reconstructed concept study</strong>
            </span>
            <span className="work-process-drawer-action">
              Explore the illustration <Plus size={18} aria-hidden="true" />
            </span>
          </summary>
          <CirsConceptStudy motion={motionEnabled} />
        </details>
      </div>
      <div className="story-projects">
        <Feature
          project={community}
          motionEnabled={motionEnabled}
          index={1}
          messy={false}
          onQuick={() => onQuick("community")}
          onPage={() => onPage("community")}
        />
        <WorkEvidenceDrawer
          project="community"
          eyebrow="Vallalar / Bilingual website preview"
          title="Read the bilingual About page."
          description="Matching English and Tamil openings from the public website review preview."
          action="2 language views"
        >
          {(view, onChange) => <CommunityLanguageStudy initialLanguage={view === "ta" ? "ta" : "en"} onLanguageChange={onChange} />}
        </WorkEvidenceDrawer>
        <Feature
          project={accuflow}
          motionEnabled={motionEnabled}
          index={2}
          messy={false}
          onQuick={() => onQuick("accuflow")}
          onPage={() => onPage("accuflow")}
          onCaptureNavigate={onCaptureNavigate}
        />
        <WorkEvidenceDrawer
          project="accuflow"
          eyebrow="AccuFlow / Prototype details"
          title="From product story to guide interface."
          description="Home, Product, How it works and the initial guide interface from the running prototype."
          action="4 prototype views"
        >
          {(view, onChange) => <InterfaceAtlas project="accuflow" initialView={view} onViewChange={onChange} onCaptureNavigate={onCaptureNavigate} />}
        </WorkEvidenceDrawer>
      </div>
    </div>
  );
}
