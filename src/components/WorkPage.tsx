import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowDownRight } from "lucide-react";
import {
  projects,
  projectAssets,
  projectStatus,
  scrollStoryCopy,
  communityStory,
} from "../content";
import type { Project } from "../content";
import InterfaceAtlas from "./InterfaceAtlas";
import CirsConceptStudy from "./CirsConceptStudy";
import CommunityLanguageStudy from "./CommunityLanguageStudy";

type WorkPageProps = {
  onQuick: (id: Project["id"]) => void;
  onPage: (id: Project["id"]) => void;
  motionEnabled?: boolean;
};

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
      <div className="chapter-reflection" aria-hidden="true" />
      <div className="cirs-detail-copy">
        <p className="section-label">01 — CIRS Website</p>
        <h2>
          A school’s story.
          <br />
          <em>A family’s next step.</em>
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
      <div className="cirs-interface-study">
        <div className="interface-study-label">
          <span>Admissions / interface study</span>
          <span>Live website</span>
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
        <ol
          className="cirs-interface-map"
          aria-label="Admissions page structure"
        >
          <li>
            <span>01</span>
            <strong>Application portal</strong>
            <small>A route for registered families.</small>
          </li>
          <li>
            <span>02</span>
            <strong>Admissions process</strong>
            <small>Entry and application information.</small>
          </li>
          <li>
            <span>03</span>
            <strong>School enquiries</strong>
            <small>Dates and assessment arrangements.</small>
          </li>
        </ol>
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
        aria-label={`Open the ${project.title} case study`}
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
                <>
                  AccuFlow.
                  <br />
                  <em>A conversation, considered.</em>
                </>
              )}
            </h2>
          </div>
          <p className="feature-description">{project.description}</p>
        </div>
        {project.id === "community" ? (
          <div className="community-scroll-runway">
            <div
              className="community-world"
              data-editor-note={communityStory.editorNote}
            >
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
                  The purpose <span>→</span> The contribution
                </p>
              </div>
              <div className="community-purpose">
                <div className="service-step" data-service-step="purpose">
                  <p className="section-label">{communityStory.purposeLabel}</p>
                  <h3>
                    Digital work.
                    <br />
                    <em>Human purpose.</em>
                  </h3>
                  <p>{communityStory.purpose}</p>
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
            </div>
          </div>
        ) : (
          <div className="accuflow-assembly">
            <ol
              className="flow-interface-map"
              aria-label="Pages in the AccuFlow prototype"
            >
              {[
                "Home",
                "Product",
                "How it works",
                "Try it",
                "Business",
                "About",
              ].map((title, i) => (
                <li key={title}>
                  <span>0{i + 1}</span>
                  {title}
                </li>
              ))}
            </ol>
            <div className="project-window-label">
              <span>AccuFlow / Try interface</span>
              <span>Actual prototype capture</span>
            </div>
            <ProcessMedia project={project} messy={messy} onOpen={onQuick} />
            <span className="accuflow-scroll-meter" aria-hidden="true" />
          </div>
        )}
        {project.id === "accuflow" && (
          <div className="accuflow-stage-info">
            <p data-flow-stage>
              <span>The idea</span>
              {project.story.challenge}
            </p>
            <p data-flow-stage>
              <span>The interaction</span>
              {project.story.process}
            </p>
            <p data-flow-stage>
              <span>Current stage</span>
              {project.story.outcome}
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
      </div>
    </article>
  );
}

const selectedProjects = [
  {
    id: "cirs",
    title: "CIRS",
    discipline: "Education / Web development",
    note: "The official school website",
    anchor: "cirs",
  },
  {
    id: "community",
    title: "Vallalar",
    discipline: "Community / Digital storytelling",
    note: "A voluntary commitment since 2023",
    anchor: "community",
  },
  {
    id: "accuflow",
    title: "AccuFlow",
    discipline: "Product / Interaction prototype",
    note: "A conversation, considered",
    anchor: "accuflow",
  },
] as const;

export default function WorkPage({
  onQuick,
  onPage,
  motionEnabled = true,
}: WorkPageProps) {
  const community = projects.find((project) => project.id === "community")!;
  const accuflow = projects.find((project) => project.id === "accuflow")!;

  return (
    <div className="work-page">
      <header className="work-page-opening page-width">
        <div className="work-page-edition">
          <p className="section-label">Selected projects / 01—03</p>
          <span>Websites, community & interaction</span>
        </div>
        <h1>
          Selected <em>work.</em>
        </h1>
        <div className="work-page-introduction">
          <p>
            A digital home for my school. An ongoing commitment to my community.
            A product idea taking shape.
          </p>
          <span>Three projects. Different purposes.</span>
        </div>
        <nav
          className="work-project-index"
          aria-label="Explore selected projects"
        >
          {selectedProjects.map((item, index) => {
            const asset = projectAssets[item.id];
            return (
              <a
                key={item.id}
                className={`work-index-entry work-index-${item.id}`}
                href={`#${item.anchor}`}
              >
                <span className="work-index-number">0{index + 1}</span>
                <span className="work-index-name">
                  <strong>{item.title}</strong>
                  <span>{item.discipline}</span>
                </span>
                <span className="work-index-note">{item.note}</span>
                {asset.previewUrl && (
                  <span className="work-index-preview" aria-hidden="true">
                    <picture>
                      {asset.mobilePreviewUrl && (
                        <source
                          media="(max-width:767px)"
                          srcSet={asset.mobilePreviewUrl}
                        />
                      )}
                      <img src={asset.previewUrl} alt="" loading="eager" />
                    </picture>
                    <span>
                      {item.id === "community"
                        ? "Website review preview"
                        : item.id === "accuflow"
                          ? "Actual prototype capture"
                          : "Live website capture"}
                    </span>
                  </span>
                )}
                <ArrowDownRight
                  className="work-index-arrow"
                  size={22}
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </nav>
        <div className="work-page-scroll-note" aria-hidden="true">
          <span>Follow the work</span>
          <span>↓</span>
        </div>
      </header>
      <div id="work">
        <CirsStory
          onQuick={() => onQuick("cirs")}
          onPage={() => onPage("cirs")}
        />
        <InterfaceAtlas project="cirs" />
        <CirsConceptStudy motion={motionEnabled} />
      </div>
      <div className="story-projects">
        <Feature
          project={community}
          index={1}
          messy={false}
          onQuick={() => onQuick("community")}
          onPage={() => onPage("community")}
        />
        <CommunityLanguageStudy />
        <Feature
          project={accuflow}
          index={2}
          messy={false}
          onQuick={() => onQuick("accuflow")}
          onPage={() => onPage("accuflow")}
        />
        <InterfaceAtlas project="accuflow" />
      </div>
    </div>
  );
}
