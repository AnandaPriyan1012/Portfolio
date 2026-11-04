import { useEffect, useState } from "react";

const sections = ["work", "studio", "about", "contact"] as const;
type Section = (typeof sections)[number];

/** Keep the film-strip location in sync with both native and Lenis scrolling. */
export default function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<Section>("work");

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const header = document.querySelector(".site-header");
      const readingLine = (header?.getBoundingClientRect().bottom ?? 0) +
        Math.min(innerHeight * 0.2, 140);
      let current: Section = "work";
      for (const id of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= readingLine)
          current = id;
      }
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4)
        current = "contact";
      setActive((previous) => previous === current ? previous : current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const about = document.getElementById("about");
    let aboutHeight = about?.offsetHeight ?? 0;
    const aboutResize =
      about && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const height = about.offsetHeight;
            if (height === aboutHeight) return;
            aboutHeight = height;
            schedule();
          })
        : null;
    if (about) aboutResize?.observe(about);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      aboutResize?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [enabled]);

  return active;
}
