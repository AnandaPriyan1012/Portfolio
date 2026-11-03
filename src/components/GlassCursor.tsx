import { useEffect, useRef, useState } from "react";

/** An optional optical accent. The native cursor is always retained. */
export default function GlassCursor({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState(
    () => matchMedia("(pointer: fine) and (hover: hover)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(pointer: fine) and (hover: hover)");
    const sync = () => setFine(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!enabled || !fine) return;
    const lens = ref.current!;
    let frame = 0;
    let x = 0,
      y = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        lens.dataset.visible = "false";
        return;
      }
      x = event.clientX;
      y = event.clientY;
      const target = event.target instanceof Element ? event.target : null;
      const mode =
        target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
      lens.dataset.mode = mode;
      lens.dataset.visible = String(
        !target?.closest("input, textarea, video, .os-window-titlebar"),
      );
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        lens.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const hide = () => {
      lens.dataset.visible = "false";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      cancelAnimationFrame(frame);
    };
  }, [enabled, fine]);
  if (!enabled || !fine) return null;
  return (
    <div
      ref={ref}
      className="glass-cursor"
      aria-hidden="true"
      data-visible="false"
    >
      <span className="glass-cursor-ring">
        <span className="cursor-view">View</span>
        <span className="cursor-play">▶</span>
      </span>
    </div>
  );
}
