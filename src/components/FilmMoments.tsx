import { useId } from "react";
import { ArrowRight, Play } from "lucide-react";
import type { creativeMedia } from "../content";
import { filmMoments, formatFilmTime } from "../film-moments";
import "./film-moments.css";

type Film = (typeof creativeMedia)[number];

/** Real frames are an index into the supplied film, never substitute footage. */
export default function FilmMoments({ film, onOpen }: {
  film: Film;
  onOpen: (seconds: number) => void;
}) {
  const id = useId();
  const moments = filmMoments(film);
  if (!moments.length) return null;
  return (
    <section className="film-moments" aria-labelledby={`${id}-title`} data-film={film.id}>
      <header>
        <div>
          <p className="film-moments-kicker">Studio / Frame by frame</p>
          <h2 id={`${id}-title`}>{film.title}, in three frames.</h2>
        </div>
        <p>Three frames from the film.<br />Open a moment, then press Play.</p>
      </header>
      <ol className="film-moments-track" aria-label={`Frames from ${film.title}`}>
        {moments.map((moment, index) => (
          <li key={moment.seconds}>
            <button type="button" className="film-moment" onClick={() => onOpen(moment.seconds)}
              aria-label={`Open ${film.title} at ${formatFilmTime(moment.seconds)}`}>
              <span className="film-moment-image">
                <img src={moment.image} alt={moment.alt} width={480} height={270}
                  loading="lazy" decoding="async" />
                <span className="film-moment-play" aria-hidden="true"><Play size={16} /></span>
              </span>
              <span className="film-moment-caption">
                <span><small aria-hidden="true">0{index + 1}</small><strong>{formatFilmTime(moment.seconds)}</strong></span>
                <span>Open moment <ArrowRight size={15} aria-hidden="true" /></span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="film-moments-source">Frames from the supplied film. The original edit is preserved.</p>
    </section>
  );
}
