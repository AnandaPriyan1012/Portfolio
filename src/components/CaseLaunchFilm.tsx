import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import "./case-launch-film.css";

type Film = { id: string; title: string; videoUrl: string; posterUrl: string };
type Playback = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/** The caller supplies an already-approved local owner-film/poster pair. */
export default function CaseLaunchFilm({ film, posterSrc }: { film: Film; posterSrc?: string }) {
  const player = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const attempt = useRef(0);
  const failed = useRef(false);
  const [requested, setRequested] = useState(false);
  const [state, setState] = useState<Playback>("idle");
  const [message, setMessage] = useState("");
  const poster = posterSrc ?? film.posterUrl;
  const caseFrame = film.id === "cirs-website-launch" && film.videoUrl === "/media/cirs-website-launch-web.mp4" &&
    poster === "/media/cirs-launch-case-0005.webp";

  useEffect(() => {
    mounted.current = true;
    const video = player.current;
    const pause = () => {
      attempt.current += 1;
      video?.pause();
    };
    const visibility = () => { if (document.hidden) pause(); };
    const opening = (event: Event) => {
      if ((event as CustomEvent<{ active?: boolean }>).detail?.active) pause();
    };
    const covered = (event: Event) => {
      if (event.target instanceof HTMLDialogElement && (event as ToggleEvent).newState === "open") pause();
    };
    const coveredFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest("dialog[open]")) pause();
    };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
    if (frame.current) observer.observe(frame.current);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("beforetoggle", covered, true);
    document.addEventListener("focusin", coveredFocus);
    window.addEventListener("ap:openingchange", opening);
    return () => {
      mounted.current = false;
      pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("beforetoggle", covered, true);
      document.removeEventListener("focusin", coveredFocus);
      window.removeEventListener("ap:openingchange", opening);
    };
  }, []);

  function sourceError() {
    if (!mounted.current) return;
    failed.current = true;
    setState("error");
    setMessage("The film could not load. Retry here, or open the launch film in Studio below.");
  }
  function watch() {
    const video = player.current;
    if (!video) return;
    if (video.getAttribute("src") === film.videoUrl && !video.paused && !video.ended) {
      attempt.current += 1;
      video.pause();
      setState("paused");
      setMessage("");
      return;
    }
    if (!/^\/media\/[a-z0-9][a-z0-9._-]*\.mp4$/i.test(film.videoUrl)) { sourceError(); return; }
    const token = ++attempt.current;
    const reload = failed.current || video.getAttribute("src") !== film.videoUrl;
    failed.current = false;
    setRequested(true);
    setState("loading");
    setMessage("");
    // Assign and play synchronously in the actual click/tap gesture. Rendering
    // or entering this chapter never assigns a media source or starts playback.
    video.controls = true;
    video.preload = "metadata";
    if (reload) { video.src = film.videoUrl; video.load(); }
    else if (video.ended) video.currentTime = 0;
    const bounds = video.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight)
      video.scrollIntoView({ block: "nearest", behavior: "instant" });
    video.focus({ preventScroll: true });
    const rejected = () => {
      if (!mounted.current || token !== attempt.current || failed.current) return;
      setState("paused");
      setMessage("Playback did not start. Use the video controls to play, or open the film in Studio below.");
    };
    try { void video.play().catch(rejected); }
    catch { rejected(); }
  }

  return (
    <figure className="case-launch-film" data-state={state}>
      <div ref={frame} className="case-launch-film-frame">
        <video ref={player} className="case-launch-video" aria-label={`${film.title} video player`}
          controls={requested} playsInline tabIndex={requested ? 0 : -1}
          preload={requested ? "metadata" : "none"} poster={poster}
          width={1920} height={1080}
          onPlay={() => { if (mounted.current) { setState("playing"); setMessage(""); } }}
          onPause={(event) => {
            if (mounted.current && event.currentTarget.hasAttribute("src") && !failed.current)
              setState(event.currentTarget.ended ? "ended" : "paused");
          }}
          onEnded={() => { if (mounted.current) setState("ended"); }}
          onError={sourceError}>
          Your browser does not support video playback. Open the film in Studio below.
        </video>
      </div>
      <div className="case-launch-film-actions">
        <button type="button" className="case-launch-watch" onClick={watch}>
          {state === "playing" ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          {state === "error" ? `Retry ${film.title}` : state === "playing" ? `Pause ${film.title}` : state === "ended" ? `Replay ${film.title}` : requested ? `Play ${film.title}` : `Watch ${film.title} · 0:38`}
        </button>
        <span>Launch film · 0:38</span>
      </div>
      <p className="case-launch-status" role="status" aria-atomic="true">{message}</p>
      <figcaption>{caseFrame ? "Poster frame from supplied launch film · 00:05" : "Supplied website launch film · 0:38"}</figcaption>
    </figure>
  );
}
