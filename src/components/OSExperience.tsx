import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Code2,
  Film,
  Heart,
  Maximize2,
  Minimize2,
  MousePointer2,
  Sparkles,
  Workflow,
  Waves,
  X,
} from "lucide-react";
import {
  aboutLanes,
  projects,
  projectAssets,
  creativeMedia,
  projectStatus as status,
  type Project,
} from "../content";
import "./os.css";

type AppId = Project["id"] | "swimming";
type DesktopWindow = {
  id: AppId;
  x: number;
  y: number;
  z: number;
  maximized: boolean;
};
type Props = {
  onClose: () => void;
  onOpenProject: (id: Project["id"]) => void;
  onSwim: () => void;
};
const apps = [
  {
    id: "cirs" as const,
    title: "Build",
    file: "CIRS Website",
    icon: Code2,
    color: "#c6a27a",
  },
  {
    id: "community" as const,
    title: "Community",
    file: "Community work",
    icon: Heart,
    color: "#c6a27a",
  },
  {
    id: "accuflow" as const,
    title: "AccuFlow",
    file: "AccuFlow",
    icon: Workflow,
    color: "#c6a27a",
  },
  {
    id: "creative" as const,
    title: "Film",
    file: "Creative production",
    icon: Film,
    color: "#c6a27a",
  },
  {
    id: "swimming" as const,
    title: "Swimming",
    file: "Beyond the screen",
    icon: Waves,
    color: "#c6a27a",
  },
  {
    id: "airkart" as const,
    title: "Imagine",
    file: "AirKart",
    icon: Sparkles,
    color: "#c6a27a",
  },
].filter(
  (app) =>
    app.id !== "creative" ||
    creativeMedia.some(
      (item) => item.videoUrl && item.posterUrl && item.credits,
    ),
);
const WindowVisual = ({ id }: { id: AppId }) => {
  const project = projects.find((item) => item.id === id);
  const source = id === "swimming" ? null : projectAssets[id].previewUrl;
  return source ? (
    <img
      src={source}
      alt={`${project?.title} — approved project visual`}
      loading="lazy"
    />
  ) : (
    <div className={`os-media-slot os-media-${id}`}>
      <span>{project?.title ?? "Beyond the screen"}</span>
      <p>
        {id === "swimming"
          ? "Personal photographs to be added."
          : "Project visuals to be added."}
      </p>
    </div>
  );
};

export default function OSExperience({
  onClose,
  onOpenProject,
  onSwim,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const counter = useRef(2);
  const drag = useRef<{
    id: AppId;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const [windows, setWindows] = useState<DesktopWindow[]>([
    {
      id: "cirs",
      x: Math.max(120, (window.innerWidth - 560) / 2),
      y: 112,
      z: 2,
      maximized: false,
    },
  ]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 740);
  const topWindow = [...windows].sort((a, b) => b.z - a.z)[0]?.id;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const resize = () => {
      setIsMobile(window.innerWidth <= 740);
      setWindows((items) =>
        items.map((item) => ({
          ...item,
          x: Math.min(item.x, Math.max(8, window.innerWidth - 590)),
          y: Math.min(item.y, Math.max(80, window.innerHeight - 200)),
        })),
      );
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = focusables[0],
        last = focusables[focusables.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !root.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !root.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
      previous?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const focusWindow = (id: AppId) => {
    const z = ++counter.current;
    setWindows((items) =>
      items.map((item) => (item.id === id ? { ...item, z } : item)),
    );
  };
  const open = (id: AppId) => {
    const z = ++counter.current;
    setWindows((items) =>
      items.some((item) => item.id === id)
        ? items.map((item) => (item.id === id ? { ...item, z } : item))
        : [
            ...items,
            {
              id,
              x: Math.min(
                180 + items.length * 28,
                Math.max(12, window.innerWidth - 590),
              ),
              y: Math.min(
                100 + items.length * 28,
                Math.max(80, window.innerHeight - 280),
              ),
              z,
              maximized: false,
            },
          ],
    );
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(`[data-window="${id}"]`)
        ?.focus(),
    );
  };
  const closeWindow = (id: AppId) => {
    setWindows((items) => items.filter((item) => item.id !== id));
    const next = [...windows]
      .filter((item) => item.id !== id)
      .sort((a, b) => b.z - a.z)[0];
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(
          next ? `[data-window="${next.id}"]` : `[data-launch="${id}"]`,
        )
        ?.focus(),
    );
  };
  const toggleMax = (id: AppId) =>
    setWindows((items) =>
      items.map((item) =>
        item.id === id ? { ...item, maximized: !item.maximized } : item,
      ),
    );
  const startDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    item: DesktopWindow,
  ) => {
    if (
      isMobile ||
      item.maximized ||
      (event.target as HTMLElement).closest("button")
    )
      return;
    focusWindow(item.id);
    drag.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      x: item.x,
      y: item.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragWindow = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const current = drag.current;
    const x = Math.max(
      8,
      Math.min(
        window.innerWidth - Math.min(560, window.innerWidth - 24) - 8,
        current.x + event.clientX - current.startX,
      ),
    );
    const y = Math.max(
      72,
      Math.min(
        window.innerHeight - 165,
        current.y + event.clientY - current.startY,
      ),
    );
    setWindows((items) =>
      items.map((item) => (item.id === current.id ? { ...item, x, y } : item)),
    );
  };
  const view = (id: AppId) => {
    onClose();
    if (id === "swimming") onSwim();
    else onOpenProject(id);
  };

  return (
    <div
      className="ap-os"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="AP OS"
    >
      <header className="os-menubar">
        <div className="os-brand">
          <span className="os-mark">ap.</span>
          <strong>AP OS</strong>
          <span className="os-version">Curiosity, connected.</span>
        </div>
        <button ref={closeButton} className="os-exit" onClick={onClose}>
          <ArrowLeft size={14} /> Conventional view <span>Esc</span>
        </button>
      </header>
      <div className="os-wallpaper" aria-hidden="true">
        <span>
          A few
          <br />
          <em>open ideas.</em>
        </span>
        <p>A different way to explore the portfolio.</p>
      </div>
      <nav
        className="os-desktop-icons"
        aria-label="Desktop applications"
        inert={isMobile && windows.length > 0}
      >
        {apps.map((app) => (
          <button
            key={app.id}
            data-launch={app.id}
            className="os-desktop-app"
            onClick={() => open(app.id)}
            style={{ "--app-color": app.color } as React.CSSProperties}
          >
            <span className="os-app-icon">
              <app.icon size={25} strokeWidth={1.3} />
            </span>
            <span>{app.file}</span>
          </button>
        ))}
      </nav>
      <div className="os-window-area">
        {windows.map((item) => {
          const app = apps.find((app) => app.id === item.id)!;
          const project = projects.find((project) => project.id === item.id);
          const swimmer = aboutLanes.find((lane) => lane.id === "swimmer")!;
          const hidden = isMobile && topWindow !== item.id;
          return (
            <section
              key={item.id}
              data-window={item.id}
              tabIndex={-1}
              onFocusCapture={() => {
                if (topWindow !== item.id) focusWindow(item.id);
              }}
              className={`os-window${item.maximized ? " os-window-maximized" : ""}${hidden ? " os-window-hidden" : ""}`}
              aria-label={`${project?.title ?? "Beyond the screen"} window`}
              style={
                {
                  left: item.x,
                  top: item.y,
                  zIndex: item.z,
                  "--app-color": app.color,
                } as React.CSSProperties
              }
              onPointerDown={() => {
                if (topWindow !== item.id) focusWindow(item.id);
              }}
            >
              <div
                className="os-window-titlebar"
                onPointerDown={(event) => startDrag(event, item)}
                onPointerMove={dragWindow}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
              >
                <span className="os-window-file">
                  <app.icon size={14} />
                  <span>{app.file}</span>
                </span>
                <div className="os-window-controls">
                  <button
                    className="os-window-max"
                    aria-label={`${item.maximized ? "Restore" : "Maximize"} ${app.title} window`}
                    onClick={() => toggleMax(item.id)}
                  >
                    {item.maximized ? (
                      <Minimize2 size={13} />
                    ) : (
                      <Maximize2 size={13} />
                    )}
                  </button>
                  <button
                    aria-label={`Close ${app.title} window`}
                    onClick={() => closeWindow(item.id)}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="os-window-content">
                <div className="os-passport-heading">
                  <span className="os-micro">
                    {project ? "Project passport" : "Beyond the screen"}
                  </span>
                  <span className="os-status">
                    {project
                      ? status[project.id]
                      : "A different kind of motion"}
                  </span>
                </div>
                <h2>{project?.title ?? "The other lane."}</h2>
                <p className="os-passport-intro">
                  {project?.subtitle ?? swimmer.description}
                </p>
                <div className="os-passport-visual">
                  <WindowVisual id={item.id} />
                </div>
                {project ? (
                  <div className="os-passport-facts">
                    <div>
                      <span>
                        <BriefcaseBusiness size={12} /> The mission
                      </span>
                      <p>{project.story.challenge}</p>
                    </div>
                    <div>
                      <span>
                        <MousePointer2 size={12} /> My role
                      </span>
                      <p>{project.story.role}</p>
                    </div>
                    <div>
                      <span>
                        <Check size={12} /> Where it stands
                      </span>
                      <p>{project.story.outcome}</p>
                    </div>
                  </div>
                ) : (
                  <div className="os-passport-facts">
                    <div>
                      <span>
                        <Waves size={12} /> More than one lane
                      </span>
                      <p>{swimmer.detail}</p>
                    </div>
                    <div>
                      <span>
                        <Check size={12} /> Recognition
                      </span>
                      <p>
                        Chinmaya Gaurav Award for Excellence in Swimming.
                        Certificate and award context to be supplied.
                      </p>
                    </div>
                  </div>
                )}
                <button
                  className="os-passport-cta"
                  onClick={() => view(item.id)}
                >
                  {project ? "Open the full case study" : "Meet the person"}{" "}
                  <ArrowUpRight size={16} />
                </button>
                <p className="os-passport-note">
                  {project?.mediaStatus ??
                    "Personal photographs and verified details pending."}
                </p>
              </div>
            </section>
          );
        })}
      </div>
      {!windows.length && (
        <div className="os-empty">
          <Sparkles size={30} />
          <p>A little room for curiosity.</p>
          <span>Open an application to explore a different side.</span>
        </div>
      )}
      <footer className="os-taskbar">
        <span className="os-taskbar-caption">Ananda Priyan</span>
        <nav className="os-dock" aria-label="Application dock">
          {apps.map((app) => (
            <button
              key={app.id}
              aria-label={`Open ${app.title}`}
              aria-pressed={topWindow === app.id}
              className={topWindow === app.id ? "os-dock-active" : ""}
              onClick={() => open(app.id)}
              style={{ "--app-color": app.color } as React.CSSProperties}
            >
              <app.icon size={20} strokeWidth={1.5} />
              <span>{app.title}</span>
              <i
                className={
                  windows.some((window) => window.id === app.id)
                    ? "os-running"
                    : ""
                }
              />
            </button>
          ))}
        </nav>
        <span className="os-taskbar-note">
          Different interests.
          <br />
          One curious mind.
        </span>
      </footer>
      <div className="os-sr" aria-live="polite">
        {topWindow
          ? `${apps.find((app) => app.id === topWindow)?.title} application active`
          : "Desktop. Choose an application."}
      </div>
    </div>
  );
}
