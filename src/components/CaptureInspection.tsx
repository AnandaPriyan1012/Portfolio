import { useId, useLayoutEffect, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import "./capture-inspection.css";

type Props = {
  src: string;
  mobileSrc?: string;
  alt: string;
  title: string;
  caption?: string;
  detail?: {
    label: string;
    bounds: readonly [number, number, number, number];
    sourceWidth: number;
    sourceHeight: number;
  };
};

function localCapture(src: string) {
  return /^\/media\/[a-z0-9][a-z0-9_./-]*\.(?:webp|png|jpe?g)$/i.test(src) &&
    !src.includes("..");
}

type Detail = NonNullable<Props["detail"]>;
type Inspection = { source: string; detail: Detail | null; sequence: number };

function validDetail(detail: Props["detail"]): detail is Detail {
  if (!detail || typeof detail.label !== "string" || !detail.label.trim() ||
    !Array.isArray(detail.bounds) || detail.bounds.length !== 4) return false;
  const [x, y, width, height] = detail.bounds;
  return [x, y, width, height, detail.sourceWidth, detail.sourceHeight].every(Number.isFinite) &&
    x >= 0 && y >= 0 && width > 0 && height > 0 &&
    detail.sourceWidth > 0 && detail.sourceHeight > 0 &&
    x + width <= detail.sourceWidth && y + height <= detail.sourceHeight;
}

export default function CaptureInspection({ src, mobileSrc, alt, title, caption, detail }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const sequence = useRef(0);
  const alignmentFrame = useRef(0);
  const pendingAlignment = useRef<{ sequence: number; detail: Detail; ready: boolean } | null>(null);
  const departure = useRef({ top: 0, left: 0 });
  const closeTouch = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const restoreFocusOnClose = useRef(true);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [detailState, setDetailState] = useState<"pending" | "aligned" | "unavailable" | "cancelled" | null>(null);
  const source = inspection?.source ?? null;
  const isOpen = source !== null;
  const selectedDetail = inspection?.detail;
  const availableDetail = validDetail(detail) ? detail : null;

  function cancelAlignment(report = true) {
    if (!pendingAlignment.current) return;
    pendingAlignment.current = null;
    cancelAnimationFrame(alignmentFrame.current);
    if (report) setDetailState("cancelled");
  }

  function openCapture(control: HTMLButtonElement, selected: Detail | null) {
    cancelAlignment(false);
    const next = ++sequence.current;
    const snapshot = selected ? { ...selected, label: selected.label.trim(), bounds: [...selected.bounds] as [number, number, number, number] } : null;
    opener.current = control;
    departure.current = { top: window.scrollY, left: window.scrollX };
    restoreFocusOnClose.current = true;
    pendingAlignment.current = snapshot ? { sequence: next, detail: snapshot, ready: false } : null;
    setDetailState(snapshot ? "pending" : null);
    setLoaded(false);
    setFailed(false);
    setZoomed(false);
    setInspection({ source: snapshot ? src : mobileSrc && matchMedia("(max-width: 767px)").matches ? mobileSrc : src,
      detail: snapshot, sequence: next });
  }

  async function imageLoaded(node: HTMLImageElement, current: Inspection) {
    if (sequence.current !== current.sequence) return;
    setLoaded(true);
    const request = pendingAlignment.current;
    if (!request || request.sequence !== current.sequence) return;
    try { await node.decode(); } catch {
      if (pendingAlignment.current !== request) return;
      pendingAlignment.current = null;
      setDetailState("unavailable");
      return;
    }
    if (pendingAlignment.current !== request || sequence.current !== current.sequence) return;
    if (node.naturalWidth !== request.detail.sourceWidth || node.naturalHeight !== request.detail.sourceHeight) {
      pendingAlignment.current = null;
      setDetailState("unavailable");
      return;
    }
    request.ready = true;
    setZoomed(true);
  }

  function close(restoreFocus = true) {
    const modal = dialog.current;
    if (!modal) return;
    ++sequence.current;
    cancelAlignment(false);
    restoreFocusOnClose.current = restoreFocus;
    if (modal.open) modal.close();
    // Native close may synchronously restore the old opener. A navigation's
    // own history target, not that obsolete control, owns the next focus move.
    if (!restoreFocus && document.activeElement === opener.current) opener.current?.blur();
    setInspection(null);
    setZoomed(false);
  }

  useLayoutEffect(() => {
    const cover = (event: Event) => {
      if ((event as CustomEvent<{ active: boolean }>).detail?.active) close(false);
    };
    window.addEventListener("ap:openingchange", cover);
    return () => {
      // Remove the top layer synchronously before a route's AP opening.
      restoreFocusOnClose.current = false;
      ++sequence.current;
      cancelAlignment(false);
      cancelAnimationFrame(alignmentFrame.current);
      dialog.current?.close();
      window.removeEventListener("ap:openingchange", cover);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !dialog.current) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    // Same-document history does not create an AP opening. Dismiss before
    // navigation restores its own reading position and native focus.
    const navigation = () => close(false);
    window.addEventListener("popstate", navigation, true);
    window.addEventListener("hashchange", navigation, true);
    return () => {
      window.removeEventListener("popstate", navigation, true);
      window.removeEventListener("hashchange", navigation, true);
      if (modal.open) modal.close();
      document.body.style.overflow = previousOverflow;
      if (restoreFocusOnClose.current && opener.current?.isConnected) {
        opener.current.focus({ preventScroll: true });
        window.scrollTo({ ...departure.current, behavior: "instant" });
      }
    };
    // Image/detail actions update one open session, without closing the top
    // layer or letting a queued old close event dismiss a newer image.
  }, [isOpen]);

  useLayoutEffect(() => {
    const request = pendingAlignment.current;
    if (!zoomed || !loaded || !inspection || !request?.ready || request.sequence !== inspection.sequence) return;
    alignmentFrame.current = requestAnimationFrame(() => {
      if (pendingAlignment.current !== request || sequence.current !== request.sequence) return;
      const area = viewport.current, original = image.current;
      if (!area || !original || !area.clientWidth || !area.clientHeight) return;
      const rendered = original.getBoundingClientRect(), frame = area.getBoundingClientRect();
      if (Math.abs(rendered.width - request.detail.sourceWidth) > .5 || Math.abs(rendered.height - request.detail.sourceHeight) > .5) {
        pendingAlignment.current = null;
        setZoomed(false);
        setDetailState("unavailable");
        return;
      }
      const [x, y, width, height] = request.detail.bounds;
      const offset = (start: number, size: number, visible: number) =>
        size + 48 <= visible ? start + size / 2 - visible / 2 : start - 24;
      const left = rendered.left - frame.left + area.scrollLeft - area.clientLeft + offset(x, width, area.clientWidth);
      const top = rendered.top - frame.top + area.scrollTop - area.clientTop + offset(y, height, area.clientHeight);
      pendingAlignment.current = null;
      area.scrollTo({ left: Math.max(0, Math.min(left, area.scrollWidth - area.clientWidth)),
        top: Math.max(0, Math.min(top, area.scrollHeight - area.clientHeight)), behavior: "instant" });
      setDetailState("aligned");
    });
    return () => cancelAnimationFrame(alignmentFrame.current);
  }, [zoomed, loaded, inspection]);

  if (!localCapture(src) || (mobileSrc && !localCapture(mobileSrc))) return null;

  return (
    <>
      <div className="capture-inspection-actions" data-has-detail={Boolean(availableDetail)}>
      <button
        className="capture-inspection-open"
        type="button"
        aria-label={`View larger capture: ${title}`}
        onClick={(event) => openCapture(event.currentTarget, null)}
      >
        <Expand size={15} aria-hidden="true" /> View larger capture
      </button>
      {availableDetail && <button className="capture-inspection-open capture-inspection-detail-open" type="button"
        onClick={(event) => openCapture(event.currentTarget, availableDetail)}>
        Inspect {availableDetail.label.trim()} detail
      </button>}
      </div>
      {source && inspection && (
        <dialog
          ref={dialog}
          className="atelier-dialog capture-inspection-dialog"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-caption`}
          data-inspection-mode={selectedDetail ? "detail" : "whole"}
          data-detail-state={detailState ?? undefined}
          data-lenis-prevent
          onClose={(event) => {
            if (event.currentTarget !== dialog.current || event.currentTarget.open || sequence.current !== inspection.sequence) return;
            close(restoreFocusOnClose.current);
          }}
          onPointerDownCapture={(event) => { if (event.nativeEvent.isTrusted) cancelAlignment(); }}
          onTouchStartCapture={(event) => { if (event.nativeEvent.isTrusted) cancelAlignment(); }}
          onWheelCapture={(event) => { if (event.nativeEvent.isTrusted) cancelAlignment(); }}
          onKeyDownCapture={(event) => { if (event.nativeEvent.isTrusted) cancelAlignment(); }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <header className="capture-inspection-header">
            <h2 id={`${id}-title`}>{title}</h2>
            <button
              type="button"
              onClick={() => close()}
              aria-label="Close capture"
              onTouchStart={(event) => {
                const touch = event.touches[0];
                closeTouch.current = event.touches.length === 1
                  ? { id: touch.identifier, x: touch.clientX, y: touch.clientY, moved: false } : null;
              }}
              onTouchMove={(event) => {
                const start = closeTouch.current;
                const touch = event.touches[0];
                if (event.touches.length !== 1 || touch.identifier !== start?.id) closeTouch.current = null;
                else if (start && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) >= 8) start.moved = true;
              }}
              onTouchCancel={() => { closeTouch.current = null; }}
              onTouchEnd={(event) => {
                const start = closeTouch.current;
                closeTouch.current = null;
                const touch = event.changedTouches[0];
                // Chromium can suppress the next compatibility click during
                // image-scroll momentum. Cancel the touchend default before
                // removing the top layer, so it cannot click the page below.
                if (start && !start.moved && event.touches.length === 0 && touch.identifier === start.id &&
                    Math.hypot(touch.clientX - start.x, touch.clientY - start.y) < 8) {
                  event.preventDefault();
                  close();
                }
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="capture-inspection-toolbar">
            <button
              type="button"
              disabled={!loaded || failed}
              aria-pressed={zoomed}
              aria-controls={`${id}-viewport`}
              onClick={() => {
                cancelAlignment();
                setZoomed((current) => !current);
                viewport.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
            >
              {zoomed ? "Fit whole image" : "Actual size (100%)"}
            </button>
            <a href={source} target="_blank" rel="noopener noreferrer">Open original image</a>
          </div>
          <div
            ref={viewport}
            id={`${id}-viewport`}
            className="capture-inspection-viewport"
            data-zoom={zoomed ? "actual" : "fit"}
            role="region"
            aria-label="Capture inspection area"
            tabIndex={0}
          >
            {failed ? (
              <p className="capture-inspection-error">This capture could not load. Open the original image to try it directly.</p>
            ) : (
              <img
                ref={image}
                key={inspection.sequence}
                className="capture-inspection-image"
                src={source}
                alt={alt}
                decoding="async"
                onLoad={(event) => { void imageLoaded(event.currentTarget, inspection); }}
                onError={() => {
                  if (sequence.current !== inspection.sequence) return;
                  cancelAlignment(false);
                  setFailed(true);
                }}
              />
            )}
          </div>
          <p className="capture-inspection-caption" id={`${id}-caption`}>
            {selectedDetail && <strong className="capture-inspection-detail-label">{selectedDetail.label} detail. </strong>}
            {caption ?? "Original browser capture."}{" "}
            {detailState === "pending" && !zoomed ? "Preparing the selected detail at its original pixel size." :
              detailState === "unavailable" ? "The detail could not be verified in this image. The whole original capture is shown." :
              zoomed ? "Scroll to inspect the image at its original pixel size." : "The whole capture is shown. Choose actual size to inspect details."}
          </p>
        </dialog>
      )}
    </>
  );
}
