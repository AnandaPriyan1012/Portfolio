import { ArrowRight } from "lucide-react";
import { creativeMedia } from "../content";
import { hasApprovedNativePlayback } from "../media-readiness";
import { isApprovedDriveEmbed } from "./DriveFilmPlayer";
import "./case-film-collection.css";

export default function CaseFilmCollection({ onStudio }: { onStudio?: (filmId?: string) => void }) {
  const films = creativeMedia.filter((film) => film.posterUrl &&
    (hasApprovedNativePlayback(film) || isApprovedDriveEmbed(film.embedUrl)));
  const featured = films.find((film) => film.id === "vantara");
  const ordered = featured ? [featured, ...films.filter((film) => film !== featured)] : films;

  return (
    <div className="case-film-collection">
      <header className="case-film-collection-heading">
        <div>
          <span className="case-micro">{String(films.length).padStart(2, "0")} films / Studio</span>
          <h2>Trailers, auditions<br />and a launch.</h2>
        </div>
        <a
          href="/studio"
          className="case-film-collection-link"
          onClick={(event) => {
            if (!onStudio || event.defaultPrevented || event.button !== 0 ||
              event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onStudio();
          }}
        >
          Browse Studio <ArrowRight size={18} aria-hidden="true" />
        </a>
      </header>
      <div className="case-film-collection-grid">
        {ordered.map((film, index) => (
          <a
            key={film.id}
            href={`/studio#${encodeURIComponent(film.id)}`}
            className={`case-film-collection-film${index === 0 ? " case-film-collection-featured" : ""}`}
            aria-label={`Open ${film.title} in Studio`}
            onClick={(event) => {
              if (!onStudio || event.defaultPrevented || event.button !== 0 ||
                event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onStudio(film.id);
            }}
          >
            <figure>
              <picture data-reader-media>
                <img
                  src={film.posterUrl!}
                  alt={`${film.title} — ${hasApprovedNativePlayback(film) ? "supplied poster" : "frame from the film"}`}
                  width={640}
                  height={360}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </picture>
              <figcaption>
                <strong>{film.title}</strong>
                <span>{film.caption}</span>
                <span className="case-film-collection-open">Open in Studio <ArrowRight size={14} aria-hidden="true" /></span>
              </figcaption>
            </figure>
          </a>
        ))}
      </div>
    </div>
  );
}
