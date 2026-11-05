import { useState, type CSSProperties, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import { creativeMedia } from "../content";
import "./home-work-proof.css";

type ProofProject = "cirs" | "community" | "accuflow";
type HomeWorkProofProps = {
  onProject: (id: ProofProject, origin: string) => void;
  onNavigate: (path: string) => void;
};

const filmFrames = [
  { id: "vantara", src: "/media/film-moments/vantara-0076.webp", time: "01:16", alt: "A person with blue and white face paint beneath tree branches, from the Vantara trailer." },
  { id: "ted-ed-2026", src: "/media/film-moments/ted-ed-2026-0014.webp", time: "00:14", alt: "A speaker wearing a headset microphone within the original film’s black frame and white cross graphics." },
  { id: "cirs-website-launch", src: "/media/film-moments/cirs-website-launch-0005.webp", time: "00:05", alt: "Students running across the campus beneath The CIRS Experience title, from the supplied launch film." },
].flatMap((frame) => {
  const film = creativeMedia.find((item) => item.id === frame.id);
  return film?.nativePlaybackApproved && film.videoUrl
    ? [{ ...frame, title: film.title, type: film.type, duration: film.caption.match(/\b\d+:\d{2}\b/)?.[0] }]
    : [];
});

function ordinaryClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function SourceImage({ src, alt, width, height, label }: {
  src: string; alt: string; width: number; height: number; label: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="home-proof-source" style={{ aspectRatio: `${width}/${height}` } as CSSProperties}>
      {failed ? <p className="home-proof-unavailable" role="status">{label} image unavailable. The linked project remains available.</p> :
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    </div>
  );
}

/** Readable project evidence beneath the illustrated desk, using existing sources only. */
export default function HomeWorkProof({ onProject, onNavigate }: HomeWorkProofProps) {
  function projectLink(event: MouseEvent<HTMLAnchorElement>, id: ProofProject) {
    if (!ordinaryClick(event)) return;
    event.preventDefault();
    onProject(id, `home-proof-${id}`);
  }
  function pageLink(event: MouseEvent<HTMLAnchorElement>, path: string) {
    if (!ordinaryClick(event)) return;
    event.preventDefault();
    onNavigate(path);
  }
  return (
    <section className="home-work-proof" aria-labelledby="home-work-proof-title" data-desk-handoff="continuous">
      <div className="home-proof-inner">
        <header className="home-proof-intro">
          <p className="home-proof-kicker">Selected work</p>
          <h2 id="home-work-proof-title">The work behind the desk.</h2>
          <p className="home-proof-description">A school website, ongoing community work and an interface prototype. The pages, their purpose and what exists today.</p>
          <p className="desk-source-note">Original desk artwork. The screens and printed insert show genuine project captures.</p>
        </header>

        <article className="home-proof-project home-proof-cirs" data-home-proof-project="cirs" aria-labelledby="home-proof-cirs-title">
          <figure className="home-proof-artifact">
            <SourceImage src="/media/atlas-cirs-admissions-desktop.webp" width={1440} height={1000} label="CIRS Admissions" alt="Actual CIRS Admissions Guide capture, showing its portal login, process link and enquiry information." />
            <figcaption>Actual Admissions Guide capture · 4 Nov 2026</figcaption>
          </figure>
          <div className="home-proof-account">
            <p className="home-proof-kicker">CIRS · Official school website</p>
            <h3 id="home-proof-cirs-title">From campus life to Admissions.</h3>
            <dl>
              <div><dt>Problem</dt><dd>Future students and parents needed a clearer picture of campus life and an easier way to find Admissions information.</dd></div>
              <div><dt>Role</dt><dd>Page design and web development with the school’s team, including Admissions and phone layouts.</dd></div>
              <div><dt>Outcome</dt><dd>The official school website is live, with a dedicated Admissions Guide.</dd></div>
            </dl>
            <a className="home-proof-link" href="/projects/cirs" data-home-origin="home-proof-cirs" onClick={(event) => projectLink(event, "cirs")}>Read the CIRS case study <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </article>

        <article className="home-proof-project home-proof-community" data-home-proof-project="community" aria-labelledby="home-proof-community-title">
          <div className="home-proof-account">
            <p className="home-proof-kicker">Vallalar Sathya Dharmasalai · Voluntary work</p>
            <h3 id="home-proof-community-title">Service that became digital work.</h3>
            <dl>
              <div><dt>Problem</dt><dd>After helping prepare and distribute meals, I asked how else I could help; the organisers described limited online reach.</dd></div>
              <div><dt>Role</dt><dd>Voluntary Social Media &amp; Technology Head since 2023: digital storytelling, social media and website work.</dd></div>
              <div><dt>Outcome</dt><dd>Website work is available as a public review preview, alongside ongoing digital storytelling and social-media work.</dd></div>
            </dl>
            <a className="home-proof-link" href="/projects/community" data-home-origin="home-proof-community" onClick={(event) => projectLink(event, "community")}>Explore the Vallalar work <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <figure className="home-proof-artifact home-proof-language-spread">
            <SourceImage src="/media/vallalar-language-en-desktop.webp" width={1440} height={500} label="Vallalar English About page" alt="Complete English About-page opening from the Vallalar website review preview." />
            <SourceImage src="/media/vallalar-language-ta-desktop.webp" width={1440} height={400} label="Vallalar Tamil About page" alt="Complete Tamil About-page opening from the same Vallalar website review preview." />
            <figcaption>English and Tamil About-page openings · Website review preview · 4 Nov 2026</figcaption>
          </figure>
        </article>

        <article className="home-proof-project home-proof-accuflow" data-home-proof-project="accuflow" aria-labelledby="home-proof-accuflow-title">
          <div className="home-proof-account">
            <p className="home-proof-kicker">AccuFlow · Website &amp; interaction prototype</p>
            <h3 id="home-proof-accuflow-title">A product story, then a guide.</h3>
            <dl>
              <div><dt>Purpose</dt><dd>Explore how a product website can lead into a conversational guide for pressure-point information.</dd></div>
              <div><dt>Scope</dt><dd>A six-page product website and conversational-interface prototype.</dd></div>
              <div><dt>Outcome</dt><dd>The publicly viewable prototype is documented through four captured routes, including the initial guide interface.</dd></div>
            </dl>
            <a className="home-proof-link" href="/projects/accuflow" data-home-origin="home-proof-accuflow" onClick={(event) => projectLink(event, "accuflow")}>Explore the AccuFlow prototype <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <figure className="home-proof-artifact">
            <SourceImage src="/media/atlas-accuflow-guide-desktop.webp" width={1440} height={1000} label="AccuFlow guide" alt="Actual initial AccuFlow guide interface before any message has been submitted, with its original prototype notice." />
            <figcaption>Actual initial guide interface · Website prototype · 4 Nov 2026</figcaption>
          </figure>
        </article>

        {filmFrames.length > 0 && <section className="home-proof-films" aria-labelledby="home-proof-films-title">
          <header>
            <div><p className="home-proof-kicker">Films &amp; trailers</p><h3 id="home-proof-films-title">A few frames from the films.</h3></div>
            <a className="home-proof-link" href="/studio" onClick={(event) => pageLink(event, "/studio")}>Open Studio <ArrowRight size={16} aria-hidden="true" /></a>
          </header>
          <div className="home-proof-film-strip">
            {filmFrames.map((film) => <a className="home-proof-film" href={`/studio#${film.id}`} key={film.id} onClick={(event) => pageLink(event, `/studio#${film.id}`)}>
              <SourceImage src={film.src} width={480} height={270} label={film.title} alt={film.alt} />
              <span className="home-proof-film-name">{film.title}<ArrowRight size={14} aria-hidden="true" /></span>
              <span className="home-proof-film-meta">{film.type}{film.duration ? ` · ${film.duration}` : ""}<span>Frame {film.time}</span></span>
            </a>)}
          </div>
        </section>}
      </div>
    </section>
  );
}
