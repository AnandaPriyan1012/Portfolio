import { useLayoutEffect, useRef, useState } from "react";
import "./work-chapter-rail.css";

const chapters = [
  { id: "cirs", label: "CIRS" },
  { id: "community", label: "Vallalar" },
  { id: "accuflow", label: "AccuFlow" },
] as const;
type Chapter = (typeof chapters)[number]["id"];

/** Native wayfinding within the existing three selected Work chapters. */
export default function WorkChapterRail({ navigationOpen = false, motionEnabled = false }: {
  navigationOpen?: boolean;
  motionEnabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const schedule = useRef<() => void>(() => {});
  const [reading, setReading] = useState<{ visible: boolean; chapter: Chapter | null }>({ visible: false, chapter: null });
  const lastReading = useRef(reading);
  const visible = reading.visible && !navigationOpen;

  useLayoutEffect(() => {
    const rail = host.current;
    const work = rail?.closest<HTMLElement>(".work-page");
    const index = work?.querySelector<HTMLElement>(".work-project-index");
    const header = document.querySelector<HTMLElement>(".site-header.atelier-navigation");
    if (!rail || !work || !index || !header) return;
    const starts = chapters.map((chapter) => ({
      id: chapter.id,
      element: work.querySelector<HTMLElement>(`#${chapter.id}`),
    }));
    let frame = 0;
    let disposed = false;
    let lastHeaderHeight = "";
    let needsScrollPadding = true;
    let lastScrollPadding = "";
    const previousProperties = [
      { element: work, name: "--work-rail-header-height" },
      { element: work, name: "--work-rail-height" },
      { element: work, name: "--work-native-scroll-padding" },
      { element: rail, name: "--work-rail-header-height" },
    ].map(({ element, name }) => ({ element, name,
      value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) }));
    work.style.setProperty("--work-rail-height", "56px");
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const headerBottom = Math.max(0, header.getBoundingClientRect().bottom);
      const headerHeight = `${headerBottom}px`;
      if (headerHeight !== lastHeaderHeight) {
        needsScrollPadding = true;
        rail.style.setProperty("--work-rail-header-height", headerHeight);
        work.style.setProperty("--work-rail-header-height", headerHeight);
        lastHeaderHeight = headerHeight;
      }
      if (needsScrollPadding) {
        const computed = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        const padding = `${Number.isFinite(computed) ? Math.max(0, computed) : 0}px`;
        if (padding !== lastScrollPadding) {
          work.style.setProperty("--work-native-scroll-padding", padding);
          lastScrollPadding = padding;
        }
        needsScrollPadding = false;
      }
      const railHeight = rail.getBoundingClientRect().height;
      const end = work.getBoundingClientRect().bottom;
      const passedIndex = index.getBoundingClientRect().bottom <= headerBottom;
      const withinWork = end > headerBottom + railHeight;
      const line = headerBottom + railHeight + 40;
      let chapter: Chapter | null = null;
      if (passedIndex && end > line) {
        for (const start of starts) {
          if (start.element && start.element.getBoundingClientRect().top <= line)
            chapter = start.id;
        }
      }
      const next = { visible: focused.current || (passedIndex && withinWork), chapter };
      if (lastReading.current.visible !== next.visible || lastReading.current.chapter !== next.chapter) {
        lastReading.current = next;
        setReading(next);
      }
    };
    const requestMeasure = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(measure);
    };
    const resize = () => { needsScrollPadding = true; requestMeasure(); };
    schedule.current = requestMeasure;
    const observer = new ResizeObserver(requestMeasure);
    [work, index, header, rail].forEach((element) => observer.observe(element));
    window.addEventListener("scroll", requestMeasure, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("hashchange", requestMeasure);
    document.fonts.addEventListener("loadingdone", requestMeasure);
    void document.fonts.ready.then(requestMeasure);
    measure();
    return () => {
      disposed = true;
      schedule.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", requestMeasure);
      window.removeEventListener("resize", resize);
      window.removeEventListener("hashchange", requestMeasure);
      document.fonts.removeEventListener("loadingdone", requestMeasure);
      previousProperties.forEach(({ element, name, value, priority }) => {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      });
    };
  }, []);

  useLayoutEffect(() => { schedule.current(); }, [navigationOpen]);

  return (
    <div ref={host} className="work-chapter-rail" data-visible={visible}
      data-motion={motionEnabled ? "on" : "off"}
      onFocusCapture={() => { focused.current = true; schedule.current(); }}
      onBlurCapture={(event) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        focused.current = false;
        schedule.current();
      }}>
      <nav aria-label="Work chapters" aria-hidden={!visible || undefined} inert={!visible}>
        {chapters.map((chapter, index) => (
          <a key={chapter.id} href={`#${chapter.id}`} aria-current={reading.chapter === chapter.id ? "location" : undefined}>
            <span className="work-chapter-number" aria-hidden="true">0{index + 1}</span>
            <span>{chapter.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
