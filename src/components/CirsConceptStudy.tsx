import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, MoveHorizontal } from "lucide-react";

const captures = [
  {
    label: "Homepage",
    image: "/media/cirs-home-desktop.webp",
    source: "https://cirschool.org/",
    alt: "Genuine public CIRS homepage with its school imagery and navigation",
  },
  {
    label: "Admissions",
    image: "/media/cirs-admissions.webp",
    source: "https://cirschool.org/admissions.html",
    alt: "Genuine CIRS Admissions Guide with portal access and the application process",
  },
];

/** A portfolio illustration beside genuine captures; never a historical draft. */
export default function CirsConceptStudy({ motion = true }: { motion?: boolean }) {
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const manual = useRef(false);
  const [reveal, setReveal] = useState(0);
  const [selected, setSelected] = useState(0);
  const [following, setFollowing] = useState(true);
  const capture = captures[selected];

  useEffect(() => {
    const element = section.current;
    if (!element || !motion) return;
    const query = window.matchMedia(
      "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      if (!query.matches || manual.current || !visible) return;
      const box = element.getBoundingClientRect();
      const distance = Math.max(1, box.height - window.innerHeight * 0.15);
      const progress = (window.innerHeight * 0.85 - box.top) / distance;
      setReveal(Math.round(Math.max(0, Math.min(1, progress)) * 100));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: "80px" },
    );
    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    query.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      query.removeEventListener("change", schedule);
    };
  }, [motion, following]);

  function takeControl(value: number) {
    manual.current = true;
    setFollowing(false);
    setReveal(value);
  }

  function followScroll() {
    manual.current = false;
    setFollowing(true);
  }

  return (
    <section
      ref={section}
      className="cirs-concept-study"
      data-motion={motion ? "on" : "off"}
      data-following={following}
      aria-labelledby={`${id}-title`}
      style={{ "--concept-reveal": `${reveal}%` } as CSSProperties}
    >
      <header className="cirs-concept-header">
        <div>
          <span className="cirs-concept-kicker">CIRS · A portfolio interpretation</span>
          <h3 id={`${id}-title`}>An interface, imagined in glass.</h3>
        </div>
        <p id={`${id}-description`}>
          An illustrative interface study, not an original project sketch or
          evidence of the historical design process.
        </p>
      </header>

      <div className="cirs-concept-viewbar">
        <span>Study / Public interface</span>
        <div role="group" aria-label="Choose the genuine CIRS capture">
          {captures.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cirs-concept-stage" aria-describedby={`${id}-description`}>
        <figure className="cirs-concept-art">
          <img
            src="/media/cirs-reconstructed-concept.png"
            alt="Reconstructed portfolio concept: amber glass desktop and phone wireframes with abstract image and text placeholders"
            width="1672"
            height="941"
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            Reconstructed concept · Created for this portfolio
          </figcaption>
        </figure>
        <figure className="cirs-concept-actual">
          <img
            src={capture.image}
            alt={capture.alt}
            width="1440"
            height="1000"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Public website capture · {capture.label}</figcaption>
        </figure>
        <span
          className="cirs-concept-seam"
          aria-hidden="true"
          style={{ opacity: reveal > 0 && reveal < 100 ? 1 : 0 }}
        >
          <MoveHorizontal size={18} />
        </span>
      </div>

      <div className="cirs-concept-legend">
        <p><span>B</span> Public website capture · {capture.label}</p>
        <p><span>A</span> Reconstructed concept · Created for this portfolio</p>
      </div>

      <div className="cirs-concept-controls">
        <div className="cirs-concept-slider">
          <label htmlFor={`${id}-reveal`}>Reveal the public interface</label>
          <input
            id={`${id}-reveal`}
            type="range"
            min="0"
            max="100"
            value={reveal}
            aria-valuetext={`${reveal}% public interface visible`}
            onChange={(event) => takeControl(Number(event.target.value))}
          />
          <output htmlFor={`${id}-reveal`}>{reveal}%</output>
        </div>
        {motion && (
          <button
            type="button"
            className="cirs-concept-follow"
            onClick={followScroll}
            disabled={following}
          >
            {following ? "Following page scroll" : "Follow page scroll"}
          </button>
        )}
        <a href={capture.source} target="_blank" rel="noreferrer">
          Visit CIRS {capture.label.toLowerCase()}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
      <p className="cirs-concept-footnote">
        The amber composition is a reconstructed concept. The website images
        show the finished public interface; they do not document an earlier
        design or a chronological before-and-after.
      </p>
    </section>
  );
}
