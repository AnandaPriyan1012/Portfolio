import { useState, type CSSProperties, type FocusEvent, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import DeskSurfaces from "./DeskSurfaces";
import "./project-opening.css";

type Destination = "/work" | "/projects/cirs" | "/projects/community" | "/projects/accuflow" | "/studio" | "/about#contact";
type Rectangle = readonly [number, number, number, number];
type Point = readonly [number, number];
const width=1672, height=941;
const objects: { id: string; className: string; href: Destination; origin?: string; title: string; context: string; rectangle: Rectangle; label: Point; shape: readonly Point[] }[] = [
  { id:"cirs", className:"desk-cirs", href:"/projects/cirs", origin:"desk-cirs", title:"CIRS website", context:"School-team web work · Live website", rectangle:[380,110,915,640], label:[586,758], shape:[[384,117],[1064,116],[1076,534],[1133,537],[1289,669],[1288,694],[514,745],[405,579]] },
  { id:"community", className:"desk-vallalar", href:"/projects/community", origin:"desk-community", title:"Vallalar", context:"Voluntary work · Review preview", rectangle:[47,540,337,144], label:[58,478], shape:[[50,561],[274,544],[381,641],[381,659],[90,679],[51,582]] },
  { id:"accuflow", className:"desk-accuflow", href:"/projects/accuflow", origin:"desk-accuflow", title:"AccuFlow", context:"Website & guide prototype", rectangle:[1200,290,430,320], label:[1278,611], shape:[[1270,295],[1608,315],[1625,337],[1586,580],[1538,605],[1204,567],[1204,536],[1255,314]] },
  { id:"films", className:"desk-films", href:"/studio", title:"Films & trailers", context:"Vantara · TED-Ed · CIRS launch", rectangle:[43,689,540,185], label:[60,853], shape:[[47,715],[100,690],[309,688],[359,715],[364,798],[407,781],[495,777],[578,811],[581,866],[487,868],[349,847],[91,846],[45,810]] },
  { id:"contact", className:"desk-contact", href:"/about#contact", title:"About & contact", context:"The person behind the work", rectangle:[1182,710,282,110], label:[1187,838], shape:[[1186,739],[1411,713],[1462,785],[1230,815]] },
];
function position(object: (typeof objects)[number]): CSSProperties {
  const [x,y,w,h]=object.rectangle;
  return {
    "--object-left":`${x/width*100}%`, "--object-top":`${y/height*100}%`,
    "--object-width":`${w/width*100}%`, "--object-height":`${h/height*100}%`,
    "--label-left":`${(object.label[0]-x)/w*100}%`, "--label-top":`${(object.label[1]-y)/h*100}%`,
    "--hit-shape":`polygon(${object.shape.map(([px,py])=>`${(px-x)/w*100}% ${(py-y)/h*100}%`).join(",")})`,
  } as CSSProperties;
}

function revealFocusedCaption(event: FocusEvent<HTMLAnchorElement>) {
  if (!event.currentTarget.matches(":focus-visible") || !window.matchMedia("(min-width:901px)").matches) return;
  const caption=event.currentTarget.querySelector<HTMLElement>(".scene-callout");
  if (!caption) return;
  const bounds=caption.getBoundingClientRect();
  const header=document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect().bottom ?? 0;
  if (bounds.bottom>window.innerHeight-12 || bounds.top<header+12)
    caption.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
}

/** A complete fixed-camera desk illustration, with genuine work in its surfaces. */
export default function ProjectOpening({ onNavigate }: { onNavigate: (path: Destination, origin?: string) => void }) {
  const [loaded,setLoaded]=useState(false);
  const [failed,setFailed]=useState(false);
  function follow(event: MouseEvent<HTMLAnchorElement>, path: Destination, origin?: string) {
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();onNavigate(path,origin);
  }
  return (
    <section className="desk-opening cinematic-desk" aria-labelledby="desk-title">
      <div className="scene-shell" data-scene-failed={failed||undefined} data-scene-loaded={loaded||undefined}>
        <header className="scene-intro">
          <h1 id="desk-title">Web work for my school.<br /> <span>Stories for the screen.</span></h1>
          <a className="desk-work-link" href="/work" onClick={event=>follow(event,"/work")}>View all projects <ArrowRight size={15} aria-hidden="true" /></a>
        </header>
        <div className="scene-visual" data-scene-art="original-cinematic-illustration">
          {!failed ? <picture className="scene-background">
            <source media="(max-width:767px)" srcSet="/media/cinematic-desk-compact.webp" />
            <img src="/media/cinematic-desk-wide.webp" width={1672} height={941} alt="A warm cinematic workspace with an open laptop, a booklet, a glass tablet, a film reel and a black personal card on a walnut desk." fetchPriority="high" decoding="async" onLoad={()=>setLoaded(true)} onError={()=>{setFailed(true);setLoaded(false);}} />
          </picture> : <p className="scene-art-unavailable" role="status">The desk artwork could not load. All project links are available below.</p>}
          {!failed && <DeskSurfaces loaded={loaded} />}
        </div>
        <nav className="scene-map" aria-label="Explore the work on the desk">
          {objects.map(object=><a key={object.id} className={`scene-object ${object.className}`} href={object.href} data-home-origin={object.origin} data-scene-object={object.id} style={position(object)} onFocus={revealFocusedCaption} onClick={event=>follow(event,object.href,object.origin)}>
            <span className="scene-hit" aria-hidden="true" />
            <span className="scene-callout"><span className="scene-callout-copy"><strong>{object.title}</strong><span>{object.context}</span></span><ArrowRight size={15} aria-hidden="true" /></span>
          </a>)}
        </nav>
      </div>
      <p className="desk-source-note page-width">Original desk artwork. The screens and printed insert show genuine project captures.</p>
    </section>
  );
}
