import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { creativeMedia } from "../content";
import { hasApprovedNativePlayback } from "../media-readiness";
import { isApprovedDriveEmbed } from "./DriveFilmPlayer";

export type DirectoryPath = "/work" | "/studio" | "/about";
type HomeDirectoryProps = {
  onNavigate: (path: string, homeOrigin?: string) => void;
  motionEnabled?: boolean;
  visitedPaths?: readonly DirectoryPath[];
  onResetVisits?: () => void;
};
type Selection = "work" | "studio" | "about";

const destinations = [
  {
    id: "work",
    path: "/work",
    title: "Work",
    category: "Websites & interaction",
    description:
      "A school website. A community’s digital space. A product prototype.",
    action: "Explore the projects",
    accessible: "Explore Work: CIRS, Vallalar Sathya Dharmasalai, and AccuFlow",
  },
  {
    id: "studio",
    path: "/studio",
    title: "Studio",
    category: "Films & creative work",
    description:
      "Trailers, auditions and a website launch. The actual films, ready to watch.",
    action: "Enter the Studio",
    accessible: "Explore Studio: films, trailers and editing work",
  },
  {
    id: "about",
    path: "/about",
    title: "Ananda",
    category: "About & contact",
    description:
      "Student developer, storyteller, swimmer. Volunteer at Vallalar since 2023.",
    action: "Meet the person",
    accessible: "About Ananda Priyan and contact",
  },
] as const;
const workViews = [
  {
    id: "cirs",
    project: "cirs",
    label: "CIRS",
    title: "A school’s digital home.",
    src: "/media/cirs-home-desktop.webp",
    mobile: "/media/cirs-home-mobile.webp",
    alt: "The actual CIRS school website homepage",
    note: "CIRS / Website capture",
    mobileHeight: 844,
    type: "Website",
  },
  {
    id: "vallalar",
    project: "community",
    label: "Vallalar",
    title: "In service of a community.",
    src: "/media/vallalar-language-en-desktop.webp",
    mobile: "/media/vallalar-language-en-mobile.webp",
    alt: "The English About page from the Vallalar website review preview",
    note: "Vallalar / Website review preview",
    mobileHeight: 420,
    type: "Community",
  },
  {
    id: "accuflow",
    project: "accuflow",
    label: "AccuFlow",
    title: "An idea, made interactive.",
    src: "/media/accuflow-prototype-desktop.webp",
    mobile: "/media/accuflow-prototype-mobile.webp",
    alt: "The real AccuFlow exploratory guide interface prototype",
    note: "AccuFlow / Website prototype capture",
    mobileHeight: 844,
    type: "Prototype",
  },
] as const;
const studioViews = ["vantara", "ted-ed-2026", "cirs-website-launch"]
  .map((id) => creativeMedia.find((film) => film.id === id))
  .filter((film): film is NonNullable<typeof film> => Boolean(film?.posterUrl &&
    (hasApprovedNativePlayback(film) || isApprovedDriveEmbed(film.embedUrl))));

type PreviewPreferences = { selection: Selection; work: string; film: string };
const previewStorageKey = "ap-home-preview-v1";
let previewMemory: PreviewPreferences | undefined;

function readPreviewPreferences(): PreviewPreferences {
  if (previewMemory) return previewMemory;
  const defaults: PreviewPreferences = { selection: "work", work: "cirs", film: studioViews[0]?.id ?? "" };
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(previewStorageKey) ?? "null");
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const saved = value as Record<string, unknown>;
      if (saved.selection === "work" || saved.selection === "studio" || saved.selection === "about")
        defaults.selection = saved.selection;
      if (workViews.some((item) => item.id === saved.work)) defaults.work = saved.work as string;
      if (studioViews.some((item) => item.id === saved.film)) defaults.film = saved.film as string;
    }
  } catch { /* Preview choices still survive SPA returns in this document. */ }
  previewMemory = defaults;
  return defaults;
}

export default function HomeDirectory({
  onNavigate,
  motionEnabled = false,
  visitedPaths,
  onResetVisits,
}: HomeDirectoryProps) {
  const root = useRef<HTMLElement>(null);
  const [preview, setPreview] = useState(readPreviewPreferences);
  const selected = preview.selection;
  const workIndex = Math.max(0, workViews.findIndex((item) => item.id === preview.work));
  const filmIndex = Math.max(0, studioViews.findIndex((item) => item.id === preview.film));
  const work = workViews[workIndex];
  const film = studioViews[filmIndex];
  const previewPath = selected === "work" ? `/projects/${work.project}`
    : selected === "studio" && film ? `/studio#${film.id}` : selected === "studio" ? "/studio" : "/about";
  const previewAction = selected === "work" ? `Read the ${work.label} story`
    : selected === "studio" && film ? "Open this film in Studio" : selected === "studio" ? "Open the film collection" : "Meet Ananda";
  const activeIndex = destinations.findIndex((item) => item.id === selected);
  const visits = new Set(
    visitedPaths?.filter((path) =>
      destinations.some((item) => item.path === path),
    ),
  );

  function rememberPreview(change: Partial<PreviewPreferences>) {
    const next = { ...(previewMemory ?? preview), ...change };
    if (next.selection === preview.selection && next.work === preview.work && next.film === preview.film) return;
    previewMemory = next;
    setPreview(next);
    try { sessionStorage.setItem(previewStorageKey, JSON.stringify(next)); }
    catch { /* Keep the bounded in-memory choices if optional storage is denied. */ }
  }
  const setSelected = (selection: Selection) => rememberPreview({ selection });

  useEffect(() => {
    if (!motionEnabled || !root.current) return;
    // Match the page coordinator's static fallback before creating triggers.
    const device = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (
      device.connection?.saveData ||
      (navigator.hardwareConcurrency > 0 &&
        navigator.hardwareConcurrency <= 2) ||
      (device.deviceMemory && device.deviceMemory <= 2)
    )
      return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 1100px) and (min-height: 760px) and (pointer: fine) and (hover: hover) and (forced-colors: none) and (prefers-reduced-motion: no-preference)",
      () => {
        const context = gsap.context(() => {
          gsap.fromTo(
            ".ap-select-display",
            { rotateY: -5, rotateX: 4, y: 46, scale: 0.96 },
            {
              rotateY: 0,
              rotateX: 0,
              y: 0,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                id: "ap-select-arrival",
                trigger: root.current,
                start: "top 85%",
                end: "top 15%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
          gsap.fromTo(
            ".ap-select-scroll-light",
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                id: "ap-select-light",
                trigger: root.current,
                start: "top 85%",
                end: "bottom 35%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }, root);
        return () => context.revert();
      },
    );
    return () => media.revert();
  }, [motionEnabled]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, path: string, homeOrigin?: string) {
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
    onNavigate(path, homeOrigin);
  }

  return (
    <section
      ref={root}
      className="home-directory"
      aria-labelledby="home-directory-heading"
      data-selection={selected}
      data-motion={motionEnabled ? "on" : "off"}
    >
      <div className="page-width home-directory-inner">
        <header className="home-directory-intro">
          <div>
            <p className="ap-select-kicker">
              <span aria-hidden="true">✦</span> AP / SELECT
            </p>
            <h2 id="home-directory-heading" className="home-directory-title">
              Pick your
              <br />
              <em>next move.</em>
            </h2>
          </div>
          <div className="home-directory-intro-note">
            <span className="ap-select-edition">WEB · FILM · COMMUNITY</span>
            <p>
              Different sides of the same curiosity.
              <br />
              Choose a page and get into the work.
            </p>
          </div>
        </header>
        <div className="ap-select-cabinet">
          <div className="ap-select-cabinet-top">
            <img
              src="/media/ap-signature-champagne.png"
              width="72"
              height="48"
              alt=""
            />
            <span>ANANDA PRIYAN / PERSONAL COLLECTION</span>
            <span className="ap-select-position" aria-hidden="true">
              0{activeIndex + 1} — 03
            </span>
          </div>
          <span className="ap-select-scroll-light" aria-hidden="true" />
          <div className="ap-select-layout">
            <div className="ap-select-display" data-preview={selected}>
              <div
                className="ap-select-modes"
                role="group"
                aria-label="Choose a preview"
              >
                <span>Preview</span>
                {destinations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Preview ${item.id === "about" ? "About" : item.title}`}
                    aria-pressed={selected === item.id}
                    onClick={() => setSelected(item.id)}
                  >
                    {item.id === "about" ? "About" : item.title}
                  </button>
                ))}
              </div>
              <div className="ap-select-preview-heading">
                <span>
                  {selected === "work"
                    ? "Inside the interfaces"
                    : selected === "studio"
                      ? "From the collection"
                      : "The person behind it"}
                </span>
                <span className="ap-select-pixel">
                  {selected === "work"
                    ? work.type
                    : selected === "studio"
                      ? (film?.type ?? "Film")
                      : "AP"}
                </span>
              </div>
              <div className="ap-select-art-window">
                {selected === "work" ? (
                  <figure
                    className={`ap-select-art ap-select-art-${work.id}`}
                    key={work.id}
                  >
                    <picture>
                      <source media="(max-width: 767px)" srcSet={work.mobile} width={390} height={work.mobileHeight} />
                      <img
                        src={work.src}
                        alt={work.alt}
                        width="1440"
                        height="1000"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <figcaption>{work.note}</figcaption>
                  </figure>
                ) : selected === "studio" && film?.posterUrl ? (
                  <figure
                    className="ap-select-art ap-select-art-film"
                    key={film.id}
                  >
                    <img
                      src={film.posterUrl}
                      alt={`${film.title} — film poster`}
                      width="1920"
                      height="1080"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption>{film.title} / Film poster</figcaption>
                  </figure>
                ) : (
                  <div className="ap-select-signature">
                    <img
                      src="/media/ap-signature-champagne.png"
                      alt="Ananda Priyan’s AP signature"
                      width="768"
                      height="512"
                      loading="lazy"
                      decoding="async"
                    />
                    <p>{selected === "studio" ? <>The film<br />collection.</> : <>Student. Builder.<br />Storyteller. Swimmer.</>}</p>
                  </div>
                )}
                <span className="ap-select-glass-edge" aria-hidden="true" />
              </div>
              <div
                className="ap-select-preview-controls"
                role="group"
                aria-label={
                  selected === "work"
                    ? "Preview project captures"
                    : selected === "studio"
                      ? "Preview film posters"
                      : "About preview"
                }
              >
                {selected === "work" ? (
                  workViews.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Preview ${item.label} capture`}
                      aria-pressed={workIndex === index}
                      onClick={() => rememberPreview({ work: item.id })}
                    >
                      {item.label}
                    </button>
                  ))
                ) : selected === "studio" ? (
                  studioViews.map(
                    (item, index) =>
                      item && (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`Preview ${item.title} poster`}
                          aria-pressed={filmIndex === index}
                          onClick={() => rememberPreview({ film: item.id })}
                        >
                          {item.title === "CIRS website launch"
                            ? "CIRS launch"
                            : item.title}
                        </button>
                      ),
                  )
                ) : (
                  <span className="ap-select-person-note">
                    CIRS · Vallalar · Beyond the screen
                  </span>
                )}
              </div>
              <a className="ap-select-caption" href={previewPath} data-home-origin="selected-preview"
                onClick={(event) => navigate(event, previewPath, "selected-preview")}>
                <span>
                  <span className="ap-select-context-action">{previewAction}</span>
                  <span className="ap-select-context-title">
                  {selected === "work"
                    ? work.title
                    : selected === "studio"
                      ? film?.title ?? "Browse the programme."
                      : "More than one lane."}
                  </span>
                </span>
                <ArrowRight size={23} aria-hidden="true" />
              </a>
            </div>
            <nav
              className="home-directory-pages"
              aria-label="Explore the portfolio"
            >
              {destinations.map((item, index) => (
                <a
                  key={item.id}
                  className={`home-directory-row home-directory-${item.id}`}
                  href={item.path}
                  aria-label={item.accessible}
                  onMouseEnter={() => setSelected(item.id)}
                  onFocus={() => setSelected(item.id)}
                  onClick={(event) => navigate(event, item.path)}
                  data-selected={selected === item.id}
                >
                  <div className="ap-select-route-top">
                    <span className="ap-select-pixel">
                      0{index + 1} / {item.category}
                    </span>
                    <ArrowRight size={21} aria-hidden="true" />
                  </div>
                  <h3>
                    {item.title}
                    <span>.</span>
                  </h3>
                  <p>{item.description}</p>
                  <span className="home-directory-action">{item.action}</span>
                </a>
              ))}
            </nav>
          </div>
          <div className="ap-select-cabinet-bottom">
            <span>CIRS · VALLALAR · ACCUFLOW · FILM</span>
            <span>
              CHOOSE YOUR ROUTE <ArrowRight size={14} aria-hidden="true" />
            </span>
          </div>
        </div>
        {visitedPaths !== undefined && (
          <div
            className="ap-select-trail"
            role="group"
            aria-label="Pages visited this session"
          >
            <p role="status">
              <span className="ap-select-pixel">YOUR TRAIL</span>{" "}
              <strong>{visits.size} / 3 pages visited</strong>
            </p>
            <ul>
              {destinations.map((item) => (
                <li key={item.path} data-visited={visits.has(item.path)}>
                  <span aria-hidden="true">
                    {visits.has(item.path) ? "◆" : "◇"}
                  </span>
                  {item.id === "about" ? "About" : item.title}
                  <span className="ap-select-visually-hidden">
                    {visits.has(item.path) ? ", visited" : ", not visited"}
                  </span>
                </li>
              ))}
            </ul>
            {onResetVisits && (
              <button type="button" onClick={onResetVisits}>
                Reset visit trail
              </button>
            )}
          </div>
        )}
        <div className="home-directory-footer">
          <p>Have something in mind?</p>
          <a
            href="/about#contact"
            onClick={(event) => navigate(event, "/about#contact")}
          >
            Let’s talk <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
