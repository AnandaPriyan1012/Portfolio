import { useState, type MouseEvent } from "react";
import { ArrowRight, Play } from "lucide-react";
import { directorsCut, scrollStoryCopy } from "../content";
import HeroFilm from "./HeroFilm";
import HomeCirsProof from "./HomeCirsProof";
import "./project-opening.css";

export default function ProjectOpening({
  onWork,
  onCaseStudy,
  onImageError,
  onDirector,
  onStudio,
  motionEnabled,
}: {
  onWork: () => void;
  onCaseStudy?: () => void;
  onImageError: () => void;
  onDirector: () => void;
  onStudio?: (filmId?: string) => void;
  motionEnabled: boolean;
}) {
  const [filmActive, setFilmActive] = useState(false);
  function studio(event: MouseEvent<HTMLAnchorElement>) {
    if (!onStudio || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onStudio();
  }
  return (
    <section
      className="scroll-opening project-opening retro-opening"
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
      <div className="hero-optical-pane" aria-hidden="true"><span className="retro-glass-raster" /></div>
      <div className="hero-story-copy">
        <p className="hero-eyebrow">Ananda Priyan · Selected work</p>
        <h1 aria-label="Ananda Priyan">
          <span>Ananda</span> <span>Priyan</span>
        </h1>
        <p className="hero-factual-intro">{scrollStoryCopy.introduction}</p>
        <button className="view-work-button" onClick={onWork}>
          <Play size={12} fill="currentColor" aria-hidden="true" /> View Work
        </button>
        <a className="opening-studio-link" href="/studio" onClick={studio}>Films <ArrowRight size={13} aria-hidden="true" /></a>
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
