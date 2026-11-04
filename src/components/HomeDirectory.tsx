import type { MouseEvent } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { creativeMedia } from "../content";
import ScrollCorridor from "./ScrollCorridor";

type HomeDirectoryProps = {
  onNavigate: (path: string) => void;
  motionEnabled?: boolean;
};

export default function HomeDirectory({
  onNavigate,
  motionEnabled = false,
}: HomeDirectoryProps) {
  const navigate = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    // Keep native open-in-new-tab and modified-click behaviour.
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
    onNavigate(path);
  };

  return (
    <section
      className="home-directory"
      aria-labelledby="home-directory-heading"
    >
      <ScrollCorridor enabled={motionEnabled} />
      <div className="home-directory-type-window" aria-hidden="true">
        <div className="home-directory-rail">
          <span>Web.</span> <em>Film.</em> <span>Community.</span>
        </div>
      </div>

      <div className="page-width home-directory-inner">
        <header className="home-directory-intro">
          <div>
            <p className="section-label">The directory / 01—03</p>
            <h2 id="home-directory-heading" className="home-directory-title">
              Three ways
              <br />
              <em>into the work.</em>
            </h2>
          </div>
          <div className="home-directory-intro-note">
            <ArrowDownRight size={28} strokeWidth={1} aria-hidden="true" />
            <p>
              Websites for school and community. Creative work for the screen. A
              little more about the person behind both.
            </p>
          </div>
        </header>

        <nav
          className="home-directory-pages"
          aria-label="Explore the portfolio"
        >
          <a
            className="home-directory-row home-directory-work"
            href="/work"
            onClick={(event) => navigate(event, "/work")}
            aria-label="Explore Work: CIRS, Vallalar Sathya Dharmasalai, and AccuFlow"
          >
            <div className="home-directory-copy">
              <span className="home-directory-number">
                01 / Websites & interaction
              </span>
              <h3>
                Work<span className="home-directory-period">.</span>
              </h3>
              <p>
                A school website, a community’s digital presence, and an
                exploratory product prototype. See the interfaces and the
                context behind them.
              </p>
              <span className="home-directory-action">
                Explore the projects{" "}
                <ArrowUpRight size={19} aria-hidden="true" />
              </span>
            </div>

            <figure className="home-directory-work-preview">
              <div className="home-directory-screen home-directory-screen-cirs">
                <div className="home-directory-screen-bar">
                  <span>CIRS</span>
                  <span>School website</span>
                </div>
                <img
                  src="/media/cirs-home-desktop.webp"
                  alt="CIRS school website homepage"
                  width="1440"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="home-directory-screen home-directory-screen-vallalar">
                <div className="home-directory-screen-bar">
                  <span>Vallalar</span>
                  <span>Website review</span>
                </div>
                <img
                  src="/media/vallalar-website-desktop.webp"
                  alt="Vallalar Sathya Dharmasalai website review preview, About page"
                  width="1440"
                  height="500"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="home-directory-screen home-directory-screen-accuflow">
                <div className="home-directory-screen-bar">
                  <span>AccuFlow</span>
                  <span>Prototype</span>
                </div>
                <img
                  src="/media/accuflow-prototype-desktop.webp"
                  alt="AccuFlow exploratory guide interface prototype"
                  width="1440"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption>Actual website & prototype captures</figcaption>
            </figure>
            <span className="home-directory-route-arrow" aria-hidden="true">
              <ArrowUpRight size={28} strokeWidth={1.2} />
            </span>
          </a>

          <a
            className="home-directory-row home-directory-studio"
            href="/studio"
            onClick={(event) => navigate(event, "/studio")}
            aria-label="Explore Studio, a six-title creative work index"
          >
            <div className="home-directory-copy">
              <span className="home-directory-number">02 / Creative work</span>
              <h3>
                Studio<span className="home-directory-period">.</span>
              </h3>
              <p>
                Trailers, video and event work. Six named projects, gathered
                into a dedicated collection index.
              </p>
              <span className="home-directory-action">
                Enter the Studio <ArrowUpRight size={19} aria-hidden="true" />
              </span>
            </div>

            <div className="home-directory-programme" aria-hidden="true">
              <div className="home-directory-programme-heading">
                <span>The collection</span>
                <span>
                  {String(creativeMedia.length).padStart(2, "0")} titles
                </span>
              </div>
              <ol>
                {creativeMedia.map((film, index) => (
                  <li key={film.id}>
                    <span className="home-directory-film-number">
                      0{index + 1}
                    </span>
                    <span className="home-directory-film-title">
                      {film.title}
                    </span>
                    <span className="home-directory-film-type">
                      {film.type}
                    </span>
                  </li>
                ))}
              </ol>
              <span className="home-directory-programme-footnote">
                A title index / open for details
              </span>
            </div>
            <span className="home-directory-route-arrow" aria-hidden="true">
              <ArrowUpRight size={28} strokeWidth={1.2} />
            </span>
          </a>

          <a
            className="home-directory-row home-directory-about"
            href="/about"
            onClick={(event) => navigate(event, "/about")}
            aria-label="About Ananda Priyan and contact"
          >
            <div className="home-directory-copy">
              <span className="home-directory-number">
                03 / About & contact
              </span>
              <h3>
                Ananda<span className="home-directory-period">.</span>
              </h3>
              <p>
                Student developer, storyteller, swimmer. And, since 2023, a
                volunteer working across social media and technology at Vallalar
                Sathya Dharmasalai.
              </p>
              <span className="home-directory-action">
                Meet the person <ArrowUpRight size={19} aria-hidden="true" />
              </span>
            </div>
            <div className="home-directory-signature" aria-hidden="true">
              <span className="home-directory-signature-label">
                A personal perspective
              </span>
              <img
                src="/media/ap-signature-champagne.png"
                alt=""
                width="768"
                height="512"
                loading="lazy"
                decoding="async"
              />
              <span className="home-directory-signature-caption">
                Ananda Priyan
              </span>
            </div>
            <span className="home-directory-route-arrow" aria-hidden="true">
              <ArrowUpRight size={28} strokeWidth={1.2} />
            </span>
          </a>
        </nav>

        <div className="home-directory-footer">
          <p>Have something in mind?</p>
          <a
            href="/about#contact"
            onClick={(event) => navigate(event, "/about#contact")}
          >
            Let’s talk <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
