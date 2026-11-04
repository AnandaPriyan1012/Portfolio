import { useEffect, useRef, useState, type CSSProperties } from "react";

type Artwork = { id: string; title: string; posterUrl: string | null; thumbnailSrcSet?: string };
const accents: Record<string, string> = {
  "cck-trailer": "#d0aa65", "farewell-video": "#bd9473", vantara: "#81a6b8",
  "ted-ed-2026": "#ca8273", "cirs-website-launch": "#c6b778",
};

/** Genuine, duplicate film artwork: the native programme remains the interface. */
export default function StudioAtmosphere({ enabled, films, selectedId }: {
  enabled: boolean; films: Artwork[]; selectedId: string;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    if (!enabled || !sheet.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setArrived(true); observer.disconnect(); }
    }, { threshold: .15 });
    observer.observe(sheet.current);
    return () => observer.disconnect();
  }, [enabled, films.length]);
  if (!films.some(film => film.posterUrl)) return null;
  return (
    <div
      className="studio-contact-sheet"
      ref={sheet}
      aria-hidden="true"
      data-motion={enabled ? "on" : "off"}
      data-arrived={arrived}
      style={{ "--studio-art-accent": accents[selectedId] ?? "#d0aa65" } as CSSProperties}
    >
      <div className="studio-contact-meta"><span>AP / SCREEN CLUB</span><span>{String(films.length).padStart(2, "0")} films ready / select below</span></div>
      <div className="studio-contact-frames">
        {films.filter(film => film.posterUrl).map((film, index) => (
          <figure key={film.id} data-film={film.id} data-active={film.id === selectedId} style={{ "--contact-order": index } as CSSProperties}>
            <div className="studio-contact-image"><img src={film.posterUrl!} srcSet={film.thumbnailSrcSet} sizes="(min-width: 1455px) 219px, (min-width: 1024px) calc(17.6vw - 37.2px), (min-width: 768px) calc(17.4vw - 37.2px), calc(17.6vw - 15.6px)" alt="" width={640} height={360} loading="lazy" decoding="async" /></div>
            <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{film.title}</figcaption>
          </figure>
        ))}
      </div>
      <div className="studio-contact-edge"><span>Studio collection</span><span>PICTURE / SOUND / PLAY</span></div>
    </div>
  );
}
