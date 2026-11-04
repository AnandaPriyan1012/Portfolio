import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import CaptureInspection from "./CaptureInspection";

type ProjectId = "cirs" | "accuflow";
type InterfaceView = {
  id: string;
  label: string;
  title: string;
  description: string;
  observations: string[];
  source: string;
  alt: string;
};

const views: Record<ProjectId, InterfaceView[]> = {
  cirs: [
    {
      id: "home",
      label: "Homepage",
      title: "The school’s public face.",
      description: "The opening view of the public CIRS website.",
      observations: [
        "School identity and navigation share the opening view.",
        "The original school imagery remains part of the interface.",
      ],
      source: "https://cirschool.org/",
      alt: "Public CIRS homepage, captured in a browser on 4 November 2026",
    },
    {
      id: "admissions",
      label: "Admissions",
      title: "Two clear starting points.",
      description:
        "The Admissions Guide introduction puts portal access beside an explanation of the process.",
      observations: [
        "Registered Portal Login and Understand the process appear together.",
        "Entry class, application and assessment have separate summaries.",
      ],
      source: "https://cirschool.org/admissions.html",
      alt: "CIRS Admissions Guide introduction with portal and process links",
    },
    {
      id: "process",
      label: "The process",
      title: "From enquiry to enrolment.",
      description: "A closer view of the published Admissions process section.",
      observations: [
        "The sequence starts with an enquiry and confirming the entry route.",
        "Application and assessment appear as distinct steps.",
      ],
      source: "https://cirschool.org/admissions.html#apply",
      alt: "CIRS Admissions process section, beginning with enquiry and entry-route confirmation",
    },
    {
      id: "questions",
      label: "Parent questions",
      title: "Answers within reach.",
      description: "The parent questions section uses expandable answers.",
      observations: [
        "Each question has its own disclosure control.",
        "The first answer is expanded in this capture.",
      ],
      source: "https://cirschool.org/admissions.html#faq",
      alt: "CIRS parent questions section with the first answer expanded",
    },
  ],
  accuflow: [
    {
      id: "home",
      label: "Homepage",
      title: "The prototype’s opening view.",
      description:
        "The public prototype introduces the AcuFlow concept and its two main entry points.",
      observations: [
        "Starter-kit and guide links appear together in the hero.",
        "Product, How it works and Try it share the navigation.",
      ],
      source: "https://accuflow-premium-ai.netlify.app/",
      alt: "AcuFlow prototype homepage with starter-kit and guide links",
    },
    {
      id: "product",
      label: "The product",
      title: "One kit. Three months.",
      description:
        "The Product route presents the proposed starter-kit concept.",
      observations: [
        "The product has a dedicated route within the prototype.",
        "Planned contents and proposed pricing are presented further down the page.",
      ],
      source: "https://accuflow-premium-ai.netlify.app/product",
      alt: "AcuFlow Product route introducing the proposed three-month starter kit",
    },
    {
      id: "workflow",
      label: "How it works",
      title: "Four steps. Clear limits.",
      description:
        "A separate route explains the concept’s proposed workflow and boundaries.",
      observations: [
        "The page names Choose, Locate, Apply and Track as its four steps.",
        "Further sections distinguish answer boundaries and questions for launch.",
      ],
      source: "https://accuflow-premium-ai.netlify.app/how-it-works",
      alt: "AcuFlow How it works route introducing four steps and explicit limits",
    },
    {
      id: "guide",
      label: "The guide",
      title: "The initial guide interface.",
      description:
        "The untouched starting state of the internal website prototype.",
      observations: [
        "Prompt suggestions, a message field and New chat are visible.",
        "The interface carries its internal-prototype disclaimer. No message was submitted.",
      ],
      source: "https://accuflow-premium-ai.netlify.app/try",
      alt: "Initial AcuFlow Guide interface with prompt suggestions, message field and internal-prototype disclaimer",
    },
  ],
};

export default function InterfaceAtlas({ project, initialView, onViewChange }: {
  project: ProjectId;
  initialView?: string;
  onViewChange?: (id: string) => void;
}) {
  const id = useId();
  const [selected, setSelected] = useState(() => Math.max(0, views[project].findIndex((view) => view.id === initialView)));
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const projectViews = views[project];
  const view = projectViews[selected];
  const projectName = project === "cirs" ? "CIRS" : "AccuFlow";
  const compactUsesDesktop = project === "accuflow" && view.id === "home";

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % projectViews.length;
    else if (event.key === "ArrowLeft")
      next = (index + projectViews.length - 1) % projectViews.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = projectViews.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    onViewChange?.(projectViews[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <section
      className="interface-atlas"
      data-project={project}
      aria-labelledby={`${id}-title`}
    >
      <header className="interface-atlas-header">
        <div>
          <span className="interface-atlas-eyebrow">{projectName} / Interface views</span>
          <h3 id={`${id}-title`}>
            {project === "cirs"
              ? "The public website, in detail."
              : "Inside the prototype."}
          </h3>
        </div>
        <p>04 views / Genuine browser captures</p>
      </header>
      <div
        className="interface-atlas-tabs"
        role="tablist"
        aria-label={`${projectName} interface views`}
      >
        {projectViews.map((item, index) => (
          <button
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-controls={`${id}-panel`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            key={item.id}
            onClick={() => { setSelected(index); onViewChange?.(item.id); }}
            onKeyDown={(event) => moveTab(event, index)}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="interface-atlas-panel"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${view.id}`}
        tabIndex={0}
        key={`${project}-${view.id}`}
      >
        <figure className="interface-atlas-capture">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={`/media/atlas-${project}-${view.id}-${compactUsesDesktop ? "desktop" : "mobile"}.webp`}
              width={compactUsesDesktop ? 1440 : 390}
              height={1000}
            />
            <img
              src={`/media/atlas-${project}-${view.id}-desktop.webp`}
              alt={view.alt}
              width={1440}
              height={1000}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <figcaption>
            Public interface capture ·{" "}
            <time dateTime="2026-11-04">4 Nov 2026</time>
          </figcaption>
          <CaptureInspection
            src={`/media/atlas-${project}-${view.id}-desktop.webp`}
            mobileSrc={`/media/atlas-${project}-${view.id}-${compactUsesDesktop ? "desktop" : "mobile"}.webp`}
            title={`${projectName} · ${view.label}`}
            alt={view.alt}
            caption="Original browser capture · 4 November 2026."
          />
        </figure>
        <div className="interface-atlas-notes">
          <span className="interface-atlas-eyebrow">
            {String(selected + 1).padStart(2, "0")} / 04 · {view.label}
          </span>
          <h4>{view.title}</h4>
          <p>{view.description}</p>
          <details className="interface-atlas-observations">
            <summary>Observed interface details</summary>
            <ul>
              {view.observations.map((observation) => (
                <li key={observation}>{observation}</li>
              ))}
            </ul>
          </details>
          <a href={view.source} target="_blank" rel="noopener noreferrer">
            Open this source view <ArrowRight size={15} aria-hidden="true" />
          </a>
          <small>
            {project === "cirs"
              ? "A dated view of the interface. For current Admissions details, use the school’s live website."
              : "Website prototype only. These captures do not verify product availability, AI responses or health outcomes."}
          </small>
        </div>
      </div>
    </section>
  );
}
