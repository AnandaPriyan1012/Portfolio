import { useEffect, useId, useRef, useState } from "react";

type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};

type Particle = {
  u: number;
  v: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
};

/** The original mark remains visible; the light points come from its exact alpha. */
export default function InteractiveSignature({
  enabled,
}: {
  enabled: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const aperture = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pulse = useRef<() => void>(() => {});
  const [capable, setCapable] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const hintId = useId();

  useEffect(() => {
    const fine = matchMedia("(pointer: fine) and (hover: hover)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const device = navigator as Device;
      const lowPower =
        device.connection?.saveData ||
        (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
        (device.deviceMemory && device.deviceMemory <= 2);
      setCapable(
        Boolean(enabled && fine.matches && !reduced.matches && !lowPower),
      );
    };
    sync();
    const connection = (navigator as Device).connection;
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    connection?.addEventListener?.("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      connection?.removeEventListener?.("change", sync);
    };
  }, [enabled]);

  useEffect(() => {
    const host = root.current;
    const frame = aperture.current;
    const source = image.current;
    const layer = canvas.current;
    if (!capable || failed || !host || !frame || !source || !layer) {
      setReady(false);
      return;
    }
    const context = layer.getContext("2d", { alpha: true });
    if (!context) return;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let resizeTimer = 0;
    let disposed = false;
    let inView = false;
    let dirty = false;
    let lastTime = 0;
    let stableFrames = 0;
    let remainingFrames = 0;
    let pointer: { x: number; y: number } | null = null;

    const state = (value: string) => {
      if (host.dataset.canvasState !== value) host.dataset.canvasState = value;
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#efdfbb";
      context.beginPath();
      for (const point of particles) {
        context.moveTo(point.x + point.radius, point.y);
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      }
      context.fill();
    };
    const stop = (value: string) => {
      cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
      state(value);
      delete host.dataset.interacting;
    };
    const animate = (time: number) => {
      raf = 0;
      if (disposed || !inView || document.hidden) {
        stop(document.hidden ? "hidden" : "offscreen");
        return;
      }
      const dt = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;
      lastTime = time;
      let speed = 0;
      let displacement = 0;
      const reach = Math.min(width, height) * 0.22;
      for (const point of particles) {
        let ax = (point.homeX - point.x) * 0.065;
        let ay = (point.homeY - point.y) * 0.065;
        if (pointer) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < reach) {
            const force = (1 - distance / reach) ** 2 * 0.95;
            ax += (distance > 0.1 ? dx / distance : point.u - 0.5) * force;
            ay += (distance > 0.1 ? dy / distance : -1) * force;
          }
        }
        const damping = 0.79 ** dt;
        point.vx = (point.vx + ax * dt) * damping;
        point.vy = (point.vy + ay * dt) * damping;
        point.x += point.vx * dt;
        point.y += point.vy * dt;
        speed = Math.max(speed, Math.abs(point.vx), Math.abs(point.vy));
        displacement = Math.max(
          displacement,
          Math.abs(point.x - point.homeX),
          Math.abs(point.y - point.homeY),
        );
      }
      draw();
      stableFrames =
        speed < 0.025 && (pointer || displacement < 0.12)
          ? stableFrames + 1
          : 0;
      remainingFrames -= 1;
      if (stableFrames > 10 || remainingFrames <= 0) {
        if (!pointer || remainingFrames <= 0) {
          for (const point of particles) {
            point.x = point.homeX;
            point.y = point.homeY;
            point.vx = point.vy = 0;
          }
          draw();
        }
        dirty = false;
        stop("rest");
        return;
      }
      raf = requestAnimationFrame(animate);
    };
    const wake = () => {
      dirty = true;
      remainingFrames = 180;
      stableFrames = 0;
      if (!inView || document.hidden || !particles.length || disposed) return;
      host.dataset.interacting = "true";
      state("active");
      if (!raf) raf = requestAnimationFrame(animate);
    };
    const layout = () => {
      if (disposed || !particles.length) return;
      stop("rest");
      pointer = null;
      const bounds = layer.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      layer.width = Math.floor(width * ratio);
      layer.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Matches the original image's `object-fit: contain` in its 70% × 60% box.
      const sourceRatio = source.naturalWidth / source.naturalHeight;
      const markWidth = Math.min(width * 0.7, height * 0.6 * sourceRatio);
      const markHeight = markWidth / sourceRatio;
      for (const point of particles) {
        point.homeX = (width - markWidth) / 2 + point.u * markWidth;
        point.homeY = (height - markHeight) / 2 + point.v * markHeight;
        point.x = point.homeX;
        point.y = point.homeY;
        point.vx = point.vy = 0;
      }
      dirty = false;
      draw();
    };
    const sample = () => {
      if (disposed || !source.naturalWidth) return;
      try {
        const sampler = document.createElement("canvas");
        sampler.width = source.naturalWidth;
        sampler.height = source.naturalHeight;
        const pixels = sampler.getContext("2d", { willReadFrequently: true });
        if (!pixels) return;
        pixels.drawImage(source, 0, 0);
        const alpha = pixels.getImageData(
          0,
          0,
          sampler.width,
          sampler.height,
        ).data;
        let hits = 0;
        let seed = 42;
        const random = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        particles = [];
        for (let y = 0; y < sampler.height; y += 2) {
          for (let x = 0; x < sampler.width; x += 2) {
            if (alpha[(y * sampler.width + x) * 4 + 3] < 48) continue;
            hits += 1;
            const slot = hits <= 760 ? hits - 1 : Math.floor(random() * hits);
            if (slot >= 760) continue;
            particles[slot] = {
              u: x / sampler.width,
              v: y / sampler.height,
              x: 0,
              y: 0,
              homeX: 0,
              homeY: 0,
              vx: 0,
              vy: 0,
              radius: 0.55 + random() * 0.42,
            };
          }
        }
        sampler.width = sampler.height = 0;
        host.dataset.sourcePoints = String(particles.length);
        layout();
        setReady(particles.length > 0);
      } catch {
        // Unsupported/blocked image sampling leaves the original PNG in place.
        setReady(false);
      }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = layer.getBoundingClientRect();
      pointer = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      wake();
    };
    const leave = () => {
      pointer = null;
      wake();
    };
    const needsSettling = () =>
      particles.some(
        (point) =>
          Math.abs(point.x - point.homeX) + Math.abs(point.y - point.homeY) >
          0.12,
      );
    const visibility = () => {
      if (document.hidden) {
        pointer = null;
        dirty = dirty || needsSettling();
        stop("hidden");
      } else if (dirty) wake();
      else state(inView ? "rest" : "offscreen");
    };
    pulse.current = () => {
      pointer = null;
      for (const point of particles) {
        const angle = Math.atan2(
          point.homeY - height / 2,
          point.homeX - width / 2,
        );
        const strength = 4 + ((point.u * 17 + point.v * 11) % 1) * 4;
        point.vx += Math.cos(angle) * strength;
        point.vy += Math.sin(angle) * strength;
      }
      wake();
    };
    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (!inView) {
          pointer = null;
          dirty = dirty || needsSettling();
          stop("offscreen");
        } else if (dirty) wake();
        else state("rest");
      },
      { threshold: 0.08 },
    );
    intersection.observe(frame);
    const resize = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 120);
    });
    resize.observe(frame);
    frame.addEventListener("pointermove", move, { passive: true });
    frame.addEventListener("pointerleave", leave, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    source.addEventListener("load", sample);
    if (source.complete && source.naturalWidth) sample();

    return () => {
      disposed = true;
      stop("static");
      clearTimeout(resizeTimer);
      intersection.disconnect();
      resize.disconnect();
      frame.removeEventListener("pointermove", move);
      frame.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      source.removeEventListener("load", sample);
      pulse.current = () => {};
      delete host.dataset.sourcePoints;
      context.clearRect(0, 0, width, height);
    };
  }, [capable, failed]);

  return (
    <figure ref={root} className="signature-study" data-canvas-state="static">
      <div className="signature-study-aperture" ref={aperture}>
        <span className="signature-study-edition" aria-hidden="true">
          Original mark / AP
        </span>
        <div className="signature-study-original">
          {failed ? (
            <span className="signature-study-fallback">Ananda Priyan</span>
          ) : (
            <>
              <img
                ref={image}
                src="/media/ap-signature.png"
                width="750"
                height="500"
                alt="Ananda Priyan — original AP signature"
                decoding="async"
                onError={() => setFailed(true)}
              />
              <span className="signature-study-ink" aria-hidden="true" />
            </>
          )}
        </div>
        {capable && !failed && <canvas ref={canvas} aria-hidden="true" />}
        <span className="signature-study-bottom-light" aria-hidden="true" />
      </div>
      <figcaption>
        <span className="signature-study-title">AP / An interaction study</span>
        <p id={hintId}>
          {capable && ready
            ? "Move across the mark. Watch the light settle."
            : "My original signature, held in glass."}
        </p>
        {capable && ready && (
          <button
            type="button"
            onClick={() => pulse.current()}
            aria-describedby={hintId}
          >
            Scatter &amp; settle
          </button>
        )}
      </figcaption>
    </figure>
  );
}
