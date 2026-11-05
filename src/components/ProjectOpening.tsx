import { useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import "./project-opening.css";

type Destination = "/work" | "/projects/cirs" | "/projects/community" | "/projects/accuflow" | "/studio" | "/about#contact";
function DeskCapture({ desktop, mobile, width, height, alt, priority = false }: {
  desktop: string; mobile?: string; width: number; height: number; alt: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="desk-image-fallback">Website capture unavailable. Project details are still available through this link.</span> : (
    <picture>
      {mobile && <source media="(max-width:767px)" srcSet={mobile} width={390} height={1000} />}
      <img src={desktop} alt={alt} width={width} height={height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={() => setFailed(true)} />
    </picture>
  );
}

/** An illustrated desk. Every object contains genuine work and is a native link. */
export default function ProjectOpening({ onNavigate }: {
  onNavigate: (path: Destination, origin?: string) => void;
}) {
  function follow(event: MouseEvent<HTMLAnchorElement>, path: Destination, origin?: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(path, origin);
  }
  return (
    <section className="desk-opening" aria-labelledby="desk-title">
      <header className="desk-intro page-width">
        <h1 id="desk-title">Web work for my school.<br /><span>Stories for the screen.</span></h1>
        <a className="desk-work-link" href="/work" onClick={(event) => follow(event, "/work")}>View all projects <ArrowRight size={16} aria-hidden="true" /></a>
      </header>
      <nav className="desk-surface" aria-label="Explore the work on the desk">
        <div className="desk-light" aria-hidden="true" />
        <a className="desk-object desk-cirs" aria-label="CIRS website — read the case study" data-home-origin="desk-cirs" href="/projects/cirs" onClick={(event) => follow(event, "/projects/cirs", "desk-cirs")}>
          <div className="desk-object-caption">
            <span className="desk-object-kind">CIRS / Official school website</span>
            <h2>CIRS website <ArrowRight size={17} aria-hidden="true" /></h2>
            <p>Page design & development with the school’s team.</p>
            <span className="desk-object-status">Live website · Read the case study</span>
          </div>
          <div className="desk-artifact desk-school-folio">
            <DeskCapture desktop="/media/atlas-cirs-home-desktop.webp" width={1440} height={1000} alt="Actual CIRS homepage capture, showing the campus, mountains and school website headline." priority />
          </div>

        </a>
        <a className="desk-object desk-vallalar" aria-label="Vallalar — explore voluntary digital work" data-home-origin="desk-community" href="/projects/community" onClick={(event) => follow(event, "/projects/community", "desk-community")}>
          <div className="desk-object-caption">
            <span className="desk-object-kind">Vallalar / Community</span>
            <h2>Digital work, in service. <ArrowRight size={16} aria-hidden="true" /></h2>
            <p>Voluntary digital storytelling & website work since 2023.</p>
            <span className="desk-object-status">Website review preview · Explore the work</span>
          </div>
          <div className="desk-artifact desk-community-booklet">
            <DeskCapture desktop="/media/vallalar-language-en-desktop.webp" width={1440} height={500} alt="English About-page opening from the Vallalar website review preview." />
            <span className="desk-booklet-edge" aria-hidden="true" />
          </div>

        </a>
        <a className="desk-object desk-accuflow" aria-label="AccuFlow — view the website prototype" data-home-origin="desk-accuflow" href="/projects/accuflow" onClick={(event) => follow(event, "/projects/accuflow", "desk-accuflow")}>
          <div className="desk-object-caption">
            <span className="desk-object-kind">AccuFlow / Interaction prototype</span>
            <h2>From page to conversation. <ArrowRight size={16} aria-hidden="true" /></h2>
            <p>A product website and initial guide interface.</p>
            <span className="desk-object-status">Website prototype · View the project</span>
          </div>
          <div className="desk-artifact desk-interface-slate">
            <DeskCapture desktop="/media/atlas-accuflow-guide-desktop.webp" width={1440} height={1000} alt="Actual initial AccuFlow guide interface, before any message has been submitted." />
          </div>

        </a>
        <a className="desk-object desk-films" aria-label="Films and trailers — open the screening room" href="/studio" onClick={(event) => follow(event, "/studio")}>
          <div className="desk-object-caption">
            <span className="desk-object-kind">Original work / Film collection</span>
            <h2>Films & trailers <ArrowRight size={17} aria-hidden="true" /></h2>
            <p>Vantara, TED-Ed auditions, the CIRS launch and more.</p>
            <span className="desk-object-status">Open the screening room</span>
          </div>
          <div className="desk-artifact desk-contact-sheet">
            <div><img src="/media/film-thumbnails/vantara-masquerade-poster-320.webp" width={320} height={180} alt="" loading="lazy" decoding="async" /><span>Vantara</span></div>
            <div><img src="/media/film-thumbnails/teded-auditions-poster-320.webp" width={320} height={180} alt="" loading="lazy" decoding="async" /><span>TED-Ed auditions</span></div>
            <div><img src="/media/film-thumbnails/cirs-website-launch-poster-320.webp" width={320} height={180} alt="" loading="lazy" decoding="async" /><span>CIRS launch</span></div>
          </div>

        </a>
        <a className="desk-object desk-contact" aria-label="About and contact" href="/about#contact" onClick={(event) => follow(event, "/about#contact")}>
          <div className="desk-artifact desk-calling-card">
            <img src="/media/ap-signature.png" width={768} height={512} alt="" decoding="async" />
            <span>About & contact <ArrowRight size={16} aria-hidden="true" /></span>
          </div>
          <div className="desk-object-caption"><p>The person behind the work. Get in touch.</p></div>
        </a>
      </nav>
      <p className="desk-source-note page-width">An illustrated desk of real work. Website surfaces show genuine desktop captures; films use original posters.</p>
    </section>
  );
}
