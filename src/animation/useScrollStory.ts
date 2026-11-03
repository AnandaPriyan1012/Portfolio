import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

type Options = {
  root: RefObject<HTMLElement | null>;
  enabled: boolean;
  route: string;
};

type ScrollTarget = Element | string | number;

type MaterialBox = { x: number; y: number; width: number; height: number };

// Every state uses eight cubic curves so GSAP can interpolate the actual pane
// geometry without a morph plugin, image swaps, a canvas or an extra RAF loop.
function roundedPane(box: MaterialBox, radius = 12) {
  const { x, y, width: w, height: h } = box;
  const r = Math.max(2, Math.min(radius, w / 8, h / 8));
  return `M ${x + r} ${y} C ${x + w * 0.3} ${y} ${x + w * 0.7} ${y} ${x + w - r} ${y} C ${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} C ${x + w} ${y + h * 0.3} ${x + w} ${y + h * 0.7} ${x + w} ${y + h - r} C ${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} C ${x + w * 0.7} ${y + h} ${x + w * 0.3} ${y + h} ${x + r} ${y + h} C ${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} C ${x} ${y + h * 0.7} ${x} ${y + h * 0.3} ${x} ${y + r} C ${x} ${y} ${x} ${y} ${x + r} ${y} Z`;
}

function sculptedPane(box: MaterialBox, warmth = false) {
  const curves = warmth
    ? [
        [170, 85],
        [350, 20, 620, 145, 820, 70],
        [930, 25, 970, 120, 920, 210],
        [875, 410, 990, 680, 870, 810],
        [840, 880, 800, 925, 770, 890],
        [540, 835, 390, 950, 180, 870],
        [90, 820, 20, 865, 60, 740],
        [145, 480, 65, 225, 140, 155],
        [150, 120, 145, 105, 170, 85],
      ]
    : [
        [170, 160],
        [350, 70, 640, 300, 800, 240],
        [915, 210, 960, 280, 920, 330],
        [875, 420, 990, 640, 870, 730],
        [840, 800, 800, 835, 770, 800],
        [540, 735, 390, 830, 200, 710],
        [110, 660, 30, 710, 90, 650],
        [170, 480, 70, 290, 140, 230],
        [150, 200, 145, 175, 170, 160],
      ];
  return (
    curves
      .map(
        (points, index) =>
          `${index ? "C" : "M"} ${points.map((v, i) => (i % 2 ? box.y + (v / 1000) * box.height : box.x + (v / 1000) * box.width)).join(" ")}`,
      )
      .join(" ") + " Z"
  );
}

function filmPane(box: MaterialBox) {
  const { x, y, width: w, height: h } = box;
  return `M ${x + 10} ${y + h * 0.1} C ${x + w * 0.3} ${y - h * 0.1} ${x + w * 0.7} ${y + h * 0.2} ${x + w - 10} ${y} C ${x + w} ${y} ${x + w} ${y} ${x + w} ${y + 12} C ${x + w} ${y + h * 0.3} ${x + w} ${y + h * 0.7} ${x + w} ${y + h - 12} C ${x + w} ${y + h} ${x + w} ${y + h} ${x + w - 10} ${y + h} C ${x + w * 0.7} ${y + h * 1.2} ${x + w * 0.3} ${y + h * 0.9} ${x + 10} ${y + h * 1.1} C ${x} ${y + h * 1.1} ${x} ${y + h * 1.1} ${x} ${y + h - 12} C ${x} ${y + h * 0.7} ${x} ${y + h * 0.3} ${x} ${y + h * 0.1 + 12} C ${x} ${y + h * 0.1} ${x} ${y + h * 0.1} ${x + 10} ${y + h * 0.1} Z`;
}

function coordinateMaterial(element: HTMLElement, desktop: boolean) {
  const surface = element.querySelector<SVGSVGElement>(".glass-material");
  const pane = surface?.querySelector<SVGPathElement>(".material-pane");
  if (!surface || !pane) return () => {};
  const inner = surface.querySelector<SVGPathElement>(".material-inner-edge");
  const film = surface.querySelector<SVGPathElement>(".material-film-edge");
  const opening = element.querySelector<HTMLElement>(".scroll-opening");
  const openingFrame = element.querySelector<HTMLElement>(".cirs-visual-frame");
  const chapters = [
    {
      name: "community",
      selector: "#community .feature-media",
      light: "#dfb882",
    },
    {
      name: "accuflow",
      selector: "#accuflow .feature-media",
      light: "#a8d1c1",
    },
    {
      name: "studio",
      selector: "#studio .studio-reel-window, #studio .studio-collection-index",
      light: "#d2b394",
    },
  ].map((chapter) => ({
    ...chapter,
    node: element.querySelector<HTMLElement>(chapter.selector),
  }));
  const clamp = gsap.utils.clamp(0, 1);
  const alpha = (value: number) => {
    surface.style.opacity = String(value);
    surface.style.visibility = value > 0.001 ? "visible" : "hidden";
  };
  const cached = new Map<
    HTMLElement,
    { left: number; top: number; width: number; height: number }
  >();
  const cacheBounds = () => {
    chapters.forEach((chapter) => {
      if (!chapter.node) return;
      const b = chapter.node.getBoundingClientRect();
      cached.set(chapter.node, {
        left: b.left,
        top: b.top + window.scrollY,
        width: b.width,
        height: b.height,
      });
    });
  };
  const viewportBox = (rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  }): MaterialBox => ({
    x: (rect.left / innerWidth) * 1000,
    y: (rect.top / innerHeight) * 1000,
    width: (rect.width / innerWidth) * 1000,
    height: (rect.height / innerHeight) * 1000,
  });
  const render = () => {
    const scene = opening?.getBoundingClientRect();
    let d = "",
      opacity = 0,
      world = "none",
      light = "#d9d5bf",
      perforated = false;
    if (scene && openingFrame && scene.top < innerHeight && scene.bottom > 0) {
      const progress =
        ScrollTrigger.getById("atelier-cirs-opening")?.progress ??
        clamp(-scene.top / Math.max(scene.height * 0.55, 1));
      world = progress < 0.08 ? "hero" : "cirs";
      const frame = viewportBox(openingFrame.getBoundingClientRect());
      const sculpture = sculptedPane({ x: 25, y: 65, width: 950, height: 850 });
      d = desktop
        ? gsap.utils.interpolate(
            sculpture,
            roundedPane(frame),
            clamp((progress - 0.04) / 0.67),
          )
        : roundedPane(frame, 7);
      opacity = desktop
        ? clamp((progress - 0.025) / 0.14) * 0.72
        : clamp(progress * 3) * 0.3;
    } else {
      const visible = chapters
        .map((chapter) => {
          const rect = chapter.node ? cached.get(chapter.node) : undefined;
          const top = rect ? rect.top - window.scrollY : 0;
          return { ...chapter, rect: rect ? { ...rect, top } : undefined };
        })
        .filter(
          (chapter) =>
            chapter.rect &&
            chapter.rect.top < innerHeight * 1.05 &&
            chapter.rect.top + chapter.rect.height > -30,
        )
        .sort(
          (a, b) =>
            Math.abs(a.rect!.top + a.rect!.height / 2 - innerHeight * 0.5) -
            Math.abs(b.rect!.top + b.rect!.height / 2 - innerHeight * 0.5),
        );
      const chapter = visible[0];
      if (chapter?.rect) {
        world = chapter.name;
        light = chapter.light;
        const box = viewportBox(chapter.rect);
        const progress = clamp(
          (innerHeight * 0.94 - chapter.rect.top) /
            Math.max(innerHeight * 0.9, 1),
        );
        const transit = clamp(
          (innerHeight - chapter.rect.top) /
            (innerHeight + chapter.rect.height),
        );
        opacity = Math.sin(transit * Math.PI) * (desktop ? 0.72 : 0.28);
        if (world === "community") {
          const peeled = {
            ...box,
            x: box.x + box.width * progress * 0.25,
            width: box.width * (1 - progress * 0.15),
          };
          d = gsap.utils.interpolate(
            roundedPane(box),
            sculptedPane(peeled, true),
            desktop ? progress : progress * 0.15,
          );
        } else if (world === "accuflow") {
          d = gsap.utils.interpolate(
            sculptedPane(box, true),
            roundedPane(box, 9),
            desktop ? progress : 1,
          );
        } else {
          d = desktop
            ? gsap.utils.interpolate(roundedPane(box), filmPane(box), progress)
            : roundedPane(box, 6);
          perforated = desktop;
        }
      }
    }
    if (d) {
      pane.setAttribute("d", d);
      inner?.setAttribute("d", d);
      film?.setAttribute("d", d);
    }
    surface.style.setProperty("--material-light", light);
    if (film) film.style.opacity = perforated ? ".32" : "0";
    alpha(opacity);
    if (element.dataset.materialWorld !== world)
      element.dataset.materialWorld = world;
    surface.dataset.world = world;
  };
  cacheBounds();
  const master = ScrollTrigger.create({
    id: "atelier-shared-material",
    trigger: element,
    start: 0,
    end: "max",
    onUpdate: render,
    onRefresh: () => {
      cacheBounds();
      render();
    },
  });
  render();
  return () => {
    master.kill();
    [pane, inner, film].forEach((path) => {
      path?.removeAttribute("d");
      path?.style.removeProperty("opacity");
    });
    surface.style.removeProperty("opacity");
    surface.style.removeProperty("visibility");
    surface.style.removeProperty("--material-light");
    delete surface.dataset.world;
    delete element.dataset.materialWorld;
  };
}

/**
 * One scroll coordinator for the homepage. ScrollTrigger owns the scene progress;
 * GSAP's ticker is also the sole RAF source for desktop Lenis (autoRaf is false).
 * React/GSAP contexts own every trigger and inline style created by this hook.
 */
export default function useScrollStory({ root, enabled, route }: Options) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduceRef = useRef(false);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || route.startsWith("/projects/")) return;
    element.dataset.scrollEngine = "static";
    const media = gsap.matchMedia();
    let alive = true;
    let refreshFrame = 0;
    let anchorFrame = 0;
    let readinessTimeout = 0;
    let initialHashPending = Boolean(window.location.hash);
    let layoutReady = false;
    let interacted = false;
    const initialHash = window.location.hash;

    // Native hash positioning happens before ScrollTrigger adds pin spacing.
    // Resolve by ID (never by an untrusted CSS selector), then correct it once
    // the initial fonts/critical images and trigger measurements are ready.
    const hashTarget = (hash: string) => {
      if (!hash || hash === "#") return null;
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return null;
      }
      const target = document.getElementById(id);
      return target && element.contains(target) ? target : null;
    };
    const placeAnchor = (hash: string, immediate: boolean) => {
      const target = hashTarget(hash);
      if (!target) return;
      const top = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - 100,
      );
      const lenis = lenisRef.current;
      if (lenis) {
        // Numeric coordinates use the actual native scroll position and avoid
        // adding CSS scroll-margin/padding to the requested header offset twice.
        lenis.resize();
        lenis.scrollTo(top, { immediate, duration: 0.85 });
      } else
        window.scrollTo({
          top,
          behavior:
            immediate || !enabled || reduceRef.current ? "instant" : "smooth",
        });
    };
    const correctInitialAnchor = () => {
      if (!alive || !layoutReady || !initialHashPending) return;
      initialHashPending = false;
      if (!interacted && window.location.hash === initialHash)
        placeAnchor(initialHash, true);
    };
    const markInteraction = () => {
      interacted = true;
      initialHashPending = false;
    };
    window.addEventListener("wheel", markInteraction, { passive: true });
    window.addEventListener("touchstart", markInteraction, { passive: true });
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);
    const hashChange = () => {
      // A new hash is an explicit navigation, including native back/forward.
      // It is independent of the one-time loading correction above.
      initialHashPending = false;
      cancelAnimationFrame(anchorFrame);
      anchorFrame = requestAnimationFrame(() => {
        if (!alive) return;
        ScrollTrigger.refresh();
        lenisRef.current?.resize();
        placeAnchor(window.location.hash, false);
      });
    };
    window.addEventListener("hashchange", hashChange);

    const refresh = () => {
      if (!alive) return;
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        if (!alive) return;
        ScrollTrigger.refresh();
        lenisRef.current?.resize();
        correctInitialAnchor();
      });
    };
    const readinessCleanups: (() => void)[] = [];
    const images = [...element.querySelectorAll("img")];
    images.forEach((image) => {
      image.addEventListener("load", refresh);
      image.addEventListener("error", refresh);
      if (image.complete && typeof image.decode === "function") {
        void image.decode().then(refresh, refresh);
      }
    });
    const criticalImages = images.filter((image) => image.loading !== "lazy");
    const criticalReady = criticalImages.map((image) => {
      if (image.complete)
        return typeof image.decode === "function"
          ? image.decode().catch(() => undefined)
          : Promise.resolve();
      return new Promise<void>((resolve) => {
        const complete = () => {
          image.removeEventListener("load", complete);
          image.removeEventListener("error", complete);
          resolve();
        };
        image.addEventListener("load", complete, { once: true });
        image.addEventListener("error", complete, { once: true });
        // Cleanup this readiness-only listener even when the image never settles.
        readinessCleanups.push(complete);
      });
    });
    const ready = Promise.allSettled([document.fonts.ready, ...criticalReady]);
    const boundedReady = new Promise<void>((resolve) => {
      readinessTimeout = window.setTimeout(resolve, 1800);
    });
    void Promise.race([ready, boundedReady]).then(() => {
      if (!alive) return;
      window.clearTimeout(readinessTimeout);
      layoutReady = true;
      refresh();
    });
    void document.fonts.ready.then(refresh);

    const context = gsap.context(() => {
      media.add(
        {
          desktop: "(min-width: 1024px)",
          mobileOrTablet: "(max-width: 1023px)",
          capablePointer: "(hover: hover) and (pointer: fine)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (match) => {
          const conditions = match.conditions ?? {};
          const reduced = Boolean(conditions.reduced);
          const device = navigator as Navigator & {
            connection?: { saveData?: boolean };
            deviceMemory?: number;
          };
          const lowPower = Boolean(
            device.connection?.saveData ||
              (navigator.hardwareConcurrency > 0 &&
                navigator.hardwareConcurrency <= 2) ||
              (device.deviceMemory && device.deviceMemory <= 2),
          );
          reduceRef.current = reduced || lowPower;
          element.dataset.motionFallback = lowPower
            ? "device"
            : reduced
              ? "reduced"
              : enabled
                ? "none"
                : "preference";
          if (!enabled || reduced || lowPower) {
            element.dataset.scrollEngine = "static";
            return;
          }

          const desktop = Boolean(
            conditions.desktop && conditions.capablePointer,
          );
          element.dataset.scrollEngine = desktop ? "gsap-lenis" : "gsap-native";
          const select = <T extends Element = HTMLElement>(selector: string) =>
            element.querySelector<T>(selector);
          const selectAll = (selector: string) => [
            ...element.querySelectorAll<HTMLElement>(selector),
          ];
          let lenis: Lenis | null = null;
          let ticker: ((time: number) => void) | null = null;
          let resumeAfterVisibility = false;
          const previousScrollBehavior =
            document.documentElement.style.scrollBehavior;

          if (desktop) {
            document.documentElement.style.scrollBehavior = "auto";
            lenis = new Lenis({
              autoRaf: false,
              smoothWheel: true,
              syncTouch: false,
              anchors: { offset: -100, duration: 0.85 },
              prevent: (node) =>
                Boolean(node.closest("dialog, .ap-os, [data-lenis-prevent]")),
            });
            lenisRef.current = lenis;
            lenis.on("scroll", ScrollTrigger.update);
            ticker = (time) => lenis?.raf(time * 1000);
            gsap.ticker.add(ticker);
            // Lenis's documented GSAP integration disables the ticker's lag correction.
            gsap.ticker.lagSmoothing(0);
          }

          const ambientScene = select<HTMLElement>(".scroll-opening");
          const ambientLight = select<HTMLElement>(".hero-material-light");
          let ambientInView = true;
          let ambientInOpening = true;
          const ambient = ambientLight
            ? gsap.fromTo(
                ambientLight,
                { xPercent: desktop ? -3 : -1, yPercent: 0, opacity: 0.16 },
                {
                  xPercent: desktop ? 3 : 1,
                  yPercent: desktop ? 2 : 0,
                  opacity: desktop ? 0.3 : 0.23,
                  duration: desktop ? 14 : 18,
                  repeat: -1,
                  yoyo: true,
                  ease: "sine.inOut",
                  paused: true,
                },
              )
            : null;
          const syncAmbient = () => {
            if (!ambient) return;
            if (ambientInView && ambientInOpening && !document.hidden)
              ambient.resume();
            else ambient.pause();
          };
          const ambientObserver =
            ambient && ambientScene
              ? new IntersectionObserver(
                  (entries) => {
                    ambientInView = entries[0]?.isIntersecting ?? false;
                    syncAmbient();
                  },
                  { threshold: 0.01 },
                )
              : null;
          if (ambientScene) ambientObserver?.observe(ambientScene);
          syncAmbient();

          const visibility = () => {
            syncAmbient();
            if (!lenis) return;
            if (document.hidden) {
              resumeAfterVisibility = !lenis.isStopped;
              lenis.stop();
            } else if (resumeAfterVisibility) {
              lenis.start();
              resumeAfterVisibility = false;
              refresh();
            }
          };
          document.addEventListener("visibilitychange", visibility);

          if (desktop) {
            const scene = select<HTMLElement>(".scroll-opening");
            const frame = select<HTMLElement>(".cirs-visual-frame");
            const hero = select(".hero-story-copy");
            const room = select(".hero-room");
            const title = select(".cirs-scene-title");
            const captions = select(".cirs-scene-captions");
            if (scene && frame) {
              const sceneBounds = scene.getBoundingClientRect();
              const frameBounds = frame.getBoundingClientRect();
              const initialFrame = {
                left: `${((frameBounds.left - sceneBounds.left) / Math.max(sceneBounds.width, 1)) * 100}%`,
                top: `${((frameBounds.top - sceneBounds.top) / Math.max(sceneBounds.height, 1)) * 100}%`,
                width: `${(frameBounds.width / Math.max(sceneBounds.width, 1)) * 100}%`,
                height: `${(frameBounds.height / Math.max(sceneBounds.height, 1)) * 100}%`,
              };
              gsap.set(frame, { left: initialFrame.left, right: "auto" });
              if (title) gsap.set(title, { autoAlpha: 0 });
              if (captions) gsap.set(captions, { autoAlpha: 0 });
              const opening = gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  id: "atelier-cirs-opening",
                  trigger: scene,
                  start: "top top",
                  end: "+=110%",
                  pin: true,
                  pinSpacing: true,
                  scrub: true,
                  invalidateOnRefresh: true,
                  anticipatePin: 1,
                  onUpdate: (trigger) => {
                    scene.dataset.progress = trigger.progress.toFixed(3);
                    ambientInOpening = trigger.progress < 0.48;
                    syncAmbient();
                  },
                  onRefresh: (trigger) => {
                    scene.dataset.progress = trigger.progress.toFixed(3);
                    ambientInOpening = trigger.progress < 0.48;
                    syncAmbient();
                  },
                },
              });
              if (hero)
                opening.to(
                  hero,
                  { autoAlpha: 0, y: -12, duration: 0.22 },
                  0.03,
                );
              if (room)
                opening.fromTo(
                  room,
                  {
                    autoAlpha: 1,
                    scale: 1,
                    clipPath: "inset(0% 0% 0% 0% round 0px)",
                  },
                  {
                    autoAlpha: 0,
                    scale: 0.98,
                    clipPath: "inset(13% 5% 17% 5% round 18px)",
                    duration: 0.43,
                  },
                  0.05,
                );
              opening.fromTo(
                frame,
                {
                  ...initialFrame,
                  clipPath: "inset(0% 0% 0% 0% round 12px)",
                  autoAlpha: 0.62,
                },
                {
                  left: "6%",
                  top: "15%",
                  width: "88%",
                  height: "66%",
                  autoAlpha: 1,
                  clipPath: "inset(0% 0% 0% 0% round 0px)",
                  duration: 0.66,
                },
                0.08,
              );
              if (title) opening.set(title, { autoAlpha: 1 }, 0.5);
              if (captions) opening.set(captions, { autoAlpha: 1 }, 0.6);
              // Keep normalized progress at 0–1 and reserve the final quarter for
              // the fully expanded view and fully opaque, stationary captions.
              opening.to({}, { duration: 0.26 }, 0.74);

              // A loaded direct link may start after the pinned scene. Refresh never
              // resets scroll position or forces visitors back through the opening.
              scene.dataset.progress =
                opening.scrollTrigger?.progress.toFixed(3) ?? "0.000";
            }

            const community = select<HTMLElement>("#community");
            const glass = select<HTMLElement>("#community .transition-glass");
            if (community && glass) {
              gsap.fromTo(
                glass,
                { xPercent: 0 },
                {
                  xPercent: 105,
                  ease: "none",
                  scrollTrigger: {
                    id: "atelier-community-glass",
                    onUpdate: (trigger) => {
                      community.dataset.storyStep =
                        trigger.progress < 0.45 ? "purpose" : "contribution";
                    },
                    trigger: community,
                    start: "top 80%",
                    end: "top 15%",
                    scrub: true,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }

            const flow = select<HTMLElement>("#accuflow");
            const flowStageInfo = select<HTMLElement>(
              "#accuflow .accuflow-stage-info",
            );
            const flowStages = selectAll("#accuflow [data-flow-stage]");
            const flowPath = select<SVGPathElement>("#accuflow .accuflow-path");
            const flowMedia = select<HTMLElement>("#accuflow .feature-media");
            if (flow && flowPath) {
              gsap.fromTo(
                flowPath,
                { strokeDasharray: 1, strokeDashoffset: 1 },
                {
                  strokeDashoffset: 0,
                  ease: "none",
                  scrollTrigger: {
                    id: "atelier-accuflow-outline",
                    trigger: flowMedia ?? flow,
                    start: "top 85%",
                    end: "top 30%",
                    scrub: true,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }
            if (flowStageInfo && flowStages.length) {
              gsap.fromTo(
                flowStages,
                { y: 18, autoAlpha: 0 },
                {
                  y: 0,
                  autoAlpha: 1,
                  duration: 0.35,
                  stagger: 0.2,
                  ease: "none",
                  scrollTrigger: {
                    id: "atelier-accuflow-stages",
                    trigger: flowStageInfo,
                    start: "top 90%",
                    end: "top 55%",
                    scrub: true,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }

            const studio = select<HTMLElement>("#studio");
            const reelWindow = select<HTMLElement>(
              "#studio .studio-reel-window",
            );
            const reel = select<HTMLElement>("#studio .studio-reel");
            if (studio && reelWindow && reel) {
              gsap.fromTo(
                reel,
                { x: 0 },
                {
                  x: () =>
                    -Math.max(0, reel.scrollWidth - reelWindow.clientWidth),
                  ease: "none",
                  scrollTrigger: {
                    id: "atelier-studio-reel",
                    trigger: studio,
                    start: "top 75%",
                    end: "bottom 30%",
                    scrub: true,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }
          } else {
            // Phones/tablets retain native vertical scroll: no pin, smoothing or
            // forced horizontal sequence. Essential text remains fully visible.
            const community = select<HTMLElement>("#community");
            const glass = select<HTMLElement>("#community .transition-glass");
            if (community && glass) {
              gsap.fromTo(
                glass,
                { x: 0, opacity: 0.3 },
                {
                  x: 12,
                  opacity: 0,
                  ease: "none",
                  scrollTrigger: {
                    id: "atelier-mobile-glass",
                    trigger: community,
                    start: "top 85%",
                    end: "top 45%",
                    scrub: true,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }
          }

          const clearMaterial = coordinateMaterial(element, desktop);
          refresh();
          return () => {
            ambientObserver?.disconnect();
            ambient?.kill();
            clearMaterial();
            document.removeEventListener("visibilitychange", visibility);
            if (ticker) gsap.ticker.remove(ticker);
            if (lenis) {
              lenis.off("scroll", ScrollTrigger.update);
              lenis.destroy();
              if (lenisRef.current === lenis) lenisRef.current = null;
            }
            document.documentElement.style.scrollBehavior =
              previousScrollBehavior;
            element.dataset.scrollEngine = "static";
            const scene = select<HTMLElement>(".scroll-opening");
            if (scene) delete scene.dataset.progress;
          };
        },
      );
    }, element);

    return () => {
      alive = false;
      cancelAnimationFrame(refreshFrame);
      cancelAnimationFrame(anchorFrame);
      window.clearTimeout(readinessTimeout);
      window.removeEventListener("wheel", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("hashchange", hashChange);
      readinessCleanups.forEach((cleanup) => cleanup());
      images.forEach((image) => {
        image.removeEventListener("load", refresh);
        image.removeEventListener("error", refresh);
      });
      media.revert();
      context.revert();
      element.dataset.scrollEngine = "static";
      delete element.dataset.motionFallback;
    };
  }, [root, enabled, route]);

  const scrollTo = useCallback(
    (target: ScrollTarget) => {
      const lenis = lenisRef.current;
      if (lenis) {
        if (typeof target === "number")
          lenis.scrollTo(target, { duration: 0.85 });
        else {
          let destination: Element | null =
            target instanceof Element ? target : null;
          if (typeof target === "string") {
            try {
              destination = target.startsWith("#")
                ? document.getElementById(decodeURIComponent(target.slice(1)))
                : document.querySelector(target);
            } catch {
              destination = null;
            }
          }
          if (destination) {
            lenis.resize();
            lenis.scrollTo(
              Math.max(
                0,
                destination.getBoundingClientRect().top + window.scrollY - 100,
              ),
              { duration: 0.85 },
            );
          }
        }
        return;
      }
      const behavior = enabled && !reduceRef.current ? "smooth" : "instant";
      if (typeof target === "number")
        window.scrollTo({ top: target, behavior });
      else {
        const destination =
          typeof target === "string" ? document.querySelector(target) : target;
        destination?.scrollIntoView({ behavior, block: "start" });
      }
    },
    [enabled],
  );

  return { scrollTo };
}
