import { useId, useLayoutEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CaptureInspection from "./CaptureInspection";
import "./accuflow-route-deck.css";

const routes = [
  {
    id: "home", label: "Home", path: "/",
    description: "A product introduction with routes to the proposed kit and guide.",
    alt: "AcuFlow prototype homepage with starter-kit and guide links",
  },
  {
    id: "product", label: "Product", path: "/product",
    description: "A dedicated page for the proposed three-month starter-kit concept.",
    alt: "AcuFlow prototype Product page introducing the proposed three-month starter kit",
  },
  {
    id: "workflow", label: "How it works", path: "/how-it-works",
    description: "Choose, Locate, Apply and Track: the concept’s proposed sequence.",
    alt: "AcuFlow prototype How it works page introducing four steps and explicit limits",
  },
  {
    id: "guide", label: "Try it", path: "/try",
    description: "The initial guide interface, before any message has been submitted.",
    alt: "Initial AcuFlow Guide interface with prompt suggestions, message field and internal-prototype disclaimer",
  },
] as const;
type RouteId = (typeof routes)[number]["id"];
// A bounded choice for ordinary SPA returns, without writing storage or history.
let rememberedRoute: RouteId = "guide";

export default function AccuFlowRouteDeck({ motionEnabled }: { motionEnabled: boolean }) {
  const id = useId();
  const [selected, setSelected] = useState<RouteId>(rememberedRoute);
  const [failed, setFailed] = useState<ReadonlySet<RouteId>>(() => new Set());
  const index = routes.findIndex((route) => route.id === selected);
  const route = routes[index];
  const desktop = `/media/atlas-accuflow-${route.id}-desktop.webp`;
  const compact = route.id === "home" ? desktop : `/media/atlas-accuflow-${route.id}-mobile.webp`;
  const unavailable = failed.has(route.id);

  useLayoutEffect(() => {
    // The explicit source ratios establish the new scene height before refresh.
    ScrollTrigger.refresh();
  }, [selected, unavailable]);

  return (
    <section className="accuflow-assembly accu-route-deck" data-route={route.id}
      data-route-motion={motionEnabled ? "on" : "off"} aria-labelledby={`${id}-title`}>
      <header className="accu-route-header">
        <div><span className="accu-route-kicker">Route deck / AccuFlow</span>
          <h3 id={`${id}-title`}>From the story to the interaction.</h3></div>
        <span className="accu-route-count">04 captured views <span>/ 06 pages</span></span>
      </header>
      <ol className="flow-interface-map" aria-label="AccuFlow captured routes">
        {routes.map((item, position) => (
          <li key={item.id}>
            <button type="button" aria-label={`Show AccuFlow ${item.label}`}
              aria-pressed={selected === item.id} aria-controls={`${id}-screen`}
              onClick={() => { rememberedRoute = item.id; setSelected(item.id); }}>
              <span className="accu-route-key" aria-hidden="true">0{position + 1}</span>
              <span>{item.label}</span><span className="accu-route-led" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <div className="accu-route-readout">
        <p role="status" aria-atomic="true"><span aria-hidden="true">0{index + 1} / 04</span>{route.description}</p>
        <a className="accu-route-source" href={`https://accuflow-premium-ai.netlify.app${route.path}`}
          target="_blank" rel="noopener noreferrer">Open {route.label} prototype <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      <figure className="feature-media accu-route-screen" id={`${id}-screen`} aria-label={`AccuFlow ${route.label} capture`}>
        {unavailable ? <div className="accu-route-unavailable" role="status">
          <strong>The {route.label} capture could not load.</strong>
          <p>The prototype route and project notes are still available.</p>
        </div> : <picture className="project-media-picture" key={route.id}>
          <source media="(max-width:767px)" srcSet={compact}
            width={route.id === "home" ? 1440 : 390} height={1000} />
          <img className="real-project-media" src={desktop} alt={route.alt}
            width={1440} height={1000} loading="lazy" decoding="async"
            onError={() => setFailed((previous) => new Set(previous).add(route.id))} />
        </picture>}
        <span className="media-glass-edge" aria-hidden="true" />
      </figure>
      <div className="accu-route-caption-row">
        <p className="project-media-caption accu-route-caption">
          {route.label} · Actual prototype capture · <time dateTime="2026-11-04">4 Nov 2026</time>
          {route.id === "home" && <span className="accu-route-compact-note">Full desktop capture shown; the captured phone homepage overflows.</span>}
        </p>
        {!unavailable && <CaptureInspection src={desktop} mobileSrc={compact}
          title={`AccuFlow · ${route.label}`} alt={route.alt}
          caption="Actual website prototype capture · 4 November 2026. No messages were submitted." />}
      </div>
      <footer className="accu-route-footer">
        <p>Website prototype. These captures show the interface, not verified AI responses or health outcomes.</p>
        <nav aria-label="Other AccuFlow prototype pages"><span>Also in the prototype</span>
          <a href="https://accuflow-premium-ai.netlify.app/business" target="_blank" rel="noopener noreferrer">Business <ArrowUpRight size={13} aria-hidden="true" /></a>
          <a href="https://accuflow-premium-ai.netlify.app/about" target="_blank" rel="noopener noreferrer">About <ArrowUpRight size={13} aria-hidden="true" /></a>
        </nav>
      </footer>
      <span className="accuflow-scroll-meter" aria-hidden="true" />
    </section>
  );
}
