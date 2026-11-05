import { useLayoutEffect, useRef, useState } from "react";

type Point = readonly [number, number];
type Quad = readonly [Point, Point, Point, Point];
const sceneWidth = 1672;
const planes: Record<string, { quad: Quad; width: number; height: number }> = {
  cirs: { quad: [[396, 135], [1054, 133], [1065, 502], [413, 538]], width: 1600, height: 1000 },
  community: { quad: [[60, 563], [274, 549], [368, 636], [90, 657]], width: 600, height: 400 },
  accuflow: { quad: [[1272, 310], [1606, 329], [1564, 568], [1218, 537]], width: 1440, height: 1000 },
  signature: { quad: [[1192, 741], [1409, 717], [1455, 782], [1234, 809]], width: 600, height: 350 },
};

// Map a real, complete rectangular capture onto its physical plane in the art.
// This is a fixed-camera projective illustration, not a simulated 3D renderer.
function projection(quad: Quad, width: number, height: number, scale: number) {
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = quad.map(([x,y]) => [x * scale,y * scale]);
  const dx1=x1-x2, dx2=x3-x2, dx3=x0-x1+x2-x3;
  const dy1=y1-y2, dy2=y3-y2, dy3=y0-y1+y2-y3;
  const determinant=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/determinant;
  const h=(dx1*dy3-dx3*dy1)/determinant;
  const a=x1-x0+g*x1, b=x3-x0+h*x3;
  const d=y1-y0+g*y1, e=y3-y0+h*y3;
  return `matrix3d(${a/width},${d/width},0,${g/width},${b/height},${e/height},0,${h/height},0,0,1,0,${x0},${y0},0,1)`;
}

function Capture({ src, project, className = "" }: { src: string; project: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="scene-capture-unavailable">{project} capture unavailable.<br />Open the project to explore the work.</span> :
    <img className={className} src={src} alt="" decoding="async" onError={() => setFailed(true)} data-genuine-capture={project} />;
}

export default function DeskSurfaces({ loaded }: { loaded: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element=host.current, visual=element?.parentElement;
    if (!element || !visual) return;
    let frame=0;
    const update=() => {
      const scale=visual.clientWidth/sceneWidth;
      element.querySelectorAll<HTMLElement>("[data-scene-plane]").forEach(plane => {
        const definition=planes[plane.dataset.scenePlane!];
        plane.style.transform=projection(definition.quad,definition.width,definition.height,scale);
      });
      element.dataset.projected="true";
    };
    update();
    const changed=() => { cancelAnimationFrame(frame); frame=requestAnimationFrame(update); };
    const observer=typeof ResizeObserver !== "undefined" ? new ResizeObserver(changed) : null;
    observer?.observe(visual);
    if (!observer) window.addEventListener("resize",changed);
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("resize",changed); };
  }, []);
  return <div className="scene-surfaces" ref={host} data-loaded={loaded} aria-hidden="true">
    <div className="scene-projected scene-laptop-display" data-scene-plane="cirs" style={{width:1600,height:1000}}>
      <Capture src="/media/desk-cirs-home-1600.webp" project="CIRS" /><span className="scene-display-reflection" />
    </div>
    <div className="scene-projected scene-booklet-print" data-scene-plane="community" style={{width:600,height:400}}>
      <Capture src="/media/vallalar-language-en-desktop.webp" project="Vallalar" />
    </div>
    <div className="scene-projected scene-tablet-display" data-scene-plane="accuflow" style={{width:1440,height:1000}}>
      <Capture src="/media/atlas-accuflow-guide-desktop.webp" project="AccuFlow" /><span className="scene-display-reflection" />
    </div>
    <div className="scene-projected scene-card-print" data-scene-plane="signature" style={{width:600,height:350}}>
      <img src="/media/ap-signature.png" alt="" width={768} height={512} decoding="async" />
    </div>
  </div>;
}
