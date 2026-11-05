import { useEffect, useRef, useState, type PointerEvent, type CSSProperties, type FocusEvent, type MouseEvent } from "react";
import { ArrowRight } from "lucide-react";
import DeskSurfaces from "./DeskSurfaces";
import DeskDiscovery from "./DeskDiscovery";
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
const actions: Record<string,string> = {
  cirs: "Explore the school website", community: "Open the community project",
  accuflow: "Inside the guide prototype", films: "Enter the screening room", contact: "Meet the person behind it",
};
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
  const shell = useRef<HTMLDivElement>(null);
  const [selected,setSelected]=useState<string | null>(null);
  const [visited,setVisited]=useState<string[]>(() => {
    try { const stored: unknown=JSON.parse(sessionStorage.getItem("ap-desk-explored") || "[]"); return Array.isArray(stored) ? objects.filter(object => stored.includes(object.id)).map(object => object.id) : []; }
    catch { return []; }
  });
  const [loaded,setLoaded]=useState(false);
  const [saveData,setSaveData]=useState(() => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData));
  useEffect(() => {
    const connection=(navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const update=() => { setSaveData(Boolean(connection?.saveData)); if (shell.current) delete shell.current.dataset.light; };
    connection?.addEventListener?.("change",update);
    return () => connection?.removeEventListener?.("change",update);
  },[]);
  function light(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || saveData || matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)").matches || document.documentElement.dataset.motion === "off") return;
    const bounds=event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--light-x",`${(event.clientX-bounds.left)/bounds.width*100}%`);
    event.currentTarget.style.setProperty("--light-y",`${(event.clientY-bounds.top)/bounds.height*100}%`);
    event.currentTarget.dataset.light="on";
  }
  const [failed,setFailed]=useState(false);
  function choose(id: string) {
    setSelected(id);
    const anchor=shell.current?.querySelector<HTMLAnchorElement>(`[data-scene-object="${id}"]`);
    anchor?.focus({preventScroll:true});
    anchor?.querySelector(".scene-callout")?.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});
  }
  function follow(event: MouseEvent<HTMLAnchorElement>, path: Destination, origin?: string) {
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    const id=objects.find(object => object.href===path)?.id;
    if(id && !visited.includes(id)) {
      const next=[...visited,id]; setVisited(next);
      try { sessionStorage.setItem("ap-desk-explored",JSON.stringify(next)); } catch { /* Session progress is optional. */ }
    }
    onNavigate(path,origin);
  }
  return (
    <section className="desk-opening cinematic-desk" aria-labelledby="desk-title">
      <div ref={shell} className="scene-shell" onPointerMove={light} onPointerLeave={() => { if(shell.current) delete shell.current.dataset.light; }} data-desk-effects={saveData ? "off" : "on"} data-scene-failed={failed||undefined} data-scene-loaded={loaded||undefined}>
        <header className="scene-intro">
          <div className="scene-intro-copy">
          <p className="scene-eyebrow">THE WORKBENCH <span>01 — 05</span></p>
          <h1 id="desk-title">Built for my school.<br /> <span>Cut for the screen.</span></h1>
          <p className="scene-invitation">Five objects. Five ways into my work.</p>
          </div>
          <div className="scene-intro-controls">
          <a className="desk-work-link" href="/work" onClick={event=>follow(event,"/work")}>View all projects <ArrowRight size={15} aria-hidden="true" /></a>
          <DeskDiscovery projects={objects.map(object=>({...object,action:actions[object.id]}))} visited={visited} onChoose={choose} />
          </div>
        </header>
        <div className="scene-visual" data-scene-art="original-cinematic-illustration">
          {!failed ? <picture className="scene-background">
            <source media="(max-width:767px)" srcSet="/media/cinematic-desk-compact.webp" />
            <img src="/media/cinematic-desk-wide.webp" width={1672} height={941} alt="A warm cinematic workspace with an open laptop, a booklet, a glass tablet, a film reel and a black personal card on a walnut desk." fetchPriority="high" decoding="async" onLoad={()=>setLoaded(true)} onError={()=>{setFailed(true);setLoaded(false);}} />
          </picture> : <p className="scene-art-unavailable" role="status">The desk artwork could not load. All project links are available below.</p>}
          {!failed && <DeskSurfaces loaded={loaded} />}
          <div className="scene-light" aria-hidden="true" /><div className="scene-grain" aria-hidden="true" />
        </div>
        <nav className="scene-map" aria-label="Explore the work on the desk">
          {objects.map((object,index)=><a key={object.id} className={`scene-object ${object.className}`} href={object.href} data-home-origin={object.origin} data-scene-object={object.id} data-selected={selected===object.id||undefined} data-explored={visited.includes(object.id)||undefined} style={position(object)} onFocus={revealFocusedCaption} onClick={event=>follow(event,object.href,object.origin)}>
            <span className="scene-hit" aria-hidden="true" />
            <span className="scene-callout"><span className="scene-object-number" aria-hidden="true">0{index+1}</span><span className="scene-callout-copy"><strong>{object.title}{visited.includes(object.id) && <small className="scene-explored">Explored</small>}</strong><span>{object.context}</span><em className="scene-object-action">{actions[object.id]}</em></span><ArrowRight size={15} aria-hidden="true" /></span>
          </a>)}
        </nav>
      </div>
      <p className="desk-source-note page-width">Original desk artwork. The screens and printed insert show genuine project captures.</p>
    </section>
  );
}
