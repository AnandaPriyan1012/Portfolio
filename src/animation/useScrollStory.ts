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

// Read the actual fixed header rather than letting anchor positions drift when
// the phone, tablet and desktop navigation use different heights.
function headerClearance() {
  const header = document.querySelector<HTMLElement>(".site-header");
  const configured = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--header-height",
    ),
  );
  const height =
    header?.getBoundingClientRect().height ??
    (Number.isFinite(configured) ? configured : 76);
  return Math.ceil(height) + 20;
}

// A quiet edge follows the real media frame. Keeping the geometry rectangular
// lets its reflected light connect chapters without introducing outline sculptures.
function roundedPane(box: MaterialBox, radius = 12) {
  const { x, y, width: w, height: h } = box;
  const r = Math.max(2, Math.min(radius, w / 8, h / 8));
  return `M ${x + r} ${y} C ${x + w * 0.3} ${y} ${x + w * 0.7} ${y} ${x + w - r} ${y} C ${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} C ${x + w} ${y + h * 0.3} ${x + w} ${y + h * 0.7} ${x + w} ${y + h - r} C ${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} C ${x + w * 0.7} ${y + h} ${x + w * 0.3} ${y + h} ${x + r} ${y + h} C ${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} C ${x} ${y + h * 0.7} ${x} ${y + h * 0.3} ${x} ${y + r} C ${x} ${y} ${x} ${y} ${x + r} ${y} Z`;
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
      light = "#d9d5bf";
    let activeBox: MaterialBox | null = null;
    if (scene && openingFrame && scene.top < innerHeight && scene.bottom > 0) {
      const progress =
        ScrollTrigger.getById("atelier-cirs-opening")?.progress ??
        clamp(-scene.top / Math.max(scene.height * 0.55, 1));
      world = progress < 0.08 ? "hero" : "cirs";
      const frame = viewportBox(openingFrame.getBoundingClientRect());
      const inset = desktop ? Math.max(0, 1 - progress / 0.58) * 3 : 0;
      activeBox = {
        x: frame.x - inset,
        y: frame.y - inset,
        width: frame.width + inset * 2,
        height: frame.height + inset * 2,
      };
      d = roundedPane(activeBox, desktop ? 9 : 6);
      opacity = desktop
        ? clamp((progress - 0.025) / 0.14) * 0.72
        : clamp(progress * 3) * 0.3;
    } else {
      const visible = chapters
        .map((chapter) => {
          const rect = chapter.node ? cached.get(chapter.node) : undefined;
          // Sticky media and its perspective settle no longer share a fixed
          // document offset. Read those two frames so the edge follows the work.
          const live =
            desktop && chapter.name !== "studio"
              ? chapter.node?.getBoundingClientRect()
              : undefined;
          const top = live?.top ?? (rect ? rect.top - window.scrollY : 0);
          return {
            ...chapter,
            rect: live
              ? { left: live.left, top, width: live.width, height: live.height }
              : rect
                ? { ...rect, top }
                : undefined,
          };
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
        const transit = clamp(
          (innerHeight - chapter.rect.top) /
            (innerHeight + chapter.rect.height),
        );
        opacity = Math.sin(transit * Math.PI) * (desktop ? 0.52 : 0.18);
        activeBox = box;
        d = roundedPane(box, desktop ? 9 : 6);
      }
    }
    if (d) {
      pane.setAttribute("d", d);
      if (activeBox) {
        const inset = desktop ? 3 : 1;
        inner?.setAttribute(
          "d",
          roundedPane(
            {
              x: activeBox.x + inset,
              y: activeBox.y + inset,
              width: Math.max(2, activeBox.width - inset * 2),
              height: Math.max(2, activeBox.height - inset * 2),
            },
            6,
          ),
        );
      }
    }
    surface.style.setProperty("--material-light", light);
    if (film) film.style.opacity = "0";
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

/** Desktop scenes use the work itself as the scroll subject. Text stays readable. */
function coordinateChapterScenes(element: HTMLElement) {
  const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
    element.querySelector<T>(selector);
  const cleanups: (() => void)[] = [];
  const directory = find(".home-directory");
  const directoryRail = find(".home-directory-rail");
  if (directory && directoryRail)
    gsap.fromTo(
      directoryRail,
      { xPercent: 3 },
      {
        xPercent: -17,
        ease: "none",
        scrollTrigger: {
          id: "atelier-home-type",
          trigger: directory,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  const workPortal = find(".home-directory-work");
  const previewScreens = workPortal?.querySelectorAll<HTMLElement>(
    ".home-directory-screen",
  );
  if (workPortal && previewScreens?.length)
    gsap.fromTo(
      previewScreens,
      {
        z: -150,
        x: (index) => (index - 1) * 34,
        y: (index) => 58 + index * 20,
        scale: 0.94,
      },
      {
        z: 0,
        x: 0,
        y: 0,
        scale: 1,
        stagger: 0.12,
        ease: "none",
        scrollTrigger: {
          id: "atelier-home-preview-arrival",
          trigger: workPortal,
          start: "top 95%",
          end: "top 25%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  const runway = find(".community-scroll-runway");
  const communityMedia = find(".community-image-reservation");
  const communityMeter = find(".community-scroll-meter");
  const purpose = find('[data-service-step="purpose"]');
  const contribution = find('[data-service-step="contribution"]');
  if (runway && communityMedia) {
    const scene = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "atelier-community-narrative",
        trigger: runway,
        start: "top 35%",
        end: "bottom 70%",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (trigger) => {
          runway.dataset.sceneProgress = trigger.progress.toFixed(3);
          runway.dataset.sceneStep =
            trigger.progress < 0.48 ? "purpose" : "contribution";
        },
      },
    });
    scene.fromTo(
      communityMedia,
      {
        scale: 0.9,
        rotationY: -5,
        rotationX: 2,
        transformOrigin: "left center",
      },
      { scale: 1, rotationY: 0, rotationX: 0, duration: 0.58 },
      0,
    );
    if (communityMeter)
      scene.fromTo(
        communityMeter,
        { scaleX: 0 },
        { scaleX: 1, duration: 1 },
        0,
      );
    if (purpose)
      scene.fromTo(
        purpose,
        { "--service-focus": 0.8 },
        { "--service-focus": 0.18, duration: 0.4 },
        0.35,
      );
    if (contribution)
      scene.fromTo(
        contribution,
        { "--service-focus": 0.12 },
        { "--service-focus": 1, duration: 0.46 },
        0.48,
      );
    // Fix the normalized timeline even when a decorative hook is unavailable.
    scene.to({}, { duration: 1 }, 0);
    cleanups.push(() => {
      delete runway.dataset.sceneProgress;
      delete runway.dataset.sceneStep;
    });
  }

  const assembly = find(".accuflow-assembly");
  const flowMedia = assembly?.querySelector<HTMLElement>(".feature-media");
  const route = assembly?.querySelectorAll<HTMLElement>(
    ".flow-interface-map li",
  );
  const flowMeter = find(".accuflow-scroll-meter");
  if (assembly && flowMedia) {
    const scene = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "atelier-accuflow-assembly",
        trigger: assembly,
        start: "top 85%",
        end: "top 16%",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (trigger) => {
          assembly.dataset.sceneProgress = trigger.progress.toFixed(3);
        },
      },
    });
    if (route?.length) {
      // Set every route tile together so later stagger entries do not jump
      // backwards to their starting positions as their segment begins.
      gsap.set(route, {
        x: (index) => (index - 2.5) * 7,
        y: (index) => (index % 2 ? 18 : -18),
        rotationX: -18,
        scale: 0.94,
        opacity: 0.72,
      });
      scene.to(
        route,
        {
          x: 0,
          y: 0,
          rotationX: 0,
          scale: 1,
          opacity: 1,
          duration: 0.33,
          stagger: 0.07,
        },
        0,
      );
    }
    scene.fromTo(
      flowMedia,
      { scale: 0.9, rotationX: 7, rotationY: -2, "--flow-exposure": 0.15 },
      {
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        "--flow-exposure": 1,
        duration: 0.85,
      },
      0.15,
    );
    if (flowMeter)
      scene.fromTo(flowMeter, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
    scene.to({}, { duration: 1 }, 0);
    cleanups.push(() => delete assembly.dataset.sceneProgress);
  }

  const flowStageInfo = find(".accuflow-stage-info");
  const stages =
    flowStageInfo?.querySelectorAll<HTMLElement>("[data-flow-stage]");
  if (flowStageInfo && stages?.length) {
    const scene = gsap.timeline({
      scrollTrigger: {
        id: "atelier-accuflow-reading",
        trigger: flowStageInfo,
        start: "top 86%",
        end: "bottom 66%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    scene.fromTo(
      stages,
      { "--flow-stage-focus": 0.08 },
      {
        "--flow-stage-focus": 1,
        duration: 0.4,
        stagger: 0.26,
        ease: "none",
      },
    );
  }

  const contact = find("#contact");
  const invitation = contact?.querySelector<HTMLElement>("h2");
  if (contact) {
    const scene = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "atelier-contact-exposure",
        trigger: contact,
        start: "top 92%",
        end: "clamp(bottom bottom)",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    scene.fromTo(
      contact,
      { "--contact-exposure": 0.08 },
      { "--contact-exposure": 1, duration: 1 },
      0,
    );
    if (invitation)
      scene.fromTo(invitation, { y: 28 }, { y: 0, duration: 0.8 }, 0);
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}

/**
 * One scroll coordinator for the homepage. ScrollTrigger owns the scene progress;
 * GSAP's ticker is also the sole RAF source for desktop Lenis (autoRaf is false).
 * React/GSAP contexts own every trigger and inline style created by this hook.
 */
export default function useScrollStory({ root, enabled, route }: Options) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduceRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const pendingRestore = useRef<{ route: string; top: number; onRestored?: () => void; preserveHash?: boolean } | null>(null);
  const restoreCoordinator = useRef<{ route: string; refresh: () => void } | null>(null);

  useLayoutEffect(() => {
    if (pendingRestore.current?.route !== route) pendingRestore.current = null;
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
        target.getBoundingClientRect().top + window.scrollY - headerClearance(),
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
      pendingRestore.current = null;
    };
    window.addEventListener("wheel", markInteraction, { passive: true });
    window.addEventListener("touchstart", markInteraction, { passive: true });
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);
    const hashChange = () => {
      // A history return can retain a film-selection fragment while restoring
      // its source link. Do not reinterpret that traversal as a fresh anchor.
      const restoration = pendingRestore.current;
      if (restoration?.route === route && restoration.preserveHash) {
        initialHashPending = false;
        cancelAnimationFrame(anchorFrame);
        refresh();
        return;
      }
      // A new hash is an explicit navigation, including native back/forward.
      // It is independent of the one-time loading correction above.
      initialHashPending = false;
      pendingRestore.current = null;
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
      if (pendingRestore.current?.route === route && pendingRestore.current.preserveHash) {
        initialHashPending = false;
        cancelAnimationFrame(anchorFrame);
      }
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        if (!alive) return;
        ScrollTrigger.refresh();
        lenisRef.current?.resize();
        const restoration = pendingRestore.current;
        if (restoration?.route === route && (!window.location.hash || restoration.preserveHash)) {
          pendingRestore.current = null;
          // An explicit return may keep a fragment as selection state. A later
          // media refresh must not reinterpret it as a new anchor navigation.
          initialHashPending = false;
          // Refresh can temporarily set the native scroller to zero. Restore
          // only after it finishes, synchronizing Lenis and GSAP's scroll cache
          // before another image/font/layout refresh can read a stale value.
          const lenis = lenisRef.current;
          if (lenis) lenis.scrollTo(restoration.top, { immediate: true, force: true });
          else window.scrollTo({ top: restoration.top, behavior: "instant" });
          ScrollTrigger.update();
          restoration.onRestored?.();
          return;
        }
        correctInitialAnchor();
      });
    };
    const coordinator = { route, refresh };
    restoreCoordinator.current = coordinator;
    // Interest selection, disclosures and the selected film's frame index can
    // move later content without a route change. Observe layout height only:
    // pane transforms must not create a refresh feedback loop.
    const changingSection = element.querySelector<HTMLElement>("#about, .screening-room");
    let sectionHeight = changingSection?.offsetHeight ?? 0;
    const contentResize =
      changingSection && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!alive) return;
            const height = changingSection.offsetHeight;
            if (height === sectionHeight) return;
            sectionHeight = height;
            refresh();
          })
        : null;
    if (changingSection) contentResize?.observe(changingSection);
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
          let clearChapterScenes = () => {};
          let resumeAfterVisibility = false;
          const previousScrollBehavior =
            document.documentElement.style.scrollBehavior;

          if (desktop) {
            document.documentElement.style.scrollBehavior = "auto";
            lenis = new Lenis({
              autoRaf: false,
              smoothWheel: true,
              syncTouch: false,
              anchors: { offset: -headerClearance(), duration: 0.85 },
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
            const heroName = select(".hero-story-copy > h1");
            const heroSupportingCopy = selectAll(".hero-story-copy > :not(h1)");
            const room = select(".hero-room");
            const heroFilm = select(".hero-film-stage");
            const opticalPane = select(".hero-optical-pane");
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
              if (title)
                gsap.set(title, { autoAlpha: 0, top: headerClearance() });
              if (captions) gsap.set(captions, { autoAlpha: 0 });
              const frameTop = () =>
                Math.max(
                  headerClearance() +
                    (title?.getBoundingClientRect().height ?? 24) +
                    18,
                  innerHeight * 0.15,
                );
              const frameHeight = () =>
                Math.min(
                  scene.clientHeight * 0.66,
                  Math.max(
                    240,
                    innerHeight -
                      frameTop() -
                      (captions?.getBoundingClientRect().height ?? 90) -
                      32,
                  ),
                );
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
                    if (title) gsap.set(title, { top: headerClearance() });
                    scene.dataset.progress = trigger.progress.toFixed(3);
                    ambientInOpening = trigger.progress < 0.48;
                    syncAmbient();
                  },
                },
              });
              if (heroSupportingCopy.length)
                opening.to(
                  heroSupportingCopy,
                  { autoAlpha: 0, y: -8, duration: 0.14 },
                  0.08,
                );
              if (heroName)
                opening.to(heroName, { y: -160, duration: 0.24 }, 0.16);
              if (hero)
                opening.to(hero, { autoAlpha: 0, y: -12, duration: 0.24 }, 0.2);
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
                    duration: 0.4,
                  },
                  0.18,
                );
              if (opticalPane) {
                opening.fromTo(
                  opticalPane,
                  { rotationY: -14, rotationX: 2, scale: 1, autoAlpha: 0.82 },
                  {
                    rotationY: 0,
                    rotationX: 0,
                    scale: 1.04,
                    autoAlpha: 1,
                    duration: 0.34,
                  },
                  0,
                );
                opening.to(opticalPane, { autoAlpha: 0, duration: 0.25 }, 0.4);
              }
              // Keep the entire source frame, including its watermark, intact.
              // Only the sibling film layer's opacity changes during the handoff.
              if (heroFilm)
                opening.fromTo(
                  heroFilm,
                  { opacity: 1 },
                  { opacity: 0, duration: 0.62 },
                  0.18,
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
                  top: frameTop,
                  width: "88%",
                  height: frameHeight,
                  autoAlpha: 1,
                  clipPath: "inset(0% 0% 0% 0% round 0px)",
                  duration: 0.58,
                },
                0,
              );
              if (title)
                opening.to(title, { autoAlpha: 1, duration: 0.12 }, 0.42);
              if (captions)
                opening.to(captions, { autoAlpha: 1, duration: 0.12 }, 0.58);
              // Keep normalized progress at 0–1 and reserve the final quarter for
              // the fully expanded view and fully opaque, stationary captions.
              opening.to({}, { duration: 0.26 }, 0.74);

              // A loaded direct link may start after the pinned scene. Refresh never
              // resets scroll position or forces visitors back through the opening.
              scene.dataset.progress =
                opening.scrollTrigger?.progress.toFixed(3) ?? "0.000";
            }

            // Material moves behind the work; the writing stays still. These
            // short, reversible scroll treatments do not add pins or delay reading.
            selectAll(".work-feature, .feature").forEach((chapter) => {
              const reflection = chapter.querySelector<HTMLElement>(
                ".chapter-reflection",
              );
              const depth = chapter.querySelector<HTMLElement>(
                ".chapter-glass-depth",
              );
              const chapterId = chapter.id || "project";
              if (reflection)
                gsap.fromTo(
                  reflection,
                  { xPercent: -8, yPercent: 2, opacity: 0.22 },
                  {
                    xPercent: 8,
                    yPercent: -2,
                    opacity: 0.48,
                    ease: "none",
                    scrollTrigger: {
                      id: `atelier-${chapterId}-reflection`,
                      trigger: chapter,
                      start: "top bottom",
                      end: "bottom top",
                      scrub: true,
                      invalidateOnRefresh: true,
                    },
                  },
                );
              if (depth)
                gsap.fromTo(
                  depth,
                  { yPercent: 4, scale: 1.035 },
                  {
                    yPercent: -4,
                    scale: 1,
                    ease: "none",
                    scrollTrigger: {
                      id: `atelier-${chapterId}-depth`,
                      trigger: chapter,
                      start: "top bottom",
                      end: "bottom top",
                      scrub: true,
                      invalidateOnRefresh: true,
                    },
                  },
                );
            });

            clearChapterScenes = coordinateChapterScenes(element);

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
          }
          // Phones/tablets retain native vertical scroll and their static glass
          // surfaces. Reflections, media settle and large transitions are desktop-only.

          const clearMaterial = coordinateMaterial(element, desktop);
          refresh();
          return () => {
            ambientObserver?.disconnect();
            ambient?.kill();
            clearMaterial();
            clearChapterScenes();
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

    const cleanup = () => {
      if (!alive) return;
      alive = false;
      if (restoreCoordinator.current === coordinator) restoreCoordinator.current = null;
      if (pendingRestore.current?.route === route) pendingRestore.current = null;
      cancelAnimationFrame(refreshFrame);
      cancelAnimationFrame(anchorFrame);
      window.clearTimeout(readinessTimeout);
      window.removeEventListener("wheel", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("hashchange", hashChange);
      contentResize?.disconnect();
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
    cleanupRef.current = cleanup;
    return () => {
      cleanup();
      if (cleanupRef.current === cleanup) cleanupRef.current = null;
    };
  }, [root, enabled, route]);

  const scrollTo = useCallback(
    (target: ScrollTarget, options?: { immediate?: boolean }) => {
      const lenis = lenisRef.current;
      if (lenis) {
        if (typeof target === "number") {
          // Native focus may have scrolled before its scroll event arrives.
          // Sync the real position before Lenis compares its cached target.
          lenis.resize();
          lenis.scrollTo(target, { duration: 0.85, immediate: options?.immediate });
        } else {
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
                destination.getBoundingClientRect().top +
                  window.scrollY -
                  headerClearance(),
              ),
              { duration: 0.85, immediate: options?.immediate },
            );
          }
        }
        if (options?.immediate) ScrollTrigger.update();
        return;
      }
      const behavior = !options?.immediate && enabled && !reduceRef.current ? "smooth" : "instant";
      if (typeof target === "number")
        window.scrollTo({ top: target, behavior });
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
        if (destination)
          window.scrollTo({
            top: Math.max(
              0,
              destination.getBoundingClientRect().top +
                window.scrollY -
                headerClearance(),
            ),
            behavior,
          });
      }
      if (options?.immediate) ScrollTrigger.update();
    },
    [enabled],
  );

  const beforeNavigate = useCallback(() => cleanupRef.current?.(), []);
  const restoreTo = useCallback((top: number, destination: string, onRestored?: () => void, options?: { preserveHash?: boolean }) => {
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (destination !== currentPath || (window.location.hash && !options?.preserveHash)) return;
    const position = Number.isFinite(top) ? Math.max(0, top) : 0;
    pendingRestore.current = { route: destination, top: position, onRestored, preserveHash: options?.preserveHash };
    const coordinator = restoreCoordinator.current;
    if (coordinator?.route === destination) coordinator.refresh();
    else {
      // Case routes have no main-page coordinator; a not-yet-mounted main page
      // will consume the route-tagged request in its first refresh instead.
      window.scrollTo({ top: position, behavior: "instant" });
      ScrollTrigger.update();
      if (destination.startsWith("/projects/")) {
        pendingRestore.current = null;
        onRestored?.();
      }
    }
  }, []);
  return { scrollTo, beforeNavigate, restoreTo };
}
