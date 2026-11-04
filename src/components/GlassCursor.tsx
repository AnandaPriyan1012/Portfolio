import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./glass-cursor.css";

type Device = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
  deviceMemory?: number;
};
type Mode = "surface" | "link" | "action" | "view" | "visit" | "play" | "email" | "save";
const nativeRegions =
  "input, textarea, select, option, [contenteditable]:not([contenteditable='false']), [role='textbox'], video, audio[controls], iframe, embed, object, .os-window-titlebar, .state-opening, [data-cursor='none'], [data-cursor='native']";
const controls = "a[href], button, summary, [role='button'], [role='link']";
const hotspot = 0.75;

/** The native pointer is hidden only after this glass arrow has a valid position. */
export default function GlassCursor({ enabled }: { enabled: boolean }) {
  const bevelId = useId();
  const arrow = useRef<HTMLDivElement>(null);
  const [capable, setCapable] = useState(false);
  const position = useRef<{ x: number; y: number; inside: boolean } | null>(null);
  const [layer] = useState(() => {
    const node = document.createElement("div");
    node.className = "glass-cursor-layer";
    node.setAttribute("aria-hidden", "true");
    return node;
  });

  useEffect(() => {
    // Remember real coordinates even while a native fallback is active. A
    // later preference change must not resurrect an old point or invent 0,0.
    const remember = (event: PointerEvent) => {
      if (event.pointerType === "mouse" &&
          Number.isFinite(event.clientX) && Number.isFinite(event.clientY) &&
          event.clientX >= 0 && event.clientX < innerWidth &&
          event.clientY >= 0 && event.clientY < innerHeight) {
        position.current = { x: event.clientX, y: event.clientY, inside: true };
      } else if (position.current) position.current.inside = false;
    };
    const absent = () => { if (position.current) position.current.inside = false; };
    window.addEventListener("pointermove", remember, { passive: true });
    window.addEventListener("pointerdown", remember, { passive: true });
    window.addEventListener("blur", absent);
    document.addEventListener("visibilitychange", absent);
    document.documentElement.addEventListener("pointerleave", absent);
    return () => {
      window.removeEventListener("pointermove", remember);
      window.removeEventListener("pointerdown", remember);
      window.removeEventListener("blur", absent);
      document.removeEventListener("visibilitychange", absent);
      document.documentElement.removeEventListener("pointerleave", absent);
    };
  }, []);

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
    let nativeDrag = false;
    let surfacePressed = false;
    let activeTarget: Element | null = null;
    let targetObserver: MutationObserver | null = null;
    document.body.appendChild(layer);
    const restoreNative = () => {
      delete document.documentElement.dataset.glassPointer;
      targetObserver?.disconnect();
      activeTarget?.classList.remove("glass-pointer-target");
      activeTarget = null;
    };
    const hide = () => {
      restoreNative();
      cancelAnimationFrame(frame);
      frame = 0;
      host.dataset.visible = "false";
      delete host.dataset.pressed;
    };
    const storePosition = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        !Number.isFinite(event.clientX) ||
        !Number.isFinite(event.clientY) ||
        event.clientX < 0 || event.clientX >= innerWidth ||
        event.clientY < 0 || event.clientY >= innerHeight
      ) {
        if (position.current) position.current.inside = false;
        hide();
        return false;
      }
      position.current = { x: event.clientX, y: event.clientY, inside: true };
      return true;
    };
    const refresh = () => {
      frame = 0;
      const point = position.current;
      if (
        !point?.inside || document.hidden || nativeDrag ||
        document.documentElement.dataset.opening === "active"
      ) {
        hide();
        return;
      }
      const hit = document.elementFromPoint(point.x, point.y);
      if (
        !hit || hit === document.documentElement ||
        hit.closest(nativeRegions) ||
        hit.closest(":disabled, [aria-disabled='true']")
      ) {
        hide();
        return;
      }
      const control = hit.closest<HTMLElement>(controls);
      const selection = window.getSelection();
      if (!control && selection && !selection.isCollapsed) {
        hide();
        return;
      }
      // A modal is in the browser's top layer. Move only our stable portal
      // container into it; an ordinary body z-index cannot paint above it.
      const dialog = hit.closest<HTMLDialogElement>("dialog[open]");
      if (dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) {
          hide(); // Leave the native pointer on the browser-owned backdrop.
          return;
        }
      }
      const parent = dialog ?? document.body;
      if (layer.parentElement !== parent) parent.appendChild(layer);
      const origin = layer.getBoundingClientRect();
      const next = control ?? hit;
      const href = control?.getAttribute("href") ?? "";
      const mode: Mode =
        control?.dataset.cursor === "play"
          ? "play"
          : control?.dataset.cursor === "view"
            ? /^https?:/.test(href)
              ? "visit"
              : "view"
            : href.startsWith("mailto:")
              ? "email"
              : control?.hasAttribute("download")
                ? "save"
                : control?.tagName === "A"
                  ? "link"
                  : control ? "action" : "surface";
      if (activeTarget !== next) {
        targetObserver?.disconnect();
        activeTarget?.classList.remove("glass-pointer-target");
        activeTarget = next;
        targetObserver?.observe(activeTarget, { attributes: true, attributeFilter: ["class"] });
      }
      // React can replace a reused navigation control's className after a
      // route/scroll update. Repair our marker without watching every style.
      activeTarget.classList.add("glass-pointer-target");
      host.dataset.mode = mode;
      host.style.transform = `translate3d(${point.x - origin.left - hotspot}px, ${point.y - origin.top - hotspot}px, 0)`;
      host.dataset.visible = "true";
      document.documentElement.dataset.glassPointer = "visible";
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(refresh);
    };
    targetObserver = new MutationObserver(() => {
      if (activeTarget && !activeTarget.classList.contains("glass-pointer-target")) schedule();
    });
    const move = (event: PointerEvent) => {
      if (!storePosition(event)) return;
      if (surfacePressed && (event.buttons & 1)) {
        nativeDrag = true;
        hide();
      } else schedule();
    };
    const over = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(nativeRegions)) hide();
      schedule();
    };
    const press = (event: PointerEvent) => {
      if (!storePosition(event)) return;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      surfacePressed = event.button === 0 && !hit?.closest(controls);
      nativeDrag = Boolean(hit?.closest(nativeRegions));
      if (nativeDrag) hide();
      else { host.dataset.pressed = "true"; schedule(); }
    };
    const release = () => {
      nativeDrag = false;
      surfacePressed = false;
      delete host.dataset.pressed;
      schedule();
    };
    const leave = () => {
      if (position.current) position.current.inside = false;
      nativeDrag = false;
      surfacePressed = false;
      hide();
    };
    const startDrag = () => { nativeDrag = true; hide(); };
    const opening = () => {
      if (document.documentElement.dataset.opening === "active") hide();
      else schedule();
    };
    const observer = new MutationObserver((records) => {
      const own = (node: Node) => node === layer || layer.contains(node);
      if (records.every(record => own(record.target) || (
        record.type === "childList" &&
        [...record.addedNodes, ...record.removedNodes].every(own)
      ))) return;
      opening();
    });
    observer.observe(document.body, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["open", "hidden", "inert", "disabled", "contenteditable", "aria-hidden", "aria-modal", "aria-busy", "aria-expanded", "aria-disabled"],
    });
    observer.observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-opening", "data-motion"],
    });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("click", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointercancel", leave);
    window.addEventListener("blur", leave);
    window.addEventListener("ap:openingchange", opening);
    document.addEventListener("visibilitychange", leave);
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("dragstart", startDrag);
    document.addEventListener("dragend", release);
    document.addEventListener("transitionend", schedule, true);
    document.addEventListener("animationend", schedule, true);
    document.addEventListener("load", schedule, true);
    document.documentElement.addEventListener("pointerleave", leave);
    schedule(); // A restored capability may reuse a real, retained position.
    return () => {
      hide();
      observer.disconnect();
      layer.remove();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("click", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointercancel", leave);
      window.removeEventListener("blur", leave);
      window.removeEventListener("ap:openingchange", opening);
      document.removeEventListener("visibilitychange", leave);
      document.removeEventListener("selectionchange", schedule);
      document.removeEventListener("dragstart", startDrag);
      document.removeEventListener("dragend", release);
      document.removeEventListener("transitionend", schedule, true);
      document.removeEventListener("animationend", schedule, true);
      document.removeEventListener("load", schedule, true);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, capable, layer]);

  if (!enabled || !capable) return null;
  return createPortal(
    <div
      ref={arrow}
      className="glass-cursor glass-arrow-cursor"
      aria-hidden="true"
      data-visible="false"
    >
      <span className="glass-arrow-shape">
        <span className="glass-arrow-optic" />
        <svg viewBox="0 0 28 36" width="21" height="27" aria-hidden="true">
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
    </div>,
    layer,
  );
}
