import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight } from "lucide-react";

const languages = [
  { id: "en", label: "English", height: 500, mobileHeight: 420 },
  { id: "ta", label: "Tamil", height: 400, mobileHeight: 360 },
] as const;

export default function CommunityLanguageStudy() {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const language = languages[selected];

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  }

  return (
    <section className="community-language-study" aria-labelledby={`${id}-title`}>
      <header className="community-language-header">
        <div>
          <span className="community-language-eyebrow">The bilingual website preview</span>
          <h3 id={`${id}-title`}>Two languages.<br /><em>One digital space.</em></h3>
        </div>
        <p>
          The About page has matching English and Tamil routes. The desktop
          header links directly between them.
        </p>
      </header>
      <div className="community-language-tabs" role="tablist" aria-label="Vallalar website preview language">
        {languages.map((item, index) => (
          <button
            type="button"
            role="tab"
            id={`${id}-${item.id}`}
            aria-controls={`${id}-panel`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            key={item.id}
            ref={(element) => { buttons.current[index] = element; }}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => moveTab(event, index)}
          >
            {item.id === "ta" ? <><span lang="ta">தமிழ்</span><small>Tamil</small></> : "English"}
          </button>
        ))}
      </div>
      <div
        className="community-language-panel"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${language.id}`}
        tabIndex={0}
      >
        <figure className="community-language-capture">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={`/media/vallalar-language-${language.id}-mobile.webp`}
              width={390}
              height={language.mobileHeight}
            />
            <img
              src={`/media/vallalar-language-${language.id}-desktop.webp`}
              alt={`Vallalar website ${language.label} About page opening, including its original header`}
              width={1440}
              height={language.height}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <figcaption>
            {language.label} About page opening · Website review preview · {" "}
            <time dateTime="2026-11-04">4 Nov 2026</time>
          </figcaption>
        </figure>
        <div className="community-language-note">
          <span className="community-language-eyebrow">Volunteer contribution</span>
          <p>
            Social Media &amp; Technology Head, since 2023. Digital storytelling,
            social media and work on the organisation’s website.
          </p>
          <a
            href={`https://vallalar-sathya-dharmasalai.vercel.app/${language.id}/about/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the {language.label} preview <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
