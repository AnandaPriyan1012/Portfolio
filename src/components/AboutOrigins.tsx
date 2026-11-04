import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./about-origins.css";

type OriginId = "cirs" | "community";
type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};

const origins = [
  {
    id: "cirs",
    place: "CIRS / My school",
    title: ["I proposed refreshing", "our school website."],
    beginning: "I wanted future students and parents to get a clearer picture of campus life.",
    contribution: "The school assembled a team. I worked on page design and web development, including Admissions and phone layouts.",
    desktop: "/media/atlas-cirs-admissions-desktop.webp",
    mobile: "/media/atlas-cirs-admissions-mobile.webp",
    width: 1440, height: 1000, phoneHeight: 1000,
    alt: "Actual CIRS Admissions Guide opening with portal and process links",
    capture: "CIRS / Admissions Guide",
    provenance: "Actual website capture · 4 Nov 2026",
    action: "Open the CIRS case study",
  },
  {
    id: "community",
    place: "Vallalar / Voluntary work",
    title: ["I asked how else", "I could help."],
    beginning: "After helping prepare and distribute meals, I asked the organisers how else I could contribute. They described limited online reach.",
    contribution: "That led to digital storytelling, social media and website work. I serve voluntarily as Social Media & Technology Head, a role I’ve held since 2023.",
    desktop: "/media/vallalar-language-ta-desktop.webp",
    mobile: "/media/vallalar-language-ta-mobile.webp",
    width: 1440, height: 400, phoneHeight: 360,
    alt: "Tamil About-page opening from the Vallalar Sathya Dharmasalai website review preview",
    capture: "Vallalar / Tamil About page",
    provenance: "Website review preview · 4 Nov 2026",
    action: "Open the Vallalar case study",
  },
] as const;

/** Personal context, paired with existing interface evidence rather than portraits. */
export default function AboutOrigins({ motionEnabled = false, onProject }: {
  motionEnabled?: boolean;
  onProject?: (id: OriginId, anchor: HTMLAnchorElement) => void;
}) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState<readonly OriginId[]>([]);

  useEffect(() => {
    const host = root.current;
    if (!host || !motionEnabled) return;
    const capable = matchMedia("(min-width: 1100px) and (min-height: 760px) and (pointer: fine) and (hover: hover) and (forced-colors: none) and (prefers-reduced-motion: no-preference)");
    const device = navigator as Device;
    let context: ReturnType<typeof gsap.context> | null = null;
    let disposed = false;
    const stop = () => {
      context?.revert();
      context = null;
      host.dataset.originsMotion = "static";
    };
    const sync = () => {
      stop();
      const lowPower = device.connection?.saveData ||
        (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
        (device.deviceMemory && device.deviceMemory <= 2);
      if (!capable.matches || lowPower) return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        host.querySelectorAll<HTMLElement>(".about-origin").forEach((scene, index) => {
          const glass = scene.querySelector<HTMLElement>(".about-origin-glass");
          const light = scene.querySelector<HTMLElement>(".about-origin-light");
          if (!glass || !light) return;
          const direction = index === 0 ? 1 : -1;
          const timeline = gsap.timeline({
            scrollTrigger: {
              id: `about-origin-${id}-${origins[index].id}`,
              trigger: scene,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          timeline.fromTo(glass,
            { y: 24, rotateY: direction * 5, rotateX: 2 },
            { y: -16, rotateY: direction * -2, rotateX: -1, ease: "none", duration: 1 }, 0);
          timeline.fromTo(light,
            { xPercent: direction * -14, scaleX: .72 },
            { xPercent: direction * 14, scaleX: 1, ease: "none", duration: 1 }, 0);
        });
      }, host);
      host.dataset.originsMotion = "staged";
    };
    sync();
    capable.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    document.fonts.ready.then(() => { if (!disposed && context) ScrollTrigger.refresh(); });
    return () => {
      disposed = true;
      capable.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
      stop();
    };
  }, [motionEnabled, id]);

  function open(event: MouseEvent<HTMLAnchorElement>, project: OriginId) {
    if (!onProject || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onProject(project, event.currentTarget);
  }

  return (
    <section ref={root} className="about-origins" aria-labelledby={`${id}-title`} data-origins-motion="static">
      <header className="about-origins-heading">
        <p>School &amp; community / How I got involved</p>
        <h2 id={`${id}-title`}>The work began<br />with people.</h2>
      </header>
      <div className="about-origins-stories">
        {origins.map((origin, index) => (
          <article key={origin.id} className={`about-origin about-origin-${origin.id}`} data-about-origin={origin.id} aria-labelledby={`${id}-${origin.id}`}>
            <div className="about-origin-copy">
              <p className="about-origin-place"><span aria-hidden="true">0{index + 1}</span>{origin.place}</p>
              <h3 id={`${id}-${origin.id}`}>{origin.title.map(line => <span key={line}>{line}</span>)}</h3>
              <p className="about-origin-beginning">{origin.beginning}</p>
              <p className="about-origin-contribution">{origin.contribution}</p>
              <a className="about-origin-link" href={`/projects/${origin.id}`} onClick={event => open(event, origin.id)}>
                {origin.action}<ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
            <figure className="about-origin-proof">
              <div className="about-origin-glass">
                <span className="about-origin-light" aria-hidden="true" />
                <div className="about-origin-source">{origin.capture}</div>
                <div className="about-origin-aperture">
                  {!failed.includes(origin.id) ? (
                    <picture>
                      <source media="(max-width: 767px)" srcSet={origin.mobile} width={390} height={origin.phoneHeight} />
                      <img src={origin.desktop} alt={origin.alt} width={origin.width} height={origin.height}
                        loading="lazy" decoding="async"
                        onError={() => setFailed(current => current.includes(origin.id) ? current : [...current, origin.id])} />
                    </picture>
                  ) : <p className="about-origin-fallback">The capture could not load. The project story is still available.</p>}
                </div>
              </div>
              <figcaption>
                <span className={origin.id === "cirs" ? "about-origin-caption-full" : undefined}>{origin.provenance}</span>
                {origin.id === "cirs" && <span className="about-origin-caption-detail">Admissions detail · Actual website capture · 4 Nov 2026</span>}
              </figcaption>
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
}
