import { useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import { directorsCut, scrollStoryCopy } from "../content";
import HomeCirsProof from "./HomeCirsProof";
import "./project-opening.css";

export default function ProjectOpening({ onWork, onCaseStudy, onImageError, onDirector, onStudio, motionEnabled }: {
  onWork: () => void;
  onCaseStudy?: () => void;
  onImageError: () => void;
  onDirector: () => void;
  onStudio?: () => void;
  motionEnabled: boolean;
}) {
  const [failed, setFailed] = useState({ community: false, accuflow: false });
  function studio(event: MouseEvent<HTMLAnchorElement>) {
    if (!onStudio || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onStudio();
  }
  return (
    <section className="scroll-opening project-opening" data-opening-motion={motionEnabled ? "on" : "off"}
      aria-label="Introduction and CIRS project scene">
      <div className="hero-story-copy">
        <p className="hero-eyebrow">Ananda Priyan · Selected work</p>
        <h1 aria-label="Ananda Priyan"><span>Ananda</span><span>Priyan<span className="opening-name-stop" aria-hidden="true">.</span></span></h1>
        <p className="opening-personal">Student developer, storyteller &amp; swimmer.</p>
        <p className="hero-factual-intro">{scrollStoryCopy.introduction}</p>
        <div className="opening-actions">
          <button className="view-work-button" type="button" onClick={onWork}>View Work</button>
          <a href="/studio" className="opening-studio-link" onClick={studio}>See the films <ArrowRight size={14} aria-hidden="true" /></a>
          {directorsCut.videoUrl && directorsCut.credits && <button type="button" className="director-film-link" data-cursor="play" onClick={onDirector}>Play Director’s Cut</button>}
        </div>
      </div>
      <div className="hero-room project-opening-stage">
        <div className="opening-edition" aria-hidden="true"><span>School / Community / Curiosity</span><span>Scroll into the work ↓</span></div>
        <div className="opening-primary-label">
          <span className="opening-purpose">For my school</span>
          <h2>CIRS.</h2><p>School-team web work <span>Live website</span></p>
        </div>
        <figure className="opening-specimen opening-specimen-community">
          <div className="opening-specimen-heading"><span className="opening-purpose">For my community</span><h2>Vallalar.</h2></div>
          <div className="opening-specimen-capture opening-community-capture">
            {!failed.community ? <img src="/media/vallalar-language-en-desktop.webp" width={1440} height={500}
              alt="English About-page opening from the Vallalar Sathya Dharmasalai website review preview"
              decoding="async" onError={() => setFailed((previous) => ({ ...previous, community: true }))} />
              : <p>The website capture could not load. Explore Work for the project context.</p>}
          </div>
          <figcaption><strong>Voluntary digital work · since 2023</strong><span>Website review preview · About page</span></figcaption>
        </figure>
        <figure className="opening-specimen opening-specimen-accuflow">
          <div className="opening-specimen-heading"><span className="opening-purpose">For an idea</span><h2>AccuFlow.</h2></div>
          <div className="opening-specimen-capture opening-accuflow-capture">
            {!failed.accuflow ? <img src="/media/accuflow-prototype-desktop.webp" width={1440} height={1000}
              alt="Actual initial AcuFlow guide interface, shown as a website and interaction prototype"
              decoding="async" onError={() => setFailed((previous) => ({ ...previous, accuflow: true }))} />
              : <p>The website capture could not load. Explore Work for the project context.</p>}
          </div>
          <figcaption><strong>Website &amp; interaction prototype</strong><span>Actual initial guide interface</span></figcaption>
        </figure>
      </div>
      <div className="cirs-scene-title"><span>CIRS Website</span><a href="https://cirschool.org" target="_blank" rel="noreferrer">Visit the live website</a></div>
      <HomeCirsProof onCaseStudy={onCaseStudy} onImagesUnavailable={onImageError} />
      <div className="cirs-scene-captions">{scrollStoryCopy.captions.map((caption) => <p key={caption.label}><span>{caption.label}</span>{caption.text}</p>)}</div>
    </section>
  );
}
