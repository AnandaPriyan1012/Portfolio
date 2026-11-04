import { useEffect, useId, useRef, useState } from "react";
import "./glass-cursor.css";

type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};
type Mode = "link" | "action" | "view" | "visit" | "play" | "email" | "save";

/** The native pointer is hidden only after this glass arrow has a valid position. */
export default function GlassCursor({ enabled }: { enabled: boolean }) {
  const bevelId = useId();
  const arrow = useRef<HTMLDivElement>(null);
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const fine = matchMedia("(pointer: fine) and (hover: hover)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    const device = navigator as Device;
    const sync = () => {
      const constrained =
        device.connection?.saveData ||
        (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) ||
        (device.deviceMemory && device.deviceMemory <= 2);
      const opticalSupport =
        CSS.supports("clip-path", "polygon(0 0, 100% 0, 0 100%)") &&
        (CSS.supports("backdrop-filter", "brightness(1.1)") ||
          CSS.supports("-webkit-backdrop-filter", "brightness(1.1)"));
      setCapable(
        Boolean(
          enabled &&
            fine.matches &&
            !reduced.matches &&
            !contrast.matches &&
            !constrained &&
            opticalSupport,
        ),
      );
    };
    sync();
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    contrast.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      contrast.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
    };
  }, [enabled]);

  useEffect(() => {
    const host = arrow.current;
    if (!enabled || !capable || !host) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    let surface: HTMLElement | null = null;
    let activeTarget: HTMLElement | null = null;
    const restoreNative = () => {
      // The root gate is removed first, even if a target was just disconnected.
      delete document.documentElement.dataset.glassPointer;
      activeTarget?.classList.remove("glass-pointer-target");
      activeTarget = null;
    };
    const hide = () => {
      restoreNative();
      cancelAnimationFrame(frame);
      frame = 0;
      surface = null;
      host.dataset.visible = "false";
      delete host.dataset.pressed;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || document.hidden) {
        hide();
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false']), video, iframe, dialog, .os-window-titlebar, [data-cursor='none']",
        )
      ) {
        hide();
        return;
      }
      const next =
        target?.closest<HTMLElement>("a[href], button, [role='button']") ??
        null;
      if (!next || next.matches(":disabled, [aria-disabled='true']")) {
        hide();
        return;
      }
      if (next !== surface) hide();
      surface = next;
      const href = next.getAttribute("href") ?? "";
      const mode: Mode =
        next.dataset.cursor === "play"
          ? "play"
          : next.dataset.cursor === "view"
            ? /^https?:/.test(href)
              ? "visit"
              : "view"
            : href.startsWith("mailto:")
              ? "email"
              : next.hasAttribute("download")
                ? "save"
                : next.tagName === "A"
                  ? "link"
                  : "action";
      host.dataset.mode = mode;
      x = event.clientX - 1;
      y = event.clientY - 1;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!surface?.isConnected) {
          hide();
          return;
        }
        host.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        host.dataset.visible = "true";
        activeTarget = surface;
        activeTarget.classList.add("glass-pointer-target");
        document.documentElement.dataset.glassPointer = "visible";
      });
    };
    const press = () => {
      if (host.dataset.visible === "true") host.dataset.pressed = "true";
    };
    const release = () => {
      delete host.dataset.pressed;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("click", hide, { passive: true });
    window.addEventListener("pointercancel", hide);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("keydown", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("click", hide);
      window.removeEventListener("pointercancel", hide);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("keydown", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, [enabled, capable]);

  if (!enabled || !capable) return null;
  return (
    <div
      ref={arrow}
      className="glass-cursor glass-arrow-cursor"
      aria-hidden="true"
      data-visible="false"
    >
      <span className="glass-arrow-shape">
        <span className="glass-arrow-optic" />
        <svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true">
          <defs>
            <linearGradient id={bevelId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff9e9" stopOpacity=".96" />
              <stop offset=".24" stopColor="#c5aa71" stopOpacity=".2" />
              <stop offset=".43" stopColor="#fff3d1" stopOpacity=".83" />
              <stop offset=".61" stopColor="#8d754d" stopOpacity=".23" />
              <stop offset=".82" stopColor="#fff7df" stopOpacity=".9" />
              <stop offset="1" stopColor="#d4b67b" stopOpacity=".55" />
            </linearGradient>
          </defs>
          <path
            className="glass-arrow-contrast"
            d="M1 1V30L8 23L14 34L20 31L13 21H26Z"
          />
          <path
            className="glass-arrow-facets"
            fill={`url(#${bevelId})`}
            fillRule="evenodd"
            d="M1 1V30L8 23L14 34L20 31L13 21H26ZM3 6.3V25.2L8.3 19.9L14.9 31.1L17.2 29.9L9.6 18.8H20.5Z"
          />
          <path
            className="glass-arrow-edge"
            d="M1 1V30L8 23L14 34L20 31L13 21H26Z"
          />
          <path
            className="glass-arrow-bevel"
            d="M3 6.3V25.2L8.3 19.9L14.9 31.1L17.2 29.9L9.6 18.8H20.5ZM1 1L3 6.3M1 30L3 25.2M8 23L8.3 19.9M14 34L14.9 31.1M20 31L17.2 29.9M13 21L9.6 18.8M26 21L20.5 18.8"
          />
        </svg>
      </span>
    </div>
  );
}
